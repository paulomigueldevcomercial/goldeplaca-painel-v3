# Build stage
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

# Runtime stage
FROM nginx:1.27-alpine

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.d/40-goldeplaca-env.sh /docker-entrypoint.d/40-goldeplaca-env.sh
RUN chmod +x /docker-entrypoint.d/40-goldeplaca-env.sh

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
