import express from 'express'

//Crear la app
const app = express();

//Routing
app.get('/', function(req, res){
    res.send("Hola mundo en expres")
})

app.get('/nosotros', function(req, res){
    res.send("Pagina de nosotros")
});

//Definir un puerto y arrancar el poyecto
const port = 3000;

app.listen(port, ()=> {
    console.log(`El servidor esta funcionando en el puerto ${port}`);
})