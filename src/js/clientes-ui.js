console.log("📋 Módulo Clientes (ABM) cargado");

// ====== ESTADO GLOBAL ======
let estado = {
  clientes: [],
  filtro: "",
};

// === FUNCIÓN PRINCIPAL ===
export async function mostrarClientes() {
  console.log("🟢 Entrando a módulo CLIENTES");

  const cont = document.getElementById("contenido");
  if (!cont) {
    console.error("❌ No existe el contenedor #contenido");
    return;
  }

  // 🔄 Siempre regeneramos el contenido al entrar
  cont.innerHTML = `
    <h2>Gestión de Clientes</h2>

    <div class="buscador">
      <select id="cmbBuscarPor">
        <option>Mostrar Todos</option>
        <option>Nombre</option>
        <option>Apellido</option>
        <option>Razón Social</option>
        <option>DNI</option>
        <option>CUIT</option>
      </select>
      <input type="text" id="txtBuscar" placeholder="🔎 Buscar cliente...">
      <small id="contadorResultados" style="display:block;margin-top:6px;opacity:.8"></small>
    </div>

 <form id="formCliente" class="form-abm">

  <input type="hidden" id="id_cliente">

  <label class="check-empresa">
    <input type="checkbox" id="chkEmpresa"> Es Empresa
  </label>

  <!-- FORMULARIO PERSONA -->
  <div id="formPersona" class="subform">
    <input type="text" id="apellido" placeholder="Apellido" required>
    <input type="text" id="nombre" placeholder="Nombre" required>
    <input type="text" id="dni" placeholder="DNI" required>
  </div>

  <!-- FORMULARIO EMPRESA -->
  <div id="formEmpresa" class="subform" style="display:none">
    <input type="text" id="razon_social" placeholder="Razón Social" >
    <input type="text" id="cuit" placeholder="CUIT" >
  </div>

  <!-- CONTACTO -->
  <div id="formContacto" class="subform">
    <input type="email" id="email" placeholder="Email" required>
    <input type="text" id="telefono" placeholder="Teléfono" required>
  </div>

  <div class="form-buttons">
    <button type="submit" class="btn-primary">Guardar</button>
    <button type="button" id="btnCancelar" class="btn-secundario">Cancelar</button>
  </div>

</form>





   <table class="tabla-clientes">
  <thead>
    <tr>
      <th>ID</th>
      <th>Tipo</th>
      <th>Nombre / Razón Social</th>
      <th>DNI / CUIT</th>   <!-- ✅ AGREGADO -->
      <th>Email</th>
      <th>Teléfono</th>
      <th>Acciones</th>
    </tr>
  </thead>
  <tbody id="tbodyClientes"></tbody>
</table>

  `;


  // === Referencias ===
  const form = document.getElementById("formCliente");
  const btnCancelar = document.getElementById("btnCancelar");
  const txtBuscar = document.getElementById("txtBuscar");
  const cmbBuscarPor = document.getElementById("cmbBuscarPor");
  const tbody = document.getElementById("tbodyClientes");
  const chkEmpresa = document.getElementById("chkEmpresa");

  // Manejo de checkbox Empresa (habilita/deshabilita campos)
  // Manejo checkbox Empresa
chkEmpresa.addEventListener("change", () => {
  const isEmpresa = chkEmpresa.checked;

  document.getElementById("formPersona").style.display = isEmpresa ? "none" : "grid";
  document.getElementById("formEmpresa").style.display = isEmpresa ? "grid" : "none";

  document.getElementById("apellido").required = !isEmpresa;
  document.getElementById("nombre").required = !isEmpresa;
  document.getElementById("dni").required = !isEmpresa;
  document.getElementById("razon_social").required = isEmpresa;
  document.getElementById("cuit").required = isEmpresa;
});

  // === Cargar clientes ===
  await recargarClientes();
  aplicarFiltro();

  // === Buscar en tiempo real ===
  txtBuscar.addEventListener("input", () => {
    estado.filtro = txtBuscar.value.toLowerCase();
    aplicarFiltro(cmbBuscarPor.value);
  });
  cmbBuscarPor.addEventListener("change", () => {
    aplicarFiltro(cmbBuscarPor.value);
  });

  // === Guardar / actualizar ===
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const isEmpresa = chkEmpresa.checked;
    const data = {
  Apellido: isEmpresa ? null : form.apellido.value.trim(),
  Nombre: isEmpresa ? null : form.nombre.value.trim(),
  DNI: isEmpresa ? null : form.dni.value.trim(),
  RazonSocial: isEmpresa ? form.razon_social.value.trim() : null,
  CUIT: isEmpresa ? form.cuit.value.trim() : null,
  Email: form.email.value.trim(),
  Telefono: form.telefono.value.trim(),
  Empresa: isEmpresa ? 1 : 0,
};

    


    const id = form.id_cliente.value;
    try {
      if (id) {
        await window.api.actualizarCliente(Number(id), data);
        alert("✅ Cliente actualizado");
      } else {
        await window.api.agregarCliente(data);
        alert("✅ Cliente agregado");
      }
      form.reset();
      chkEmpresa.checked = false; // Reset checkbox
      await recargarClientes();
      aplicarFiltro();
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    }
  });

  // === Cancelar ===
  btnCancelar.addEventListener("click", () => {
    form.reset();
    chkEmpresa.checked = false;
  });

  // === Acciones en tabla ===
  tbody.addEventListener("click", async (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const tr = e.target.closest("tr");
    if (!tr) return;

    const id = Number(tr.dataset.id);

   if (btn.classList.contains("btn-editar")) {
  const cliente = estado.clientes.find(c => c.ID_cliente === id);
  if (!cliente) return;

  form.id_cliente.value = id;
  chkEmpresa.checked = cliente.Empresa;

  // Mostrar / ocultar bloques
// Aplicar cambio visual como si se clickeó el checkbox
chkEmpresa.dispatchEvent(new Event("change"));


  // Datos comunes
  form.email.value = cliente.Email || "";
  form.telefono.value = cliente.Telefono || "";

  // Empresa o Persona
  if (cliente.Empresa) {
    form.razon_social.value = cliente.RazonSocial || "";
    form.cuit.value = cliente.CUIT || "";
  } else {
    form.apellido.value = cliente.Apellido || "";
    form.nombre.value = cliente.Nombre || "";
    form.dni.value = cliente.DNI || "";
  }

  form.apellido.focus();
}

    if (btn.classList.contains("btn-eliminar")) {
      if (confirm("¿Seguro que querés eliminar este cliente?")) {
        await window.api.eliminarCliente(id);
        alert("🗑️ Cliente eliminado");
        await recargarClientes();
        aplicarFiltro();
      }
    }
  });
}

