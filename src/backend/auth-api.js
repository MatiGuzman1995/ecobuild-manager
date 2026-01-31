import conexion from './db.js';
import bcrypt from 'bcryptjs';

console.log("🟢 conexion:", conexion ? "OK" : "NO DEFINIDA");

// === LOGIN DE USUARIO ===
export async function verificarCredenciales(usuario, password) {
  try {
    const [rows] = await conexion.execute(
      'SELECT * FROM usuarios WHERE usuario = ? OR email = ? LIMIT 1',
      [usuario, usuario]
    );

    if (rows.length === 0) {
      console.log("❌ Usuario no encontrado");
      return null;
    }

    const user = rows[0];

    const passDB = user.password;

    // 1) Comparar texto plano (temporal)
    if (passDB === password) {
      console.log(`✅ Login exitoso (texto plano): ${user.usuario} (${user.rol})`);
      return {
        id: user.id_usuario,
        nombre: `${user.nombre} ${user.apellido}`,
        rol: user.rol,
      };
    }

    // 2) Comparar bcrypt (si ya migraste a hash)
    try {
      const match = await bcrypt.compare(password, passDB);
      if (match) {
        console.log(`✅ Login exitoso (bcrypt): ${user.usuario} (${user.rol})`);
        return {
          id: user.id_usuario,
          nombre: `${user.nombre} ${user.apellido}`,
          rol: user.rol,
        };
      }
    } catch (e) {
      // ignore bcrypt error (if password is not a hash)
    }

    console.log("❌ Contraseña incorrecta");
    return null;

  } catch (error) {
    console.error("Error en verificarCredenciales:", error);
    return null;
  }
}
