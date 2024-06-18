import { check, validationResult } from 'express-validator';
import Usuario from '../models/Usuario.js'
import { generarId } from '../helpers/tokens.js'
import { emailRegistro } from '../helpers/email.js'

const formularioLogin = (req, res) => {
    res.render('auth/login', {
        pagina: 'Iniciar Sesión'
    })
}

//* REGISTRO
const formularioRegistro = (req, res) => {
    res.render('auth/registro', {
        pagina: 'Crear cuenta',
        csrfToken : req.csrfToken()
    })
}

const registrar = async (req, res) => {
    //* Validaciones
    await check('nombre').notEmpty().withMessage("El nombre es obligatorio").run(req);
    await check('email').isEmail().withMessage("Ingrese un formato de email correcto").run(req);
    await check('password').isLength({ min: 6 }).withMessage("Password debe de ser de al menos 6 caracteres").run(req);
    await check('repetir_password').equals(req.body.password).withMessage("Los password no son iguales").run(req);

    let resultado = validationResult(req);

    //Verificar que el resultado este vacio
    if (!resultado.isEmpty()) {
        //Errores
        return res.render('auth/registro', {
            pagina: 'Crear cuenta',
            csrfToken : req.csrfToken(),
            errores: resultado.array(),
            usuario: {
                nombre: req.body.nombre,
                email: req.body.email
            }
        })
    }

    //Extraer datos
    const { nombre, email, password } = req.body;

    //Verificar que el usuario no este registrado
    const existeUsuario = await Usuario.findOne({ where: { email } })

    if (existeUsuario) {
        //Errores
        return res.render('auth/registro', {
            pagina: 'Crear cuenta',
            errores: [{ msg: 'El correo ya esta registrado' }],
            csrfToken : req.csrfToken(),
            usuario: {
                nombre: req.body.nombre,
                email: req.body.email
            }
        })
    }

    //*ALMACENAR USUARIO
    const usuario = await Usuario.create({
        nombre,
        email,
        password,
        token: generarId()
    })

    //* Envia Email de confirmacion
    emailRegistro({
        nombre: usuario.nombre,
        email: usuario.email,
        token: usuario.token
    })

    //* Mostrar mensajes de confirmacion de cuenta
    res.render('templates/mensaje', {
        pagina: 'Cuenta creada correctamente',
        mensaje: 'Hemos enviado un Email de confirmacion, presiona en el enlace'
    })
}

//* FUNCION QUE COMPRUEBA UNA CUENTA DE USUARIO
const confirmar = async  (req, res)=>{
    const {token} = req.params;

    //Verificar si el token es valido
    const usuario = await Usuario.findOne({ where: { token } })

    if(!usuario){
        return res.render('auth/confirmar-cuenta',{
            pagina: 'Error al confirmar tu cuenta',
            mensaje: 'Hubo un error al confirmar tu cuenta, intentalo nuevamente',
            error:true
        })
    }

    //Confirmar la cuenta
    usuario.token = null;
    usuario.confirmado = true;
    await usuario.save();

    if(usuario){
        return res.render('auth/confirmar-cuenta',{
            pagina: 'Cuenta confirmada',
            mensaje: 'La cuenta se confirmo correctamente',
            error:false
        })
    }
}

const formularioOlvidePassword = (req, res) => {
    res.render('auth/olvide-password', {
        pagina: 'Recupera tu acceso a Bienes Raices'
    })
}

export {
    formularioLogin,
    formularioRegistro,
    registrar,
    confirmar,
    formularioOlvidePassword,
}