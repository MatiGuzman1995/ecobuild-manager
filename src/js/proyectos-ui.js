console.log("🏗️ Módulo Proyectos cargado");

// Estado global
let estado = {
  proyectos: [],
  filteredProyectos: [], // Nuevo para manejar filtrado y paginación
  provincias: [],
  localidades: [],
  clientes: [],
  currentIndex: 0,
  cardsVisible: 3,
  filtro: "",
  proyectoEditando: null,
  archivosEditando: [], // Nuevos archivos
  archivosExistentes: [], // De BD
  imagenSeleccionada: null,
};

// Consts
const MAX_ARCHIVO_SIZE = 100 * 1024 * 1024;
const TIPOS_PERMITIDOS = [".pdf", ".jpg", ".jpeg", ".png", ".docx", ".txt", ".zip"];

// === FUNCIÓN PRINCIPAL ===
export async function mostrarProyectos() {
  const cont = document.getElementById("contenido");
  if (!cont) return;

  cont.innerHTML = `
    <h2>Gestión de Proyectos</h2>

    <form id="formProyecto" class="form-abm">
      <input type="hidden" id="id_proyecto">
      <input type="text" id="nombre" placeholder="Nombre del Proyecto" required>
      <input type="text" id="txtCliente" list="datalistClientes" placeholder="Buscar Cliente...">
      <input type="hidden" id="id_cliente_hidden">
      <datalist id="datalistClientes"></datalist>
      <input type="text" id="metros_cuadrados" placeholder="Metros Cuadrados" required>
      <select id="cmbProvincia"></select>
      <select id="cmbLocalidad"></select>
      <input type="text" id="calle" placeholder="Calle" required>
      <input type="text" id="numeracion" placeholder="Numeración" required>
      <input type="text" id="descripcion_terreno" placeholder="Descripción del Terreno">
      <img id="imgPreview" src="" alt="Preview Imagen" style="display:none; max-width:200px;">
      <button type="button" id="btnLoadImage">Cargar Imagen</button>
      <ul id="listaArchivos"></ul>
      <button type="button" id="btnAgregarArchivos">Agregar Archivos</button>
      <button type="button" id="btnEliminarSeleccionados">Eliminar Seleccionados</button>
      <button type="button" id="btnLimpiarArchivos">Limpiar Archivos</button>
      <button type="submit">Guardar</button>
      <button type="button" id="btnCancelar">Cancelar</button>
    </form>

    <div class="buscador">
      <input type="text" id="txtBuscar" placeholder="🔎 Buscar proyecto por nombre o cliente...">
      <small id="contadorResultados"></small>
    </div>

    <div class="carousel">
      <div id="carouselContainer" class="carousel-container" style="display: flex; flex-wrap: wrap; justify-content: space-around;"></div>
      <div class="carousel-controls" style="display: flex; justify-content: space-between; width: 100%; margin-top: 10px;">
        <button id="btnPrev" style="width: 48%; height: 50px; font-size: 24px; background: linear-gradient(135deg, #4CAF50, #388E3C); color: white; border: none; border-radius: 8px; cursor: pointer;">◀ Anterior</button>
        <button id="btnNext" style="width: 48%; height: 50px; font-size: 24px; background: linear-gradient(135deg, #4CAF50, #388E3C); color: white; border: none; border-radius: 8px; cursor: pointer;">Siguiente ▶</button>
      </div>
    </div>

    <!-- Modal para ver archivos -->
    <div id="modalArchivos" class="modal" style="display:none; position:fixed; top:20%; left:30%; width:40%; background:white; padding:20px; border:1px solid #ccc; z-index:1000;">
      <h3>Archivos del Proyecto</h3>
      <ul id="listaArchivosModal"></ul>
      <button id="btnAbrirArchivo">Abrir Seleccionado</button>
      <button id="btnGuardarArchivo">Guardar Seleccionado</button>
      <button id="btnEliminarArchivo">Eliminar Seleccionado</button> <!-- Movido aquí -->
      <button id="btnCerrarModal">Cerrar</button>
    </div>
  `;

  // Referencias
  const form = document.getElementById("formProyecto");
  const txtBuscar = document.getElementById("txtBuscar");
  const cmbProvincia = document.getElementById("cmbProvincia");
  const cmbLocalidad = document.getElementById("cmbLocalidad");
  const txtCliente = document.getElementById("txtCliente");
  const idClienteHidden = document.getElementById("id_cliente_hidden");
  const datalistClientes = document.getElementById("datalistClientes");
  const imgPreview = document.getElementById("imgPreview");
  const listaArchivos = document.getElementById("listaArchivos");
  const modalArchivos = document.getElementById("modalArchivos");
  const listaArchivosModal = document.getElementById("listaArchivosModal");

  // Cargar datos
  estado.provincias = await window.api.obtenerProvincias();
  estado.localidades = await window.api.obtenerLocalidades(1);
  estado.clientes = await window.api.obtenerClientes();
  await recargarProyectos();

  // Poblar combos
  cmbLocalidad.innerHTML = estado.localidades.map(l => `<option value="${l.ID_localidad}">${l.nomLocalidad}</option>`).join("");
  cmbProvincia.innerHTML = estado.provincias.map(p => `<option value="${p.ID_provincia}">${p.nomProvincia}</option>`).join("");

  // Poblar datalist para autocompletado de clientes
  function actualizarDatalist(filtro = "") {
    datalistClientes.innerHTML = estado.clientes
      .filter(c => {
        const display = c.Empresa ? `${c.RazonSocial} (CUIT: ${c.CUIT})` : `${c.Apellido}, ${c.Nombre} (DNI: ${c.DNI})`;
        return display.toLowerCase().includes(filtro.toLowerCase());
      })
      .map(c => `<option value="${c.Empresa ? `${c.RazonSocial} (CUIT: ${c.CUIT})` : `${c.Apellido}, ${c.Nombre} (DNI: ${c.DNI})`}">${c.Empresa ? `${c.RazonSocial} (CUIT: ${c.CUIT})` : `${c.Apellido}, ${c.Nombre} (DNI: ${c.DNI})`}</option>`)
      .join("");
  }
  actualizarDatalist(); // Inicial
  txtCliente.addEventListener("input", () => actualizarDatalist(txtCliente.value));

  // Al seleccionar de datalist, buscar ID y setear hidden
  txtCliente.addEventListener("change", () => {
    const display = txtCliente.value;
    const cliente = estado.clientes.find(c => 
      (c.Empresa && `${c.RazonSocial} (CUIT: ${c.CUIT})` === display) ||
      (!c.Empresa && `${c.Apellido}, ${c.Nombre} (DNI: ${c.DNI})` === display)
    );
    if (cliente) {
      idClienteHidden.value = cliente.ID_cliente;
      console.log("Cliente seleccionado: ID", cliente.ID_cliente);
    } else {
      idClienteHidden.value = "";
    }
  });

  // Eventos
  cmbProvincia.addEventListener("change", async () => {
    const idProv = cmbProvincia.value;
    estado.localidades = await window.api.obtenerLocalidades(idProv);
    cmbLocalidad.innerHTML = estado.localidades.map(l => `<option value="${l.ID_localidad}">${l.nomLocalidad}</option>`).join("");
  });

  txtBuscar.addEventListener("input", () => {
    estado.filtro = txtBuscar.value;
    estado.currentIndex = 0; // Reset paginación al buscar
    aplicarFiltro();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const idCliente = idClienteHidden.value;
    if (!idCliente) {
      alert("Seleccione un cliente válido");
      return;
    }
    const data = {
      ID_cliente: idCliente,
      Nombre: form.nombre.value.trim(),
      Metros_Cuadrados: form.metros_cuadrados.value.trim(),
      terreno: {
        descripcion: form.descripcion_terreno.value.trim(),
        direccion: {
          calle: form.calle.value.trim(),
          numeracion: form.numeracion.value.trim(),
          ID_localidad: cmbLocalidad.value,
        }
      }
    };
    // Solo incluir Imagen si hay nueva; si no, omitir para no sobreescribir
    if (estado.imagenSeleccionada !== null) {
      data.Imagen = estado.imagenSeleccionada;
    }

    const id = form.id_proyecto.value;
    if (id) {
      await window.api.actualizarProyecto(Number(id), data);
      if (estado.archivosEditando.length > 0) {
        await window.api.subirArchivosProyecto(id, estado.archivosEditando);
      }
      alert("✅ Proyecto actualizado");
    } else {
      const newId = await window.api.agregarProyecto(data);
      if (estado.archivosEditando.length > 0) {
        await window.api.subirArchivosProyecto(newId, estado.archivosEditando);
      }
      alert("✅ Proyecto agregado");
    }

    limpiarEdicion();
    await recargarProyectos();
    aplicarFiltro();
  });

  document.getElementById("btnLoadImage").addEventListener("click", async () => {
    console.log("Click en Cargar Imagen - Iniciando selector de archivo");
    try {
      const file = await window.api.seleccionarArchivo({ accept: '.jpg,.png' });
      if (file) {
        console.log("Archivo seleccionado:", file.name);
        estado.imagenSeleccionada = file.contenido;
        imgPreview.src = URL.createObjectURL(new Blob([file.contenido]));
        imgPreview.style.display = "block";
      } else {
        console.log("No se seleccionó archivo");
      }
    } catch (error) {
      console.error("Error al seleccionar imagen:", error);
    }
  });

  document.getElementById("btnAgregarArchivos").addEventListener("click", async () => {
    console.log("Click en Agregar Archivos - Iniciando selector múltiple");
    try {
      const files = await window.api.seleccionarArchivos({ multiple: true, accept: TIPOS_PERMITIDOS.join(",") });
      console.log("Archivos seleccionados:", files.length);
      for (const file of files) {
        if (file.size > MAX_ARCHIVO_SIZE) {
          alert(`Archivo ${file.name} excede 100MB`);
          continue;
        }
        estado.archivosEditando.push(file);
      }
      renderListaArchivos();
    } catch (error) {
      console.error("Error al seleccionar archivos:", error);
    }
  });

  document.getElementById("btnEliminarSeleccionados").addEventListener("click", () => {
    // TODO: Implementar si necesitas selección múltiple en form
  });

  document.getElementById("btnLimpiarArchivos").addEventListener("click", async () => {
    if (confirm("¿Eliminar todos los archivos?")) {
      if (estado.proyectoEditando) {
        await window.api.eliminarArchivosProyecto(estado.proyectoEditando.ID_proyecto);
      }
      estado.archivosEditando = [];
      estado.archivosExistentes = [];
      renderListaArchivos();
    }
  });

  document.getElementById("btnCancelar").addEventListener("click", limpiarEdicion);

  // Carrusel eventos
  document.getElementById("btnPrev").addEventListener("click", () => {
    estado.currentIndex = Math.max(0, estado.currentIndex - estado.cardsVisible);
    renderCarrusel();
  });
  document.getElementById("btnNext").addEventListener("click", () => {
    estado.currentIndex = Math.min(estado.filteredProyectos.length - estado.cardsVisible, estado.currentIndex + estado.cardsVisible);
    renderCarrusel();
  });

  // Eventos en carrusel (botones en cards)
  document.getElementById("carouselContainer").addEventListener("click", async (e) => {
    const card = e.target.closest(".card");
    if (!card) return;
    const id = Number(card.dataset.id);
    const proyecto = await window.api.obtenerProyectoPorId(id);

    if (e.target.classList.contains("btn-editar")) {
      estado.proyectoEditando = proyecto;
      estado.archivosExistentes = await window.api.obtenerArchivosProyecto(id);
      estado.archivosEditando = [];

      form.id_proyecto.value = id;
      form.nombre.value = proyecto.Nombre;
      txtCliente.value = proyecto.Empresa ? `${proyecto.RazonSocial} (CUIT: ${proyecto.CUIT})` : `${proyecto.Apellido}, ${proyecto.Nombre} (DNI: ${proyecto.DNI})`;
      idClienteHidden.value = proyecto.ID_cliente; // Setear hidden
      form.metros_cuadrados.value = proyecto.Metros_Cuadrados;
      form.descripcion_terreno.value = proyecto.DescripcionTerreno;
      form.calle.value = proyecto.Calle;
      form.numeracion.value = proyecto.Numeracion;
      cmbProvincia.value = proyecto.ID_provincia;
      cmbProvincia.dispatchEvent(new Event("change"));
      cmbLocalidad.value = proyecto.ID_localidad;

      if (proyecto.Imagen) {
        imgPreview.src = URL.createObjectURL(new Blob([proyecto.Imagen]));
        imgPreview.style.display = "block";
      }

      renderListaArchivos();
    }

    if (e.target.classList.contains("btn-eliminar")) {
      if (confirm("¿Eliminar proyecto?")) {
        await window.api.eliminarProyecto(id);
        await recargarProyectos();
        aplicarFiltro();
      }
    }

    if (e.target.classList.contains("btn-ver-archivos")) {
      estado.archivosExistentes = await window.api.obtenerArchivosProyecto(id);
      renderListaArchivosModal();
      modalArchivos.style.display = "block";
    }
  });

  // Eventos del modal
  document.getElementById("btnCerrarModal").addEventListener("click", () => {
    modalArchivos.style.display = "none";
  });

  document.getElementById("btnAbrirArchivo").addEventListener("click", async () => {
    const selected = listaArchivosModal.querySelector("li input[type=checkbox]:checked");
    if (!selected) return alert("Seleccione un archivo");
    const arch = estado.archivosExistentes.find(a => a.ID_archivo === Number(selected.closest("li").dataset.id));
    if (arch) {
      const tempPath = await window.api.abrirArchivoTemporal(arch); // Nuevo IPC
      if (tempPath) {
        await window.api.abrirArchivo(tempPath); // Nuevo IPC para shell.openPath
      }
    }
  });

  document.getElementById("btnGuardarArchivo").addEventListener("click", async () => {
    const selected = listaArchivosModal.querySelector("li input[type=checkbox]:checked");
    if (!selected) return alert("Seleccione un archivo");
    const arch = estado.archivosExistentes.find(a => a.ID_archivo === Number(selected.closest("li").dataset.id));
    if (arch) {
      await window.api.guardarArchivo(arch); // Nuevo IPC para elegir carpeta y guardar
    }
  });

  // Nuevo: Eliminar en modal
  document.getElementById("btnEliminarArchivo").addEventListener("click", async () => {
    const selected = listaArchivosModal.querySelector("li input[type=checkbox]:checked");
    if (!selected) return alert("Seleccione un archivo");
    const idArchivo = Number(selected.closest("li").dataset.id);
    if (confirm("¿Eliminar archivo seleccionado?")) {
      await window.api.eliminarArchivo(idArchivo);
      estado.archivosExistentes = estado.archivosExistentes.filter(a => a.ID_archivo !== idArchivo);
      renderListaArchivosModal();
    }
  });

  // Selección en lista modal (no necesita evento extra, checkboxes manejan solos)

  renderCarrusel();
}

