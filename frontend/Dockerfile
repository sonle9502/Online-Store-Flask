# Frontend
FROM node:18 AS build

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install 

# Copy the rest of the application
COPY . .

# Use a smaller image for production
FROM node:18 AS production

WORKDIR /app
COPY --from=build /app ./

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
