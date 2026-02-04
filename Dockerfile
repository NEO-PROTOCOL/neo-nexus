FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy dependency files
COPY package.json ./

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

# Install dependencies (allow scripts for native builds)
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "dist/server.js"]
