FROM node:20-alpine

WORKDIR /app

# Copy application files
COPY . .

# Install dependencies and generate Prisma client
RUN npm ci && \
    npm run prisma:generate

# Create a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3001

ENV NODE_ENV=production

CMD ["npm", "start"] 