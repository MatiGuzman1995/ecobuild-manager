import conexion from './src/backend/db.js';

const [filas] = await conexion.query('SELECT * FROM clientes');
console.log('📋 Clientes encontrados:');
console.log(filas);

await conexion.end();
