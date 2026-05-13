FROM node:22-alpine

WORKDIR /app

# Copy package files from frontend folder
COPY package*.json ./


# Install dependencies
RUN npm ci

# Copy source code from frontend folder
COPY . .

# Expose port
EXPOSE 3000

# Start Next.js in development mode
CMD ["npm","run", "dev"]