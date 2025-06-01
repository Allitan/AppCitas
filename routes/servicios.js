const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Ruta para crear un nuevo servicio
router.post('/', (req, res) => {
    const { Nombre, Duración, Precio } = req.body;

    if (!Nombre || !Duración || !Precio) {
        return res.status(400).json({ error: 'Por favor, proporciona el nombre, la duración y el precio del servicio.' });
    }

    const query = 'INSERT INTO Servicio (Nombre, Duración, Precio) VALUES (?, ?, ?)';
    db.query(query, [Nombre, Duración, Precio], (err, results) => {
        if (err) {
            console.error('Error creating servicio:', err);
            return res.status(500).json({ error: 'Error al crear el servicio.' });
        }

        const newServicioId = results.insertId;
        res.status(201).json({ id: newServicioId, message: 'Servicio creado exitosamente.' });
    });
});

// Ruta para obtener todos los servicios
router.get('/', (req, res) => {
    const query = 'SELECT ID_Servicio, Nombre, Duración, Precio FROM Servicio';

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching servicios:', err);
            return res.status(500).json({ error: 'Error al obtener los servicios.' });
        }
        res.json(results);
    });
});

// Ruta para obtener un servicio específico por su ID
router.get('/:servicioId', (req, res) => {
    const servicioId = req.params.servicioId;
    const query = 'SELECT ID_Servicio, Nombre, Duración, Precio FROM Servicio WHERE ID_Servicio = ?';

    db.query(query, [servicioId], (err, results) => {
        if (err) {
            console.error(`Error fetching servicio with ID ${servicioId}:`, err);
            return res.status(500).json({ error: 'Error al obtener el servicio.' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: `No se encontró el servicio con ID ${servicioId}.` });
        }

        res.json(results[0]);
    });
});

// Ruta para actualizar un servicio específico por su ID
router.put('/:servicioId', (req, res) => {
    const servicioId = req.params.servicioId;
    const { Nombre, Duración, Precio } = req.body;

    if (!Nombre && !Duración && !Precio) {
        return res.status(400).json({ error: 'Por favor, proporciona al menos un campo para actualizar el servicio.' });
    }

    const updates = [];
    const values = [];

    if (Nombre) {
        updates.push('Nombre = ?');
        values.push(Nombre);
    }
    if (Duración) {
        updates.push('Duración = ?');
        values.push(Duración);
    }
    if (Precio) {
        updates.push('Precio = ?');
        values.push(Precio);
    }

    const query = `UPDATE Servicio SET ${updates.join(', ')} WHERE ID_Servicio = ?`;
    values.push(servicioId);

    db.query(query, values, (err, result) => {
        if (err) {
            console.error(`Error updating servicio with ID ${servicioId}:`, err);
            return res.status(500).json({ error: 'Error al actualizar el servicio.' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: `No se encontró el servicio con ID ${servicioId}.` });
        }

        res.json({ message: 'Servicio actualizado exitosamente.' });
    });
});

// Ruta para eliminar un servicio específico por su ID
router.delete('/:servicioId', (req, res) => {
    const servicioId = req.params.servicioId;
    const query = 'DELETE FROM Servicio WHERE ID_Servicio = ?';

    db.query(query, [servicioId], (err, result) => {
        if (err) {
            console.error(`Error deleting servicio with ID ${servicioId}:`, err);
            return res.status(500).json({ error: 'Error al eliminar el servicio.' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: `No se encontró el servicio con ID ${servicioId}.` });
        }

        res.json({ message: 'Servicio eliminado exitosamente.' });
    });
});

module.exports = router;