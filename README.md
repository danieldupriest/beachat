# Beachat
Beachat is an IRC-like chat client/server written in Javascript for a networking class at Portland State University. The intention is to use socket connections to allow multiple clients to connect to a server, manage multiple chat rooms, and even provide a rudimentary history feature like that found in Discord.

## Configuration

1. Copy `/server/.env.sample` to `/server/.env` and update with the desired port.
2. Edit `/client/src/App.vue` and change the `WebSocket("ws://dev.hypersweet.com:8080...")` line to reflect your backend server url and port.

## Building the server

1. Inside the `/server` directory, run `npm i`

## Building the client
If building with Node v17+, there is a bug which requires using the legacy openssl provider.

1. Inside the `/client` directory, run `npm i`
2. Run `export NODE_OPTIONS=--openssl-legacy-provider && npm run build`
3. Copy the contents of `/client/dist` to your web server's public directory.

## Running the dev server

1. Inside the `/server` directory, run `node serve.js`
