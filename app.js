const express = require('express');
const app = express();
const PORT = 3000;
const profesionalesRoutes = require('./routes/profesionales');
const citasRouter = require('./routes/citas');
const clientesRouter = require('./routes/clientes');
const serviciosRouter = require('./routes/servicios')
const cors = require('cors');

app.use(cors());

app.use(express.json());

app.use('/api/profesionales', profesionalesRoutes);
app.use('/api/citas', citasRouter);
app.use('/api/clientes', clientesRouter);
app.use('/api/servicios', serviciosRouter);

app.get('/', (req, res) =>{
    res.send('Hola desde la API de gestion de citas!');
});

app.listen(PORT, () =>{
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
