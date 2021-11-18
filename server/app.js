const db = require("./database")

class User {
    constructor(name, socket) {
        this.name = name
        this.socket = socket
        this.channel = "#general"
        this.send("Welcome to the Beachat server! Type '/help' for instructions and a list of commands you can use.")
    }
    changeName(newName) {
        this.name = newName
        this.socket.name = newName
        this.send(`Name changed to ${newName}`)
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
        this.joinChannel(newUser, "#general")
        return newUser
    }
    command(trigger, func) {
        this.commands.push({
            trigger: trigger,
            func: func
        })
    }
    channelMessage(channel, message, history=true) {
        if(this.channelExists(channel)) {
            this.users.map((user) => {
                if (user.channel == channel) {
                    user.send(message)
                }
            })
            if(!history) {
                return
            }
            db.run(`INSERT INTO messages (channel, date, message) VALUES (?, ?, ?)`, [channel, Date.now(), message], (err) => {
                if (err) {
                    console.log("Database error: " + err.message)
                }
            })

        }
    }
    getChannelHistory(channel, number) {
        return new Promise((resolve, reject) => {
          db.all(`SELECT message FROM messages WHERE channel = ? ORDER BY date DESC LIMIT ?`, [channel, number], (err, rows) => {
              if (err) {
                  reject(err.message)
              }
              rows.reverse()
              let messages = rows.map((item) => {
                return item['message']
              })
              
            resolve(messages)
          })
        })
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
        this.channelMessage(user.channel, `${user.name} joined channel '${user.channel}'.`, history=false)
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
            //console.log(`Checking ${comand.trigger} against ${message}`)
            if(message.startsWith(command.trigger)) {
                //console.log(`Matched '${command.trigger}'!`)
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
