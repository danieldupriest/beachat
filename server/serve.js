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

app.command('/channels', (args, fromUser) => {
    const channels = app.getChannels()
    fromUser.send('Server: These channels are available:')
    channels.sort((a,b) => {
        if (a.name < b.name) {
            return -1
        } else if (a.name > b.name) {
            return 1
        }
        return 0
    })
    channels.map((channel) => {
        fromUser.send(channel.name)
    })
})

app.command('/message', (args, fromUser) => {
    const toUserName = args[1]
    const toUser = app.getUser(toUserName)
    const message = args.slice(2).join(' ')
    console.log(`Sending private message from ${fromUser.name} to ${toUser.name}.`)
    toUser.send(`Private message from ${fromUser.name}: ${message}`)
})

app.command('/name', (args, fromUser) => {
    const newName = args[1]
    if (newName == undefined || newName == '') {
        fromUser.send("Server: You must specify a newname.")
        return
    }
    fromUser.changeName(newName)
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