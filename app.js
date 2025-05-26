const express = require('express');
const app = express();
const PORT = 3000;
const profesionalesRoutes = require('./routes/profesionales');

app.use((req, res, next) =>{
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET', 'POST', 'PUT', 'DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use(express.json());

app.use('/api/profesionales', profesionalesRoutes);

app.get('/', (req, res) =>{
    res.send('Hola desde la API de gestion de citas!');
});

app.listen(PORT, () =>{
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});