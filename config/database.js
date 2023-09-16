import mongoose from 'mongoose'
import process from 'process'
import 'dotenv/config'

mongoose.connect(process.env.database, {
    authSource: "admin",
    user: process.env.user,
    pass: process.env.password
}).then(() => console.log('Connected to the database'))

export default mongoose