#!/bin/bash
set -euo pipefail

RELEASE_TYPE=$1
IS_FINAL_BUILD=$([[ "$RELEASE_TYPE" == "final" ]] && echo "true" || echo "false")

echo "📌 Ermittle Versionsnummer..."
BRANCH_NAME="${CI_COMMIT_REF_NAME}"
if [[ ! "$BRANCH_NAME" =~ ^release/[0-9]+\.[0-9]+$ ]]; then 
  echo "❌ Fehler: Kein gültiger 'release/X.X' Branch!"; exit 1; 
fi
MINOR_VERSION="${BRANCH_NAME#release/}"

echo "🔍 Synchronisiere lokale Tags mit Remote-Tags..."
git fetch --tags

echo "🔍 Lade existierende Tags aus Git..."
EXISTING_TAGS=$(git tag -l "release-${MINOR_VERSION}.*")
LATEST_TAG=$(echo "$EXISTING_TAGS" | sort -V | tail -n 1)

echo "🔍 Prüfe auf bestehende Release Version anhand der Basisversion ${LATEST_TAG}"
if [[ "$LATEST_TAG" =~ -rc[0-9]+$ ]]; then
  LATEST_TAG_WITHOUT_RC=$(echo "$LATEST_TAG" | sed 's/-rc[0-9]*$//')
  EXISTING_TAGS_WITHOUT_RC=$(echo "$EXISTING_TAGS" | grep -v -- '-rc[0-9]\+$' | sort -uV)
  if [[ "$EXISTING_TAGS_WITHOUT_RC" =~ "$LATEST_TAG_WITHOUT_RC" ]]; then
    LATEST_TAG="$LATEST_TAG_WITHOUT_RC"
  fi
fi

echo "📌 Gefundene Vorgängerversion: ${LATEST_TAG}"

echo "🔍 Ermittle Patch- und RC-Version..."
if [[ -z "$LATEST_TAG" ]]; then
  PATCH_VERSION="0"
  RC_VERSION="rc1"
else
  LATEST_PATCH=$(echo "$LATEST_TAG" | grep -oE 'release-[0-9]+\.[0-9]+\.[0-9]+' | sed 's/release-//')
  echo "🔍 Extrahierte Patch-Version: ${LATEST_PATCH}"

  LATEST_RC=$(echo "$LATEST_TAG" | grep -oE 'rc[0-9]+' | sed 's/rc//' || echo "0")
  echo "🔍 Extrahierte RC-Version: ${LATEST_RC}"

  if [[ -z "$LATEST_RC" || "$LATEST_RC" -eq "0" ]]; then
    PATCH_VERSION=$(echo "$LATEST_PATCH" | awk -F. '{print $3 + 1}')
    RC_VERSION="rc1"
  else
    PATCH_VERSION=$(echo "$LATEST_PATCH" | awk -F. '{print $3}')
    RC_VERSION="rc$((LATEST_RC + 1))"
  fi
fi

# 🔹 Falls "final" Release, entferne "-rcX"
if [[ "$IS_FINAL_BUILD" == "true" ]]; then
  VERSION="${MINOR_VERSION}.${PATCH_VERSION}"
else
  VERSION="${MINOR_VERSION}.${PATCH_VERSION}-${RC_VERSION}"
fi
echo "🔍 Neue Version: $VERSION"

# 🔍 Ermittle letzte Versionen
ALL_GIT_TAGS="$(git tag -l 'release-*' | sort -V)"

LATEST_MAJOR_TAG=$(echo "$ALL_GIT_TAGS" | grep -oE 'release-[0-9]+' | sort -V | tail -n 1 | sed 's/release-//')
LATEST_MAJOR_NUMBER=$(echo "$LATEST_MAJOR_TAG" | awk -F. '{print $1}')
CURRENT_MAJOR_NUMBER=$(echo "$VERSION" | awk -F. '{print $1}')
IS_LATEST_MAJOR_VERSION=$([[ -z "$LATEST_MAJOR_NUMBER" ]] || [[ "$CURRENT_MAJOR_NUMBER" -ge "$LATEST_MAJOR_NUMBER" ]] && echo "true" || echo "false")

LATEST_MINOR_TAG=$(echo "$ALL_GIT_TAGS" | grep -oE "release-${CURRENT_MAJOR_NUMBER}\.[0-9]+" | sort -uV | tail -n 1 | sed 's/release-//')
LATEST_MINOR_NUMBER=$(echo "$LATEST_MINOR_TAG" | awk -F. '{print $2}')
CURRENT_MINOR_NUMBER=$(echo "$VERSION" | awk -F. '{print $2}')
IS_LATEST_MINOR_VERSION=$([[ -z "$LATEST_MINOR_NUMBER" ]] || [[ "$CURRENT_MINOR_NUMBER" -ge "$LATEST_MINOR_NUMBER" ]] && echo "true" || echo "false")

LATEST_PATCH_TAG=$(echo "$ALL_GIT_TAGS" | grep -oE "release-${CURRENT_MAJOR_NUMBER}.${CURRENT_MINOR_NUMBER}\.[0-9]+" | sort -uV | tail -n 1 | sed 's/release-//')
LATEST_PATCH_NUMBER=$(echo "$LATEST_PATCH_TAG" | awk -F. '{split($3, a, "-"); print a[1]}')
CURRENT_PATCH_NUMBER=$(echo "$VERSION" | awk -F. '{split($3, a, "-"); print a[1]}')
IS_LATEST_PATCH_VERSION=$([[ -z "$LATEST_PATCH_NUMBER" ]] || [[ "$CURRENT_PATCH_NUMBER" -ge "$LATEST_PATCH_NUMBER" ]] && echo "true" || echo "false")

