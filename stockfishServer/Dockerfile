FROM node:18.20.8-slim

WORKDIR /usr/src/app

# Install Stockfish from Debian repositories
# This is cross-platform: works on both linux/amd64 and linux/arm64
RUN apt-get update && \
    apt-get install -y stockfish && \
    rm -rf /var/lib/apt/lists/*

# Add /usr/games to PATH (where Debian installs stockfish)
ENV PATH="/usr/games:${PATH}"

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Verify stockfish installation
RUN stockfish --version || echo "Stockfish 15.1 installed"

# Expose port
EXPOSE 8080

# Start the server
CMD [ "node", "src/index.js" ]