// Funciones auxiliares
async function recargarProyectos() {
  estado.proyectos = await window.api.obtenerProyectos();
  estado.filteredProyectos = estado.proyectos; // Inicializar filtrado con todos
}

function aplicarFiltro() {
  const filtro = estado.filtro.toLowerCase();
  estado.filteredProyectos = estado.proyectos.filter(p =>
    p.Nombre.toLowerCase().includes(filtro) || (p.Empresa ? p.RazonSocial.toLowerCase().includes(filtro) : (p.Apellido + ' ' + p.Nombre).toLowerCase().includes(filtro))
  );
  estado.currentIndex = 0; // Reset paginación
  renderCarrusel(estado.filteredProyectos);
  actualizarContador(estado.filteredProyectos.length, estado.proyectos.length);
}

function renderCarrusel(lista = estado.filteredProyectos) {
  const container = document.getElementById("carouselContainer");
  container.innerHTML = "";
  const slice = lista.slice(estado.currentIndex, estado.currentIndex + estado.cardsVisible);
  slice.forEach(p => {
    const clienteDisplay = p.Empresa ? `${p.RazonSocial} (CUIT: ${p.CUIT})` : `${p.Apellido}, ${p.NombreCliente} (DNI: ${p.DNI})`;
    const direccionDisplay = `${p.Calle}, ${p.Numeracion}, ${p.Localidad}, ${p.Provincia}`;
    const imagenHtml = p.Imagen ? `<img src="${URL.createObjectURL(new Blob([p.Imagen]))}" alt="Imagen Proyecto" style="max-width:100%; height:auto;">` : '';
    const card = document.createElement("div");
    card.className = "card";
    card.dataset.id = p.ID_proyecto;
    card.style = "width: 300px; margin: 10px; padding: 10px; border: 1px solid #ccc; border-radius: 8px; text-align: center;";
    card.innerHTML = `
      <h3>${p.NombreProyecto}</h3>
      ${imagenHtml}
      <p>Cliente: ${clienteDisplay}</p>
      <p>Descripción: ${p.DescripcionTerreno}</p>
      <p>Metros: ${p.Metros_Cuadrados} M2</p>
      <p>Dirección: ${direccionDisplay}</p>
      <button class="btn-ver-archivos">Ver Archivos</button>
      <button class="btn-editar">Editar</button>
      <button class="btn-eliminar">Eliminar</button>
    `;
    container.appendChild(card);
  });
}

