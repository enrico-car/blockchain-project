FROM node:18

WORKDIR /app

# Install dependencies
COPY package*.json ./

RUN npm install --include=dev

COPY . .

EXPOSE 3000

# Copy entrypoint script and make it executable
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Set the entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]