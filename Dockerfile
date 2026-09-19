# Jef has no dependencies, so there is nothing to install and nothing to audit.
# The whole server is four files of plain JavaScript.
FROM node:22-alpine

WORKDIR /app
COPY package.json server.json glama.json README.md LICENSE ./
COPY src ./src
COPY test.js ./

# Prove it works at build time. No network is touched.
RUN node test.js

# Nothing is written, nothing is read, nothing listens on a port.
USER node
ENTRYPOINT ["node", "src/stdio.js"]
