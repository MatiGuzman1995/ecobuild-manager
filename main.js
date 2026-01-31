// main.js
import fs from 'fs';
import path from 'path';
import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import { fileURLToPath } from 'url';

// === DB base ===
import conexion from './src/backend/db.js';
conexion.query('SELECT 1')
  .then(() => console.log('✅ Conectado a Terra DB'))
  .catch(err => console.log('❌ Error DB:', err));

// === BACKEND IMPORTS ===

// Auth
import { verificarCredenciales } from './src/backend/auth-api.js';

// Clientes
import {
  obtenerClientes,
  agregarCliente,
  actualizarCliente,
  eliminarCliente
} from './src/backend/clientes-api.js';

// Proyectos
import {
  obtenerProyectos,
  agregarProyecto,
  actualizarProyecto,
  eliminarProyecto,
  obtenerProyectoPorId,
  obtenerArchivosProyecto,
  subirArchivosProyecto,
  //eliminarArchivo,
  //eliminarArchivosProyecto,
  obtenerProvincias,
  obtenerLocalidades,
  agregarDireccion,
  agregarTerreno
} from './src/backend/proyectos-api.js';

// Presupuestos
import {
  obtenerPresupuestos,
  agregarPresupuesto,
  eliminarPresupuesto,
  aprobarPresupuesto,
  obtenerDetallePresupuesto,
  agregarDetallePresupuesto
} from './src/backend/presupuestos-api.js';

// Materiales
import {
  obtenerMateriales,
  agregarMaterial,
  actualizarMaterial,
  eliminarMaterial
} from './src/backend/materiales-api.js';

// Usuarios
import {
  obtenerUsuarios,
  crearUsuario,
  cambiarEstadoUsuario,
  eliminarUsuario,
  actualizarUsuario,
  actualizarPerfilUsuario
} from './src/backend/usuarios-api.js';

// === PLACEHOLDERS para módulos NO implementados aún ===
async function obtenerMensajes() { return []; }
async function cambiarEstadoMensaje() { return true; }
async function borrarMensaje() { return true; }

// === EVENTOS ===
import {
  obtenerEventos,
  obtenerEventosProximos,
  agregarEvento,
  actualizarEvento,
  eliminarEvento,
  obtenerEventoPorId
} from './src/backend/calendario-api.js';

async function eliminarArchivo() { return false; }
async function eliminarArchivosProyecto() { return false; }

// ==============================
//    RUTAS / WINDOW
// ==============================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function crearVentanaPrincipal() {
  const rutaHTML = path.join(__dirname, 'src', 'index.html');
  console.log('🟩 Cargando:', rutaHTML);

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#f0f0f0',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false,
    }
  });

  mainWindow.loadFile(rutaHTML);
  mainWindow.webContents.openDevTools();
  mainWindow.webContents.on('did-finish-load', () => console.log('🌿 Renderer listo'));
}

// ==============================
// AUTH
// ==============================
ipcMain.handle('login-usuario', (_e, user, pass) => verificarCredenciales(user, pass));
ipcMain.handle('actualizarProgreso', (_e, id, avance) => actualizarProgreso(id, avance));   // ← este no está importado, ¿existe la función?

// ==============================
// CLIENTES
// ==============================
ipcMain.handle('clientes:obtener', obtenerClientes);
ipcMain.handle('clientes:agregar', (_e, d) => agregarCliente(d));
ipcMain.handle('clientes:actualizar', (_e, id, d) => actualizarCliente(id, d));
ipcMain.handle('clientes:eliminar', (_e, id) => eliminarCliente(id));

// ==============================
// PROYECTOS
// ==============================
ipcMain.handle('obtenerProyectos', obtenerProyectos);
ipcMain.handle('agregarProyecto', (_e, data) => agregarProyecto(data));
ipcMain.handle('actualizarProyecto', (_e, id, data) => actualizarProyecto(id, data));
ipcMain.handle('eliminarProyecto', (_e, id) => eliminarProyecto(id));
ipcMain.handle('obtenerProyectoPorId', (_e, id) => obtenerProyectoPorId(id));
ipcMain.handle('obtenerArchivosProyecto', (_e, id) => obtenerArchivosProyecto(id));
ipcMain.handle('subirArchivosProyecto', (_e, id, archivos) => subirArchivosProyecto(id, archivos));
ipcMain.handle('obtenerProvincias', obtenerProvincias);
ipcMain.handle('obtenerLocalidades', (_e, idProvincia) => obtenerLocalidades(idProvincia));

// ==============================
// PRESUPUESTOS
// ==============================
ipcMain.handle('presupuestos:obtener', obtenerPresupuestos);
ipcMain.handle('presupuestos:agregar', (_e, data) => agregarPresupuesto(data));
ipcMain.handle('presupuestos:eliminar', (_e, id) => eliminarPresupuesto(id));
ipcMain.handle('presupuestos:aprobar', (_e, id, estado) => aprobarPresupuesto(id, estado));
ipcMain.handle('presupuestos:detalle', (_e, id) => obtenerDetallePresupuesto(id));
ipcMain.handle('presupuestos:detalle-agregar', (_e, id_presupuesto, detalles) => agregarDetallePresupuesto(id_presupuesto, detalles));

