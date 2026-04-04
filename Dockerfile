# ---- Development Stage ----
FROM node:20-alpine AS development
LABEL railway.disable-cache=true

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies (this will be cached unless package files change)
RUN npm install

# Copy source files (but node_modules will be preserved by volume mount)
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]


# ---- Build Stage ----
FROM node:20-alpine AS builder

ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build:all


# ---- Production Stage ----
# Note: nginx.conf is no longer used in production; it can be used as reference for local/dev setups.
FROM node:20-alpine AS production

WORKDIR /app

# Copy built Express server
COPY --from=builder /app/dist-server ./dist-server
# Copy static frontend bundle
COPY --from=builder /app/dist ./dist
# Copy public folder (needed by the seed endpoint for CSV files)
COPY --from=builder /app/public ./public
# Install only production dependencies
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

EXPOSE 3000
CMD ["node", "dist-server/server/index.js"]