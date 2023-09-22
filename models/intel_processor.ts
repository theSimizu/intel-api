import '../config/database_mongo.js'
import mongoose from 'mongoose'


const intelProcessorsSchema = new mongoose.Schema({
    "Model": {
        type: String,
        unique: true
    }
}, {strict: false})


export default mongoose.model('IntelProcessors', intelProcessorsSchema)
