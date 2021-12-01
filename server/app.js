const db = require("./database")
const TIMEOUT = 6 //seconds

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
    send(message) {
        this.socket.send(message)
    }
}

class App {
    constructor() {
        this.users = []
        this.channels = ["#general"]
        this.commands = []
        this.loadChannels()
    }

    loadChannels() {
        this.channels = []
        db.all(`SELECT name FROM channels ORDER BY name`, [], (err, rows) => {
            if (err) {
                throw new Error(`Error reading database:: ${err.message}`)
            }
            this.channels = []
            for (const row of rows) {
                this.channels.push(row.name)
            }
        })
    }
    
    channelExists(name){
        return this.channels.includes(name)
    }

    createChannel(name) {
        if (this.channels.includes(name)) {
            throw new Error(`Channel ${name} already exists.`)
        }
        this.channels.push(name)
        
        // Write the channel to the database.
        db.run(`INSERT INTO channels (name) VALUES (?)`, [name], (err) => {
            if (err) {
                throw new Error(`Error writing to database: ${err.message}`)
            }
        })
        console.log(`Created channel '${name}'.`)
    }

    createUser(name, ws) {
        const newUser = new User(name, ws)
        this.keepalive(newUser)
        this.users.push(newUser)
        this.joinChannel(newUser, "#general")
        return newUser
    }
    command(trigger, func) {
        console.log(`Registered command '${trigger}'`)
        this.commands.push({
            trigger: trigger,
            func: func
        })
    }
    channelMessage(channel, message, history=true) {
        if (!this.channels.includes(channel)) {
            throw new Error(`Channel ${channel} not found.`)
        }
        this.users.map((user) => {
            if (user.channel == channel) {
                user.send(message)
            }
        })        

        // Return if this message should not be written to history.
        if(!history) {
            return
        }

        // Write the message to the channel history.
        db.run(`INSERT INTO messages (channel, date, message) VALUES (?, ?, ?)`, [channel, Date.now(), message], (err) => {
            if (err) {
                throw new Error(`Error writing to database: ${err.message}`)
            }
        })
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
        throw new Error("User not found")
    }
    getUsers() {
        return this.users
    }
    joinChannel(user, channel) {
        user.channel = channel
        console.log(`User ${user.name} joined channel '${channel}'`)
        this.channelMessage(user.channel, `${user.name} joined channel '${user.channel}'.`, false)
    }
    userMessage(name, message) {
        this.users.map((user) => {
            if (user.name == name) {
                user.send(message)
            }
        })
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
        console.log(`No keepalive message received from ${user.name} for ${TIMEOUT} seconds. Connection closed.`)      
    }
    keepalive(user) {
        //console.debug(`In keepalive() for user ${user.name}.`)

        if (user.timer) {
            clearTimeout(user.timer)
        }
        user.timer = setTimeout(()=> {this.disconnect(user)}, TIMEOUT*1000)
    }
    handle(message, user) {
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
}

module.exports = App
