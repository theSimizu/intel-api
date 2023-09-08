import mongoose from '../config/database.js'

const intelProcessorsSchema = mongoose.Schema({}, {strict: false})


export default mongoose.model('IntelProcessors', intelProcessorsSchema)
