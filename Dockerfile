### Microservice directory ###
FROM node:latest
ARG microservice

# Create app directory
WORKDIR /usr/src/app

# COPY package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Bundle app source
COPY src/ ./src
COPY tsconfig.* ./

# Build the app
RUN npm run build

# Expose the port
EXPOSE 3000
ENV PORT=3000

# Start the app
CMD ["npm", "run", "start:prod"]