// calendario-ui.js completo, con iconos realistas y estructura prolija (día negrita, align left, mayúscula inicial)
console.log("📅 Módulo Calendario cargado");

// Estado global
let estado = {
  eventos: [],
  clientes: [],
  proyectos: [],
  eventoEditando: null,
  fechaSeleccionada: new Date().toISOString().split('T')[0],
  mostrarTodosFuturos: false,
  clima: null,
};

// Consts para clima (OpenWeather API)
const API_KEY = '494985c0fb793de761beaa24fc8be7f2';
const CIUDAD = 'Cordoba,ar';
const BASE_URL = 'https://api.openweathermap.org/data/2.5/forecast';

// === FUNCIÓN PRINCIPAL ===
export async function mostrarCalendario() {
  const cont = document.getElementById("contenido");
  if (!cont) return;

  cont.innerHTML = `
    <h2>Clima Córdoba</h2>

    <div id="panelClima" class="panel-clima" style="display: flex; gap: 15px; overflow-x: auto; margin-bottom: 20px; padding: 10px;"></div>
    <hr>
    <h3>Calendario</h3>

    <div class="panel-agenda">
      <input type="date" id="fechaSeleccionada" value="${estado.fechaSeleccionada}">
      <button id="btnMostrarTodos">Mostrar Todos Próximos</button>

      <form id="formEvento" class="form-abm">
        <input type="hidden" id="id_evento">
        <input type="text" id="asunto" placeholder="Asunto" required>
        <textarea id="detalles" placeholder="Detalles"></textarea>
        <input type="date" id="fechaInicio" required>
        <input type="time" id="horaInicio" required>
        <input type="date" id="fechaFin" required>
        <input type="time" id="horaFin" required>
        <select id="cmbCliente"><option value="">Seleccionar Cliente</option></select>
        <select id="cmbProyecto"><option value="">Seleccionar Proyecto</option></select>
        <label><input type="checkbox" id="chkOtro"> Otro</label>
        <button type="submit">Guardar</button>
        <button type="button" id="btnLimpiar">Limpiar</button>
      </form>

      <div id="panelEventosProximos" class="panel-eventos-proximos"></div>

      <table class="tabla-eventos" style="width: 100%; border-collapse: collapse; border: 1px solid #ccc;">
        <thead style="background: #f0f0f0;">
          <tr>
            <th style="border: 1px solid #ccc; padding: 8px;">Inicio</th>
            <th style="border: 1px solid #ccc; padding: 8px;">Asunto</th>
            <th style="border: 1px solid #ccc; padding: 8px;">Cliente</th>
            <th style="border: 1px solid #ccc; padding: 8px;">Proyecto</th>
            <th style="border: 1px solid #ccc; padding: 8px;">Fin</th>
            <th style="border: 1px solid #ccc; padding: 8px;">Descripción</th>
            <th style="border: 1px solid #ccc; padding: 8px;">Acciones</th>
          </tr>
        </thead>
        <tbody id="tbodyEventos"></tbody>
      </table>
    </div>
  `;

  // Cargar datos iniciales
  await cargarClientesYProyectos();
  await cargarClima();
  await recargarEventos();

  // Eventos
  document.getElementById("formEvento").addEventListener("submit", guardarEvento);
  document.getElementById("btnLimpiar").addEventListener("click", limpiarForm);
  document.getElementById("btnMostrarTodos").addEventListener("click", () => {
    estado.mostrarTodosFuturos = true;
    recargarEventos();
  });
  document.getElementById("fechaSeleccionada").addEventListener("change", (e) => {
    estado.fechaSeleccionada = e.target.value;
    estado.mostrarTodosFuturos = false;
    recargarEventos();
  });
  document.getElementById("chkOtro").addEventListener("change", (e) => {
    document.getElementById("cmbCliente").disabled = e.target.checked;
    document.getElementById("cmbProyecto").disabled = e.target.checked;
  });

  // Delegar clics en tabla para editar/eliminar
  document.getElementById("tbodyEventos").addEventListener("click", async (e) => {
    if (e.target.classList.contains("btn-editar")) {
      const id = e.target.closest("tr").dataset.id;
      const evento = await window.api.obtenerEventoPorId(id);
      cargarFormParaEdicion(evento);
    } else if (e.target.classList.contains("btn-eliminar")) {
      const id = e.target.closest("tr").dataset.id;
      if (confirm("¿Eliminar evento?")) {
        await window.api.eliminarEvento(id);
        alert("Eliminado");
        recargarEventos();
      }
    }
  });

  // Cargar panel de próximos eventos
  await renderEventosProximos();
}

