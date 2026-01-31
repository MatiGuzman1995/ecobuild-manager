import conexion from './db.js';

// Obtener todos los materiales
export async function obtenerMateriales() {
  const [rows] = await conexion.execute(`
    SELECT 
      id_material, 
      nombre, 
      descripcion, 
      unidad, 
      precio_unitario, 
      tipo
    FROM materiales
    ORDER BY nombre ASC
  `);
  return rows;
}

// Agregar material
export async function agregarMaterial(data) {
  const { nombre, descripcion, unidad, precio_unitario, tipo } = data;

  const [result] = await conexion.execute(
    `INSERT INTO materiales (nombre, descripcion, unidad, precio_unitario, tipo)
     VALUES (?, ?, ?, ?, ?)`,
    [nombre, descripcion, unidad, precio_unitario, tipo]
  );

  return { success: true, id_material: result.insertId };
}

// Actualizar material
export async function actualizarMaterial(id_material, data) {
  const { nombre, descripcion, unidad, precio_unitario, tipo } = data;

  await conexion.execute(
    `UPDATE materiales 
     SET nombre=?, descripcion=?, unidad=?, precio_unitario=?, tipo=? 
     WHERE id_material=?`,
    [nombre, descripcion, unidad, precio_unitario, tipo, id_material]
  );

  return { success: true };
}

// Eliminar material
export async function eliminarMaterial(id_material) {
  await conexion.execute(`DELETE FROM materiales WHERE id_material=?`, [id_material]);
  return { success: true };
}
