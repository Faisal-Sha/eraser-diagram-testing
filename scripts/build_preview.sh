#!/bin/bash
set -euo pipefail

echo "🌟 Setze Version: $VERSION"

# Install Node.js (if not using a Node image)
apk add --no-cache nodejs npm

# 📄 Generate API Docs
echo "📄 Generating API Documentation..."
cd api
npm install
npm run compodoc  # Replace with actual docs generation command
cd ..

# 📄 Generate Frontend Docs (if applicable)
echo "📄 Generating Frontend Documentation..."
cd frontend
npm install
npm run compodoc  # Replace with actual docs generation command
cd ..

# Setze Version in Angular-Frontend
sed -i "s/version: '.*'/version: '$VERSION'/" frontend/src/environments/environment.prod.ts
sed -i "s/showDocs: .*/showDocs: '${VERSION}'.startsWith('preview-'),/" frontend/src/environments/environment.prod.ts


# 🔨 Baue API
echo "🔨 Baue API..."
docker build --label "version=${VERSION}" -t ${API_IMAGE}:build-${CI_COMMIT_SHORT_SHA} -f Dockerfile-api .

# 🔨 Baue Frontend
echo "🔨 Baue Frontend..."
docker build --build-arg BUILD_ENV=preview --label "version=${VERSION}" -t ${FRONTEND_IMAGE}:build-${CI_COMMIT_SHORT_SHA} -f Dockerfile-frontend .

echo "🔐 Logge in GitLab Container Registry ein..."
docker login -u "$CI_REGISTRY_USER" -p "$CI_REGISTRY_PASSWORD" "$CI_REGISTRY"

# 🔖 Tagge & pushe Images
docker tag ${API_IMAGE}:build-${CI_COMMIT_SHORT_SHA} ${API_IMAGE}:${VERSION}
docker tag ${FRONTEND_IMAGE}:build-${CI_COMMIT_SHORT_SHA} ${FRONTEND_IMAGE}:${VERSION}
docker push ${API_IMAGE}:${VERSION}
docker push ${FRONTEND_IMAGE}:${VERSION}
echo "📌 Docker-Images getaggt und gepusht"