// ====== FUNCIONES AUXILIARES ======
async function recargarClientes() {
  try {
    estado.clientes = await window.api.obtenerClientes();
  } catch (error) {
    console.error("❌ Error al obtener clientes:", error);
    estado.clientes = [];
  }
}
function aplicarFiltro(campo = "Mostrar Todos") {
  const filtro = estado.filtro;
  let lista = estado.clientes;

  if (campo !== "Mostrar Todos" && filtro) {
    lista = lista.filter(c => {
      let valor = "";
      switch (campo) {
        case "Nombre": valor = c.Nombre; break;
        case "Apellido": valor = c.Apellido; break;
        case "Razón Social": valor = c.RazonSocial; break;
        case "DNI": valor = c.DNI; break;
        case "CUIT": valor = c.CUIT; break;
      }
      return (valor || "").toString().toLowerCase().includes(filtro);
    });
  } else {
    // ✅ Búsqueda libre (busca en todo)
    lista = lista.filter(c =>
      `${c.Apellido} ${c.Nombre} ${c.RazonSocial} ${c.DNI} ${c.CUIT} ${c.Email} ${c.Telefono}`
        .toLowerCase()
        .includes(filtro)
    );
  }

  renderTabla(lista);
  actualizarContador(lista.length, estado.clientes.length);
}


function renderTabla(lista) {
  const tbody = document.getElementById("tbodyClientes");
  if (!tbody) {
    console.warn("⚠️ tbodyClientes no encontrado");
    return;
  }

  tbody.innerHTML = "";

  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="6">No se encontraron resultados</td></tr>`;
    return;
  }

 const rows = lista.map(c => `
<tr data-id="${c.ID_cliente}">
  <td>${c.ID_cliente}</td>
  <td>${c.Empresa ? "Empresa" : "Persona"}</td>

  <td>
    ${c.Empresa 
      ? esc(c.RazonSocial || "")
      : `${esc(c.Apellido || "")}, ${esc(c.Nombre || "")}`}
  </td>

  <td>
    ${c.Empresa 
      ? (c.CUIT ? esc(c.CUIT) : "-")
      : (c.DNI ? esc(c.DNI) : "-")}
  </td>

  <td>${esc(c.Email) || "-"}</td>
  <td>${esc(c.Telefono) || "-"}</td>

  <td>
    <button class="btn-editar">✏️</button>
    <button class="btn-eliminar">🗑️</button>
  </td>
</tr>
`).join("");


  tbody.innerHTML = rows;
}

function actualizarContador(vistos, total) {
  const small = document.getElementById("contadorResultados");
  if (small) {
    small.textContent = `Mostrando ${vistos} de ${total} clientes`;
  }
}

function esc(v) {
  if (v == null) return "";
  return String(v).replace(/[&<>"']/g, (s) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[s]));
}