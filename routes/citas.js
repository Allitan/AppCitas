   const express = require('express');
   const router = express.Router();
   const db = require('../config/db');
   
   // Ruta para obtener una cita específica por su ID
    router.get('/citas/:citaId', (req, res) => {
        const citaId = req.params.citaId;
        const query = 'SELECT ID_Cita, ID_Profesional, ID_Cliente, ID_Servicio, Fecha, Hora, Estado FROM Cita WHERE ID_Cita = ?';

        db.query(query, [citaId], (err, results) => {
            if (err) {
                console.error(`Error fetching cita with ID ${citaId}:`, err);
                return res.status(500).json({ error: 'Error al obtener la cita.' });
            }

            if (results.length === 0) {
                return res.status(404).json({ message: `No se encontró la cita con ID ${citaId}.` });
            }

            res.json(results[0]); // Devolvemos el primer (y único) resultado
        });
    });

module.exports = router;