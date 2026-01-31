console.log("💰 Módulo Presupuestos cargado");

let presupuestos = [];

// Función para aumentar el tamaño de Swal (de nuevo-ui)
function aumentarSwal() {
  const style = document.createElement("style");
  style.textContent = `
    .swal2-popup {
      width: 700px !important;
      max-width: 95vw;
      font-size: 1rem !important;
    }
    .cliente-card, .proy-card, .mat-card {
      font-size: 15px !important;
      padding: 14px !important;
    }
    .swal-input-custom {
      font-size: 15px !important;
      padding: 10px !important;
    }
  `;
  document.head.appendChild(style);
}

export async function mostrarPresupuestos() {
  const contenido = document.getElementById("contenido");

  contenido.innerHTML = `
    <div class="presupuesto-header">
      <h2>📑 Gestión de Presupuestos</h2>

      <div class="toolbar">
        <input type="text" id="inputBuscarPresupuesto" placeholder="🔍 Buscar por cliente, proyecto o CUIT...">
        <button id="btnNuevoPresupuesto" class="btn-primary">➕ Nuevo Presupuesto</button>
      </div>
    </div>

    <div class="stats">
      <div class="stat-card">
        <span class="stat-title">Total</span>
        <span id="statTotal" class="stat-value">0</span>
      </div>
      <div class="stat-card green">
        <span class="stat-title">Aprobados</span>
        <span id="statAprobados" class="stat-value">0</span>
      </div>
      <div class="stat-card yellow">
        <span class="stat-title">Pendientes</span>
        <span id="statPendientes" class="stat-value">0</span>
      </div>
    </div>

    <div class="tabla-wrapper">
      <table class="tabla-presupuestos">
        <thead>
          <tr>
            <th>#</th>
            <th>Cliente</th>
            <th>DNI/CUIT</th>
            <th>Proyecto</th>
            <th>Monto (ARS)</th>
            <th>Estado</th>
            <th>Fecha</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody id="tbodyPresupuestos"></tbody>
      </table>
    </div>
  `;

  document.getElementById("btnNuevoPresupuesto").addEventListener("click", mostrarNuevoPresupuesto);

  document.getElementById("inputBuscarPresupuesto").addEventListener("input", filtrarPresupuestos);

  await cargarPresupuestos();
  renderizarPresupuestos();
}


// === Cargar data ===
async function cargarPresupuestos() {
  try {
    presupuestos = await window.api.obtenerPresupuestos?.() || [];
  } catch (err) {
    console.error("❌ Error al obtener presupuestos:", err);
    presupuestos = [];
  }
}


// === Buscar ===
function filtrarPresupuestos(e) {
  const term = e.target.value.toLowerCase();
  const filtrados = presupuestos.filter(p =>
    `${p.Apellido || ""} ${p.Nombre || ""} ${p.RazonSocial || ""} ${p.CUIT || ""} ${p.DNI || ""} ${p.nombre || ""}`
      .toLowerCase()
      .includes(term)
  );
  renderizarPresupuestos(filtrados);
}


