FROM node:20-alpine as build-stage

WORKDIR /app
RUN corepack enable
RUN corepack prepare pnpm@latest --activate

RUN npm config set registry https://registry.npmmirror.com

COPY .npmrc package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM nginx:stable-alpine as production-stage

COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY docker/10-render-platform-config.sh /docker-entrypoint.d/10-render-platform-config.sh
RUN chmod +x /docker-entrypoint.d/10-render-platform-config.sh

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
