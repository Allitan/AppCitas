const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Ruta para crear un nuevo cliente
router.post('/', (req, res) => {
    const { Nombre, Email } = req.body;

    if (!Nombre || !Email) {
        return res.status(400).json({ error: 'Por favor, proporciona el nombre y el email del cliente.' });
    }

    const query = 'INSERT INTO Cliente (Nombre, Email) VALUES (?, ?)';
    db.query(query, [Nombre, Email], (err, results) => {
        if (err) {
            console.error('Error creating cliente:', err);
            return res.status(500).json({ error: 'Error al crear el cliente.' });
        }

        const newClienteId = results.insertId;
        res.status(201).json({ id: newClienteId, message: 'Cliente creado exitosamente.' });
    });
});

// Ruta para obtener todos los clientes
router.get('/', (req, res) =>{
    const query = 'SELECT ID_Cliente, Nombre, Email FROM Cliente';

    db.query(query, (err, results) =>{
        if(err){
            console.error('Error featching clientes: ', err);
            return res.status(500).json({error: 'Error al obtener los clientes'});
        }
        res.json({results});
    });
});

// Ruta para obtener un cliente especifico por su ID
router.get('/:clienteId', (req, res) =>{
    const clienteId = req.params.clienteId;
    const query = 'SELECT ID_Cliente, Nombre, Email FROM Cliente WHERE ID_Cliente = ?';

    db.query(query, [clienteId], (err, results) =>{
        if(err){
            console.error(`Error fetching cliente with ID ${clienteId}:`, err);
            return res.status(500).json({error: 'Error al obtener el cliente'});
        }

        if(results.length === 0){
            return res.status(404).json({message: `No se encontró el cliente con ID ${clienteId}.`});
        }

        res.json(results[0]);
    });
});

// Ruta para actualizar un cliente
router.put('/:clienteId', (req, res) =>{
    const clienteId = req.params.clienteId;
    const {Nombre, Email} = req.body;

    if(!Nombre && !Email){
        return res.status(400).json({error: 'Por favor, proporciona al menos un campo (Nombre, Email) para actualizar el cliente'});
    }

    const updates = [];
    const values = [];

    if(Nombre){
        updates.push('Nombre = ?');
        values.push(Nombre);
    }
    if(Email){
        updates.push('Email = ?');
        values.push(Email);
    }

    const query = `UPDATE Cliente SET ${updates.join(', ')} WHERE ID_Cliente = ?`;
    values.push(clienteId);

    db.query(query, values, (err, results) =>{
        if(err){
            console.log(`Error updating cliente with ID ${clienteId}:`, err);
            return res.status(500).json({error: 'Error al actualizar el cliente.'});
        }

        if(results.affectedRows === 0){
            return res.status(500).json({message:`No se encontró el cliente con ID ${clienteId}.`});
        }

        res.json({message: 'Cliente actualizado exitosamente.'});
    });
});

// Ruta para eliminar un cliente especifico por si ID
router.delete('/:clienteId', (req,res) => {
    const clienteId = req.params.clienteId;
    const query = 'DELETE FROM Cliente WHERE ID_Cliente = ?';

    db.query(query, [clienteId], (err, results) =>{
        if(err){
            console.error(`Error deleting cliente with ID ${clienteId}:`, err);
            return res.status(500).json({error: 'Error al almacenar el cliente.'});
        }

        if(results.affectedRows === 0){
            return res.status(404).json({message: `No se encontró el cliente con ID ${clienteId}.`});
        }

        res.json({message: 'Cliente eliminado exitosamente'});
    });
});


module.exports = router;