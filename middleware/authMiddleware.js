const jwt = require('jsonwebtoken');

const authenticateClient = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1]; // Bearer <token>

        if (token) {
            jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
                if (err) {
                    return res.status(403).json({ error: 'Token inválido.' }); // 403 Forbidden
                }

                req.clientId = user.clientId; // Guardamos el ID del cliente en la request para usarlo en la ruta
                next(); // Permitimos que la solicitud continúe a la siguiente middleware o ruta
            });
        } else {
            res.status(401).json({ error: 'Token de autenticación no proporcionado.' }); // 401 Unauthorized
        }
    } else {
        res.status(401).json({ error: 'Encabezado de autorización no encontrado.' }); // 401 Unauthorized
    }
};

module.exports = { authenticateClient };