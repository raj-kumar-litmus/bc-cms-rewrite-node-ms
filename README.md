# Product CMS Rewrite Backend for Front End

This repository contains the backend code for the rewrite of Backcountry's Product CMS. The UI connects to this Node.js layer, which interacts with MongoDB and PostgresDB (for Backcountry APIs such as attribute, merch, copy, sizing) and provides the necessary response to the front end. This repository connects to both MongoDB and PostgresDB via Prisma (ORM).

## Tech Stack

- Node.js version: 16+
- Language: JavaScript, Node.js, Express.js
- ORM: Prisma
- Linter: ESLint
- Logging: Pino

## Steps to Run the Repository Locally

1. Install Node.js.
2. Clone the repository.
3. From the root folder, run `npm install`.
4. To start the server, run `npm run start`.
5. To start the server in watch mode, run `npm run dev`.

### Authentication

The backend provides authentication functionality. However, during development or testing, you can skip the authentication process by setting the `SKIP_AUTH` environment variable to `true` in your configuration. This allows for easier development and testing without the need for authentication.

#### Configuration

Make sure to set the following environment variables in your configuration file:

- `SKIP_AUTH=true`: Skip authentication during development or testing.
- `USER_NAME=<your_user_name>`: username used when authentication is skipped.
- `USER_EMAIL=<your_user_email>`: user email used when authentication is skipped.

## Reference for Developers

- Pubsub topics are listened for creating new workflows.
- ...
