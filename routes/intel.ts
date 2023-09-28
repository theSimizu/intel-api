import express from 'express'
import IntelProcessor from '../models/intel_processor.js'
import JSONStream from 'JSONStream'

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
    res.set('Content-Type', 'application/json')
    await IntelProcessor.find({})
                        .select(removeSelected)
                        .cursor()
                        .pipe(JSONStream.stringify())
                        .pipe(res.type('json'))

})

export default router
