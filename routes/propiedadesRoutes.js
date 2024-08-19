import express, { Router } from 'express'
import {admin} from '../controllers/propiedadController.js'

//Routing
const router = express.Router()

router.get('/mis-propiedades', admin)

export default router;