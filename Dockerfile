# Build stage
FROM node:18-alpine AS builder
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install ALL dependencies (including devDependencies) for build
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine
RUN apk add --no-cache openssl

EXPOSE 3000

WORKDIR /app

ENV NODE_ENV=production

# Copy package files
COPY package.json package-lock.json* ./

# Install only production dependencies
RUN npm ci --omit=dev && npm cache clean --force
# Remove CLI packages since we don't need them in production
RUN npm remove @shopify/cli

# Copy built application from builder stage
COPY --from=builder /app/build ./build
COPY --from=builder /app/public ./public
# Copy other necessary files
COPY . .

CMD ["npm", "run", "docker-start"]
