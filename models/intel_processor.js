import mongoose from '../config/database.js'

const intelProcessorsSchema = mongoose.Schema({
    "Model": {
        type: String,
        unique: true
    }
}, {strict: false})


export default mongoose.model('IntelProcessors', intelProcessorsSchema)
