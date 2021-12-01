const sqlite3 = require("sqlite3").verbose()

const DB_FILE = "./database.db"

let db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) {
    return console.error(err.messagae)
  }
  console.log("Connected to SQlite database")
})

module.exports = db
