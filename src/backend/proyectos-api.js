import conexion from './db.js';
import path from 'path';

// === OBTENER PROVINCIAS ===
export async function obtenerProvincias() {
  const [rows] = await conexion.execute('SELECT * FROM PROVINCIA ORDER BY nomProvincia');
  return rows;
}

// === OBTENER LOCALIDADES POR PROVINCIA ===
export async function obtenerLocalidades(idProvincia) {
  const [rows] = await conexion.execute('SELECT * FROM LOCALIDAD WHERE ID_provincia = ? ORDER BY nomLocalidad', [idProvincia]);
  return rows;
}

// === AGREGAR DIRECCION ===
export async function agregarDireccion(data) {
  const { calle, numeracion, ID_localidad } = data;
  const [result] = await conexion.execute(
    'INSERT INTO DIRECCION (calle, numeracion, ID_localidad) VALUES (?, ?, ?)',
    [calle, numeracion, ID_localidad]
  );
  return result.insertId;
}

// === AGREGAR TERRENO ===
export async function agregarTerreno(data) {
  const { descripcion, ID_direccion, ID_cliente } = data;
  const [result] = await conexion.execute(
    'INSERT INTO TERRENO (descripcion, ID_direccion, ID_cliente) VALUES (?, ?, ?)',
    [descripcion, ID_direccion, ID_cliente]
  );
  return result.insertId;
}

// === OBTENER TODOS LOS PROYECTOS ===
export async function obtenerProyectos() {
  const [rows] = await conexion.execute(`
    SELECT 
      p.ID_proyecto,
      p.Nombre AS NombreProyecto,
      p.Metros_Cuadrados,
      p.Imagen,
      c.ID_cliente,
      c.Apellido,
      c.Nombre AS NombreCliente,
      c.DNI,
      c.CUIT,
      c.RazonSocial,
      c.Empresa,
      t.descripcion AS DescripcionTerreno,
      d.calle AS Calle,
      d.numeracion AS Numeracion,
      l.nomLocalidad AS Localidad,
      pr.nomProvincia AS Provincia
    FROM PROYECTO p
    LEFT JOIN CLIENTE c ON p.ID_cliente = c.ID_cliente
    LEFT JOIN TERRENO t ON p.ID_terreno = t.ID_terreno
    LEFT JOIN DIRECCION d ON t.ID_direccion = d.ID_direccion
    LEFT JOIN LOCALIDAD l ON d.ID_localidad = l.ID_localidad
    LEFT JOIN PROVINCIA pr ON l.ID_provincia = pr.ID_provincia
    ORDER BY p.ID_proyecto DESC
  `);
  return rows;
}

// === AGREGAR NUEVO PROYECTO ===
export async function agregarProyecto(data) {
  const { ID_cliente, Nombre, Metros_Cuadrados, Imagen, terreno } = data;

  // Agregar Dirección y Terreno primero
  const ID_direccion = await agregarDireccion(terreno.direccion);
  const ID_terreno = await agregarTerreno({ ...terreno, ID_direccion, ID_cliente });

  const [result] = await conexion.execute(
    `INSERT INTO PROYECTO (Nombre, ID_cliente, ID_terreno, Metros_Cuadrados, Imagen)
     VALUES (?, ?, ?, ?, ?)`,
    [Nombre, ID_cliente, ID_terreno, Metros_Cuadrados, Imagen || null]
  );
  return result.insertId;
}

// === ACTUALIZAR PROYECTO ===
export async function actualizarProyecto(id, data) {
  const { Nombre, Metros_Cuadrados, Imagen, terreno } = data;

  // Actualizar Terreno/Dirección
  const proyecto = await obtenerProyectoPorId(id);
  await conexion.execute(
    'UPDATE DIRECCION SET calle=?, numeracion=?, ID_localidad=? WHERE ID_direccion = (SELECT ID_direccion FROM TERRENO WHERE ID_terreno = ?)',
    [terreno.direccion.calle, terreno.direccion.numeracion, terreno.direccion.ID_localidad, proyecto.ID_terreno]
  );
  await conexion.execute(
    'UPDATE TERRENO SET descripcion=? WHERE ID_terreno=?',
    [terreno.descripcion, proyecto.ID_terreno]
  );

  let query = 'UPDATE PROYECTO SET Nombre=?, Metros_Cuadrados=?';
  let params = [Nombre, Metros_Cuadrados];
  if (Imagen !== undefined) {
    query += ', Imagen=?';
    params.push(Imagen);
  }
  query += ' WHERE ID_proyecto=?';
  params.push(id);

  await conexion.execute(query, params);
  return true;
}

