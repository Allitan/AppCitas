const express = require('express');
const router = express.Router();
const db = require('../config/db');
const jwt = require('jsonwebtoken');
const secretKey = 'tuClaveSecretaSuperSegura';

// Mostrar todos los profesionales
router.get('/', (req, res) =>{
    const query = 'SELECT * FROM Profesional';

    db.query(query, (err, results) =>{
        if(err){
            console.error('Error fetching profesionales:', err);
            res.status(500).json({error: 'Error al obtener los profesionales'});
            return;
        }
        res.json(results);
    });
});

//Mostrar el profesional dependiendo del id de cada profesional
router.get('/:id', (req, res) =>{
    const profesionalId = req.params.id;
    const query = 'SELECT * FROM Profesional WHERE ID_Profesional = ?';
    
    db.query(query, [profesionalId], (err, results) =>{
        if (err){
            console.error(`Error fetching profesional whith ID ${profesionalId}:`, err);
            res.status(500).json({error: `Error al obtener el profesional con ID ${profesionalId}`});
            return;
        }

        if(results.length === 0){
            res.status(404).json({error: `No se encontro ningun profesional con ID ${profesionalId}`});
            return;
        }

        res.json(results[0]);
    });
});

// Asociar un servicio existente a un profesional
router.post('/:profesionalId/servicios', (req, res) => {
    const profesionalId = req.params.profesionalId;
    const { servicioId } = req.body;

    if (!servicioId) {
        return res.status(400).json({ error: 'Por favor, proporciona el ID del servicio a asociar.' });
    }

    const query = 'INSERT INTO ProfesionalServicio (ID_Profesional, ID_Servicio) VALUES (?, ?)';
    db.query(query, [profesionalId, servicioId], (err, result) => {
        if (err) {
            console.error(`Error associating service ${servicioId} to profesional ${profesionalId}:`, err);
            return res.status(500).json({ error: 'Error al asociar el servicio al profesional.' });
        }
        res.status(201).json({ message: 'Servicio asociado al profesional exitosamente.' });
    });
});

// Obtener los servicios ofrecidos por un profesional
router.get('/:profesionalId/servicios', (req, res) => {
    const profesionalId = req.params.profesionalId;
    const query = `
        SELECT s.ID_Servicio, s.Nombre, s.Duración, s.Precio
        FROM Servicio s
        JOIN ProfesionalServicio ps ON s.ID_Servicio = ps.ID_Servicio
        WHERE ps.ID_Profesional = ?
    `;

    db.query(query, [profesionalId], (err, results) => {
        if (err) {
            console.error(`Error fetching services for profesional ${profesionalId}:`, err);
            return res.status(500).json({ error: 'Error al obtener los servicios del profesional.' });
        }
        res.json(results);
    });
});

router.get('/:profesionalId/servicios/:servicioId', (req, res) => {
    const profesionalId = req.params.profesionalId;
    const servicioId = req.params.servicioId;
    const query = `
        SELECT s.ID_Servicio, s.Nombre, s.Duración, s.Precio
        FROM Servicio s
        JOIN ProfesionalServicio ps ON s.ID_Servicio = ps.ID_Servicio
        WHERE ps.ID_Profesional = ? AND ps.ID_Servicio = ?
    `;

    db.query(query, [profesionalId, servicioId], (err, results) => {
        if (err) {
            console.error(`Error fetching servicio ${servicioId} for profesional ${profesionalId}:`, err);
            return res.status(500).json({ error: 'Error al obtener el servicio.' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: `No se encontró el servicio con ID ${servicioId} para el profesional con ID ${profesionalId}.` });
        }

        res.json(results[0]);
    });
});


