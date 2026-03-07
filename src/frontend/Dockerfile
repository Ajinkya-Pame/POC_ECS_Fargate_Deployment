# Step 1: Build the React Application
FROM node:20.15-alpine AS build

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies (ci means clean install, matching the lockfile exactly)
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the Vite application for production (creates the /dist folder)
RUN npm run build

# Step 2: Serve the application using Nginx
FROM nginx:alpine

# Remove the default Nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy the built assets from the previous 'build' stage
COPY --from=build /app/dist /usr/share/nginx/html

# Create Nginx config TEMPLATE with $BACKEND_URL placeholder
# envsubst will replace this at container startup
RUN rm /etc/nginx/conf.d/default.conf
RUN echo 'server { \
    listen 80; \
    resolver 169.254.169.253 valid=10s ipv6=off; \
    location /api/ { \
        set $backend "http://${BACKEND_URL}"; \
        proxy_pass $backend; \
        proxy_http_version 1.1; \
        proxy_set_header Connection ""; \
        chunked_transfer_encoding off; \
        proxy_buffering off; \
        proxy_cache off; \
    } \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' >/etc/nginx/conf.d/default.conf.template

# Expose port 80 (This aligns with ECS and ALB configurations)
EXPOSE 80

# At startup: envsubst replaces $BACKEND_URL in template, then Nginx starts
CMD ["/bin/sh", "-c", "envsubst '${BACKEND_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