// === CARGAR CLIENTES Y PROYECTOS ===
async function cargarClientesYProyectos() {
  estado.clientes = await window.api.obtenerClientes();
  estado.proyectos = await window.api.obtenerProyectos();

  const cmbCliente = document.getElementById("cmbCliente");
  estado.clientes.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.ID_cliente;
    opt.textContent = c.Empresa ? `${c.RazonSocial} (CUIT: ${c.CUIT})` : `${c.Apellido}, ${c.Nombre} (DNI: ${c.DNI})`;
    cmbCliente.appendChild(opt);
  });

  const cmbProyecto = document.getElementById("cmbProyecto");
  estado.proyectos.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.ID_proyecto;
    opt.textContent = p.NombreProyecto;
    cmbProyecto.appendChild(opt);
  });
}

// === CARGAR CLIMA (MEJORADO: ESTRUCTURA PROLIJA, ICONOS REALISTAS) ===
async function cargarClima() {
  try {
    const response = await fetch(`${BASE_URL}?q=${CIUDAD}&appid=${API_KEY}&units=metric&lang=es`);
    const data = await response.json();
    const dailyForecast = groupForecastByDay(data.list);

    const panel = document.getElementById("panelClima");
    panel.innerHTML = '';
    dailyForecast.forEach(day => {
      const iconClass = getFaIcon(day.description);
      const descCapitalized = day.description.charAt(0).toUpperCase() + day.description.slice(1);
      const card = document.createElement("div");
      card.style.width = '150px';
      card.style.height = 'auto';
      card.style.border = '1px solid #ccc';
      card.style.borderRadius = '8px';
      card.style.padding = '10px';
      card.style.textAlign = 'center';
      card.style.overflow = 'hidden'; // Evita desborde
      card.style.wordBreak = 'break-word'; // Rompe palabras largas
      card.innerHTML = `
        <i class="fas ${iconClass}" style="font-size: 30px; color: #4CAF50; display: block; margin-bottom: 10px;"></i>
        <strong>${new Date(day.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'numeric' })}</strong>
        <p style="text-align: left; margin: 5px 0;">${descCapitalized}</p>
        <p style="text-align: left; margin: 5px 0;">Temperatura: ${day.temp_min}°C / ${day.temp_max}°C</p>
        <p style="text-align: left; margin: 5px 0;">Humedad: ${day.humidity}%</p>
        <p style="text-align: left; margin: 5px 0;">Viento: ${day.wind_speed} m/s</p>
      `;
      panel.appendChild(card);
    });
  } catch (error) {
    document.getElementById("panelClima").innerHTML = "<p>Error al cargar clima.</p>";
  }
}

// === AGRUPAR FORECAST POR DÍA (CON MAX/MIN/HUMEDAD/VIENTO) ===
function groupForecastByDay(list) {
  const groups = {};
  list.forEach(item => {
    const date = item.dt_txt.split(' ')[0];
    if (!groups[date]) groups[date] = { temps: [], humidities: [], winds: [], descriptions: [] };
    groups[date].temps.push(item.main.temp);
    groups[date].humidities.push(item.main.humidity);
    groups[date].winds.push(item.wind.speed);
    groups[date].descriptions.push(item.weather[0].description);
  });

  return Object.keys(groups).slice(0, 5).map(date => ({
    date,
    temp_min: Math.round(Math.min(...groups[date].temps)),
    temp_max: Math.round(Math.max(...groups[date].temps)),
    humidity: Math.round(groups[date].humidities.reduce((a, b) => a + b) / groups[date].humidities.length),
    wind_speed: Math.round(groups[date].winds.reduce((a, b) => a + b) / groups[date].winds.length),
    description: groups[date].descriptions[0] // Primera descripción
  }));
}

// === MAPEAR DESCRIPCIÓN A FA ICON (MÁS REALISTA) ===
function getFaIcon(description) {
  description = description.toLowerCase();
  if (description.includes('cielo claro')) return 'fa-sun';
  if (description.includes('nubes dispersas')) return 'fa-cloud-sun';
  if (description.includes('muy nuboso')) return 'fa-cloud';
  if (description.includes('nubes')) return 'fa-cloud';
  if (description.includes('lluvia ligera')) return 'fa-cloud-rain';
  if (description.includes('lluvia')) return 'fa-cloud-showers-heavy';
  if (description.includes('tormenta')) return 'fa-cloud-bolt';
  if (description.includes('nieve')) return 'fa-snowflake';
  if (description.includes('niebla')) return 'fa-smog';
  return 'fa-cloud'; // Default
}

// === RECARGAR EVENTOS ===
async function recargarEventos() {
  if (estado.mostrarTodosFuturos) {
    estado.eventos = await window.api.obtenerEventos(null, true);
  } else {
    estado.eventos = await window.api.obtenerEventos(estado.fechaSeleccionada);
  }
  renderTabla(estado.eventos);
  await renderEventosProximos();
}

