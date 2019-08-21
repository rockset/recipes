FROM node:alpine
WORKDIR '/app'
COPY package.json .

# Copy all local files into the image.
COPY . .

RUN npm install
RUN npm audit fix

# Build for production.
RUN npm run build --production

# Install `serve` to run the application.
RUN npm install -g serve

# Set the command to start the node server.
CMD serve -s build

# Tell Docker about the port we'll run on.
EXPOSE 5000