// ==============================
// MATERIALES
// ==============================
ipcMain.handle('materiales:obtener', obtenerMateriales);
ipcMain.handle('materiales:agregar', (_e, data) => agregarMaterial(data));
ipcMain.handle('materiales:actualizar', (_e, id, data) => actualizarMaterial(id, data));
ipcMain.handle('materiales:eliminar', (_e, id) => eliminarMaterial(id));

// ==============================
// USUARIOS
// ==============================
ipcMain.handle('obtenerUsuarios', obtenerUsuarios);
ipcMain.handle('crearUsuario', (_e, data) => crearUsuario(data));
ipcMain.handle('cambiarEstadoUsuario', (_e, id, estado) => cambiarEstadoUsuario(id, estado));
ipcMain.handle('eliminarUsuario', (_e, id) => eliminarUsuario(id));
ipcMain.handle('actualizarUsuario', (_e, data) => actualizarUsuario(data));

// ==============================
// MENSAJES (placeholders)
// ==============================
ipcMain.handle('mensajes:obtener', obtenerMensajes);
ipcMain.handle('mensajes:cambiarEstado', (_e, id, estado) => cambiarEstadoMensaje(id, estado));
ipcMain.handle('mensajes:borrar', (_e, id) => borrarMensaje(id));

// ==============================
// CALENDARIO / EVENTOS
// ==============================
ipcMain.handle('obtener-eventos', (_e, fecha, todosFuturos) => obtenerEventos(fecha, todosFuturos));
ipcMain.handle('obtener-eventos-proximos', obtenerEventosProximos);           // ← ESTA LÍNEA FALTABA → SOLUCIÓN DEL ERROR
ipcMain.handle('agregar-evento', (_e, data) => agregarEvento(data));
ipcMain.handle('actualizar-evento', (_e, id, data) => actualizarEvento(id, data));
ipcMain.handle('eliminar-evento', (_e, id) => eliminarEvento(id));
ipcMain.handle('obtener-evento-por-id', (_e, id) => obtenerEventoPorId(id));

// ==============================
// IPC: File Picker (para imagen/archivos)
// ==============================
ipcMain.handle('seleccionarArchivo', async (_e, options) => {
  console.log("IPC recibido: seleccionarArchivo con opciones:", options);
  try {
    const { filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Archivos', extensions: options.accept.split(',').map(e => e.trim().slice(1)) }]
    });
    if (filePaths && filePaths[0]) {
      const fp = filePaths[0];
      const contenido = await fs.promises.readFile(fp);
      const name = path.basename(fp);
      const tipo = path.extname(name).toUpperCase().slice(1) || 'desconocido';
      const size = contenido.length;
      console.log("Archivo seleccionado en main:", fp);
      return { name, path: fp, size, contenido, tipo };
    }
    console.log("No se seleccionó archivo");
    return null;
  } catch (error) {
    console.error("Error en seleccionarArchivo:", error);
    return null;
  }
});

ipcMain.handle('seleccionarArchivos', async (_e, options) => {
  console.log("IPC recibido: seleccionarArchivos con opciones:", options);
  try {
    const { filePaths } = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Archivos', extensions: options.accept.split(',').map(e => e.trim().slice(1)) }]
    });
    const files = [];
    for (const fp of filePaths) {
      const contenido = await fs.promises.readFile(fp);
      const name = path.basename(fp);
      const tipo = path.extname(name).toUpperCase().slice(1) || 'desconocido';
      const size = contenido.length;
      files.push({ name, path: fp, size, contenido, tipo });
    }
    console.log("Archivos seleccionados en main:", files.length);
    return files;
  } catch (error) {
    console.error("Error en seleccionarArchivos:", error);
    return [];
  }
});

// IPC: Abrir archivo temporal
ipcMain.handle('abrirArchivoTemporal', async (_e, arch) => {
  try {
    const tempDir = app.getPath('temp');
    const tempPath = path.join(tempDir, arch.nombre);
    await fs.promises.writeFile(tempPath, arch.contenido);
    return tempPath;
  } catch (error) {
    console.error("Error al crear temp file:", error);
    return null;
  }
});

// Abrir archivo con shell
ipcMain.handle('abrirArchivo', async (_e, tempPath) => {
  try {
    await shell.openPath(tempPath);
    return true;
  } catch (error) {
    console.error("Error al abrir archivo:", error);
    return false;
  }
});

// Guardar archivo en carpeta elegida
ipcMain.handle('guardarArchivo', async (_e, arch) => {
  try {
    const { filePath } = await dialog.showSaveDialog({
      defaultPath: arch.nombre,
      filters: [{ name: 'Archivo', extensions: [path.extname(arch.nombre).slice(1)] }]
    });
    if (filePath) {
      await fs.promises.writeFile(filePath, arch.contenido);
      console.log("Archivo guardado en:", filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error al guardar archivo:", error);
    return false;
  }
});

// ==============================
// START
// ==============================
app.whenReady().then(() => {
  crearVentanaPrincipal();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) crearVentanaPrincipal();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});