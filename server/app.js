const { Message, Channel } = require("./database")
const TIMEOUT = 20 //seconds until user is disconnected for no keepalive

// Stores user info and web socket connection
class User {
    constructor(name, socket) {
        this.name = name
        this.socket = socket
        this.channel = "#general" // Join users to #general by default
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

    // Creates a new chat app server
    constructor() {
        this.users = []
        this.channels = ["#general"]
        this.commands = []
        this.loadChannels()
    }

    // Returns true if a channel already exists
    // @param {string} name Name of the channel to check
    async channelExists(name){
        return await Channel.exists(name)
    }

    // Send a message to all users of the specified channel.
    // By default, messages will be stored in a channel's history.
    // @param {string} channelName Name of the channel to send in
    // @param {string} text Message body
    // @param {boolean} saveToHistory Writes the message to history if true
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
    // @param {string} trigger Command text to act as trigger
    // @param {function} func Code to execute for this command
    command(trigger, func) {
        this.commands.push({
            trigger: trigger,
            func: func
        })
        console.debug(`Registered command '${trigger}'`)
    }

    // Attempts to create a new channel
    // @param {string} name New channel name
    async createChannel(name) {
        if (await Channel.exists(name)) {
            throw new Error(`Channel ${name} already exists.`)
        }
        const channel = new Channel(name)
        const result = await channel.save()
        this.channels.push(name)
        console.debug(`Created channel ${name}.`)
    }

    // Called whenever a new user connects.
    // @param {string} name Name of new user
    // @param {object} ws Web Socket with user's connection
    createUser(name, ws) {
        const newUser = new User(name, ws)
        this.keepalive(newUser)
        this.users.push(newUser)
        this.joinChannel(newUser, "#general")
        return newUser
    }

    // Removes a user from the user list. Note, this will not
    // disconnect them. Use app.disconnect() for that.
    // @param {object} user User object to delete from server
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
        console.debug(`Deleted user ${user.name}.`)
    }

    // Disconnects the specified user.
    // @param {object} user User to disconnect.
    disconnect(user) {
        user.socket.close()
    }

    // Retrieves either the last 10 messages sent in a channel,
    // or the last "number" of messages.
    // @param {string} channelName Name of the channel
    // @param {number} number Number of messages to retrieve
    async getChannelHistory(channelName, number) {
        let results = await Message.fetchByChannel(channelName, number)
        results.reverse()
        return results
    }

    // Returns list of channels
    getChannels() {
        return this.channels
    }

    // Attempts to retrieve the user object with the specified name.
    // @param {string} name Name of user object to retrieve.
    getUser(name) {
        for (const user of this.users) {
            if(user.name == name) {
                return user
            }
        }
        throw new Error(`User ${name} not found.`)
    }

    // Retrieves a list of all connected users.
    getUsers() {
        return this.users
    }

    // This function is attached to the web socket server's
    // "message" event, and iterates through all registered
    // commands looking for a match.
    // @param {string} message Incoming message to be handled.
    // @user {object} user User who sent the message to be handled.
    handler(message, user) {
        if(message == '') {
            return
        }
        // Iterate through registered commands
        for (const command of this.commands) {
            //console.debug(`Checking message ${message} against command ${command.trigger}.`)
            if(message.startsWith(command.trigger)) {
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
    // @param {object} user User who wishes to join the channel
    // @param {string} channelName Channel to create and/or join.
    async joinChannel(user, channelName) {
        if (! await Channel.exists(channelName)) {
            await this.createChannel(channelName)
        }
        user.channel = channelName
        this.channelMessage(user.channel, `${user.name} joined channel '${channelName}'.`, false)
    }

    // Function which resets the keepalive timeout. If "TIMEOUT"
    // seconds elapse without a "/keepalive" message from the user,
    // they will be disconnected.
    // @param {object} user User whose keepalive request should be handled.
    keepalive(user) {
        if (user.timer) {
            clearTimeout(user.timer)
        }
        user.timer = setTimeout(()=> {
            console.debug(`No keepalive message received from ${user.name} for ${TIMEOUT} seconds. Connection will be closed.`)
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
