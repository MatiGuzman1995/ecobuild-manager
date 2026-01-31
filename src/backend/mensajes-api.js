import mysql from 'mysql2/promise';

// --- Conexión a la base local ---
const conexion = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',  // tu contraseña local
  database: 'ecobuildmanager'
});

console.log('✅ Conectado a MySQL (mensajes)');

// ----------------------
// FUNCIONES EXPORTADAS
// ----------------------

// Obtener todos los mensajes
export async function obtenerMensajes() {
  try {
    const [rows] = await conexion.execute('SELECT * FROM mensajes ORDER BY fecha DESC');
    return rows;
  } catch (err) {
    console.error('❌ Error al obtener mensajes:', err);
    return [];
  }
}

// Cambiar estado de mensaje (leído / no leído)
export async function cambiarEstadoMensaje(id_mensaje, estado) {
  try {
    await conexion.execute('UPDATE mensajes SET estado=? WHERE id_mensaje=?', [estado, id_mensaje]);
    return true;
  } catch (err) {
    console.error('❌ Error al cambiar estado mensaje:', err);
    return false;
  }
}

// Borrar mensaje
export async function borrarMensaje(id_mensaje) {
  try {
    await conexion.execute('DELETE FROM mensajes WHERE id_mensaje=?', [id_mensaje]);
    return true;
  } catch (err) {
    console.error('❌ Error al borrar mensaje:', err);
    return false;
  }
}

// Agregar mensaje (desde formulario web)
export async function agregarMensaje(nombre, apellido, email, asunto, contenido) {
  try {
    await conexion.execute(
      'INSERT INTO mensajes (nombre, apellido, email, asunto, contenido, fecha, estado) VALUES (?, ?, ?, ?, ?, NOW(), ?)',
      [nombre, apellido, email, asunto, contenido, 'no_leido']
    );
    return true;
  } catch (err) {
    console.error('❌ Error al agregar mensaje:', err);
    return false;
  }
}
