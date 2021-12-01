const { db } = require("./database")

db.serialize( () => {
    db.run(`CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, channel TEXT, date INTEGER, text TEXT)`, (err) => {
        if (err) { throw new Error(err.msg) }
    })
    .run(`CREATE TABLE IF NOT EXISTS channels (id INTEGER PRIMARY KEY AUTOINCREMENT, name)`, (err) => {
        if (err) { throw new Error(err.msg) }
    })
    .run(`INSERT INTO channels (id, name) VALUES (0, '#general')`, (err) => {
        if (err) { throw new Error(err.msg) }
    })
})

db.close((err) => {
    if (err) {
        console.error(err.message)
    }
})