import { check, validationResult } from 'express-validator';
import bcrypt from 'bcrypt'
import Usuario from '../models/Usuario.js'
import { generarId, generarJWT } from '../helpers/tokens.js'
import { emailRegistro, emailOlvidePassword } from '../helpers/email.js'
import { where } from 'sequelize';

const formularioLogin = (req, res) => {
    res.render('auth/login', {
        pagina: 'Iniciar Sesión',
        csrfToken : req.csrfToken()
    })
}

const autenticar = async (req, res) => {
    //Validaciones
    await check('email').isEmail().withMessage("El Email es obligatorio").run(req);
    await check('password').notEmpty().withMessage("El Password es obligatorio").run(req);

    let resultado = validationResult(req);

    //Verificar que el resultado este vacio
    if (!resultado.isEmpty()) {
        //Errores
        return res.render('auth/login', {
            pagina: 'Iniciar sesion',
            csrfToken : req.csrfToken(),
            errores: resultado.array()
        })
    }

    const {email, password} = req.body;

    //comprobar si el usuario existe
    const usuario = await Usuario.findOne({where : {email}});

    if(!usuario){
        return res.render('auth/login', {
            pagina: 'Iniciar Sesión',
            csrfToken : req.csrfToken(),
            errores: [{msg: "El usuario no existe"}]
        })
    }

    //Comprobar si el usuario esta confirmado
    if(!usuario.confirmado){
        return res.render('auth/login', {
            pagina: 'Iniciar Sesión',
            csrfToken : req.csrfToken(),
            errores: [{msg: "Tu cuenta no ha sido confirmada"}]
        })
    }

    //Revisar el password
    if(!usuario.verificarPassword(password)){
        return res.render('auth/login', {
            pagina: 'Iniciar Sesión',
            csrfToken : req.csrfToken(),
            errores: [{msg: "El password es incorrecto"}]
        })
    }

    //Autenticar el usuario
    const token = generarJWT({id: usuario.id, nombre: usuario.nombre});

    //Almacenar token en un cookie
    return res.cookie('_token', token, {
        httpOnly: true,
        //secure: true,
        //sameSite: true,
    }).redirect('/mis-propiedades') 
}

//* REGISTRO
const formularioRegistro = (req, res) => {
    res.render('auth/registro', {
        pagina: 'Crear cuenta',
        csrfToken : req.csrfToken()
    })
}

const  registrar = async (req, res) => {
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
        pagina: 'Recupera tu acceso a Bienes Raices',
        csrfToken : req.csrfToken(),
})}

const resetPassword = async (req, res) => {
        //* Validaciones
        await check('email').isEmail().withMessage("Ingrese un formato de email correcto").run(req);

        let resultado = validationResult(req);
    
        //Verificar que el resultado este vacio
        if (!resultado.isEmpty()) {
            //Errores
            return res.render('auth/olvide-password', {
                pagina: 'Recupera tu password',
                csrfToken : req.csrfToken(),
                errores: resultado.array(),
            })
        }

        //Extraer datos
        const {email} = req.body;

        //Buscar usuario

        const usuario = await Usuario.findOne({ where: {email}})
        
        if(!usuario){
            //Errores
            return res.render('auth/olvide-password', {
                pagina: 'Recupera tu password',
                csrfToken : req.csrfToken(),
                errores: [{msg: "El email no pertenece a ningun usuario"}],
            })
        }

        //Generar un token
        usuario.token = generarId();
        await usuario.save();

        //Enviar un email
        emailOlvidePassword({
            email: usuario.email,
            nombre: usuario.nombre,
            token: usuario.token,
        });

        //Renderizar un mensaje
        res.render('templates/mensaje', {
            pagina: 'Reestablece tu Password',
            mensaje: 'Hemos enviado un Email con las instrucciones'
        })
}

const comprobarToken = async (req, res) => {

    const {token} = req.params;

    const usuario = await Usuario.findOne({where : {token}})

    if(!usuario){
        return res.render('auth/confirmar-cuenta',{
            pagina: 'Reestablece tu password',
            mensaje: 'Hubo un error al validar tu informacion, intentalo nuevamente',
            error:true
        })
    }

    //Mostrar formulario para modificar el password
    res.render('auth/reset-password', {
        pagina: 'Reestablece tu Password',
        csrfToken : req.csrfToken(),
    })
}

const nuevoPassword = async (req, res) => {
    //Validar el nuevo password
    await check('password').isLength({ min: 6 }).withMessage("Password debe de ser de al menos 6 caracteres").run(req);

    let resultado = validationResult(req);

    //Verificar que el resultado este vacio
    if (!resultado.isEmpty()) {
        //Errores
        return res.render('auth/reset-password', {
            pagina: 'Reestablece tu password',
            csrfToken : req.csrfToken(),
            errores: resultado.array(),
        })
    }

    const {token} = req.params;
    const {password} = req.body;

    //Idetificar quien hace el cambio
    const usuario = await Usuario.findOne({where : {token}})

    //Hashear el nuevo password
    const salt = await bcrypt.genSalt(10);
    usuario.password = await bcrypt.hash(password, salt);
    usuario.token = null;

    await usuario.save();

    res.render('auth/confirmar-cuenta', {
        pagina: 'Password reestablecido',
        mensaje: 'El password se guardo correctamente'

    })

}


export {
    formularioLogin,
    autenticar,
    formularioRegistro,
    registrar,
    confirmar,
    formularioOlvidePassword,
    resetPassword,
    comprobarToken,
    nuevoPassword,
}