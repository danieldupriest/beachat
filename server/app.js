const { Message, Channel } = require("./database")
const TIMEOUT = 20 //seconds

// Stores user info and web socket connection
class User {
    constructor(name, socket) {
        this.name = name
        this.socket = socket
        this.channel = "#general"
        this.timer = null
        this.send("Connection established.")
        setTimeout(() => {
            this.send("Welcome to the Beachat server! Type '/help' for instructions and a list of commands you can use.")
        }, 1000)
    }

    // Change the user's name
    changeName(newName) {
        this.name = newName
        this.socket.name = newName
    }

    // Send a message directly to a user. This is a low-level
    // method used by other components to keep everyone in sync.
    send(text) {
        this.socket.send(text)
    }
}

// Contains all core functionality needed to implement all commands.
class App {
    constructor() {
        this.users = []
        this.channels = ["#general"]
        this.commands = []
        this.loadChannels()
    }

    // Returns true if a channel already exists
    async channelExists(name){
        return await Channel.exists(name)
    }

    // Send a message to all users of the specified channel.
    // By default, messages will be stored in a channel's history.
    async channelMessage(channelName, text, saveToHistory=true) {
        if (!Channel.exists(channelName)) {
            throw new Error(`Channel ${channel} not found.`)
        }
        const message = new Message(channelName, text)
        this.users.map((user) => {
            if (user.channel == channelName) {
                user.send(text)
            }
        })

        // Return if this message should not be written to history.
        if(saveToHistory) {
            await message.save()
        }
    }

    // Used to create and implement '/commands' which are
    // processed in the order they were registered. An empty
    // trigger string will catch all messages. the function
    // passed in will be run when a command matches. Functions
    // will have access to "args", which is an array of the
    // input string separated by spaces, and "fromUser", which
    // is an instance of the User class who sent the message.
    command(trigger, func) {
        this.commands.push({
            trigger: trigger,
            func: func
        })
        console.log(`Registered command '${trigger}'`)
    }

    // Attempts to create a new channel
    async createChannel(name) {
        if (await Channel.exists(name)) {
            throw new Error(`Channel ${name} already exists.`)
        }
        const channel = new Channel(name)
        const result = await channel.save()
        this.channels.push(name)
        console.log(`Created channel '${name}'.`)
    }

    // Called whenever a new user connects.
    createUser(name, ws) {
        const newUser = new User(name, ws)
        this.keepalive(newUser)
        this.users.push(newUser)
        this.joinChannel(newUser, "#general")
        return newUser
    }

    // Removes a user from the user list.
    delete(user) {
        if(user.timer) {
            clearInterval(user.timer)
        }
        this.users = this.users.filter((iterUser) => {
            if (user != iterUser) {
                return true
            }
            return false
        })
        console.log(`Deleted user ${user.name}.`)
    }

    // Disconnects the specified user.
    disconnect(user) {
        user.socket.close()
    }

    // Retrieves either the last 10 messages sent in a channel,
    // or the last "number" of messages.
    async getChannelHistory(channelName, number) {
        let results = await Message.fetchByChannel(channelName, number)
        results.reverse()
        return results
    }

    // Returns list of channels
    getChannels() {
        return this.channels
    }

    // Attempts to retrieve the user whose name is specified.
    getUser(name) {
        for (const user of this.users) {
            if(user.name == name) {
                return user
            }
        }
        throw new Error(`User ${name} not found.`)
    }

    // Retrieves a list of all connected.
    getUsers() {
        return this.users
    }

    // This function is attached to the web socket server's
    // "message" event, and iterates through all registered
    // commands looking for a match.
    handler(message, user) {
        if(message == '') {
            return
        }
        // Iterate through registered commands
        for (const command of this.commands) {
            //console.log(`Checking ${command.trigger} against ${message}`)
            if(message.startsWith(command.trigger)) {
                //console.log(`Received command '${command.trigger}' from ${user.name}.`)
                try {
                    return command.func(message.split(' '), user)
                } catch (e) {
                    console.error(`Error running command ${command.trigger}: ${e}`)
                }
            }
        }
    }

    // This will attempt to join a user to the specified channel.
    // If the channel does not exist, it will be created and the
    // user will be joined.
    async joinChannel(user, channelName) {
        if (! await Channel.exists(channelName)) {
            await this.createChannel(channelName)
        }
        user.channel = channelName
        console.log(`User ${user.name} joined channel ${channelName}`)
        this.channelMessage(user.channel, `${user.name} joined channel '${channelName}'.`, false)
    }

    // Function which resets the keepalive timeout. If "TIMEOUT"
    // seconds elapse without a "/keepalive" message from the user,
    // they will be disconnected.
    keepalive(user) {
        if (user.timer) {
            clearTimeout(user.timer)
        }
        user.timer = setTimeout(()=> {
            console.log(`No keepalive message received from ${user.name} for ${TIMEOUT} seconds. Connection closed.`)      
            this.disconnect(user)
        }, TIMEOUT * 1000)
    }

    // Loads existing channels from the database.
    async loadChannels() {
        this.channels = []
        const savedChannels = await Channel.fetchAll()
        for (const channel of savedChannels) {
            this.channels.push(channel.name)
        }
    }
}

module.exports = App