const formularioLogin = (req, res) =>{
    res.render('auth/login', {

    })
} 

const formularioRegistro = (req, res) =>{
    res.render('auth/registro', {
        
    })
} 

export {
    formularioLogin,
    formularioRegistro
}