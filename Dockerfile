FROM node:18.12.0

COPY ./ ./

RUN npm install
RUN npm run prisma:generate
RUN npm run prisma:push

EXPOSE 3000
CMD [ "node", "index.js" ]