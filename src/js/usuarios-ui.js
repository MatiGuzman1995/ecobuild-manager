export function cargarUsuariosUI() {
  const contenido = document.getElementById("contenido");

  contenido.innerHTML = `
    <style>
      .modal {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.5);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      .modal.visible { display: flex; }
      .modal-contenido {
        background: #fff;
        border-radius: 10px;
        padding: 30px;
        width: 600px;
        max-width: 90%;
        box-shadow: 0 0 15px rgba(0,0,0,0.3);
      }
      .modal-contenido input, 
      .modal-contenido select {
        width: 100%;
        margin-bottom: 10px;
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 5px;
      }
      .modal-btns {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 10px;
      }
      .btn-primary, .btn-success, .btn-danger, .btn-secondary, .btn-edit, .btn-delete {
        border: none;
        border-radius: 6px;
        padding: 6px 12px;
        cursor: pointer;
        color: #fff;
      }
      .btn-primary { background: #007bff; }
      .btn-success { background: #28a745; }
      .btn-danger { background: #dc3545; }
      .btn-secondary { background: #6c757d; }
      .btn-edit { background: #17a2b8; }
      .btn-delete { background: #dc3545; }
      table.tabla {
        width: 100%;
        border-collapse: collapse;
        margin-top: 15px;
      }
      table.tabla th, table.tabla td {
        border: 1px solid #ccc;
        padding: 10px;
        text-align: center;
      }
      table.tabla th {
        background: #f8f9fa;
      }
    </style>

    <div class="header-flex">
      <h2>👤 Gestión de Usuarios</h2>
      <button id="btnNuevoUsuario" class="btn-primary">➕ Nuevo Usuario</button>
    </div>

    <table class="tabla">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Email</th>
          <th>Rol</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody id="tablaUsuarios"></tbody>
    </table>

    <!-- Modal Nuevo Usuario -->
    <div id="modalUsuario" class="modal">
      <div class="modal-contenido">
        <h3 id="tituloModalUsuario">➕ Crear Nuevo Usuario</h3>

        <label>Nombre</label>
        <input type="text" id="inputNombreUsuario">

        <label>Apellido</label>
        <input type="text" id="inputApellidoUsuario">

        <label>Email</label>
        <input type="email" id="inputEmailUsuario">

        <label>Usuario</label>
        <input type="text" id="inputUsuarioLogin">

        <label>Contraseña</label>
        <input type="password" id="inputPasswordUsuario">

        <label>Rol</label>
        <select id="inputRolUsuario">
          <option value="admin">Admin</option>
          <option value="tecnico">Técnico</option>
          <option value="operador">Operador</option>
          <option value="cliente">Cliente</option>
          <option value="visor">Visor</option>
        </select>

        <div class="modal-btns">
          <button id="btnGuardarUsuario" class="btn-success">Guardar</button>
          <button id="btnCancelarUsuario" class="btn-secondary">Cancelar</button>
        </div>
      </div>
    </div>
  `;

  cargarUsuarios();

  document.getElementById("btnNuevoUsuario").onclick = mostrarModalNuevo;
  document.getElementById("btnCancelarUsuario").onclick = cerrarModal;
  document.getElementById("btnGuardarUsuario").onclick = guardarUsuario;
}

async function cargarUsuarios() {
  const usuarios = await window.api.obtenerUsuarios();
  const tbody = document.getElementById("tablaUsuarios");
  tbody.innerHTML = "";

  usuarios.forEach(u => {
    let color = "🟢";
    if (u.estado === "suspendido") color = "🟠";
    if (u.estado === "baja") color = "🔴";

    const estado = `${color} ${u.estado.charAt(0).toUpperCase() + u.estado.slice(1)}`;

    const acciones = `
      <button class="btn-edit" onclick="editarUsuario(${u.id_usuario})">✏️</button>
      ${u.rol !== 'admin' ? `<button class="btn-delete" onclick="eliminarUsuario(${u.id_usuario})">🗑️</button>` : ""}
      <button class="btn-secondary" onclick="cambiarEstado(${u.id_usuario}, '${u.estado}')">🔁 Estado</button>
    `;

    const fila = `
      <tr>
        <td>${u.nombre} ${u.apellido}</td>
        <td>${u.email}</td>
        <td>${u.rol}</td>
        <td>${estado}</td>
        <td>${acciones}</td>
      </tr>
    `;

    tbody.innerHTML += fila;
  });
}

