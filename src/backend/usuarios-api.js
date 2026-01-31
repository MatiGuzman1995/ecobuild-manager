import conexion from './db.js';
import bcrypt from 'bcryptjs';

// 📌 Obtener todos los usuarios
export async function obtenerUsuarios() {
  try {
    const [rows] = await conexion.execute(`
      SELECT 
        id_usuario, 
        nombre, 
        apellido, 
        email, 
        usuario, 
        rol, 
        estado, 
        DATE_FORMAT(fecha_creacion, '%d/%m/%Y %H:%i') AS fecha_creacion,
        DATE_FORMAT(fecha_actualizacion, '%d/%m/%Y %H:%i') AS fecha_actualizacion
      FROM usuarios
      ORDER BY id_usuario DESC
    `);
    return rows;
  } catch (error) {
    console.error("❌ Error en obtenerUsuarios:", error);
    return [];
  }
}

// 📌 Crear usuario nuevo
export async function crearUsuario(data) {
  try {
    const { nombre, apellido, email, usuario, password, rol } = data;

    if (!nombre || !apellido || !email || !usuario || !password || !rol) {
      throw new Error("Faltan datos obligatorios para crear usuario.");
    }

    // Encriptar contraseña
    const hash = await bcrypt.hash(password, 10);

    await conexion.execute(`
      INSERT INTO usuarios 
        (nombre, apellido, email, usuario, password, rol, estado, fecha_creacion, fecha_actualizacion)
      VALUES (?, ?, ?, ?, ?, ?, 'activo', NOW(), NOW())
    `, [nombre, apellido, email, usuario, hash, rol]);

    console.log(`✅ Usuario ${usuario} creado correctamente.`);
    return true;
  } catch (error) {
    console.error("❌ Error en crearUsuario:", error);
    return false;
  }
}

// 📌 Cambiar estado del usuario (activo / suspendido / baja)
export async function cambiarEstadoUsuario(id_usuario, nuevoEstado) {
  try {
    if (!["activo", "suspendido", "baja"].includes(nuevoEstado)) {
      throw new Error("Estado inválido.");
    }

    await conexion.execute(`
      UPDATE usuarios 
      SET estado = ?, fecha_actualizacion = NOW() 
      WHERE id_usuario = ?
    `, [nuevoEstado, id_usuario]);

    console.log(`🔄 Usuario ${id_usuario} cambiado a estado ${nuevoEstado}.`);
    return true;
  } catch (error) {
    console.error("❌ Error en cambiarEstadoUsuario:", error);
    return false;
  }
}

// 📌 Eliminar usuario (excepto admin principal)
export async function eliminarUsuario(id) {
  try {
    if (id == 1) {
      console.warn("⚠️ Intento de eliminar al administrador principal bloqueado.");
      return false;
    }

    await conexion.execute(
      `DELETE FROM usuarios WHERE id_usuario = ?`,
      [id]
    );

    console.log(`🗑️ Usuario con ID ${id} eliminado correctamente.`);
    return true;
  } catch (error) {
    console.error("❌ Error en eliminarUsuario:", error);
    return false;
  }
}

// 📌 Actualizar datos de usuario (por admin)
export async function actualizarUsuario(data) {
  const { id, nombre, apellido, email, usuario, rol, password } = data;

  try {
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      await conexion.execute(`
        UPDATE usuarios 
        SET nombre=?, apellido=?, email=?, usuario=?, rol=?, password=?, fecha_actualizacion=NOW()
        WHERE id_usuario=?
      `, [nombre, apellido, email, usuario, rol, hash, id]);
    } else {
      await conexion.execute(`
        UPDATE usuarios 
        SET nombre=?, apellido=?, email=?, usuario=?, rol=?, fecha_actualizacion=NOW()
        WHERE id_usuario=?
      `, [nombre, apellido, email, usuario, rol, id]);
    }

    console.log(`✏️ Usuario ${id} actualizado correctamente.`);
    return true;
  } catch (error) {
    console.error("❌ Error en actualizarUsuario:", error);
    return false;
  }
}

// 📌 Actualizar perfil del usuario logueado
export async function actualizarPerfilUsuario(data) {
  const { id, nombre, apellido, email, password } = data;

  try {
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      await conexion.execute(`
        UPDATE usuarios 
        SET nombre=?, apellido=?, email=?, password=?, fecha_actualizacion=NOW()
        WHERE id_usuario=?
      `, [nombre, apellido, email, hash, id]);
    } else {
      await conexion.execute(`
        UPDATE usuarios 
        SET nombre=?, apellido=?, email=?, fecha_actualizacion=NOW()
        WHERE id_usuario=?
      `, [nombre, apellido, email, id]);
    }

    console.log(`👤 Perfil del usuario ${id} actualizado correctamente.`);
    return true;
  } catch (error) {
    console.error("❌ Error en actualizarPerfilUsuario:", error);
    return false;
  }
}