// === Render ===
function renderizarPresupuestos(lista = presupuestos) {
  const tbody = document.getElementById("tbodyPresupuestos");
  tbody.innerHTML = "";

  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="8">No hay presupuestos registrados</td></tr>`;
    return;
  }

  document.getElementById("statTotal").textContent = lista.length;
  document.getElementById("statAprobados").textContent = lista.filter(p => p.aprobado).length;
  document.getElementById("statPendientes").textContent = lista.filter(p => !p.aprobado).length;

  lista.forEach(p => {
    console.log("Objeto presupuesto en lista:", p); // Debug para ver keys de p
    const isEmpresa = p.Empresa === 1 || !!p.RazonSocial; // Determinar si es empresa
    const clienteNombre = isEmpresa ? (p.RazonSocial || "") : `${p.Apellido || ""} ${p.Nombre || ""}`;
    const docId = isEmpresa ? (p.CUIT || "-") : (p.DNI || "-");
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.id_presupuesto}</td>
      <td>${clienteNombre}</td>
      <td>${docId}</td>
      <td>${p.nombre || "Sin proyecto"}</td>
      <td>$ ${p.monto.toLocaleString("es-AR")}</td>
      <td>
        <span class="tag ${p.aprobado ? "aprobado" : "pendiente"}">
          ${p.aprobado ? "Aprobado ✅" : "En revisión ⏳"}
        </span>
      </td>
      <td>${p.fecha_emision ? new Date(p.fecha_emision).toLocaleDateString("es-AR") : "-"}</td>
      <td class="acciones">
        <button class="btn-icon ver" data-id="${p.id_presupuesto}">👁️</button>
        <button class="btn-icon imprimir" data-id="${p.id_presupuesto}">🖨️</button>
        <button class="btn-icon toggle" data-id="${p.id_presupuesto}">
          ${p.aprobado ? "✅" : "⏳"}
        </button>
        <button class="btn-icon eliminar" data-id="${p.id_presupuesto}">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // === Acciones ===
  tbody.addEventListener("click", async (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const id = btn.dataset.id;
    const p = presupuestos.find(p => p.id_presupuesto == id);

    if (btn.classList.contains("ver")) {
      verDetallePresupuesto(id, p);
    }

    if (btn.classList.contains("imprimir")) {
      generarPDFPresupuesto(id, p);
    }

    if (btn.classList.contains("toggle")) {
      const nuevoEstado = p.aprobado ? "pendiente" : "aprobado";
      await window.api.aprobarPresupuesto(id, nuevoEstado);
      await cargarPresupuestos();
      renderizarPresupuestos();
    }

    if (btn.classList.contains("eliminar")) {
      if (confirm("¿Eliminar presupuesto?")) {
        await window.api.eliminarPresupuesto(id);
        await cargarPresupuestos();
        renderizarPresupuestos();
      }
    }
  });
}


// === Detalle ===
async function verDetallePresupuesto(id, p) {
  const detalles = await window.api.obtenerDetallePresupuesto(id);
  let pr = null;
  if (p.id_proyecto) {
    pr = await window.api.obtenerProyectoPorId(p.id_proyecto);
  }
  console.log("Objeto presupuesto en detalle:", p); // Debug
  console.log("Objeto proyecto en detalle:", pr); // Debug

  const isEmpresa = p.Empresa === 1 || !!p.RazonSocial;
  const clienteNombre = isEmpresa ? (p.RazonSocial || "") : `${p.Apellido || ""} ${p.Nombre || ""}`;
  const docId = isEmpresa ? (p.CUIT || "-") : (p.DNI || "-");
  let html = `
    <h3>Presupuesto #${id}</h3>
    <p>Cliente: ${clienteNombre}</p>
    <p>DNI/CUIT: ${docId}</p>
    <p>Proyecto: ${p.nombre || "Sin proyecto"}</p>
    <p>Mano de obra: $ ${p.mano_obra || 0}</p>
    <table>
      <thead>
        <tr>
          <th>Material</th>
          <th>Cant.</th>
          <th>Precio</th>
          <th>Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${detalles.map(d => `
          <tr>
            <td>${d.material_nombre || d.descripcion}</td>
            <td>${d.cantidad}</td>
            <td>$ ${d.precio_unitario}</td>
            <td>$ ${d.subtotal}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
    <p>Total: $ ${p.monto}</p>
  `;

  Swal.fire({
    title: "Detalle",
    html,
    width: 600
  });
}


// === PDF ===
async function generarPDFPresupuesto(id, p) {
  const detalles = await window.api.obtenerDetallePresupuesto(id);
  let pr = null;
  if (p.id_proyecto) {
    pr = await window.api.obtenerProyectoPorId(p.id_proyecto);
  }
  console.log("Objeto presupuesto en PDF:", p); // Debug
  console.log("Objeto proyecto en PDF:", pr); // Debug

  let subtotal = detalles.reduce((acc, d) => acc + (d.cantidad * d.precio_unitario), 0) + (p.mano_obra || 0);
  let iva = subtotal * 0.21;

  const body = [
    [
      { text: "Material", bold: true },
      { text: "Cantidad", bold: true, alignment: "center" },
      { text: "Precio Unit.", bold: true, alignment: "right" },
      { text: "Subtotal", bold: true, alignment: "right" }
    ]
  ];

  detalles.forEach(d => {
    const materialNombre = d.material_nombre || d.descripcion || d.nombre || `Material ${d.id_material}`;
    body.push([
      materialNombre,
      { text: d.cantidad, alignment: "center" },
      { text: `$ ${Number(d.precio_unitario).toLocaleString("es-AR")}`, alignment: "right" },
      { text: `$ ${(d.cantidad * d.precio_unitario).toLocaleString("es-AR")}`, alignment: "right" }
    ]);
  });

  const isEmpresa = p.Empresa === 1 || !!p.RazonSocial;
  const clienteNombre = isEmpresa ? (p.RazonSocial || "") : `${p.Apellido || ""} ${p.Nombre || ""}`;
  const docId = isEmpresa ? (p.CUIT || "-") : (p.DNI || "-");
  const docDefinition = {
    content: [
      {
        columns: [
          { text: "Terra-C · EcoBuild Manager", style: "brand" },
          { text: `Presupuesto #${id}`, style: "header", alignment: "right" }
        ]
      },
      { text: `Fecha: ${new Date().toLocaleDateString("es-AR")}`, alignment: "right", margin: [0, -6, 0, 12] },

      { text: `Cliente: ${clienteNombre}`, style: "subheader" },
      { text: `DNI/CUIT: ${docId}` },
      { text: `Proyecto: ${p.nombre || "Sin proyecto"}` },
      { text: " ", margin: [0, 4] },

      {
        table: {
          headerRows: 1,
          widths: ["*", 70, 90, 90],
          body
        },
        layout: "lightHorizontalLines"
      },

      { text: `\nMano de obra: $ ${p.mano_obra?.toLocaleString("es-AR") || "0"}`, alignment: "right" },
      
      { text: `Subtotal: $ ${subtotal.toLocaleString("es-AR")}`, alignment: "right" },
      { text: `IVA (21%): $ ${iva.toLocaleString("es-AR")}`, alignment: "right" },
      { text: `TOTAL: $ ${p.monto.toLocaleString("es-AR")}`, style: "total" },
      { text: "\nNota: Este presupuesto tiene una validez de 14 días.", italics: true, alignment: "center", margin: [0,10,0,0] },

      { text: "\nGracias por confiar en Terra-C 🌿", italics: true, alignment: "center" },
      { text: "contacto@terrac.com · +54 351 000 000 · Córdoba, AR", fontSize: 9, alignment: "center" }
    ],
    styles: {
      brand: { fontSize: 12, bold: true, color: "#1b5e20" },
      header: { fontSize: 20, bold: true },
      subheader: { fontSize: 12, bold: true },
      total: { fontSize: 16, bold: true, alignment: "right" }
    },
    defaultStyle: { fontSize: 10 }
  };

  window.pdfMake.createPdf(docDefinition).open();
}


// === Exportar Excel ===
XLSX.utils.json_to_sheet;


function exportarPresupuestosExcel() {
  const data = presupuestos.map(p => ({
    ID: p.id_presupuesto,
    Cliente: `${p.Apellido || ""} ${p.Nombre || ""}`,
    CUIT: p.CUIT || "-",
    Proyecto: p.nombre,
    ManoObra: p.mano_obra,
    Margen: p.margen + "%",
    Monto: p.monto,
    Estado: p.aprobado ? "Aprobado" : "Pendiente",
    Fecha: p.fecha_emision
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Presupuestos");
  XLSX.writeFile(wb, "presupuestos_terrac.xlsx");
}

// Función para mostrar nuevo presupuesto (de nuevo-ui, adaptada)
async function mostrarNuevoPresupuesto() {
  const contenido = document.getElementById("contenido");

  const clientes = await window.api.obtenerClientes?.();
  const materiales = await window.api.obtenerMateriales?.();
  const proyectos = await window.api.obtenerProyectos?.();

  let clienteSeleccionado = null;
  let proyectoSeleccionado = null;
  let filas = [];

  contenido.innerHTML = `
  <div class="presupuesto-nuevo-container">

    <div class="header-flex">
      <h2>🧾 Nuevo Presupuesto</h2>
      <button id="cancelarPresupuesto" class="btn-secondary">⬅ Volver</button>
    </div>

    <!-- DATOS BÁSICOS -->
   <div class="presupuesto-card">

      <h3>📌 Datos del Presupuesto</h3>

      <div class="cliente-box">
        👤 Cliente:
        <strong><span id="clienteSeleccionadoText">No seleccionado</span></strong>
        <button id="btnElegirCliente" class="btn-link">Seleccionar</button>
        <div id="clienteInfo" class="info-mini hidden"></div>
      </div>

      <div class="cliente-box" style="margin-top:6px;">
        🏗 Proyecto:
        <strong><span id="proyectoSeleccionadoText">No seleccionado</span></strong>
        <button id="btnElegirProyecto" class="btn-link" disabled>Seleccionar</button>
        <div id="proyectoInfoBox" class="info-mini hidden"></div>
      </div>
    </div>

    <!-- TABLA MATERIALES -->
   <div class="presupuesto-card">

      <h3>🌱 Materiales</h3>

      <table class="tabla materiales-table">
        <thead>
          <tr>
            <th>Cant.</th>
            <th>Material</th>
            <th>Precio</th>
            <th>Subtotal</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="tbodyMateriales"></tbody>
      </table>

      <button id="btnAgregarFila" class="btn-secondary" style="margin-top:10px;">
        ➕ Agregar material
      </button>
    </div>

    <!-- TOTALES -->
    <div class="totales-bar">
    <div class="campo">
  <label>Mano de obra (ARS)</label>
  <input 
  type="number" 
  id="inputManoObra" 
  class="form-input"
  placeholder="Ingresar monto"
  step="0.01"
  min="0"
  inputmode="decimal"
  oninput="this.value = this.value.replace(/[^0-9.]/g, '')"
/>

</div>



      <div><strong>Subtotal:</strong> <span id="subtotal">$ 0.00</span></div>
      <div><strong>IVA (21%):</strong> <span id="iva">$ 0.00</span></div>
      <div class="total-tag"><strong>Total:</strong> <span id="total">$ 0.00</span></div>
    </div>

    <!-- GUARDAR -->
    <button id="guardarPresupuesto" class="btn-save">💾 Guardar Presupuesto</button>
  </div>
  `;

  // Volver a lista
  document.getElementById("cancelarPresupuesto").addEventListener("click", mostrarPresupuestos);

  // ========================
  // CLIENTE
  // ========================
  document.getElementById("btnElegirCliente").onclick = async () => {

    let filtro = "";

    function renderClientes(filtrados = clientes) {
      return filtrados.map(c => {
        const display = c.Empresa ? `${c.RazonSocial} (CUIT: ${c.CUIT})` : `${c.Apellido}, ${c.Nombre} (DNI: ${c.DNI})`;
        return `<div class="cliente-card" data-id="${c.ID_cliente}">
          <strong>${display}</strong><br>
          Email: ${c.Email} | Tel: ${c.Telefono}
        </div>`;
      }).join("");
    }

    const { value: idCliente } = await Swal.fire({
      title: "Seleccionar Cliente",
      html: `
        <input id="swal-input1" class="swal-input-custom" placeholder="Buscar cliente...">
        <div id="listaClientesSwal" style="max-height:300px; overflow-y:auto; margin-top:10px;">
          ${renderClientes()}
        </div>
      `,
      focusConfirm: false,
      preConfirm: () => {
        const selected = document.querySelector(".cliente-card.selected");
        return selected ? selected.dataset.id : null;
      },
      didOpen: () => {
        aumentarSwal();
        const input = document.getElementById("swal-input1");
        const lista = document.getElementById("listaClientesSwal");
        let idx = -1;

        function filtrar() {
          filtro = input.value.toLowerCase();
          return clientes.filter(c => {
            const display = c.Empresa ? c.RazonSocial : `${c.Apellido} ${c.Nombre}`;
            return display.toLowerCase().includes(filtro);
          });
        }

        function render() {
          const arr = filtrar();
          lista.innerHTML = renderClientes(arr);
          if (idx >= 0 && idx < arr.length) {
            lista.children[idx].classList.add("selected");
            lista.children[idx].scrollIntoView({ block: "nearest" });
          }
        }

        input.addEventListener("input", render);
        input.addEventListener("keydown", e => {
          const arr = filtrar();
          if (e.key === "ArrowDown") { idx = (idx + 1) % arr.length; render(); }
          if (e.key === "ArrowUp") { idx = (idx - 1 + arr.length) % arr.length; render(); }
          if (e.key === "Enter" && arr[idx]) Swal.clickConfirm();
        });

        lista.addEventListener("click", e => {
          const card = e.target.closest(".cliente-card");
          if (card) {
            idx = Array.from(lista.children).indexOf(card);
            render();
            Swal.clickConfirm();
          }
        });
      }
    });

    if (idCliente) {
      clienteSeleccionado = clientes.find(c => c.ID_cliente == idCliente);
      document.getElementById("clienteSeleccionadoText").textContent = clienteSeleccionado.Empresa ? clienteSeleccionado.RazonSocial : `${clienteSeleccionado.Apellido}, ${clienteSeleccionado.Nombre}`;
      document.getElementById("clienteInfo").innerHTML = `Email: ${clienteSeleccionado.Email}<br>Tel: ${clienteSeleccionado.Telefono}`;
      document.getElementById("clienteInfo").classList.remove("hidden");

      // Habilitar selección de proyecto
      document.getElementById("btnElegirProyecto").disabled = false;
    }
  };

  // ========================
  // PROYECTO
  // ========================
  document.getElementById("btnElegirProyecto").onclick = async () => {
    if (!clienteSeleccionado) return;

    let filtro = "";

    const proysCliente = proyectos.filter(p => p.ID_cliente == clienteSeleccionado.ID_cliente);

    function renderProyectos(filtrados = proysCliente) {
      return filtrados.map(pr => `
        <div class="proy-card" data-id="${pr.ID_proyecto}">
          <strong>${pr.NombreProyecto}</strong><br>
          ${pr.Metros_Cuadrados} m² | ${pr.Provincia}, ${pr.Localidad}
        </div>
      `).join("");
    }

    const { value: idProyecto } = await Swal.fire({
      title: "Seleccionar Proyecto",
      html: `
        <input id="swal-input2" class="swal-input-custom" placeholder="Buscar proyecto...">
        <div id="listaProyectosSwal" style="max-height:300px; overflow-y:auto; margin-top:10px;">
          ${renderProyectos()}
        </div>
      `,
      focusConfirm: false,
      preConfirm: () => {
        const selected = document.querySelector(".proy-card.selected");
        return selected ? selected.dataset.id : null;
      },
      didOpen: () => {
        aumentarSwal();
        const input = document.getElementById("swal-input2");
        const lista = document.getElementById("listaProyectosSwal");
        let idx = -1;

        function filtrar() {
          filtro = input.value.toLowerCase();
          return proysCliente.filter(pr => pr.NombreProyecto.toLowerCase().includes(filtro));
        }

        function render() {
          const arr = filtrar();
          lista.innerHTML = renderProyectos(arr);
          if (idx >= 0 && idx < arr.length) {
            lista.children[idx].classList.add("selected");
            lista.children[idx].scrollIntoView({ block: "nearest" });
          }
        }

        input.addEventListener("input", render);
        input.addEventListener("keydown", e => {
          const arr = filtrar();
          if (e.key === "ArrowDown") { idx = (idx + 1) % arr.length; render(); }
          if (e.key === "ArrowUp") { idx = (idx - 1 + arr.length) % arr.length; render(); }
          if (e.key === "Enter" && arr[idx]) Swal.clickConfirm();
        });

        lista.addEventListener("click", e => {
          const card = e.target.closest(".proy-card");
          if (card) {
            idx = Array.from(lista.children).indexOf(card);
            render();
            Swal.clickConfirm();
          }
        });
      }
    });

    if (idProyecto) {
      proyectoSeleccionado = proyectos.find(pr => pr.ID_proyecto == idProyecto);
      document.getElementById("proyectoSeleccionadoText").textContent = proyectoSeleccionado.NombreProyecto;
      document.getElementById("proyectoInfoBox").innerHTML = `${proyectoSeleccionado.Metros_Cuadrados} m²<br>${proyectoSeleccionado.Provincia}, ${proyectoSeleccionado.Localidad}`;
      document.getElementById("proyectoInfoBox").classList.remove("hidden");
    }
  };

  // ========================
  // MATERIALES
  // ========================
  document.getElementById("btnAgregarFila").onclick = agregarFilaMaterial;

  function agregarFilaMaterial() {
    const tbody = document.getElementById("tbodyMateriales");
    const index = filas.length;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input type="number" class="cant-input" min="1" value="1"></td>
      <td><button class="btn-select-mat">Seleccionar material</button></td>
      <td>$ <span class="precio">0.00</span></td>
      <td>$ <span class="subtotal">0.00</span></td>
      <td><button class="btn-remove">❌</button></td>
    `;

    tbody.appendChild(tr);

    filas.push({ cantidad: 1, precio: 0, descripcion: "", id_material: null });

    // Cantidad
    tr.querySelector(".cant-input").addEventListener("input", e => {
      filas[index].cantidad = Number(e.target.value) || 1;
      calcularTotales();
    });

    // Seleccionar material
    tr.querySelector(".btn-select-mat").addEventListener("click", async () => {
      let filtro = "";

      function renderMats(filtrados = materiales) {
        return filtrados.map(m => `
          <div class="mat-card" data-id="${m.id_material}">
            <strong>${m.nombre}</strong><br>
            $${m.precio_unitario} / ${m.unidad} | Stock: ${m.stock_actual}
          </div>
        `).join("");
      }

      const { value: idMat } = await Swal.fire({
        title: "Seleccionar Material",
        html: `
          <input id="swal-input3" class="swal-input-custom" placeholder="Buscar material...">
          <div id="listaMatsSwal" style="max-height:300px; overflow-y:auto; margin-top:10px;">
            ${renderMats()}
          </div>
        `,
        focusConfirm: false,
        preConfirm: () => {
          const selected = document.querySelector(".mat-card.selected");
          return selected ? selected.dataset.id : null;
        },
        didOpen: () => {
          aumentarSwal();
          const input = document.getElementById("swal-input3");
          const lista = document.getElementById("listaMatsSwal");
          let idx = -1;

          function filtrar() {
            filtro = input.value.toLowerCase();
            return materiales.filter(m => m.nombre.toLowerCase().includes(filtro));
          }

          function render() {
            const arr = filtrar();
            lista.innerHTML = renderMats(arr);
            if (idx >= 0 && idx < arr.length) {
              lista.children[idx].classList.add("selected");
              lista.children[idx].scrollIntoView({ block: "nearest" });
            }
          }

          input.addEventListener("input", render);
          input.addEventListener("keydown", e => {
            const arr = filtrar();
            if (e.key === "ArrowDown") { idx = (idx + 1) % arr.length; render(); }
            if (e.key === "ArrowUp") { idx = (idx - 1 + arr.length) % arr.length; render(); }
            if (e.key === "Enter" && arr[idx]) Swal.clickConfirm();
          });

          lista.addEventListener("click", e => {
            const card = e.target.closest(".mat-card");
            if (card) {
              idx = Array.from(lista.children).indexOf(card);
              render();
              Swal.clickConfirm();
            }
          });
        }
      });

      if (idMat) {
        const mat = materiales.find(m => m.id_material == idMat);
        filas[index] = { ...filas[index], id_material: mat.id_material, descripcion: mat.nombre, precio: mat.precio_unitario };
        tr.children[1].innerHTML = mat.nombre;
        tr.children[2].textContent = `$ ${mat.precio_unitario.toLocaleString("es-AR")}`;
        calcularTotales();
      }
    });

    // Eliminar fila
    tr.querySelector(".btn-remove").addEventListener("click", () => {
      tr.remove();
      filas.splice(index, 1);
      calcularTotales();
    });

    calcularTotales();
  }

  // ========================
  // TOTALES
  // ========================
  function calcularTotales() {
    let totalMateriales = 0;

    document.querySelectorAll("#tbodyMateriales tr").forEach((row, index) => {
      const cantidad = filas[index].cantidad || 0;
      const precio = filas[index].precio || 0;
      const subtotal = cantidad * precio;

      totalMateriales += subtotal;

      // actualizar subtotal fila
      row.children[3].textContent = `$ ${subtotal.toLocaleString("es-AR")}`;
    });

   let manoObra = Number(document.getElementById("inputManoObra").value) || 0;

let subtotal = totalMateriales + manoObra;

// SIN MARGEN
let iva = subtotal * 0.21;
let totalFinal = subtotal + iva;


    document.getElementById("subtotal").textContent = `$ ${subtotal.toLocaleString("es-AR")}`;
    document.getElementById("iva").textContent = `$ ${iva.toLocaleString("es-AR")}`;
    document.getElementById("total").textContent = `$ ${totalFinal.toLocaleString("es-AR")}`;

    // Guardar totales globalmente
    window._totales = {
      totalMateriales,
      manoObra,
      subtotal,
      iva,
      totalFinal
    };
  }

  // listeners (fuera de la función)
  document.getElementById("inputManoObra").oninput = calcularTotales;



  // ========================
  // GUARDAR PRESUPUESTO
  // ========================
 document.getElementById("guardarPresupuesto").onclick = async () => {

  if (!clienteSeleccionado)
    return Swal.fire("❗ Falta seleccionar cliente");

  let proyectoId = proyectoSeleccionado ? proyectoSeleccionado.ID_proyecto : null;

  if (!proyectoSeleccionado) {
    const r = await Swal.fire({
      icon: "warning",
      title: "¿Guardar sin proyecto?",
      text: "Podés asignar un proyecto más tarde.",
      showCancelButton: true,
      confirmButtonText: "Sí, guardar",
      cancelButtonText: "No"
    });
    if (!r.isConfirmed) return;
  }

  if (filas.length === 0 || filas.some(f => !f.descripcion))
    return Swal.fire("❗ Debes seleccionar al menos un material");

  const tot = window._totales;

  console.log("➡ Datos a guardar", {
    cliente: clienteSeleccionado,
    proyectoId,
    filas,
    tot
  });

 const resp = await window.api.agregarPresupuesto({
  ID_cliente: clienteSeleccionado.ID_cliente,
  ID_proyecto: proyectoId,  // puede ser null
  monto_materiales: tot.totalMateriales,
  mano_obra: tot.manoObra,
  monto_total: tot.totalFinal
});


  if (!resp?.id_presupuesto) {
    return Swal.fire("❌ Error", "No se pudo guardar el presupuesto", "error");
  }

  const idPresupuesto = resp.id_presupuesto;
  const ok = await window.api.agregarDetallePresupuesto(idPresupuesto, filas);

  if (!ok) {
    return Swal.fire("⚠️ Guardado parcial", "El detalle no se guardó", "warning");
  }

  Swal.fire("✅ Guardado", "Presupuesto cargado correctamente", "success");
  mostrarPresupuestos();
};
}