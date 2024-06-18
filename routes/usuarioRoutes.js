import express from 'express'
import {formularioLogin, 
    formularioRegistro,
    registrar,
    confirmar,
    formularioOlvidePassword,
} from '../controllers/usuarioController.js'

//Routing
const router = express.Router()

router.get('/login', formularioLogin );

router.get('/registro', formularioRegistro);
router.post('/registro', registrar);

router.get('/confirmar/:token', confirmar);

router.get('/olvide-password', formularioOlvidePassword);


export default router;