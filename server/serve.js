require('dotenv').config()
const url = require('url')
const ws = require('ws')
const App = require('./app')

const app = new App()

app.command('/join', (args, user) => {
    const channel = args[1]
    if(!app.channelExists(channel)) {
        app.createChannel(channel)
    }
    app.joinChannel(user, channel)
})

app.command('/message', (args, user) => {
    const toUserName = args[1]
    const message = args.slice(2).join(' ')
    app.privateMessage(user, toUserName, message)
})

app.command('/users', (args, user) => {
    const users = app.getUsers()
    user.send("Server: The following users are connected:")
    users.map((item) => {
        user.send(item.name)
    })
})

app.command('', (args, user) => {
    const message = args.join(' ')
    console.log(`User ${user.name} sent message '${message}'.`)
    app.channelMessage(user.channel, `${user.name}: ${message}`)
})

const wss = new ws.WebSocketServer({ port: process.env.PORT })
wss.on('connection', (ws, req) => {
    const connectUrl = new URL("http://localhost/" + req.url)
    const name = connectUrl.searchParams.get('name')
    ws.name = name
    const user = app.createUser(name, ws)
    ws.on('message', (message) => {
        app.handle(message.toString(), user)
    })
    ws.on('close', (reasonCode, description) => {
        app.deleteUser(ws.name)
    })
})