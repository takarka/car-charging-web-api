FROM node:18.18.0

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build TypeScript code
RUN npm run build

# Expose the port the app will run on
EXPOSE 3000

# Command to run the application
CMD ["node", "./dist/index.js"]
