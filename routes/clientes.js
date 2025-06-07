const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { authenticateClient } = require('../middleware/authMiddleware');

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
router.get('/', authenticateClient, (req, res) =>{
    const query = 'SELECT ID_Cliente, Nombre, Email FROM Cliente';

    db.query(query, (err, results) =>{
        if(err){
            console.error('Error featching clientes: ', err);
            return res.status(500).json({error: 'Error al obtener los clientes'});
        }
        res.json({results});
    });
});

// Ruta para obtener un cliente especifico por su ID (PROTEGIDA)
router.get('/:clienteId', authenticateClient, (req, res) =>{
    const clienteId = req.params.clienteId;
    const authenticatedClientId = req.clientId; // ID del cliente autenticado del token

    if (String(clienteId) !== String(authenticatedClientId)) {
        return res.status(403).json({ error: 'No tienes permiso para ver la información de este cliente.' });
    }

    const query = 'SELECT ID_Cliente, Nombre, Email, Teléfono FROM Cliente WHERE ID_Cliente = ?';

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
router.put('/:clienteId', authenticateClient, (req, res) =>{
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
router.delete('/:clienteId', authenticateClient, (req,res) => {
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

// Ruta para registrar un nuevo cliente
router.post('/registro', async (req, res) => {
    const { Nombre, Email, Teléfono, Contraseña } = req.body;

    // Validar que todos los campos obligatorios estén presentes
    if (!Nombre || !Email || !Contraseña) {
        return res.status(400).json({ error: 'Por favor, proporciona nombre, email y contraseña.' });
    }

    try {
        // Verificar si el email ya existe
        const emailCheckQuery = 'SELECT ID_Cliente FROM Cliente WHERE Email = ?';
        const [existingClient] = await db.promise().query(emailCheckQuery, [Email]);

        if (existingClient.length > 0) {
            return res.status(409).json({ error: 'El email ya está registrado.' });
        }

        // Hashear la contraseña
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(Contraseña, saltRounds);

        // Insertar el nuevo cliente en la base de datos
        const insertQuery = 'INSERT INTO Cliente (Nombre, Email, Teléfono, Contraseña) VALUES (?, ?, ?, ?)';
        const [result] = await db.promise().query(insertQuery, [Nombre, Email, Teléfono, hashedPassword]);

        res.status(201).json({ message: 'Cliente registrado exitosamente.', clientId: result.insertId });

    } catch (error) {
        console.error('Error al registrar el cliente:', error);
        return res.status(500).json({ error: 'Error interno del servidor al registrar el cliente.' });
    }
});

// Ruta para el login de cliente
router.post('/login', async (req, res) => {
    const { Email, Contraseña } = req.body;

    if (!Email || !Contraseña) {
        return res.status(400).json({ error: 'Por favor, proporciona email y contraseña.' });
    }

    try {
        // Buscar al cliente por su email
        const query = 'SELECT ID_Cliente, Contraseña FROM Cliente WHERE Email = ?';
        const [results] = await db.promise().query(query, [Email]);

        if (results.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas.' }); // 401 Unauthorized
        }

        const client = results[0];

        // Comparar la contraseña proporcionada con la contraseña hasheada
        const passwordMatch = await bcrypt.compare(Contraseña, client.Contraseña);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }

        // Generar un token JWT
        const token = jwt.sign(
            { clientId: client.ID_Cliente }, // Payload: información a incluir en el token
            process.env.JWT_SECRET || 'your-secret-key', // Clave secreta para firmar el token. ¡Guárdala en una variable de entorno!
            { expiresIn: '1h' } // Opciones del token: tiempo de expiración (ej: 1 hora)
        );

        res.json({ message: 'Login exitoso.', token: token, clientId: client.ID_Cliente });

    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        return res.status(500).json({ error: 'Error interno del servidor al iniciar sesión.' });
    }
});


module.exports = router;