function renderListaArchivos() {
  const lista = document.getElementById("listaArchivos");
  lista.innerHTML = "";
  [...estado.archivosExistentes, ...estado.archivosEditando].forEach(arch => {
    const li = document.createElement("li");
    li.textContent = `${arch.name || 'Archivo desconocido'} [${arch.tipo || 'desconocido'}] (${(arch.size / 1024).toFixed(2) || 0} KB) - ${arch.FechaSubida || 'Nuevo'}`;
    lista.appendChild(li);
  });
}

function renderListaArchivosModal() {
  const lista = document.getElementById("listaArchivosModal");
  lista.innerHTML = "";
  estado.archivosExistentes.forEach(arch => {
    const li = document.createElement("li");
    li.dataset.id = arch.ID_archivo;
    li.innerHTML = `<input type="checkbox"> ${arch.nombre || 'Archivo desconocido'} [${arch.tipo || 'desconocido'}] (${(arch.Tamaño / 1024).toFixed(2) || 0} KB) - ${arch.FechaSubida || 'Desconocida'}`;
    lista.appendChild(li);
  });
}

function limpiarEdicion() {
  document.getElementById("formProyecto").reset();
  document.getElementById("id_cliente_hidden").value = "";
  estado.proyectoEditando = null;
  estado.archivosEditando = [];
  estado.archivosExistentes = [];
  estado.imagenSeleccionada = null;
  document.getElementById("imgPreview").style.display = "none";
  renderListaArchivos();
}

function debounce(func, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
}

function actualizarContador(vistos, total) {
  document.getElementById("contadorResultados").textContent = `Mostrando ${vistos} de ${total} proyectos`;
}