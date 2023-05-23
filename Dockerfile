FROM node:18.12.0

COPY ./ ./

RUN npm install

EXPOSE 3000
CMD [ "node", "app.js" ]