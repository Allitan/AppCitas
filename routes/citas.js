const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Ruta para obtener una cita específica por su ID
router.get('/:citaId', (req, res) => {
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
router.get('/', (req, res) => {
    const { fecha, estado, idCliente, idProfesional } = req.query;
    let query = 'SELECT ID_Cita, ID_Profesional, ID_Cliente, ID_Servicio, Fecha, Hora, Estado FROM Cita WHERE 1=1';

    const values = [];

    if (fecha) {
        query += ' AND Fecha = ?';
        values.push(fecha);
    }
    if (estado) {
        query += ' AND Estado = ?';
        values.push(estado);
    }
    if (idCliente) {
        query += ' AND ID_Cliente = ?';
        values.push(idCliente);
    }
    if (idProfesional) {
        query += ' AND ID_Profesional = ?';
        values.push(idProfesional);
    }

    db.query(query, values, (err, results) => {
        if (err) {
            console.error('Error fetching citas with filters:', err);
            return res.status(500).json({ error: 'Error al obtener las citas.' });
        }

        res.json(results);
    });
});

//Actualizar una Cita
router.put('/:citaId', (req, res) => {
    const citaId = req.params.citaId;
    const { ID_Profesional, ID_Cliente, ID_Servicio, Fecha, Hora, Estado } = req.body;

    if (!ID_Profesional && !ID_Cliente && !ID_Servicio && !Fecha && !Hora && !Estado) {
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
router.delete('/:citaId', (req, res) => {
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

// Ruta para crear una nueva cita
router.post('/', (req, res) => {
    const { ID_Profesional, ID_Cliente, ID_Servicio, Fecha, Hora } = req.body;

    if (!ID_Profesional || !ID_Cliente || !ID_Servicio || !Fecha || !Hora) {
        return res.status(400).json({ error: 'Por favor, proporciona ID_Profesional, ID_Cliente, ID_Servicio, Fecha y Hora para la cita.' });
    }

    db.query('SELECT ID_Profesional FROM Profesional WHERE ID_Profesional = ?', [ID_Profesional], (err, profesionalResult) => {
        if (err) {
            console.error('Error al verificar el profesional:', err);
            return res.status(500).json({ error: 'Error interno del servidor al crear la cita.' });
        }
        if (profesionalResult.length === 0) {
            return res.status(400).json({ error: 'El ID del profesional proporcionado no es válido.' });
        }

        db.query('SELECT ID_Cliente FROM Cliente WHERE ID_Cliente = ?', [ID_Cliente], (err, clienteResult) => {
            if (err) {
                console.error('Error al verificar el cliente:', err);
                return res.status(500).json({ error: 'Error interno del servidor al crear la cita.' });
            }
            if (clienteResult.length === 0) {
                return res.status(400).json({ error: 'El ID del cliente proporcionado no es válido.' });
            }

            const servicioQuery = `
                SELECT ps.ID_ProfesionalServicio
                FROM Servicio s
                JOIN ProfesionalServicio ps ON s.ID_Servicio = ps.ID_Servicio
                WHERE s.ID_Servicio = ? AND ps.ID_Profesional = ?
            `;
            db.query(servicioQuery, [ID_Servicio, ID_Profesional], (err, servicioResult) => {
                if (err) {
                    console.error('Error al verificar el servicio:', err);
                    return res.status(500).json({ error: 'Error interno del servidor al crear la cita.' });
                }
                if (servicioResult.length === 0) {
                    return res.status(400).json({ error: 'El servicio proporcionado no existe o no está ofrecido por el profesional.' });
                }

                // DEBUG extra: log día y consulta de disponibilidad
                // console.log('Fecha recibida:', Fecha);
                // Cálculo correcto del día de la semana en inglés, sin desfase de zona horaria
                const [year, month, day] = Fecha.split('-').map(Number);
                const fechaObj = new Date(Date.UTC(year, month - 1, day));
                const dayNameEn = fechaObj.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
                // console.log('Día calculado (en inglés, UTC):', dayNameEn);
                // const disponibilidadDebugQuery = `
                //     SELECT * FROM Disponibilidad
                //     WHERE ID_Profesional = ? AND Dia = ?
                // `;
                // db.query(disponibilidadDebugQuery, [ID_Profesional, dayNameEn], (err, rows) => {
                //     if (!err) {
                //         console.log('Disponibilidad encontrada en BD:', rows);
                //     }
                // });
                const disponibilidadQuery = `
                    SELECT ID_Disponibilidad
                    FROM Disponibilidad
                    WHERE ID_Profesional = ? AND Dia = ?
                    AND TIME(?) >= TIME(HoraInicio) AND TIME(?) < TIME(HoraFin)
                `;
                // console.log('Consulta disponibilidad params:', [ID_Profesional, dayNameEn, Hora, Hora]);
                db.query(disponibilidadQuery, [ID_Profesional, dayNameEn, Hora, Hora], (err, disponibilidadResult) => {
                    if (err) {
                        console.error('Error al verificar la disponibilidad:', err);
                        return res.status(500).json({ error: 'Error interno del servidor al crear la cita.' });
                    }
                    console.log('Resultado de disponibilidad:', disponibilidadResult);
                    if (disponibilidadResult.length === 0) {
                        return res.status(400).json({ error: 'El profesional no está disponible en la fecha y hora solicitadas.' });
                    }

                    // Verificar si hay citas existentes para el mismo profesional que se superponen
                    const overlapQuery = `
                        SELECT ID_Cita
                        FROM Cita
                        WHERE ID_Profesional = ?
                          AND Fecha = ?
                          AND (
                            (TIME(?) >= Hora AND TIME(?) < ADDTIME(Hora, (SELECT Duración FROM Servicio WHERE ID_Servicio = ?))) OR
                            (TIME(?) < Hora AND ADDTIME(TIME(?), (SELECT Duración FROM Servicio WHERE ID_Servicio = ?)) > TIME(?)) OR
                            (Hora >= TIME(?) AND ADDTIME(Hora, (SELECT Duración FROM Servicio WHERE ID_Servicio = ?)) <= TIME(?))
                          )
                    `;

                    // Necesitamos obtener la duración del servicio para calcular la superposición
                    db.query('SELECT Duración FROM Servicio WHERE ID_Servicio = ?', [ID_Servicio], (err, duracionResult) => {
                        if (err) {
                            console.error('Error al obtener la duración del servicio:', err);
                            return res.status(500).json({ error: 'Error interno del servidor al crear la cita.' });
                        }

                        if (duracionResult.length === 0 || !duracionResult[0].Duración) {
                            return res.status(400).json({ error: 'No se encontró la duración del servicio proporcionado.' });
                        }

                        const duracionServicio = duracionResult[0].Duración;

                        db.query(overlapQuery, [ID_Profesional, Fecha, Hora, Hora, ID_Servicio, Hora, Hora, ID_Servicio, Hora, Hora, ID_Servicio, Hora], (err, overlapResult) => {
                            if (err) {
                                console.error('Error al verificar citas superpuestas:', err);
                                return res.status(500).json({ error: 'Error interno del servidor al crear la cita.' });
                            }

                            if (overlapResult.length > 0) {
                                return res.status(409).json({ error: 'Ya existe una cita para este profesional que se superpone con la hora solicitada.' });
                            }

                            // Si no hay superposición, procedemos a crear la nueva cita
                            const citaQuery = 'INSERT INTO Cita (ID_Profesional, ID_Cliente, ID_Servicio, Fecha, Hora, Estado) VALUES (?, ?, ?, ?, ?, ?)';
                            db.query(citaQuery, [ID_Profesional, ID_Cliente, ID_Servicio, Fecha, Hora, 'Pendiente'], (err, citaResult) => {
                                if (err) {
                                    console.error('Error al crear la cita:', err);
                                    return res.status(500).json({ error: 'Error interno del servidor al crear la cita.' });
                                }

                                // Eliminar la disponibilidad usada correctamente (cubre la hora de la cita)
                                const deleteDispQuery = `DELETE FROM Disponibilidad WHERE ID_Profesional = ? AND Dia = ? AND TIME(?) >= TIME(HoraInicio) AND TIME(?) < TIME(HoraFin)`;
                                db.query(deleteDispQuery, [ID_Profesional, dayNameEn, Hora, Hora], (err, delResult) => {
                                    if (err) {
                                        console.error('Error al eliminar la disponibilidad tras agendar cita:', err);
                                        // No bloquea la creación de la cita, solo loguea
                                    }
                                    // Continúa con la respuesta
                                    const newCitaId = citaResult.insertId;
                                    res.status(201).json({ id: newCitaId, message: 'Cita creada exitosamente.' });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

// Ruta para obtener todas las citas de un cliente específico
router.get('/clientes/:clienteId/citas', (req, res) => {
    const clienteId = req.params.clienteId;
    const query = `
        SELECT c.ID_Cita, c.ID_Profesional, c.ID_Servicio, c.Fecha, c.Hora, c.Estado,
               p.Nombre AS NombreProfesional, p.Especialidad AS EspecialidadProfesional
        FROM Cita c
        JOIN Profesional p ON c.ID_Profesional = p.ID_Profesional
        WHERE c.ID_Cliente = ?
    `;
    db.query(query, [clienteId], (err, results) => {
        if (err) {
            console.error(`Error fetching citas for cliente ID ${clienteId}:`, err);
            return res.status(500).json({ error: 'Error al obtener las citas del cliente.' });
        }
        res.json(results);
    });
});

module.exports = router;