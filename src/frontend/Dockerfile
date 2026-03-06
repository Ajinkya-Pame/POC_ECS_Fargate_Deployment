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

# Create a simple inline conf to handle React SPA routing and API proxy
RUN rm /etc/nginx/conf.d/default.conf
RUN echo "server { \
    listen 80; \
    location /api/ { \
        proxy_pass http://backend:3001; \
        proxy_http_version 1.1; \
        proxy_set_header Connection ''; \
        chunked_transfer_encoding off; \
        proxy_buffering off; \
        proxy_cache off; \
    } \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files \$uri \$uri/ /index.html; \
    } \
}" >/etc/nginx/conf.d/default.conf

# Expose port 80 (This aligns with ECS and ALB configurations)
EXPOSE 80

# Start Nginx when the container starts
CMD ["nginx", "-g", "daemon off;"]