// === ELIMINAR PROYECTO ===
export async function eliminarProyecto(id) {
  await conexion.execute('DELETE FROM PROYECTO WHERE ID_proyecto = ?', [id]);
  return true;
}

// === OBTENER DETALLE DE UN PROYECTO ===
export async function obtenerProyectoPorId(id) {
  const [rows] = await conexion.execute(`
    SELECT 
      p.*,
      t.descripcion AS DescripcionTerreno,
      d.calle AS Calle,
      d.numeracion AS Numeracion,
      d.ID_localidad,
      l.ID_provincia,
      l.nomLocalidad AS Localidad,
      pr.nomProvincia AS Provincia,
      c.Apellido,
      c.Nombre AS NombreCliente,
      c.DNI,
      c.CUIT,
      c.RazonSocial,
      c.Empresa
    FROM PROYECTO p
    LEFT JOIN TERRENO t ON p.ID_terreno = t.ID_terreno
    LEFT JOIN DIRECCION d ON t.ID_direccion = d.ID_direccion
    LEFT JOIN LOCALIDAD l ON d.ID_localidad = l.ID_localidad
    LEFT JOIN PROVINCIA pr ON l.ID_provincia = pr.ID_provincia
    LEFT JOIN CLIENTE c ON p.ID_cliente = c.ID_cliente
    WHERE p.ID_proyecto = ?
  `, [id]);
  return rows[0];
}

// === OBTENER ARCHIVOS DE PROYECTO ===
export async function obtenerArchivosProyecto(id_proyecto) {
  const [rows] = await conexion.execute(`
    SELECT 
      ID_archivo, 
      NombreArchivo AS nombre, 
      TipoArchivo AS tipo,
      Contenido AS contenido,
      FechaSubida AS FechaSubida,
      Tamaño AS Tamaño
    FROM ARCHIVO_PROYECTO 
    WHERE ID_proyecto = ? 
    ORDER BY FechaSubida DESC
  `, [id_proyecto]);
  return rows.map(r => ({ ...r, contenido: r.contenido || Buffer.alloc(0), tipo: r.tipo || 'desconocido', Tamaño: r.Tamaño || 0, FechaSubida: r.FechaSubida || new Date() }));
}

// === SUBIR ARCHIVOS MÚLTIPLES ===
export async function subirArchivosProyecto(id_proyecto, archivos) {
  const results = [];
  for (const archivo of archivos) {
    if (archivo.size > 100 * 1024 * 1024) throw new Error(`Archivo ${archivo.name} excede 100MB`);
    const ext = path.extname(archivo.name).toLowerCase();
    if (!['.pdf', '.jpg', '.jpeg', '.png', '.docx', '.txt', '.zip'].includes(ext)) throw new Error(`Tipo no permitido: ${archivo.name}`);

    let contenido = archivo.contenido;
    if (!Buffer.isBuffer(contenido)) {
      if (contenido instanceof Uint8Array || contenido instanceof ArrayBuffer) {
        contenido = Buffer.from(contenido);
      } else if (contenido && typeof contenido === 'object' && 'data' in contenido) {
        contenido = Buffer.from(contenido.data);
      } else {
        throw new Error(`Contenido inválido para ${archivo.name}`);
      }
    }
    const tipo = ext.slice(1).toUpperCase();
    const tamano = archivo.size;

    const [result] = await conexion.execute(
      `INSERT INTO ARCHIVO_PROYECTO (ID_proyecto, NombreArchivo, TipoArchivo, Contenido, FechaSubida, Tamaño)
       VALUES (?, ?, ?, ?, NOW(), ?)`,
      [id_proyecto, archivo.name, tipo, contenido, tamano]
    );
    results.push(result.insertId);
  }
  return results;
}

// === ELIMINAR ARCHIVO ===
export async function eliminarArchivo(id_archivo) {
  await conexion.execute('DELETE FROM ARCHIVO_PROYECTO WHERE ID_archivo = ?', [id_archivo]);
  return true;
}

// === ELIMINAR TODOS ARCHIVOS DE PROYECTO ===
export async function eliminarArchivosProyecto(id_proyecto) {
  await conexion.execute('DELETE FROM ARCHIVO_PROYECTO WHERE ID_proyecto = ?', [id_proyecto]);
  return true;
}