# Use Node.js version 18 on Debian Bullseye
FROM node:18-bullseye

# The /app directory should act as the main application directory
WORKDIR /app

# Copy the app package and package-lock.json file
COPY package*.json ./

# Install node packages
RUN npm install --ignore-scripts

# Copy Webpack configuration, Babel configuration, and source files
COPY webpack.config.js .babelrc ./
COPY ./src ./src


# Install the `serve` package globally to run the application
RUN npm install -g serve

# Set the environment variable to resolve the OpenSSL issue
ENV NODE_OPTIONS=--openssl-legacy-provider

# Build the app
RUN npm run build

# Expose the port (example: 3000)
EXPOSE 3000

# Start the app using the `serve` command
CMD ["serve", "-s", "site"]
