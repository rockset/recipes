FROM node:alpine
WORKDIR '/app'
COPY package.json .

Copy all local files into the image.
COPY . .

RUN apk add py-pip

RUN pip install awscli && \
    apk add --update jq


RUN export REACT_APP_ROCKSET_API_KEY=$(aws ssm get-parameter --with-decryption \
    --name /rockset/rs2/apikey/member --region us-west-2 \
    | jq -r '.Parameter | "\(.Name)\t\(.Value)"' | cut -f2)

RUN npm install
RUN npm audit fix

# Build for production.
RUN npm run build --production
RUN npm install -g serve

CMD serve -s build
EXPOSE 5000
