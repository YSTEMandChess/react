#FROM ubuntu:latest
#
#ENTRYPOINT ["top", "-b"]

# Dockerfile for `react-ystemandchess/Dockerfile`
# Stage 1: build with Node
FROM node:18-alpine AS builder
WORKDIR /app

# Install deps using package files first to leverage layer caching
COPY package*.json ./
RUN npm ci

# Copy source and build (set BUILD_DIR=dist for Vite)
COPY . .
ARG BUILD_DIR=build
RUN npm run build

# Stage 2: minimal runtime that serves static files on port 3000
FROM node:18-alpine AS runtime
WORKDIR /app

# install a small static server
RUN npm install -g serve@14.0.1 --unsafe-perm
ENV NODE_ENV=production

# copy built assets from builder
ARG BUILD_DIR=build
COPY --from=builder /app/${BUILD_DIR} /app/build

EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]
