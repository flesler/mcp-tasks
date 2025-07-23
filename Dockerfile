FROM node:20-alpine

WORKDIR /app

# Copy package files for production dependencies
COPY package*.json ./

# Install ONLY production dependencies (for externalized deps)
RUN npm ci --only=production && npm cache clean --force

# Copy pre-built application 
COPY dist/ ./dist/

# Set environment variables
ENV NODE_ENV=production

# Run the server
CMD ["node", "dist/index.js"]