// Desasociar un servicio de un profesional
router.delete('/:profesionalId/servicios/:servicioId', (req, res) => {
    const profesionalId = req.params.profesionalId;
    const servicioId = req.params.servicioId;
    const query = 'DELETE FROM ProfesionalServicio WHERE ID_Profesional = ? AND ID_Servicio = ?';

    db.query(query, [profesionalId, servicioId], (err, result) => {
        if (err) {
            console.error(`Error disassociating service ${servicioId} from profesional ${profesionalId}:`, err);
            return res.status(500).json({ error: 'Error al desasociar el servicio del profesional.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: `No se encontró la asociación del servicio ${servicioId} con el profesional ${profesionalId}.` });
        }
        res.json({ message: 'Servicio desasociado del profesional exitosamente.' });
    });
});

    // Ruta para crear un nuevo horario de disponibilidad para un profesional
    router.post('/:profesionalId/disponibilidad', (req, res) =>{
        const profesionalId = req.params.profesionalId;
        const { dia, horaInicio, horaFin } = req.body;

        if (!dia || !horaInicio || !horaFin) {
        return res.status(400).json({ error: 'Por favor, proporciona dia, hora de inicio y hora de fin para la disponibilidad' });
        }

        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(horaInicio) || !timeRegex.test(horaFin)) {
            return res.status(400).json({ error: 'El formato de hora debe ser HH:MM (ej. 09:00, 18:30).' });
        }

        const query = 'INSERT INTO Disponibilidad (Dia, HoraInicio, HoraFin, ID_Profesional) VALUES (?, ?, ?, ?)';
        db.query(query, [dia, horaInicio, horaFin, profesionalId], (err, results) => {
            if (err) {
                console.error(`Error creating disponibilidad for profesional ID ${profesionalId}:`, err);
                res.status(500).json({ error: 'Error al crear la disponibilidad.' });
                return; // Asegúrate de retornar aquí
            }

            const newDisponibilidadId = results.insertId;
            res.status(201).json({ id: newDisponibilidadId, message: 'Disponibilidad creada exitosamente.' });
        });
    });

    //obtener la disponibilidad de un profesional.
    router.get('/:profesionalId/disponibilidad', (req,res) =>{
        const profesionalId = req.params.profesionalId;
        const query = 'SELECT ID_Disponibilidad, Dia, HoraInicio, HoraFin FROM Disponibilidad WHERE ID_Profesional = ?';

        db.query(query, [profesionalId], (err, results) =>{
            if(err){
                console.error(`Error fetching disponibilidad for profesional ID ${profesionalId}:`, err);
                return res.status(500).json({error: 'Error al obtener la disponibilidad.'});
            }

            if(results.length === 0){
                return res.status(404).json({message: `No se encontro disponibilidad para el profesional con ID ${profesionalId}.`});
            }

            res.json({results});
        });
    });

// Ruta para obtener toda la disponibilidad de un profesional específico
    router.get('/:profesionalId/disponibilidad', (req, res) => {
        const profesionalId = req.params.profesionalId;
        const query = 'SELECT ID_Disponibilidad, Dia, HoraInicio, HoraFin FROM Disponibilidad WHERE ID_Profesional = ?';

        db.query(query, [profesionalId], (err, results) => {
            if (err) {
                console.error(`Error fetching disponibilidad for profesional ID ${profesionalId}:`, err);
                return res.status(500).json({ error: 'Error al obtener la disponibilidad.' });
            }

            if (results.length === 0) {
                return res.status(404).json({ message: `No se encontró disponibilidad para el profesional con ID ${profesionalId}.` });
            }

            res.json(results);
        });
    });

    //Ruta para crear una nueva cita para un profesional
    router.post('/:profesionalId/citas', (req, res) =>{
        const profesionalId = req.params.profesionalId;
        const { idCliente, idServicio, fecha, hora} = req.body;

        if(!idCliente || !idServicio || !fecha || !hora){
            return res.status(400).json({error: 'Por favor, proporciona idCliente, idServicio, fecha y hora para la cita'});
        }

        const query = 'INSERT INTO Cita (ID_Profesional, ID_Cliente, ID_Servicio, Fecha, Hora, Estado) VALUES (?, ?, ?, ?, ?, ?)';
        db.query(query, [profesionalId, idCliente, idServicio, fecha, hora, 'Pendiente'], (err, results) =>{
            if(err){
                console.error('Error creating cita:', err);
                return res.status(500).json({error: 'Error al crear la cita.'});
            }

            const newCitaId = results.insertId;
            res.status(201).json({id: newCitaId, message: 'Cita creada exitosamenge.'});
        });
    });

    // Ruta para obtener todas las citas de un profesional
    router.get('/:profesionalId/citas', (req, res) => {
        const profesionalId = req.params.profesionalId;
        const query = 'SELECT ID_Cita, ID_Cliente, ID_Servicio, Fecha, Hora, Estado FROM Cita WHERE ID_Profesional = ?';

        db.query(query, [profesionalId], (err, results) => {
            if (err) {
                console.error(`Error fetching citas for profesional ID ${profesionalId}:`, err);
                return res.status(500).json({ error: 'Error al obtener las citas.' });
            }

            if (results.length === 0) {
                return res.status(404).json({ message: `No se encontraron citas para el profesional con ID ${profesionalId}.` });
            }

            res.json(results);
        });
    });

    // Ruta para crear un nuevo profesional
    router.post('/', (req, res) => {
        const { Nombre, Especialidad, Email, Contrasenia } = req.body; // <-- Incluimos Email y Contrasenia

        if (!Nombre || !Especialidad || !Email || !Contrasenia) { // <-- Validamos Email y Contrasenia
            return res.status(400).json({ error: 'Por favor, proporciona el nombre, la especialidad, el email y la contraseña del profesional.' });
        }

        const query = 'INSERT INTO Profesional (Nombre, Email, Contraseña, Especialidad) VALUES (?, ?, ?, ?)'; // <-- Incluimos Email y Contraseña en la consulta
        db.query(query, [Nombre, Email, Contrasenia, Especialidad], (err, results) => { // <-- Pasamos Email y Contrasenia como valores
            if (err) {
                console.error('Error creating profesional:', err);
                return res.status(500).json({ error: 'Error al crear el profesional.' });
            }

            const newProfesionalId = results.insertId;
            res.status(201).json({ id: newProfesionalId, message: 'Profesional creado exitosamente.' });
        });
    });

    //Ruta para el login de profesionales
    router.post('/login', (req, res) =>{
        const { email, contrasenia } = req.body;

        if (!email || !contrasenia){
            return res.status(400).json({error: 'Por favor, proporciona email y contrasenia'});
        }

        const query = 'SELECT *FROM Profesional WHERE Email = ?';
        db.query(query, [email], (err, results) =>{
            if(err){
                console.error('Error al buscar el profesional:', err);
                return res.status(500).json({error: 'Error interno del servidor'});
            }

            if(results.length === 0){
                return res.status(401).json({error: 'Credenciales invalidas'});
            }

            const profesional = results[0];

            if(contrasenia === profesional.Contraseña){
                const token = jwt.sign({ profesionalId: profesional.ID_Profesional }, secretKey, { expiresIn: '1h'});
                res.json({ token });
            }else{
                return res.status(401).json({error: 'Credenciales invalidas'});
            }
        });
    })




module.exports = router;