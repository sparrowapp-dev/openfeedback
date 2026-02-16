# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Build args for environment variables
ARG VITE_API_URL=http://localhost:3000/api/v1
ARG VITE_API_KEY=
ARG VITE_BOARD_ID=

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace config
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* tsconfig.json ./

# Copy packages
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build shared package
RUN pnpm --filter @openfeedback/shared build

# Set env variables for build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_API_KEY=$VITE_API_KEY
ENV VITE_BOARD_ID=$VITE_BOARD_ID

# Build web app
RUN pnpm --filter @openfeedback/web build

# Production stage - nginx
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Copy nginx config
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
