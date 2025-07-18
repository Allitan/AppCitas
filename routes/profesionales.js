const express = require('express');
const router = express.Router();
const db = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { authenticateProfesional } = require('../middleware/authoProfesionalMiddleware');

// Mostrar todos los profesionales
router.get('/', authenticateProfesional, (req, res) =>{
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
router.get('/:id', authenticateProfesional, (req, res) =>{
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
router.post('/:profesionalId/servicios', authenticateProfesional, (req, res) => {
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
router.get('/:profesionalId/servicios', authenticateProfesional, (req, res) => {
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

router.get('/:profesionalId/servicios/:servicioId', authenticateProfesional, (req, res) => {
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
router.delete('/:profesionalId/servicios/:servicioId', authenticateProfesional, (req, res) => {
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
    router.post('/:profesionalId/disponibilidad', authenticateProfesional,(req, res) =>{
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
                return;
            }

            const newDisponibilidadId = results.insertId;
            res.status(201).json({ id: newDisponibilidadId, message: 'Disponibilidad creada exitosamente.' });
        });
    });

    // Obtener la disponibilidad de un profesional (con opción de filtrar por fecha en el futuro)
    router.get('/:profesionalId/disponibilidad', (req,res) =>{
        const profesionalId = req.params.profesionalId;
        const authenticatedProfesionalId = req.profesionalId;
        // console.log('[DEBUG] profesionalId param:', profesionalId, '| authenticatedProfesionalId (token):', authenticatedProfesionalId);
        //const { fecha } = req.query; // Ejemplo de cómo podrías filtrar por fecha en el futuro
        let query = 'SELECT ID_Disponibilidad, Dia, HoraInicio, HoraFin FROM Disponibilidad WHERE ID_Profesional = ?';
        const values = [profesionalId];
        /*
        if (fecha) {
            query += ' AND Dia = DAYNAME(?) AND ? BETWEEN FechaInicio AND FechaFin'; // Ejemplo de filtro por fecha
            values.push(fecha, fecha);
        }
        */
        db.query(query, values, (err, results) =>{
            if(err){
                console.error(`[DEBUG] Error fetching disponibilidad for profesional ID ${profesionalId}:`, err);
                return res.status(500).json({error: 'Error al obtener la disponibilidad.'});
            }
            // Siempre retornar un array, aunque esté vacío
            res.json({ data: results });
        });
    });

    // Ruta para actualizar un horario de disponibilidad específico de un profesional
    router.put('/:profesionalId/disponibilidad/:disponibilidadId', authenticateProfesional, (req, res) => {
        const profesionalId = req.params.profesionalId;
        const disponibilidadId = req.params.disponibilidadId;
        const { dia, horaInicio, horaFin } = req.body;

        if (!dia && !horaInicio && !horaFin) {
            return res.status(400).json({ error: 'Por favor, proporciona al menos un campo (dia, horaInicio, horaFin) para actualizar la disponibilidad.' });
        }

        const updates = [];
        const values = [];

        if (dia) {
            updates.push('Dia = ?');
            values.push(dia);
        }
        if (horaInicio) {
            const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
            if (!timeRegex.test(horaInicio)) {
                return res.status(400).json({ error: 'El formato de hora de inicio debe ser HH:MM (ej. 09:00, 18:30).' });
            }
            updates.push('HoraInicio = ?');
            values.push(horaInicio);
        }
        if (horaFin) {
            const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
            if (!timeRegex.test(horaFin)) {
                return res.status(400).json({ error: 'El formato de hora de fin debe ser HH:MM (ej. 09:00, 18:30).' });
            }
            updates.push('HoraFin = ?');
            values.push(horaFin);
        }

        const query = `UPDATE Disponibilidad SET ${updates.join(', ')} WHERE ID_Disponibilidad = ? AND ID_Profesional = ?`;
        values.push(disponibilidadId, profesionalId);

        db.query(query, values, (err, result) => {
            if (err) {
                console.error(`Error updating disponibilidad ${disponibilidadId} for profesional ${profesionalId}:`, err);
                return res.status(500).json({ error: 'Error al actualizar la disponibilidad.' });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: `No se encontró la disponibilidad con ID ${disponibilidadId} para el profesional con ID ${profesionalId}.` });
            }

            res.json({ message: 'Disponibilidad actualizada exitosamente.' });
        });
    });

    // Ruta para eliminar un horario de disponibilidad específico de un profesional
    router.delete('/:profesionalId/disponibilidad/:disponibilidadId', authenticateProfesional, (req, res) => {
        const profesionalId = req.params.profesionalId;
        const disponibilidadId = req.params.disponibilidadId;
        const query = 'DELETE FROM Disponibilidad WHERE ID_Disponibilidad = ? AND ID_Profesional = ?';

        db.query(query, [disponibilidadId, profesionalId], (err, result) => {
            if (err) {
                console.error(`Error deleting disponibilidad ${disponibilidadId} for profesional ${profesionalId}:`, err);
                return res.status(500).json({ error: 'Error al eliminar la disponibilidad.' });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: `No se encontró la disponibilidad con ID ${disponibilidadId} para el profesional con ID ${profesionalId}.` });
            }

            res.json({ message: 'Disponibilidad eliminada exitosamente.' });
        });
    });

    // Ruta para obtener toda la disponibilidad de un profesional específico (PROTEGIDA)
    router.get('/:profesionalId/disponibilidad', authenticateProfesional, (req, res) => {
        const profesionalId = req.params.profesionalId;
        const authenticatedProfesionalId = req.profesionalId;

        if (profesionalId !== authenticatedProfesionalId) {
            return res.status(403).json({ error: 'No tienes permiso para ver la disponibilidad de este profesional.' });
        }

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

    // Ruta para obtener todas las citas de un profesional
    router.get('/:profesionalId/citas', authenticateProfesional,(req, res) => {
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

    // Registro de profesional (asegura compatibilidad con frontend)
router.post('/registro', async (req, res) => {
    const { Nombre, Especialidad, Email, Teléfono, Contraseña, Duración, Precio } = req.body;
    if (!Nombre || !Especialidad || !Email || !Contraseña || !Duración || !Precio) {
        return res.status(400).json({ error: 'Por favor, proporciona nombre, especialidad, email, contraseña, duración y precio.' });
    }
    try {
        // Hashear la contraseña
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(Contraseña, saltRounds);
        // Insertar el profesional
        const insertQuery = 'INSERT INTO Profesional (Nombre, Email, Contraseña, Teléfono, Especialidad) VALUES (?, ?, ?, ?, ?)';
        const [result] = await db.promise().query(insertQuery, [Nombre, Email, hashedPassword, Teléfono, Especialidad]);
        const newProfesionalId = result.insertId;
        // Crear servicio automáticamente
        const servicioQuery = 'INSERT INTO Servicio (Nombre, Duración, Precio) VALUES (?, ?, ?)';
        const [servicioResult] = await db.promise().query(servicioQuery, [Especialidad, Duración, Precio]);
        const newServicioId = servicioResult.insertId;
        // Asociar el servicio al profesional
        const asociaQuery = 'INSERT INTO ProfesionalServicio (ID_Profesional, ID_Servicio) VALUES (?, ?)';
        await db.promise().query(asociaQuery, [newProfesionalId, newServicioId]);
        res.status(201).json({ id: newProfesionalId, message: 'Profesional y servicio creados exitosamente.' });
    } catch (err) {
        console.error('Error en el registro de profesional:', err);
        res.status(500).json({ error: 'Error al registrar el profesional.' });
    }
});

// Login de profesional
router.post('/login', async (req, res) => {
    const { Email, Contraseña } = req.body;
    if (!Email || !Contraseña) {
        return res.status(400).json({ error: 'Por favor, proporciona email y contraseña.' });
    }
    try {
        // Buscar al profesional por su email
        const query = 'SELECT ID_Profesional, Contraseña FROM Profesional WHERE Email = ?';
        const [results] = await db.promise().query(query, [Email]);
        if (results.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }
        const profesional = results[0];
        // Comparar la contraseña proporcionada con la contraseña hasheada
        const passwordMatch = await bcrypt.compare(Contraseña, profesional.Contraseña);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }
        // Generar un token JWT
        const token = jwt.sign(
            { profesionalId: profesional.ID_Profesional },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '1h' }
        );
        res.json({ message: 'Login exitoso.', token: token, profesionalId: profesional.ID_Profesional });
    } catch (error) {
        console.error('Error al iniciar sesión del profesional:', error);
        return res.status(500).json({ error: 'Error interno del servidor al iniciar sesión del profesional.' });
    }
});

// Eliminar perfil de profesional
router.delete('/:profesionalId', authenticateProfesional, async (req, res) => {
    const profesionalId = req.params.profesionalId;
    const authenticatedProfesionalId = req.profesionalId;
    if (String(profesionalId) !== String(authenticatedProfesionalId)) {
        return res.status(403).json({ error: 'No tienes permiso para eliminar este perfil.' });
    }
    try {
        // Eliminar primero las dependencias (servicios, disponibilidad, citas, etc.) si es necesario
        await db.promise().query('DELETE FROM ProfesionalServicio WHERE ID_Profesional = ?', [profesionalId]);
        await db.promise().query('DELETE FROM Disponibilidad WHERE ID_Profesional = ?', [profesionalId]);
        await db.promise().query('DELETE FROM Cita WHERE ID_Profesional = ?', [profesionalId]);
        // Finalmente, eliminar el profesional
        const [result] = await db.promise().query('DELETE FROM Profesional WHERE ID_Profesional = ?', [profesionalId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'No se encontró el profesional.' });
        }
        res.json({ message: 'Perfil de profesional eliminado exitosamente.' });
    } catch (err) {
        console.error('Error al eliminar el profesional:', err);
        res.status(500).json({ error: 'Error al eliminar el perfil.' });
    }
});

module.exports = router;