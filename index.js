import express from 'express'
import usuarioRoutes from './routes/usuarioRoutes.js'

//Crear la app
const app = express();

//Routing
//app.get('/', usuarioRoutes)
app.use('/', usuarioRoutes);

//Definir un puerto y arrancar el poyecto
const port = 3000;

app.listen(port, ()=> {
    console.log(`El servidor esta funcionando en el puerto ${port}`);
})