if [[ "$IS_FINAL_BUILD" == "false" ]]; then
  LATEST_RC_TAG=$(echo "$ALL_GIT_TAGS" | grep -oE "release-${CURRENT_MAJOR_NUMBER}.${CURRENT_MINOR_NUMBER}.${CURRENT_PATCH_NUMBER}-rc[0-9]+" | sort -uV | tail -n 1 || echo "")
  LATEST_RC_NUMBER=$(echo "$LATEST_RC_TAG" | grep -oE 'rc[0-9]+' | sed 's/rc//' || echo "0")
  CURRENT_RC_NUMBER=$(echo "$VERSION" | grep -oE 'rc[0-9]+' | sed 's/rc//')
  IS_LATEST_RC_VERSION=$([[ -z "$LATEST_RC_NUMBER" ]] || [[ "$CURRENT_RC_NUMBER" -ge "$LATEST_RC_NUMBER" ]] && echo "true" || echo "false")
else
  IS_LATEST_RC_VERSION="true"
fi

echo "🌟 Setze Version: $VERSION"

# Setze Version in Angular-Frontend
sed -i "s/version: '.*'/version: '$VERSION'/" frontend/src/environments/environment.prod.ts

# 🔨 Baue API
echo "🔨 Baue API..."
docker build --label "version=${VERSION}" -t ${API_IMAGE}:build-${CI_COMMIT_SHORT_SHA} -f Dockerfile-api .

# 🔨 Baue Frontend
echo "🔨 Baue Frontend..."
docker build --build-arg BUILD_ENV=production --label "version=${VERSION}" -t ${FRONTEND_IMAGE}:build-${CI_COMMIT_SHORT_SHA} -f Dockerfile-frontend .

echo "🔐 Logge in GitLab Container Registry ein..."
docker login -u "$CI_REGISTRY_USER" -p "$CI_REGISTRY_PASSWORD" "$CI_REGISTRY"

echo "🔍 Setze Git-User für den CI-Runner..."
git config --global user.email "${GITLAB_USER_EMAIL}"
git config --global user.name "${GITLAB_USER_NAME}"

# 🔑 Setze Git-Authentifizierung mit Deploy Token
git remote set-url origin "https://$ACCESS_TOKEN:$ACCESS_TOKEN@$CI_SERVER_HOST/$CI_PROJECT_PATH.git"

# 🔖 Tagge & pushe Images
docker tag ${API_IMAGE}:build-${CI_COMMIT_SHORT_SHA} ${API_IMAGE}:${VERSION}
docker tag ${FRONTEND_IMAGE}:build-${CI_COMMIT_SHORT_SHA} ${FRONTEND_IMAGE}:${VERSION}
docker push ${API_IMAGE}:${VERSION}
docker push ${FRONTEND_IMAGE}:${VERSION}
echo "📌 Docker-Images getaggt und gepusht"

# 📌 Git-Tag erstellen & pushen
git tag -a "release-${VERSION}" -m "Release Candidate ${VERSION}"
git push origin "release-${VERSION}"
echo "📌 Git-Tag 'release-${VERSION}' erstellt und gepusht"


# Latest Tags erstellen
echo "📌 Erstelle Docker Latest Tags"
VERSION_MAJOR=$(echo "$VERSION" | awk -F. '{print $1}')
VERSION_MINOR=$(echo "$VERSION" | awk -F. '{print $1 "." $2}')

# 📌 Release Git-Tags erstellen & pushen
LATEST_VERSION_POSTFIX=$([[ "$IS_FINAL_BUILD" == "true" ]] && echo "" || echo "-rc")
if [[ "$IS_LATEST_PATCH_VERSION" == "true" ]]; then
  if [[ "$IS_FINAL_BUILD" == "true" || "$IS_LATEST_RC_VERSION" == "true" ]]; then 
    if [[ "$IS_FINAL_BUILD" == "false" ]]; then
      TAG_VERSION=${VERSION_MINOR}${LATEST_VERSION_POSTFIX}
      docker tag ${API_IMAGE}:${VERSION} ${API_IMAGE}:${TAG_VERSION}
      docker tag ${FRONTEND_IMAGE}:${VERSION} ${FRONTEND_IMAGE}:${TAG_VERSION}
      docker push ${API_IMAGE}:${TAG_VERSION}
      docker push ${FRONTEND_IMAGE}:${TAG_VERSION}
      
      echo "📌 Docker Tag ${TAG_VERSION} erstellt und gepusht"
    fi

    if [[ "$IS_LATEST_MINOR_VERSION" == "true" ]]; then
      TAG_VERSION=${VERSION_MAJOR}${LATEST_VERSION_POSTFIX}
      docker tag ${API_IMAGE}:${VERSION} ${API_IMAGE}:${TAG_VERSION}
      docker tag ${FRONTEND_IMAGE}:${VERSION} ${FRONTEND_IMAGE}:${TAG_VERSION}
      docker push ${API_IMAGE}:${TAG_VERSION}
      docker push ${FRONTEND_IMAGE}:${TAG_VERSION}
      echo "📌 Docker Tag ${TAG_VERSION} erstellt und gepusht"

      if [[ "$IS_LATEST_MAJOR_VERSION" == "true" ]]; then
        TAG_VERSION=latest${LATEST_VERSION_POSTFIX}
        docker tag ${API_IMAGE}:${VERSION} ${API_IMAGE}:${TAG_VERSION}
        docker tag ${FRONTEND_IMAGE}:${VERSION} ${FRONTEND_IMAGE}:${TAG_VERSION}
        docker push ${API_IMAGE}:${TAG_VERSION}
        docker push ${FRONTEND_IMAGE}:${TAG_VERSION}
        echo "📌 Docker Tag ${TAG_VERSION} erstellt und gepusht"
      fi
    fi
  fi
fi