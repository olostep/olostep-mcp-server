# Olostep MCP Server
# Docker image for the Olostep Model Context Protocol server
# https://github.com/olostep/olostep-mcp-server

FROM node:20-alpine

LABEL org.opencontainers.image.title="Olostep MCP Server"
LABEL org.opencontainers.image.description="MCP server for web scraping, search, and content extraction powered by Olostep API"
LABEL org.opencontainers.image.url="https://github.com/olostep/olostep-mcp-server"
LABEL org.opencontainers.image.source="https://github.com/olostep/olostep-mcp-server"
LABEL org.opencontainers.image.vendor="Olostep"
LABEL org.opencontainers.image.licenses="ISC"

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production --ignore-scripts

# Copy built application
COPY build/ ./build/

# Environment variable for API key (required at runtime)
ENV OLOSTEP_API_KEY=""
ENV ORBIT_KEY=""

# The MCP server uses stdio transport, so we need interactive mode
# Run as non-root user for security
RUN addgroup -g 1001 -S mcpuser && \
    adduser -S mcpuser -u 1001 -G mcpuser && \
    chown -R mcpuser:mcpuser /app

USER mcpuser

# Entry point for the MCP server
ENTRYPOINT ["node", "build/index.js"]


