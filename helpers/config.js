const mongoose = require("mongoose");
require("dotenv").config();

const user = process.env.MONGO_USER;
const pass = process.env.MONGO_PASS;
const DB = process.env.MONGO_DB;
mongoose.connect(
    `mongodb+srv://${user}:${pass}@cluster0.idxsn.mongodb.net/${DB}?retryWrites=true&w=majority`,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }
).then(() => {
    console.log('DB Connection successfull')
}).catch((err) => {
    console.log(`no connectoin error -> ${err}`)
})
