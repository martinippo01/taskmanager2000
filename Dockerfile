### Shared directory ###
FROM node:latest AS shared

WORKDIR /usr/src/app

# COPY package.json and package-lock.json
COPY shared/package*.json .

# Install dependencies
RUN npm install

# Bundle shared source
COPY shared/src/ ./src
COPY shared/tsconfig.* ./

# Install tsc
RUN npm install -g typescript

# Build the shared
RUN tsc


### Microservice directory ###
FROM node:latest AS microservice
ARG microservice

# Create app directory
WORKDIR /usr/src/app

# COPY package.json and package-lock.json
COPY ${microservice}/package*.json ./
COPY --from=shared /usr/src/app/lib ../shared/lib
COPY --from=shared /usr/src/app/node_modules ../shared/node_modules

# Install dependencies
RUN npm install

# Bundle app source
COPY ${microservice}/src/ ./src
COPY ${microservice}/tsconfig.* ./

# Build the app
RUN npm run build

# Expose the port
EXPOSE 3000
ENV PORT=3000

# Start the app
CMD ["npm", "run", "start:prod"]