import express from 'express'

//Routing
const router = express.Router()

router.get('/', (req, res) => {
    res.json({msg:'Hola mundo en express'})
});

router.post('/', (req, res) => {
    res.json({msg:"Respuesta en post"})
});


export default router;