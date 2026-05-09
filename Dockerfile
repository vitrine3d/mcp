FROM node:22-slim
WORKDIR /app
COPY package.json tsconfig.json ./
RUN npm install
COPY src/ src/
RUN npm run build
ENTRYPOINT ["node", "dist/index.js"]
