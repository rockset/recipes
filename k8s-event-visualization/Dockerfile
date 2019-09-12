FROM node:alpine
WORKDIR '/app'
COPY package.json .

# Copy all local files into the image.
COPY . .

RUN npm install
RUN npm audit fix

# Build for production.
RUN export REACT_APP_ROCKSET_API_KEY=<API key here> && npm run build --production && npm install -g serve