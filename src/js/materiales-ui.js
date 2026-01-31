export async function mostrarMateriales() {
  const contenido = document.getElementById("contenido");

  contenido.innerHTML = `
    <div class="header-flex">
      <h2>📦 Gestión de Materiales</h2>
      <button id="btnNuevoMaterial" class="btn-primary">➕ Nuevo Material</button>
    </div>

    <div class="toolbar">
      <input type="text" id="buscarMaterial" placeholder="🔍 Buscar...">
    </div>

    <table class="tabla">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Descripción</th>
          <th>Unidad</th>
          <th>Precio</th>
          <th>Tipo</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody id="listaMateriales"></tbody>
    </table>
  `;

  cargarMateriales();
  document.getElementById("btnNuevoMaterial").addEventListener("click", () => abrirModal());
  document.getElementById("btnCerrarModal").addEventListener("click", cerrarModal);
  document.getElementById("buscarMaterial").addEventListener("input", filtrarMateriales);
}

/* ===== FUNCIONES UI ===== */

async function cargarMateriales() {
  const materiales = await window.api.obtenerMateriales();
  window._listaMateriales = materiales;
  renderTabla(materiales);
}

function renderTabla(data) {
  const tbody = document.getElementById("listaMateriales");
  tbody.innerHTML = "";

  data.forEach(mat => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${mat.nombre}</td>
      <td>${mat.descripcion ?? '-'}</td> 
      <td>${mat.unidad}</td>
      <td>$${Number(mat.precio_unitario).toFixed(2)}</td>
      <td>${mat.tipo ?? '-'}</td>
      <td>
        <button class="btn-edit" data-id="${mat.id_material}">✏️</button>
        <button class="btn-del" data-id="${mat.id_material}">🗑️</button>
      </td>
    `;

    tbody.appendChild(tr);
  });

  document.querySelectorAll(".btn-edit").forEach(btn =>
    btn.addEventListener("click", e => editarMaterial(e.target.dataset.id))
  );

  document.querySelectorAll(".btn-del").forEach(btn =>
    btn.addEventListener("click", e => eliminarMaterial(e.target.dataset.id))
  );
}

/* ===== MODAL ===== */

let editId = null;

function abrirModal(material = null) {
  editId = material?.id_material ?? null;

  document.getElementById("modalMaterial").classList.remove("oculto");
  document.getElementById("modalTitulo").innerText = material ? "Editar Material" : "Nuevo Material";

  document.getElementById("matNombre").value = material?.nombre ?? "";
  document.getElementById("matDesc").value = material?.descripcion ?? "";
  document.getElementById("matUnidad").value = material?.unidad ?? "";
  document.getElementById("matPrecio").value = material?.precio_unitario ?? "";
  document.getElementById("matTipo").value = material?.tipo ?? "";

  document.getElementById("btnGuardarMat").onclick = guardarMaterial;
}

function cerrarModal() {
  document.getElementById("modalMaterial").classList.add("oculto");
  document.getElementById("matNombre").value = "";
  document.getElementById("matDesc").value = "";
  document.getElementById("matUnidad").value = "";
  document.getElementById("matPrecio").value = "";
  document.getElementById("matTipo").value = "";
  editId = null;
}

/* ===== CRUD ===== */

async function guardarMaterial() {
  const nombre = document.getElementById("matNombre").value.trim();
  const descripcion = document.getElementById("matDesc").value.trim();
  const unidad = document.getElementById("matUnidad").value.trim();
  const precio = Number(document.getElementById("matPrecio").value);
  const tipo = document.getElementById("matTipo").value.trim();

  if (!nombre || !descripcion || !unidad || !tipo || isNaN(precio)) {
    return alert("⚠️ Todos los campos son obligatorios.");
  }

  if (descripcion.length > 120) {
    return alert("⚠️ La descripción no puede superar los 120 caracteres.");
  }

  if (precio <= 0) {
    return alert("⚠️ El precio debe ser mayor a 0.");
  }

  const data = { nombre, descripcion, unidad, precio_unitario: precio, tipo };

  if (editId) {
    await window.api.actualizarMaterial(Number(editId), data);
  } else {
    await window.api.agregarMaterial(data);
  }

  cerrarModal();
  cargarMateriales();
}

async function editarMaterial(id) {
  const item = window._listaMateriales.find(m => m.id_material == id);
  if (!item) return alert("❌ Material no encontrado");
  abrirModal(item);
}

async function eliminarMaterial(id) {
  if (!id || isNaN(Number(id))) {
    return alert("Error: ID inválido.");
  }

  if (!confirm("¿Eliminar material?")) return;

  await window.api.eliminarMaterial(Number(id));
  cargarMateriales();
}

/* ===== FILTRO ===== */

function normalizar(texto) {
  return texto?.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function filtrarMateriales(e) {
  const palabras = normalizar(e.target.value).split(" ").filter(Boolean);

  const filtrado = window._listaMateriales.filter(m => {
    const nombre = normalizar(m.nombre);
    const desc = normalizar(m.descripcion);
    const tipo = normalizar(m.tipo);
    const unidad = normalizar(m.unidad);

    return palabras.every(p =>
      nombre.includes(p) || desc.includes(p) || tipo.includes(p) || unidad.includes(p)
    );
  });

  renderTabla(filtrado);
}

/* ===== CONTROLES ===== */

document.getElementById("btnCerrarX").addEventListener("click", cerrarModal);

document.getElementById("modalMaterial").addEventListener("click", e => {
  if (e.target.id === "modalMaterial") cerrarModal();
});

document.addEventListener("keydown", e => {
  const modal = document.getElementById("modalMaterial");
  if (e.key === "Escape" && !modal.classList.contains("oculto")) cerrarModal();
});
