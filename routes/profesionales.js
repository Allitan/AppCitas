const express = require('express');
const router = express.Router();
const db = require('../config/db');

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

module.exports = router;