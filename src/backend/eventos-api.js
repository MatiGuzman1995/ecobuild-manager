import conexion from './db.js';

// === OBTENER TODOS LOS EVENTOS ===
export async function obtenerEventos(fecha = null, todosFuturos = false) {
  let query = `
    SELECT 
      E.ID_evento, E.Asunto, E.Detalles, E.FechaHoraInicio, E.FechaHoraFin, E.Otro,
      C.ID_cliente, 
      CASE 
        WHEN C.RazonSocial IS NOT NULL THEN CONCAT(C.RazonSocial, ' (CUIT: ', C.CUIT, ')')
        ELSE CONCAT(C.Apellido, ', ', C.Nombre, ' (DNI: ', C.DNI, ')')
      END AS ClienteNombre,
      P.ID_proyecto, P.Nombre AS ProyectoNombre
    FROM EVENTOS E
    LEFT JOIN CLIENTE C ON E.ID_cliente = C.ID_cliente
    LEFT JOIN PROYECTO P ON E.ID_proyecto = P.ID_proyecto
  `;
  const params = [];

  if (fecha) {
    query += ` WHERE DATE(E.FechaHoraInicio) = ? ORDER BY E.FechaHoraInicio ASC`;
    params.push(fecha);
  } else if (todosFuturos) {
    query += ` WHERE E.FechaHoraInicio >= NOW() ORDER BY E.FechaHoraInicio ASC`;
  } else {
    query += ` ORDER BY E.FechaHoraInicio ASC`;
  }

  const [rows] = await conexion.execute(query, params);
  return rows;
}

// === OBTENER EVENTOS PRÓXIMOS (HASTA 2 SEMANAS) ===
export async function obtenerEventosProximos() {
  const query = `
    SELECT 
      E.ID_evento, E.Asunto, E.Detalles, E.FechaHoraInicio, E.FechaHoraFin, E.Otro,
      C.ID_cliente, 
      CASE 
        WHEN C.RazonSocial IS NOT NULL THEN CONCAT(C.RazonSocial, ' (CUIT: ', C.CUIT, ')')
        ELSE CONCAT(C.Apellido, ', ', C.Nombre, ' (DNI: ', C.DNI, ')')
      END AS ClienteNombre,
      P.ID_proyecto, P.Nombre AS ProyectoNombre
    FROM EVENTOS E
    LEFT JOIN CLIENTE C ON E.ID_cliente = C.ID_cliente
    LEFT JOIN PROYECTO P ON E.ID_proyecto = P.ID_proyecto
    WHERE E.FechaHoraInicio >= NOW() AND E.FechaHoraInicio <= DATE_ADD(NOW(), INTERVAL 14 DAY)
    ORDER BY E.FechaHoraInicio ASC
  `;
  const [rows] = await conexion.execute(query);
  return rows;
}

// === AGREGAR EVENTO ===
export async function agregarEvento(data) {
  const { Asunto, Detalles, FechaHoraInicio, FechaHoraFin, ID_cliente, ID_proyecto, Otro } = data;

  if (!Asunto) throw new Error('Asunto requerido');
  if (new Date(FechaHoraInicio) >= new Date(FechaHoraFin))
    throw new Error('La fecha de inicio debe ser anterior a la de fin');

  const [result] = await conexion.execute(
    `INSERT INTO EVENTOS (Asunto, Detalles, FechaHoraInicio, FechaHoraFin, ID_cliente, ID_proyecto, Otro)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [Asunto, Detalles || null, FechaHoraInicio, FechaHoraFin, ID_cliente || null, ID_proyecto || null, Otro ? 1 : 0]
  );
  return result.insertId;
}

// === ACTUALIZAR EVENTO ===
export async function actualizarEvento(id, data) {
  const { Asunto, Detalles, FechaHoraInicio, FechaHoraFin, ID_cliente, ID_proyecto, Otro } = data;

  if (!Asunto) throw new Error('Asunto requerido');
  if (new Date(FechaHoraInicio) >= new Date(FechaHoraFin))
    throw new Error('La fecha de inicio debe ser anterior a la de fin');

  await conexion.execute(
    `UPDATE EVENTOS 
     SET Asunto=?, Detalles=?, FechaHoraInicio=?, FechaHoraFin=?, ID_cliente=?, ID_proyecto=?, Otro=? 
     WHERE ID_evento=?`,
    [Asunto, Detalles || null, FechaHoraInicio, FechaHoraFin, ID_cliente || null, ID_proyecto || null, Otro ? 1 : 0, id]
  );
  return true;
}

// === ELIMINAR EVENTO ===
export async function eliminarEvento(id) {
  await conexion.execute('DELETE FROM EVENTOS WHERE ID_evento=?', [id]);
  return true;
}

// === OBTENER EVENTO POR ID ===
export async function obtenerEventoPorId(id) {
  const [rows] = await conexion.execute(`
    SELECT 
      E.ID_evento, E.Asunto, E.Detalles, E.FechaHoraInicio, E.FechaHoraFin, E.Otro,
      C.ID_cliente, 
      CASE 
        WHEN C.RazonSocial IS NOT NULL THEN CONCAT(C.RazonSocial, ' (CUIT: ', C.CUIT, ')')
        ELSE CONCAT(C.Apellido, ', ', C.Nombre, ' (DNI: ', C.DNI, ')')
      END AS ClienteNombre,
      P.ID_proyecto, P.Nombre AS ProyectoNombre
    FROM EVENTOS E
    LEFT JOIN CLIENTE C ON E.ID_cliente = C.ID_cliente
    LEFT JOIN PROYECTO P ON E.ID_proyecto = P.ID_proyecto
    WHERE E.ID_evento = ?
  `, [id]);
  return rows[0];
}
