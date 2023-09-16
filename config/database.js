import mongoose from 'mongoose'
import process from 'process'
import 'dotenv/config'

mongoose.connect(process.env.database)
        .then(() => console.log('Connected to the database'))

export default mongoose