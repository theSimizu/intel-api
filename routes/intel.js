import express from 'express'
import IntelProcessor from '../models/intel_processor.js'

const router = express.Router();
const removeSelected = '-_id -__v -indexModel -indexNumber'

router.get('/number/:id', async (req, res) => {
    const id = req.params.id.replace(/[^a-zA-Z0-9]/g, '')
                            .replace('Intel', '')
                            .replace('Processor', '')
                            .toUpperCase()

    const processor = await IntelProcessor.findOne({'indexNumber': id})
                                          .select(removeSelected)

    res.json(processor)
})

router.get('/all', async (req, res) => {
    const processors = await IntelProcessor.find({})
                                           .select(removeSelected)

    res.json(processors)
})

export default router
