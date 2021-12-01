const sqlite3 = require("sqlite3").verbose()
const DB_FILE = "./database.db"

const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) {
    return console.error(err.messagae)
  }
  console.log("Connected to SQlite database")
})

class Channel {
  constructor(name, id=0) {
    this.id = id
    this.name = name
  }

  toString() {
    return `${this.name}`
  }

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

class Message {
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
  
  toString() {
    return `${this.date.toString()} - ${this.channel} - ${this.text}`
  }

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