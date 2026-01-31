import conexion from "./db.js";

// 📌 Obtener todos los presupuestos
export async function obtenerPresupuestos() {
  const [rows] = await conexion.query(`
    SELECT 
      p.id_presupuesto,
      c.Apellido AS Apellido,
      c.Nombre AS Nombre,
      c.DNI AS DNI,
      c.RazonSocial AS RazonSocial,
      c.CUIT AS CUIT,
      pr.nombre,
      p.mano_obra,
      p.margen,
      p.monto_total AS monto,

      -- ✅ si estado = aprobado → 1, sino 0
      IF(p.estado = 'aprobado', 1, 0) AS aprobado,

      p.estado,  -- ✅ coma faltante arreglada
      p.fecha_emision

    FROM presupuestos p
    LEFT JOIN cliente c ON p.id_cliente = c.ID_cliente
    LEFT JOIN proyecto pr ON p.id_proyecto = pr.id_proyecto
    ORDER BY p.id_presupuesto DESC
  `);

  return rows;
}




// 📌 Insertar presupuesto (CABECERA)
export async function agregarPresupuesto(data) {
  const { ID_cliente, ID_proyecto, monto_materiales, mano_obra, monto_total } = data;

  try {
    const [result] = await conexion.execute(
      `INSERT INTO presupuestos 
      (ID_cliente, ID_proyecto, monto_materiales, mano_obra, monto_total)
       VALUES (?, ?, ?, ?, ?)`,
      [
        ID_cliente,
        ID_proyecto ?? null,   // ✅ permite NULL
        monto_materiales,
        mano_obra,
        monto_total
      ]
    );

    console.log("✅ Presupuesto insertado ID:", result.insertId);
    return { id_presupuesto: result.insertId };

  } catch (err) {
    console.error("❌ Error insertando presupuesto:", err.sqlMessage || err);
    throw err;
  }
}



// 📌 Insertar líneas / detalle
export async function agregarDetallePresupuesto(id_presupuesto, detalles) {
  try {
    for (const d of detalles) {
      await conexion.execute(
        `INSERT INTO presupuesto_detalle 
  (id_presupuesto, id_material, cantidad, precio_unitario, subtotal)
  VALUES (?, ?, ?, ?, ?)`,
        [
          id_presupuesto,
          d.id_material,
          d.cantidad,
          d.precio,
          d.cantidad * d.precio
        ]
      );

    }

    console.log("✅ Detalles guardados");
    return true;
  } catch (err) {
    console.error("❌ Error insertando detalle:", err);
    return false;
  }
}

// 📌 Otros métodos aún no usados
export async function eliminarPresupuesto(id) {
  try {
    await conexion.execute(`DELETE FROM presupuesto_detalle WHERE id_presupuesto = ?`, [id]);
    await conexion.execute(`DELETE FROM presupuestos WHERE id_presupuesto = ?`, [id]);
    return { ok: true };
  } catch (err) {
    console.error("❌ Error eliminando presupuesto:", err);
    throw err;
  }
}
export async function obtenerDetallePresupuesto(id) {
  const [rows] = await conexion.query(
    `SELECT d.*, m.nombre AS material_nombre
     FROM presupuesto_detalle d
     JOIN materiales m ON d.id_material = m.id_material
     WHERE d.id_presupuesto = ?`,
    [id]
  );

  console.log("📦 DETALLE DB →", rows); // <-- DEBUG IMPORTANTE

  return rows;
}



export async function aprobarPresupuesto(id, estado) {
  try {
    await conexion.execute(
      `UPDATE presupuestos SET estado = ? WHERE id_presupuesto = ?`,
      [estado, id]
    );

    return { ok: true };
  } catch (error) {
    console.error("❌ Error actualizando estado de presupuesto:", error);
    throw error;
  }
}


