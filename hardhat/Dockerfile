FROM node:18

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY hardhat.config.js ./
COPY scripts/ ./scripts/
COPY contracts/ ./contracts/
COPY ignition/ ./ignition/

RUN npm install

EXPOSE 8545

# Copy entrypoint script and make it executable
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Set the entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]