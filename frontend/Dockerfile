# setup node environment
FROM --platform=linux/amd64 node:18 as node
WORKDIR /app/frontend
COPY . .
COPY ../common ../common
RUN npm install
RUN npm run build --omit=dev

# setup nginx environment
FROM --platform=linux/amd64 nginx:alpine
COPY --from=node /app/dist/calculation-tool /usr/share/nginx/html
COPY /nginx.conf  /etc/nginx/conf.d/default.conf