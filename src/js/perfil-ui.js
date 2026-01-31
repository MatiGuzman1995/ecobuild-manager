export async function mostrarPerfil() {
  const contenido = document.getElementById("contenido");

  const usuarioLogueado = JSON.parse(localStorage.getItem("usuario"));
  if (!usuarioLogueado) return;

  // ✅ Obtenemos datos actualizados desde DB (por si hubo cambios antes)
  const usuarios = await window.api.obtenerUsuarios();
  const userDb = usuarios.find(u => u.id_usuario === usuarioLogueado.id);

  contenido.innerHTML = `
    <h2>Mi Perfil 👤</h2>
    <div class="perfil-box">

      <label>Nombre</label>
      <input id="perfilNombre" value="${userDb.nombre}" />

      <label>Apellido</label>
      <input id="perfilApellido" value="${userDb.apellido}" />

      <label>Usuario</label>
      <input id="perfilUsuario" value="${userDb.usuario}" readonly style="background:#eee;">

      <label>Email</label>
      <input id="perfilEmail" value="${userDb.email ?? ''}" />

      <label>Nueva contraseña (opcional)</label>
      <input id="perfilPass1" type="password" placeholder="********">

      <label>Confirmar contraseña</label>
      <input id="perfilPass2" type="password" placeholder="********">

      <button id="guardarPerfil" class="btn-primary">Guardar cambios</button>
    </div>
  `;

  document.getElementById("guardarPerfil").addEventListener("click", async () => {
    await guardarCambiosPerfil(userDb.id_usuario);
  });
}

async function guardarCambiosPerfil(id) {
  const nombre = document.getElementById("perfilNombre").value.trim();
  const apellido = document.getElementById("perfilApellido").value.trim();
  const email = document.getElementById("perfilEmail").value.trim();
  const pass1 = document.getElementById("perfilPass1").value.trim();
  const pass2 = document.getElementById("perfilPass2").value.trim();

  // ✅ Validar contraseña si la carga
  if (pass1 !== "" && pass1 !== pass2) {
    return Swal.fire("Error", "Las contraseñas no coinciden", "error");
  }

  // ✅ Si no quiere cambiar contraseña → pasamos null
  const data = {
    id,
    nombre,
    apellido,
    email,
    password: pass1 ? pass1 : null
  };

  const result = await window.api.actualizarPerfilUsuario(data);


  if (!result) {
    return Swal.fire("Error", "No se pudo actualizar el perfil", "error");
  }

  Swal.fire("Éxito", "Perfil actualizado correctamente", "success");

  // ✅ Actualizar sesión en LocalStorage
  const usuarioActual = JSON.parse(localStorage.getItem("usuario"));
  usuarioActual.nombre = `${nombre} ${apellido}`;
  localStorage.setItem("usuario", JSON.stringify(usuarioActual));

  // ✅ Refrescar nombre en topbar
  document.getElementById("userInfo").textContent =
    `${usuarioActual.nombre} | ${usuarioActual.rol}`;
}

