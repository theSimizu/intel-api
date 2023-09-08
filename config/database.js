import mongoose from 'mongoose'

mongoose.connect('mongodb://127.0.0.1:27017/processors')
.then(() => console.log('Connected to the database'))

export default mongoose