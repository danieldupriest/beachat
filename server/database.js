const sqlite3 = require("sqlite3").verbose()

const DB_FILE = "./database.db"

let db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) {
    return console.error(err.messagae)
  }
  console.log("Connected to SQlite database")
})

db.get(`SELECT COUNT(*) FROM messages`, (err, row) => {
  if(err) {
    db.get(`CREATE TABLE messages (id INTEGER PRIMARY KEY AUTOINCREMENT, channel TEXT, date INTEGER, message TEXT)`, (err, row) => {
      if(err) {
        console.log(err.message)
        return
      }
      console.log("Created message table.")
    })
  }
})

module.exports = db
