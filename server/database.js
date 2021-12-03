const sqlite3 = require("sqlite3").verbose()
const DB_FILE = "./database.db"

const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) {
    return console.error(err.messagae)
  }
  console.log("Connected to SQlite database")
})

// Dataclass to store channel information
class Channel {

  // Creates a new channel
  // @param {string} name Name of the channel beginning with #
  // @param {number} id ID of the channel for the database
  constructor(name, id=0) {
    this.id = id
    this.name = name
  }

  // Converts a channel to string representation
  toString() {
    return `${this.name}`
  }

  // Asynchronously returns true if a given channel exists in the database
  // @param {string} name Name of the channel to check
  static exists(name) {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM channels WHERE name=?`, [name], (err, rows) => {
        if (err) {
          reject(new Error(`Error checking for channel existence: ${err.message}`))
        }
        if (rows.length == 0) {
          resolve(false)
        }
        resolve(true)
      })
    })
  }

  // Asynchronously returns a sorted list of all channels
  static fetchAll() {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM channels ORDER BY name DESC`, [], (err, rows) => {
        if (err) {
          reject(new Error(`Error retrieving channels: ${err.message}`))
        }
        let results = []
        for (const row of rows) {
          let result = new Channel(row['name'], row['id'])
          results.push(result)
        }
        resolve(results)
      })
    })
  }

  // Asynchronously saves a new channel to the database
  save() {
    return new Promise((resolve, reject) => {
      db.serialize(()=> {
        db.run(`INSERT INTO channels (name) VALUES (?)`, [this.name], (err) => {
          if (err) {
            reject(new Error(`Error writing channel to database: ${err.message}`))
          }
        })
        .get(`SELECT last_insert_rowid()`, (err, result) => {
          if (err) {
            reject(new Error(`Error getting id: ${err.message}`))
          }
          this.id = result
          resolve(this)
        })
      })
    })
  }
}

// Dataclass to store message history in the database
class Message {

  // Creates a new message
  // @param {string} channel Channel a message was sent in
  // @param {string} text Message body
  // @param {number} id ID of a message (for database)
  // @param {date} date Unix timestamp for the message
  constructor(channel, text, id=0, date=null) {
    this.id = id
    this.channel = channel
    this.text = text
    if(date == null) {
      this.date = Date.now()
    } else {
      this.date = date
    }
  }
  
  // Converts message to a string representation
  toString() {
    return `${this.date.toString()} - ${this.channel} - ${this.text}`
  }

  // Asynchronously returns sorted history of messages for given channel
  // @param {string} channel The channel to return messages for
  // @param {number} number The number of messages to return
  static fetchByChannel(channel, number = 10) {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM messages WHERE channel = ? ORDER BY date DESC LIMIT ?`, [channel, number], (err, rows) => {
        if (err) {
          reject(new Error(`Error retrieving messages: ${err.message}`))
        }
        let results = []
        for (const row of rows) {
          let result = new Message(row['channel'], row['text'], row['id'], row['date'])
          results.push(result)
        }
        resolve(results)
      })
    })
  }

  // Aynchronously saves message to the database
  save() {
    return new Promise((resolve, reject) => {
      db.serialize(()=> {
        db.run(`INSERT INTO messages (channel, date, text) VALUES (?, ?, ?)`, [this.channel, this.date, this.text], (err) => {
          if (err) {
              reject(new Error(`Error writing to database: ${err.message}`))
          }
        })
        .get(`SELECT last_insert_rowid()`, (err, result) => {
          if (err) {
            reject(new Error(`Error getting id: ${err.message}`))
          }
          this.id = result
          resolve(this)
        })
      })
    })
  }
}

module.exports = { db, Message, Channel }