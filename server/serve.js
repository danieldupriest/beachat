require('dotenv').config()
const url = require('url')
const ws = require('ws')
const App = require('./app')

const PORT = process.env.PORT || 8080
const app = new App()

app.command('/channels', (args, fromUser) => {
    const channels = app.getChannels()
    channels.sort()
    fromUser.send('These channels are available:')
    channels.map((channel) => {
        fromUser.send(`- ${channel}`)
    })
})

app.command('/help', (args, fromUser) => {
    fromUser.send("The following commands are available:")
    fromUser.send("- /join [channel] Join a different channel. If it does not already exist it will be created.")
    fromUser.send("- /channels       List all available channels.")
    fromUser.send("- /history [num]  This will show the last [num] messages sent in the current channel.")
    fromUser.send("- /message [username] [message] Send a private message to another user.")
    fromUser.send("- /name [name] Change your username.")
    fromUser.send("- /users List all users currently connected.")
})

app.command('/history', async (args, fromUser) => {
    const channel = fromUser.channel
    let num = 10
    if (args.length > 1) {
        const input = parseInt(args[1])
        if (isNaN(input)) {
            return fromUser.send("Value provided must be an integer.")
        } else {
            num = input
        }
    }
    const history = await app.getChannelHistory(channel, num)
    fromUser.send(`Showing last ${num} messages in channel ${channel}:`)
    history.map((message) => {
        fromUser.send(`- ${message}`)
    })
})

app.command('/join', (args, fromUser) => {
    if (args.length < 2) {
        return fromUser.send("You must specify a channel name")
    }
    const channel = args[1]
    if (!channel.startsWith("#")) {
        return fromUser.send("Channel names must begin with a #. Example: #faq")
    }
    if(!app.channelExists(channel)) {
        app.createChannel(channel)
    }
    app.joinChannel(fromUser, channel)
})

app.command("/keepalive", (args, fromUser) => {
    app.keepalive(fromUser)
})

app.command('/message', (args, fromUser) => {
    if (args.length < 2) {
        return fromUser.send("You must specify the target username.")
    }
    if (args.length < 3) {
        return fromUser.send("You must write a message to send.")
    }
    const toUserName = args[1]
    let toUser
    try
    {    
        toUser = app.getUser(toUserName)
    } catch (e) {
        console.error(`Could not find user ${toUserName}`)
        return fromUser.send(`Could not find the user ${toUserName}`)
    }
    const message = args.slice(2).join(' ')
    console.debug(`Sending private message from ${fromUser.name} to ${toUser.name}.`)
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

const wss = new ws.WebSocketServer({ port: PORT })
wss.on('connection', (ws, req) => {
    const connectUrl = new URL("http://localhost/" + req.url)
    const name = connectUrl.searchParams.get('name')
    ws.name = name
    const user = app.createUser(name, ws)
    ws.on('message', (message) => {
        app.handle(message.toString(), user)
    })
    ws.on('error', (error)=> {
        console.error(error)
    })
    ws.on('close', (reasonCode, description) => {
        app.delete(user)
    })
})

console.log(`Started Beachat Web Socket Server on port ${PORT}`)