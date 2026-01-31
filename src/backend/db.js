// src/backend/db.js
import mysql from 'mysql2/promise';

const conexion = await mysql.createConnection({
    host: 'localhost',
  user: 'root',
   password: '',
  database: 'EcoTerra'
});

console.log('✅ Conectado a MySQL (Terra)');
export default conexion;
