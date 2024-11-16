# Use the official Node.js image as a base
FROM node:16

# Set the working directory in the container
WORKDIR /app

# Copy all files in the current directory to the container
COPY . .

# Install dependencies (npm install runs in the container after copying the files)
RUN npm install

# Expose the desired port (e.g., 3000 if your app uses it)
EXPOSE 4000

# Define the default command to run the app
CMD ["node", "index.js"]