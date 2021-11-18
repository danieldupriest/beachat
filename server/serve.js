require('dotenv').config()
const url = require('url')
const ws = require('ws')
const App = require('./app')
const db = require('./database.js')

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
    fromUser.send('These channels are available:')
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

app.command('/help', (args, fromUser) => {
    fromUser.send("The following commands are available:")
    fromUser.send("- /join [channel] Join a different channel. If it does not already exist it will be created.")
    fromUser.send("- /channels       List all available channels.")
    fromUser.send("- /message [username] [message] Send a private message to another user.")
    fromUser.send("- /name [name] Change your username.")
    fromUser.send("- /users List all users currently connected.")
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
        fromUser.send("You must specify a newname.")
        return
    }
    fromUser.changeName(newName)
})

app.command('/users', (args, user) => {
    const users = app.getUsers()
    user.send("The following users are connected:")
    users.map((item) => {
        user.send(`- ${item.name}`)
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
