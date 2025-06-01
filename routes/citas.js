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

    //Ruta para obtener citas con opciones de filtrado
    router.get('/', (req, res) =>{
        const {fecha, estado, idCliente, idProfesional} = req.query;
        let query = 'SELECT ID_Cita, ID_Profesional, ID_Cliente, ID_Servicio, Fecha, Hora, Estado FROM Cita WHERE 1=1';

        const values = [];

        if(fecha){
            query += ' AND Fecha = ?';
            values.push(fecha);
        }
        if(estado){
            query += ' AND Estado = ?';
            values.push(estado);
        }
        if(idCliente){
            query += ' AND ID_Cliente = ?';
            values.push(idCliente);
        }
        if(idProfesional){
            query += ' AND ID_Profesional = ?';
            values.push(idProfesional);
        }

        db.query(query, values, (err, results) =>{
            if(err){
                console.error('Error fetching citas with filters:', err);
                return res.status(500).json({ error: 'Error al obtener las citas.' });
            }

            res.json(results);
        });
    });

    //Actualizar uns Cita
    router.put('/citas/:citaId', (req,res) =>{
        const citaId = req.params.citaId;
        const { ID_Profesional, ID_Cliente, ID_Servicio, Fecha, Hora, Estado } = req.body;

        if(!ID_Profesional && !ID_Cliente && !ID_Servicio && !Fecha && !Hora && !Estado){
            return res.status(400).json({ error: 'Por favor, proporciona al menos un campo para actualizar la cita.' });
        }

        const updates = [];
        const values = [];

        if (ID_Profesional) {
            updates.push('ID_Profesional = ?');
            values.push(ID_Profesional);
        }
        if (ID_Cliente) {
            updates.push('ID_Cliente = ?');
            values.push(ID_Cliente);
        }
        if (ID_Servicio) {
            updates.push('ID_Servicio = ?');
            values.push(ID_Servicio);
        }
        if (Fecha) {
            updates.push('Fecha = ?');
            values.push(Fecha);
        }
        if (Hora) {
            updates.push('Hora = ?');
            values.push(Hora);
        }
        if (Estado) {
            updates.push('Estado = ?');
            values.push(Estado);
        }

        const query = `UPDATE Cita SET ${updates.join(', ')} WHERE ID_Cita = ?`;
        values.push(citaId);

        db.query(query, values, (err, result) => {
            if (err) {
                console.error(`Error updating cita with ID ${citaId}:`, err);
                return res.status(500).json({ error: 'Error al actualizar la cita.' });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: `No se encontró la cita con ID ${citaId}.` });
            }

            res.json({ message: 'Cita actualizada exitosamente.' });
        });
    });

    // Ruta para eliminar una cita específica por su ID
    router.delete('/citas/:citaId', (req, res) => {
        const citaId = req.params.citaId;
        const query = 'DELETE FROM Cita WHERE ID_Cita = ?';

        db.query(query, [citaId], (err, result) => {
            if (err) {
                console.error(`Error deleting cita with ID ${citaId}:`, err);
                return res.status(500).json({ error: 'Error al eliminar la cita.' });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: `No se encontró la cita con ID ${citaId}.` });
            }

            res.json({ message: 'Cita eliminada exitosamente.' });
        });
    });


module.exports = router;