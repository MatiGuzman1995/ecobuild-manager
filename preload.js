console.log("⚙️ Preload cargado correctamente");

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {

  // =======================
  // AUTH / LOGIN
  // =======================
  loginUsuario: (usuario, contraseña) =>
    ipcRenderer.invoke("login-usuario", usuario, contraseña),

  // =======================
  // MATERIALES
  // =======================
  obtenerMateriales: () => ipcRenderer.invoke("materiales:obtener"),
  agregarMaterial: (data) => ipcRenderer.invoke("materiales:agregar", data),
  actualizarMaterial: (id, data) =>
    ipcRenderer.invoke("materiales:actualizar", id, data),
  eliminarMaterial: (id) =>
    ipcRenderer.invoke("materiales:eliminar", id),

  // =======================
  // PRESUPUESTOS
  // =======================
  obtenerPresupuestos: () => ipcRenderer.invoke("presupuestos:obtener"),
  agregarPresupuesto: (data) =>
    ipcRenderer.invoke("presupuestos:agregar", data),
  eliminarPresupuesto: (id) =>
    ipcRenderer.invoke("presupuestos:eliminar", id),

  obtenerDetallePresupuesto: (id) =>
    ipcRenderer.invoke("presupuestos:detalle", id),
  agregarDetallePresupuesto: (id_presupuesto, detalles) =>
    ipcRenderer.invoke("presupuestos:detalle-agregar", id_presupuesto, detalles),
  aprobarPresupuesto: (id, estado) =>
    ipcRenderer.invoke("presupuestos:aprobar", id, estado),

  // =======================
  // USUARIOS
  // =======================
  obtenerUsuarios: () => ipcRenderer.invoke('obtenerUsuarios'),
crearUsuario: (data) => ipcRenderer.invoke('crearUsuario', data),
cambiarEstadoUsuario: (id, estado) =>
  ipcRenderer.invoke('cambiarEstadoUsuario', { id, estado }),
eliminarUsuario: (id) => ipcRenderer.invoke('eliminarUsuario', id),
actualizarUsuario: (data) => ipcRenderer.invoke('actualizarUsuario', data),

  // =======================
  // MENSAJES
  // =======================
  obtenerMensajes: () => ipcRenderer.invoke('mensajes:obtener'),
  cambiarEstadoMensaje: (id, estado) => ipcRenderer.invoke('mensajes:cambiarEstado', id, estado),
  borrarMensaje: (id) => ipcRenderer.invoke('mensajes:borrar', id),
  agregarMensaje: (data) => ipcRenderer.invoke('mensajes:agregar', data),

  // =======================
  // CLIENTES
  // =======================
  obtenerClientes: () => ipcRenderer.invoke('clientes:obtener'),
  agregarCliente: (data) => ipcRenderer.invoke('clientes:agregar', data),
  actualizarCliente: (id, data) => ipcRenderer.invoke('clientes:actualizar', id, data),
  eliminarCliente: (id) => ipcRenderer.invoke('clientes:eliminar', id),

  // =======================
  // PROYECTOS
  // =======================
  obtenerProvincias: () => ipcRenderer.invoke('obtenerProvincias'),
  obtenerLocalidades: (idProv) => ipcRenderer.invoke('obtenerLocalidades', idProv),

  obtenerProyectos: () => ipcRenderer.invoke('obtenerProyectos'),
  agregarProyecto: (data) => ipcRenderer.invoke('agregarProyecto', data),
  actualizarProyecto: (id, data) => ipcRenderer.invoke('actualizarProyecto', id, data),
  eliminarProyecto: (id) => ipcRenderer.invoke('eliminarProyecto', id),
  obtenerProyectoPorId: (id) => ipcRenderer.invoke('obtenerProyectoPorId', id),

  obtenerArchivosProyecto: (id) => ipcRenderer.invoke('obtenerArchivosProyecto', id),
  subirArchivosProyecto: (id, archivos) => ipcRenderer.invoke('subirArchivosProyecto', id, archivos),
  eliminarArchivo: (idArchivo) => ipcRenderer.invoke('eliminarArchivo', idArchivo),
  eliminarArchivosProyecto: (idProyecto) => ipcRenderer.invoke('eliminarArchivosProyecto', idProyecto),

  // =======================
  // FILE PICKER
  // =======================
  seleccionarArchivo: (options) => ipcRenderer.invoke('seleccionarArchivo', options),
  seleccionarArchivos: (options) => ipcRenderer.invoke('seleccionarArchivos', options),

  abrirArchivoTemporal: (arch) => ipcRenderer.invoke('abrirArchivoTemporal', arch),
  abrirArchivo: (tempPath) => ipcRenderer.invoke('abrirArchivo', tempPath),
  guardarArchivo: (arch) => ipcRenderer.invoke('guardarArchivo', arch),

  // =======================
// CALENDARIO (EVENTOS)
// =======================
obtenerEventos: (fecha, todosFuturos) =>
  ipcRenderer.invoke('obtener-eventos', fecha, todosFuturos),
obtenerEventosProximos: () => ipcRenderer.invoke('obtener-eventos-proximos'),
agregarEvento: (data) => ipcRenderer.invoke('agregar-evento', data),
actualizarEvento: (id, data) =>
  ipcRenderer.invoke('actualizar-evento', { id, data }),
eliminarEvento: (id) => ipcRenderer.invoke('eliminar-evento', id),
obtenerEventoPorId: (id) => ipcRenderer.invoke('obtener-evento-por-id', id)});
