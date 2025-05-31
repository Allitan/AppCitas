const express = require('express');
const router = express.Router();
const db = require('../config/db');

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

// Agregar un servicio
router.post('/:profesionalId/servicios', (req, res) =>{
    const profesionalId = req.params.profesionalId;
    const {nombre, duracion, precio} = req.body;

    if(!nombre || !duracion || !precio){
        return res.status(400).json({error: 'Por favor, proporiona nombre, duracion y precio para el servicio.'});
    }

    const query = 'INSERT INTO Servicio (Nombre, Duración, Precio, ID_Profesional) VALUES (?, ?, ?, ?)';
    db.query(query, [nombre, duracion, precio, profesionalId], (err, results) =>{
        if(err){
            console.error(`Error creating service for profesional ID ${profesionalId}:`, err);
            res.status(500).json({error: 'Error al crear el servicio.'});
        }

        const newServiceId = results.insertId;
        res.status(201).json({id: newServiceId, message: 'Servicio creado exitosamente.'});
    });
});

// Mostrar el servicio dependiendo del profesional que lo da
router.get('/:profesionalId/servicios', (req, res) =>{
    const profesionalId = req.params.profesionalId;
    const query = 'SELECT * FROM Servicio WHERE ID_Profesional = ?';

    db.query(query, [profesionalId], (err, results) =>{
        if (err){
            console.error(`Error fetching servicios for profesional ID ${profesionalId}:`, err);
            res.status(500).json({error: 'Error al obtener los servicios.'});
            return;
        }

        res.json(results);
    });
});

router.get('/:profesionalId/servicios/:servicioId', (req, res) =>{
    const profesionalId = req.params.profesionalId;
    const servicioId = req.params.servicioId;
    const query = 'SELECT * FROM Servicio WHERE ID_Servicio = ? AND ID_Profesional = ?';

    db.query(query, [servicioId, profesionalId], (err, results) =>{
        if(err){
            console.error(`Error fetching servicio ${servicioId} for profesional ${profesionalId}:`, err);
            res.status(500).json({error: 'Error al obtener el servicio'});
            return;
        }

        if(results.length === 0){
            res.status(400).json({error: `No se encontro el servicio ${servicioId} para el profesional ${profesionalId}`});
            return;
        }

        res.json(results[0]);
    });
});

// Actualizar un servicio
router.put('/:profesionalId/servicios/:servicioId', (req, res) =>{
    const profesionalId = req.params.profesionalId;
    const servicioId = req.params.servicioId;
    const {nombre, duracion, precio} = req.body;

    if(!nombre || !duracion || !precio){
       return res.status(400).json({ error: 'Por favor, proporciona nombre, duración y precio para actualizar el servicio.' });
    }

    const query = 'UPDATE Servicio SET Nombre = ?, Duración = ?, Precio = ? WHERE ID_Servicio = ? AND ID_Profesional = ?';
    db.query(query, [nombre, duracion, precio, servicioId, profesionalId], (err, result) =>{
        if(err){
            console.error(`Error updating servicio ${servicioId} for profesional ${profesionalId}:`, err);
            res.status(500).json({error: 'Error al actualizar el servicio'});
            return;
        }

        if (result.affectedRows === 0){
            res.status(400).json({error: `No se encontro el servicio ${servicioId} para el profesional ${profesionalId}`});
            return;
        }

        res.json({message: 'Servicio actualizado exitosamente.'});
    });
});

//Eliminar un servicio 
router.delete('/:profesionalId/servicios/:servicioId', (req, res) =>{
    const profesionalId = req.params.profesionalId;
    const servicioId = req.params.servicioId;
    const query = 'DELETE FROM Servicio WHERE ID_Servicio = ? AND ID_Profesional = ?';
    
    db.query(query, [servicioId, profesionalId], (err, results) =>{
        if(err){
            console.error(`Error deleting servicio ${servicioId} for profesional ${profesionalId}:`, err);
            res.status(500).json({error: 'Error al eliminar el servicio.'});
            return;
        }
         
        if(results.affectedRows === 0){
            res.status(400).json({ error: `No se encontro el servicio ${servicioId} para el profesional ${profesionalId}`});
            return;
        }

        res.json({message: 'Servicio eliminado exitosamente.'});
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





module.exports = router;