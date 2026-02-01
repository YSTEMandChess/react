FROM node:18.20.8 AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code and configuration
COPY . .

# Build the React app
RUN npm run build

# Production stage - serve with nginx
FROM nginx:alpine

# Copy custom nginx configuration if needed
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

