FROM node:latest

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Bundle app source
COPY src/ ./src

# Build the app
RUN npm run build

# Expose the port
EXPOSE 3000

# Start the app
RUN npm run start:prod