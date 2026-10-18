FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_MEMO_API_BASE=/api/v1/memo
ARG VITE_AUTH_API_BASE=/api/v1/auth
ARG VITE_OAUTH_AUTHORIZE_ACTION=/oauth/authorize

ENV VITE_MEMO_API_BASE=$VITE_MEMO_API_BASE \
    VITE_AUTH_API_BASE=$VITE_AUTH_API_BASE \
    VITE_OAUTH_AUTHORIZE_ACTION=$VITE_OAUTH_AUTHORIZE_ACTION

RUN npm run build

FROM nginx:alpine

COPY deploy/docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
