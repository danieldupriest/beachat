require('dotenv').config()
const url = require('url')
const ws = require('ws')

const wss = new ws.WebSocketServer({ port: process.env.PORT })
wss.on('connection', (ws, req) => {
    const connectUrl = new URL("http://localhost/" + req.url)
    const name = connectUrl.searchParams.get('name')
    ws.name = name
    ws.on('message', (message) => {
        console.log(`Received message: '${message}'`)
        ws.send(`Received message: '${message}'`)
    })
})