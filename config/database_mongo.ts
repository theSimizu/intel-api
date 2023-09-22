import mongoose from 'mongoose'
import process from 'process'
import 'dotenv/config'

const db:string = process.env.database || ''

mongoose.connect(db, {
    authSource: "admin",
    user: process.env.user,
    pass: process.env.password
}).then(() => console.log('Connected to the database'))
