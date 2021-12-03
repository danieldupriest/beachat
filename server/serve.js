require('dotenv').config()
const url = require('url')
const ws = require('ws')
const App = require('./app')
const { Message } = require('./database')

const PORT = process.env.PORT || 8080
const app = new App()

// Allows user to list all channels on the server
// Example: "/channels"
app.command('/channels', (args, fromUser) => {
    const channels = app.getChannels()
    channels.sort()
    fromUser.send('These channels are available:')
    channels.map((channel) => {
        fromUser.send(`- ${channel}`)
    })
    console.debug(`Sending user ${fromUser.name} list of channels.`)
})

// Allows user to view help instructions for using the server
// Example: "/help"
app.command('/help', (args, fromUser) => {
    console.debug(`Sending user ${fromUser.name} help and instructions.`)
    fromUser.send("The following commands are available:")
    fromUser.send("- /join [channel] Join a different channel. If it does not already exist it will be created.")
    fromUser.send("- /channels       List all available channels.")
    fromUser.send("- /history [num]  This will show the last [num] messages sent in the current channel.")
    fromUser.send("- /message [username] [message] Send a private message to another user.")
    fromUser.send("- /name [name] Change your username.")
    fromUser.send("- /users List all users currently connected.")
})

// Allows user to view history of messages in current channel
// Example: "/history 20" - Display last 20 messages.
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
        fromUser.send(`- ${message.text}`)
    })
    console.debug(`Sending user ${fromUser.name} last ${num} messages for channel ${channel}.`)
})

// Allows user to join (and possibly create) the specified channel
// Example: "/join #faq" - Creates #faq if it doesn't exist, and joins.
app.command('/join', async (args, fromUser) => {
    if (args.length < 2) {
        return fromUser.send("You must specify a channel name")
    }
    const channel = args[1]
    if (!channel.startsWith("#")) {
        return fromUser.send("Channel names must begin with a #. Example: #faq")
    }
    await app.joinChannel(fromUser, channel)
    console.debug(`User ${fromUser.name} joined channel ${channel}.`)
})

// Automatic message sent by the client app to keep a connection alive.
// By default, if no "/keepalive" message is sent, the server
// will disconnect the client after 20 seconds.
app.command("/keepalive", (args, fromUser) => {
    app.keepalive(fromUser)
    console.debug(`Performing keepalive for user ${fromUser.name}.`)
})

// Allows the user to send a private message to another user.
// Example: "/message someUser Hi there!" - Sends the message
// "Hi there!" to the user "someUser". These messages are not
// visible to other users, and they are not stored in history.
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

// Allows a user to change their name
// Example: "/name anonymous" - Changes a user's name to "anonymous".
app.command('/name', (args, fromUser) => {
    if (args.length < 2) {
        return fromUser.send("You must specify a new name.")
    }
    const newName = args[1]
    if (newName == '') {
        return fromUser.send("You must specify a new name.")
    }
    const oldName = fromUser.name
    fromUser.changeName(newName)
    console.debug(`User ${oldName} changed name to ${newName}.`)
    fromUser.send(`Name changed from ${oldName} to ${newName}`)
})

// Allows user to list all users connected to server.
// Example: "/users"
app.command('/users', (args, fromUser) => {
    const users = app.getUsers()
    fromUser.send("The following users are connected:")
    users.map((item) => {
        fromUser.send(`- ${item.name}`)
    })
    console.debug(`Sending user ${fromUser.name} list of users.`)
})

// This command catches any commands beginning with "/"
// that the system doesn't recognize, and returns an
// error to the user.
app.command('/', (args, fromUser) => {
    const command = args[0]
    console.debug(`User ${fromUser.name} sent unknown command: ${command}`)
    fromUser.send(`Unknown command: ${command}`)
    fromUser.send(`Send '/help' to view available commands.`)
})

// Any uncaught messages are treated as channel messages
// and will send a message to everyone in the user's
// current channel. Message history is saved for each channel.
// Example: "This is a message for my channel."
app.command('', (args, fromUser) => {
    const message = args.join(' ')
    app.channelMessage(fromUser.channel, `${fromUser.name}: ${message}`)
    console.debug(`User ${fromUser.name} sent message '${message}'.`)    
})

// Setup Web Socket Server to handle connections and pass messages
// to the app.handler() function.
const wss = new ws.WebSocketServer({ port: PORT })
wss.on('connection', (ws, req) => {
    const connectUrl = new URL("http://localhost/" + req.url)
    const name = connectUrl.searchParams.get('name')
    if (name == null) {
        return console.error("Web Socket connection refused. Missing name parameter.")
    }
    console.debug(`User ${name} connected.`)
    ws.name = name
    const user = app.createUser(name, ws)
    ws.on('message', (message) => {
        app.handler(message.toString(), user)
    })
    ws.on('error', (error)=> {
        console.error(error)
    })
    ws.on('close', (reasonCode, description) => {
        app.delete(user)
    })
})

console.debug(`Started Beachat Web Socket Server on port ${PORT}`)
