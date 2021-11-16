class User {
    constructor(name, socket) {
        this.name = name
        this.socket = socket
        this.channel = "#general"
        this.send("Server: Welcome to the Beachat server! Type '/help' for instructions and a list of commands you can use.")
    }
    changeName(newName) {
        this.name = newName
        this.socket.name = newName
        this.send(`Server: Name changed to ${newName}`)
    }
    send(message) {
        this.socket.send(message)
    }
}

class Channel {
    constructor(name) {
        this.name = name
        this.history = []
    }
}

class App {
    constructor() {
        this.users = []
        this.channels = [new Channel("#general")]
        this.commands = []
    }
    channelExists(name){
        for (const channel of this.channels) {
            if (name == channel.name) {
                return true
            }
        }
        return false
    }
    createChannel(name) {
        console.log(`Creating channel '${name}'.`)
        this.channels.push(new Channel(name))
    }
    createUser(name, ws) {
        const newUser = new User(name, ws)
        this.users.push(newUser)
        this.channelMessage("#general", `Server: ${newUser.name} joined channel #general.`)
        return newUser
    }
    command(trigger, func) {
        this.commands.push({
            trigger: trigger,
            func: func
        })
    }
    channelMessage(channel, message) {
        if(this.channelExists(channel)) {
            this.users.map((user) => {
                if (user.channel == channel) {
                    user.send(message)
                }
            })
        }
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
        return null
    }
    getUsers() {
        return this.users
    }
    joinChannel(user, channel) {
        user.channel = channel
        console.log(`User ${user.name} joined channel '${channel}'`)
        this.channelMessage(user.channel, `Server: ${user.name} joined channel '${user.channel}'.`)
    }
    userMessage(name, message) {
        this.users.map((user) => {
            if (user.name == name) {
                user.send(message)
            }
        })
    }
    deleteUser(name) {
        this.users = this.users.filter((user) => {
            if (user.name != name) {
                return true
            }
            return false
        })
    }
    handle(message, user) {
        for (const command of this.commands) {
            console.log(`Checking ${comand.trigger} against ${message}`)
            if(message.startsWith(command.trigger)) {
                console.log(`Matched '${command.trigger}'!`)
                //console.log("Calling command.func with " + message + " and " + user.name)
                try {
                    return command.func(message.split(' '), user)
                } catch (e) {
                    console.log("Error: " + e)
                }
            }
        }
    }
}

module.exports = App