FROM node:22-alpine

WORKDIR /app

# Copy package descriptors and install dependencies
COPY package.json package-lock.json* ./

# Install dependencies (ignoring devDependencies in production isn't strictly necessary here because we need Vite to build)
RUN npm install

# Copy application source
COPY . .

# Build the frontend assets
RUN npm run build

# Expose the application port
EXPOSE 3000

# Set Node environment to production
ENV NODE_ENV=production

# Start the Node.js backend
CMD ["npm", "start"]
