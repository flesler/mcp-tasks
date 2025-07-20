FROM node:20-alpine AS builder

COPY . /app
WORKDIR /app

# Install dependencies and build TypeScript code
RUN npm ci && npm run build

# Set environment variables
ENV NODE_ENV=production

# Run the server
CMD ["node", "dist/index.js"]
