FROM node:18

WORKDIR /app

COPY package*.json ./
COPY hardhat.config.js ./
COPY scripts/ ./scripts/
COPY contracts/ ./contracts/
COPY ignition/ ./ignition/

RUN npm install

EXPOSE 8545

# Crea uno script entrypoint
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]