# Product CMS rewrite BackEnd for Front end

This repository contains the backend code for rewrite of Backcountry's Product CMS.
The UI connects to this node layer which interacts with Mongo DB and Postgres DB (for backcountry apis such as attribute, merch, copy, sizing) and provides the necessary response to the front end.
This repository connects to both Mongo and Postgres via Prisma (ORM).

##### Tech stack:

Node version: 16+
Language: Javascript, Node.js, express.js
ORM: Prisma
Linter : eslint
Logging: pino

##### Steps to run the repository locally:

1. Install node.js
2. Clone the repository.
3. From the root folder, run `npm i`
4. To start the server, run `npm run start`
5. To start the server in watch mode, run `npm run dev`

##### Reference for developers :

- Pubsub topics are listened for creating new workflows.
