const mysql = require('mysql2');

const dbconfig = {
    host: 'localhost',
    user: 'root',
    password: 'tigotigo',
    database: 'citas_db'
};

const db = mysql.createPool(dbconfig);

db.getConnection((err, connection) => {
    if (err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('Database connection was closed.');
        } else if (err.code === 'ER_CON_COUNT_ERROR') {
            console.error('Database has too many connections.');
        } else if (err.code === 'ECONNREFUSED') {
            console.error('Database connection was refused.');
        } else {
            console.error('Error connecting to database', err);
        }
        return;
    }

    connection.release();
    console.log('Database connected successfully!');
});

module.exports = db;