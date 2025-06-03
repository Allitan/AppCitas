const jwt = require('jsonwebtoken');

const authenticateProfesional = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1]; // Bearer <token>

        if (token) {
            jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
                if (err) {
                    return res.status(403).json({ error: 'Token inválido.' }); // 403 Forbidden
                }

                req.profesionalId = user.profesionalId; // Guardamos el ID del profesional en la request
                next();
            });
        } else {
            res.status(401).json({ error: 'Token de autenticación no proporcionado.' }); // 401 Unauthorized
        }
    } else {
        res.status(401).json({ error: 'Encabezado de autorización no encontrado.' }); // 401 Unauthorized
    }
};

module.exports = { authenticateProfesional };