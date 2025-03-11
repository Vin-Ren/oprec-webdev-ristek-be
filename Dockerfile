# Use the official Node.js image
FROM node:20

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json tsconfig.json ./

# Install dependencies using pnpm
RUN pnpm install

# Copy other application files
COPY . .

RUN pnpm prisma generate

RUN pnpm run build

# Expose the desired port (default is 3000 for many Node applications)
EXPOSE 3000

# Start the application
CMD ["pnpm", "run", "preview"]