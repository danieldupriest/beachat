# Beachat
Beachat is an IRC-like chat client/server written in Javascript for a networking class at Portland State University. The intention is to use socket connections to allow multiple clients to connect to a server, manage multiple chat rooms, and even provide a rudimentary history feature like that found in Discord.

## Building the server

1. Copy `/server/.env.sample` to `/server/.env` and update with the desired port.
2. Inside the `/server` directory, run `npm i`
3. If you wish to clear the database, remove `/server/database.db` and inside the `/server` directory, run `npm run init`

## Building the client
Note: If building with Node v17+ (as installed on google cloud instances), there is a bug which requires using the legacy openssl provider.

1. Edit `/client/src/App.vue` and change the `WebSocket("ws://localhost:8080...")` line to reflect your backend server url and port.
2. If you will be serving from a subdirectory, copy `vue.config.js.example` to `vue.config.js`, then edit the `publicPath` parameter to match your subdirectory. For example: `publicPath: "/mysubdirectory/"
3. Edit `/client/public/index.html` and update the `Content-Security-Policy` meta tag to allow connections to your backend server. The default setup is for localhost and my server.
4. Inside the `/client` directory, run `npm i`
5. If on Google cloud, run `export NODE_OPTIONS=--openssl-legacy-provider && npm run build`, otherwise `npm run build` should work.
6. Copy the contents of `/client/dist` to your web server's public directory.

## Running the dev server

1. Inside the `/server` directory, run `npm run serve`