// === RENDER TABLA DE EVENTOS (FULL-WIDTH, ESTILO DATAGRIDVIEW) ===
function renderTabla(lista) {
  const tbody = document.getElementById("tbodyEventos");
  tbody.innerHTML = "";

  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="7">No hay eventos</td></tr>`;
    return;
  }

  lista.forEach(e => {
    const tr = document.createElement("tr");
    tr.dataset.id = e.ID_evento;
    tr.innerHTML = `
      <td style="border: 1px solid #ccc; padding: 8px;">${new Date(e.FechaHoraInicio).toLocaleString()}</td>
      <td style="border: 1px solid #ccc; padding: 8px;">${e.Asunto}</td>
      <td style="border: 1px solid #ccc; padding: 8px;">${e.ClienteNombre || '-'}</td>
      <td style="border: 1px solid #ccc; padding: 8px;">${e.ProyectoNombre || '-'}</td>
      <td style="border: 1px solid #ccc; padding: 8px;">${new Date(e.FechaHoraFin).toLocaleString()}</td>
      <td style="border: 1px solid #ccc; padding: 8px;">${e.Detalles || '-'}</td>
      <td style="border: 1px solid #ccc; padding: 8px;">
        <button class="btn-editar">✏️</button>
        <button class="btn-eliminar">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// === GUARDAR/ACTUALIZAR EVENTO ===
async function guardarEvento(e) {
  e.preventDefault();
  const id = document.getElementById("id_evento").value;
  const data = {
    Asunto: document.getElementById("asunto").value,
    Detalles: document.getElementById("detalles").value,
    FechaHoraInicio: `${document.getElementById("fechaInicio").value}T${document.getElementById("horaInicio").value}:00`,
    FechaHoraFin: `${document.getElementById("fechaFin").value}T${document.getElementById("horaFin").value}:00`,
    ID_cliente: document.getElementById("cmbCliente").value || null,
    ID_proyecto: document.getElementById("cmbProyecto").value || null,
    Otro: document.getElementById("chkOtro").checked,
  };

  try {
    if (id) {
      await window.api.actualizarEvento(id, data);
      alert("Evento actualizado");
    } else {
      await window.api.agregarEvento(data);
      alert("Evento agregado");
    }
    recargarEventos();
    limpiarForm();
  } catch (error) {
    alert("Error: " + error.message);
  }
}

// === CARGAR FORM PARA EDICIÓN ===
function cargarFormParaEdicion(evento) {
  estado.eventoEditando = evento;
  document.getElementById("id_evento").value = evento.ID_evento;
  document.getElementById("asunto").value = evento.Asunto;
  document.getElementById("detalles").value = evento.Detalles || '';
  document.getElementById("fechaInicio").value = new Date(evento.FechaHoraInicio).toISOString().split('T')[0];
  document.getElementById("horaInicio").value = new Date(evento.FechaHoraInicio).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  document.getElementById("fechaFin").value = new Date(evento.FechaHoraFin).toISOString().split('T')[0];
  document.getElementById("horaFin").value = new Date(evento.FechaHoraFin).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  document.getElementById("cmbCliente").value = evento.ID_cliente || '';
  document.getElementById("cmbProyecto").value = evento.ID_proyecto || '';
  document.getElementById("chkOtro").checked = evento.Otro;
}

// === LIMPIAR FORM ===
function limpiarForm() {
  document.getElementById("formEvento").reset();
  estado.eventoEditando = null;
}

// === RENDER PANEL EVENTOS PRÓXIMOS (CON BORDERS Y COLORES) ===
export async function renderEventosProximos(panelId = "panelEventosProximos") {
  const proximos = await window.api.obtenerEventosProximos();
  const panel = document.getElementById(panelId);
  panel.innerHTML = "<h3>Próximos Eventos</h3>";

  if (!proximos.length) {
    panel.innerHTML += "<p>No hay eventos próximos.</p>";
    return;
  }

  proximos.forEach(e => {
    const diffHours = (new Date(e.FechaHoraInicio) - new Date()) / (1000 * 60 * 60);
    let bgColor = '#e8f5e9'; // Verde lejano
    if (diffHours < 1) bgColor = '#ffebee'; // Rojo urgente
    else if (diffHours < 24) bgColor = '#fff3e0'; // Naranja hoy
    else if (diffHours < 48) bgColor = '#fffde7'; // Amarillo mañana
    else if (diffHours < 168) bgColor = '#e3f2fd'; // Azul semana

    const div = document.createElement("div");
    div.style.backgroundColor = bgColor;
    div.style.border = '1px solid #ccc';
    div.style.padding = '10px';
    div.style.marginBottom = '10px';
    div.style.borderRadius = '4px';
    div.innerHTML = `
      <strong>${e.Asunto}</strong><br>
      ${new Date(e.FechaHoraInicio).toLocaleString()} - ${new Date(e.FechaHoraFin).toLocaleString()}<br>
      ${e.ClienteNombre || 'Interno'} | ${e.ProyectoNombre || '-'}`;
    panel.appendChild(div);
  });
}