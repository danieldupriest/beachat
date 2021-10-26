require('dotenv').config()
const ws = require('ws')

const wss = new ws.WebSocketServer({ port: process.env.PORT })
wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        console.log("Received: " + message)
    })
    ws.send("Sent from client")
})