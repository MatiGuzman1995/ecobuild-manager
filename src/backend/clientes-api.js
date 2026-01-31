import conexion from './db.js';

// === OBTENER TODOS ===
export async function obtenerClientes() {
  const [rows] = await conexion.execute('SELECT * FROM CLIENTE ORDER BY ID_cliente DESC');
  return rows;
}

// === AGREGAR ===
export async function agregarCliente(data) {
  const { Apellido, Nombre, Email, Telefono, DNI, CUIT, RazonSocial, Empresa } = data;

  // Validaciones básicas (inspiradas en Forms)
  if (Empresa) {
    if (!RazonSocial || !CUIT) throw new Error('Razón Social y CUIT requeridos para empresa');
    // Formato CUIT simple (11 dígitos)
    if (!/^\d{11}$/.test(CUIT)) throw new Error('CUIT inválido');
  } else {
    if (!Apellido || !Nombre || !DNI) throw new Error('Apellido, Nombre y DNI requeridos para persona');
    // Formato DNI simple (8 dígitos)
    if (!/^\d{8}$/.test(DNI)) throw new Error('DNI inválido');
  }
  if (!Email || !Telefono) throw new Error('Email y Teléfono requeridos');

  const [result] = await conexion.execute(
    'INSERT INTO CLIENTE (Apellido, Nombre, Email, Telefono, DNI, CUIT, RazonSocial, Empresa) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [Apellido || null, Nombre || null, Email, Telefono, DNI || null, CUIT || null, RazonSocial || null, Empresa ? 1 : 0]
  );
  return result.insertId;
}

// === EDITAR ===
export async function actualizarCliente(id, data) {
  const { Apellido, Nombre, Email, Telefono, DNI, CUIT, RazonSocial, Empresa } = data;

  // Mismas validaciones que en agregar
  if (Empresa) {
    if (!RazonSocial || !CUIT) throw new Error('Razón Social y CUIT requeridos para empresa');
    if (!/^\d{11}$/.test(CUIT)) throw new Error('CUIT inválido');
  } else {
    if (!Apellido || !Nombre || !DNI) throw new Error('Apellido, Nombre y DNI requeridos para persona');
    if (!/^\d{8}$/.test(DNI)) throw new Error('DNI inválido');
  }
  if (!Email || !Telefono) throw new Error('Email y Teléfono requeridos');

  await conexion.execute(
    'UPDATE CLIENTE SET Apellido=?, Nombre=?, Email=?, Telefono=?, DNI=?, CUIT=?, RazonSocial=?, Empresa=? WHERE ID_cliente=?',
    [Apellido || null, Nombre || null, Email, Telefono, DNI || null, CUIT || null, RazonSocial || null, Empresa ? 1 : 0, id]
  );
  return true;
}

// === ELIMINAR ===
export async function eliminarCliente(id) {
  await conexion.execute('DELETE FROM CLIENTE WHERE ID_cliente=?', [id]);
  return true;
}