function mostrarModalNuevo() {
  document.getElementById("tituloModalUsuario").textContent = "➕ Crear Nuevo Usuario";
  document.getElementById("modalUsuario").classList.add("visible");
  limpiarCamposModal();
}

function cerrarModal() {
  document.getElementById("modalUsuario").classList.remove("visible");
}

function limpiarCamposModal() {
  document.getElementById("inputNombreUsuario").value = "";
  document.getElementById("inputApellidoUsuario").value = "";
  document.getElementById("inputEmailUsuario").value = "";
  document.getElementById("inputUsuarioLogin").value = "";
  document.getElementById("inputPasswordUsuario").value = "";
  document.getElementById("inputRolUsuario").value = "visor";
}

async function guardarUsuario() {
  const user = {
    nombre: document.getElementById("inputNombreUsuario").value,
    apellido: document.getElementById("inputApellidoUsuario").value,
    email: document.getElementById("inputEmailUsuario").value,
    usuario: document.getElementById("inputUsuarioLogin").value,
    password: document.getElementById("inputPasswordUsuario").value,
    rol: document.getElementById("inputRolUsuario").value
  };

  if (!user.nombre || !user.email || !user.usuario || !user.password)
    return alert("⚠️ Complete todos los campos obligatorios");

  await window.api.crearUsuario(user);
  cerrarModal();
  cargarUsuarios();
}

// 🔁 Cambiar estado (activo ↔ suspendido ↔ baja)
window.cambiarEstado = async (id, estadoActual) => {
  let nuevoEstado;
  if (estadoActual === "activo") nuevoEstado = "suspendido";
  else if (estadoActual === "suspendido") nuevoEstado = "baja";
  else nuevoEstado = "activo";

  await window.api.cambiarEstadoUsuario(id, nuevoEstado);
  cargarUsuarios();
};

window.editarUsuario = async (id) => {
  const usuarios = await window.api.obtenerUsuarios();
  const u = usuarios.find(x => x.id_usuario === id);

  document.getElementById("tituloModalUsuario").textContent = "✏️ Editar Usuario";
  document.getElementById("inputNombreUsuario").value = u.nombre;
  document.getElementById("inputApellidoUsuario").value = u.apellido;
  document.getElementById("inputEmailUsuario").value = u.email;
  document.getElementById("inputUsuarioLogin").value = u.usuario;
  document.getElementById("inputRolUsuario").value = u.rol;

  document.getElementById("modalUsuario").classList.add("visible");
  document.getElementById("btnGuardarUsuario").onclick = () => actualizarUsuario(id);
};

window.eliminarUsuario = async (id) => {
  if (!confirm("¿Seguro que deseas eliminar este usuario?")) return;
  await window.api.eliminarUsuario(id);
  cargarUsuarios();
};

window.actualizarUsuario = async (id) => {
  const data = {
    id,
    nombre: document.getElementById("inputNombreUsuario").value,
    apellido: document.getElementById("inputApellidoUsuario").value,
    email: document.getElementById("inputEmailUsuario").value,
    usuario: document.getElementById("inputUsuarioLogin").value,
    rol: document.getElementById("inputRolUsuario").value,
    password: document.getElementById("inputPasswordUsuario").value || null
  };

  await window.api.actualizarUsuario(data);
  cerrarModal();
  cargarUsuarios();
};
