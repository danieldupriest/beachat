const { Message, Channel } = require("./database")
const TIMEOUT = 20 //seconds

class User {
    constructor(name, socket) {
        this.name = name
        this.socket = socket
        this.channel = "#general"
        this.timer = null
        this.send("Welcome to the Beachat server! Type '/help' for instructions and a list of commands you can use.")
    }
    changeName(newName) {
        this.name = newName
        this.socket.name = newName
        this.send(`Name changed to ${newName}`)
    }
    send(text) {
        this.socket.send(text)
    }
}

class App {
    constructor() {
        this.users = []
        this.channels = ["#general"]
        this.commands = []
        this.loadChannels()
    }
    
    async channelExists(name){
        return await Channel.exists(name)
    }

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

    command(trigger, func) {
        this.commands.push({
            trigger: trigger,
            func: func
        })
        console.log(`Registered command '${trigger}'`)
    }

    async createChannel(name) {
        if (await Channel.exists(name)) {
            throw new Error(`Channel ${name} already exists.`)
        }
        const channel = new Channel(name)
        const result = await channel.save()
        this.channels.push(name)
        console.log(`Created channel '${name}'.`)
    }

    createUser(name, ws) {
        const newUser = new User(name, ws)
        this.keepalive(newUser)
        this.users.push(newUser)
        this.joinChannel(newUser, "#general")
        return newUser
    }

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

    disconnect(user) {
        user.socket.close()
    }

    async getChannelHistory(channelName, number) {
        let results = await Message.fetchByChannel(channelName, number)
        results.reverse()
        return results
    }

    getChannels() {
        return this.channels
    }

    getUser(name) {
        for (const user of this.users) {
            if(user.name == name) {
                return user
            }
        }
        throw new Error(`User ${name} not found.`)
    }

    getUsers() {
        return this.users
    }

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

    async joinChannel(user, channelName) {
        if (! await Channel.exists(channelName)) {
            await this.createChannel(channelName)
        }
        user.channel = channelName
        console.log(`User ${user.name} joined channel ${channelName}`)
        this.channelMessage(user.channel, `${user.name} joined channel '${channelName}'.`, false)
    }

    keepalive(user) {
        if (user.timer) {
            clearTimeout(user.timer)
        }
        user.timer = setTimeout(()=> {
            console.log(`No keepalive message received from ${user.name} for ${TIMEOUT} seconds. Connection closed.`)      
            this.disconnect(user)
        }, TIMEOUT * 1000)
    }

    async loadChannels() {
        this.channels = []
        const savedChannels = await Channel.fetchAll()
        for (const channel of savedChannels) {
            this.channels.push(channel.name)
        }
    }
}

module.exports = App