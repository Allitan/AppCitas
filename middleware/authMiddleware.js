const jwt = require('jsonwebtoken');

const authenticateClient = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1];

        if (token) {
            jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
                if (err) {
                    return res.status(403).json({ error: 'Token inválido.' });
                }

                req.clientId = user.clientId;
                next();
            });
        } else {
            res.status(401).json({ error: 'Token de autenticación no proporcionado.' });
        }
    } else {
        res.status(401).json({ error: 'Encabezado de autorización no encontrado.' });
    }
};

module.exports = { authenticateClient };