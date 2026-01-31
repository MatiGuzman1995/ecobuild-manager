console.log("📊 Dashboard.js cargado correctamente");

// ✅ Cargar usuario logueado
const usuarioLogueado = JSON.parse(localStorage.getItem("usuario"));
if (!usuarioLogueado) {
  window.location.href = "index.html"; // login
}

// ✅ Mostrar usuario en la topbar
const userInfoElement = document.getElementById("userInfo");
if (userInfoElement && usuarioLogueado) {
  userInfoElement.textContent = `${usuarioLogueado.nombre} | ${usuarioLogueado.rol}`;
}

document.addEventListener('DOMContentLoaded', () => {

  // === Botón de cerrar sesión ===
  const logoutBtn = document.getElementById('logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem("usuario");
      window.location.href = 'index.html';
    });
  }

  const menuItems = document.querySelectorAll('.menu li');
  const titulo = document.getElementById('titulo-seccion');
  const contenido = document.getElementById('contenido');

  // === Control de roles ===
  const usuarioActual = usuarioLogueado;
  const rol = usuarioActual.rol || 'consulta';
  console.log(`🔐 Rol activo: ${rol}`);

  // Permisos por rol
  const permisos = {
    admin: ['inicio', 'proyectos', 'clientes', 'presupuesto', 'calendario', 'progreso', 'usuarios', 'configuracion', 'materiales'],
    tecnico: ['inicio', 'proyectos', 'progreso'],
    operador: ['inicio', 'clientes', 'presupuesto', 'materiales'],
    visor: ['inicio', 'clientes', 'proyectos'],
    consulta: ['inicio', 'proyectos']
  };

  // Ocultar ítems según permisos
  document.querySelectorAll('.menu li').forEach(li => {
    const section = li.getAttribute('data-section');
    if (!permisos[rol]?.includes(section)) {
      li.style.display = 'none';
    }
  });

  // === Gráficos iniciales ===
  function inicializarGraficos() {
    const ctx1 = document.getElementById('graficoProyectos');
    const ctx2 = document.getElementById('graficoClientes');
    if (!ctx1 || !ctx2) return;

    new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: ['Pendientes', 'En ejecución', 'Finalizados'],
        datasets: [{
          label: 'Proyectos',
          data: [3, 8, 5],
          backgroundColor: ['#fdd835', '#43a047', '#1e88e5']
        }]
      },
      options: { responsive: true, plugins: { legend: { display: false } } }
    });

    new Chart(ctx2, {
      type: 'doughnut',
      data: {
        labels: ['Residenciales', 'Empresariales', 'Gobierno'],
        datasets: [{
          data: [7, 3, 2],
          backgroundColor: ['#81c784', '#64b5f6', '#aed581']
        }]
      },
      options: { responsive: true }
    });
  }

  // === Renderizar panel de Próximos Eventos (replicado de calendario-ui) ===
  async function renderProximosEventosEnDashboard() {
    const panel = document.getElementById('dashboard-proximos-eventos');
    if (!panel) {
      console.warn("No se encontró #dashboard-proximos-eventos en el DOM");
      return;
    }

    try {
      const proximos = await window.api.obtenerEventosProximos();

      panel.innerHTML = `<h3>Próximos Eventos (próximas 2 semanas)</h3>`;

      if (!proximos?.length) {
        panel.innerHTML += `<p style="color:#666; padding:10px;">No hay eventos programados en los próximos 14 días.</p>`;
        return;
      }

      proximos.forEach(e => {
        const diffHours = (new Date(e.FechaHoraInicio) - new Date()) / (1000 * 60 * 60);
        let bgColor = '#e8f5e9'; // Verde lejano
        if (diffHours < 1) bgColor = '#ffebee';      // Rojo urgente
        else if (diffHours < 24) bgColor = '#fff3e0'; // Naranja hoy
        else if (diffHours < 48) bgColor = '#fffde7'; // Amarillo mañana
        else if (diffHours < 168) bgColor = '#e3f2fd'; // Azul semana

        const div = document.createElement("div");
        div.style.backgroundColor = bgColor;
        div.style.border = '1px solid #ccc';
        div.style.padding = '12px';
        div.style.margin = '8px 0';
        div.style.borderRadius = '6px';
        div.innerHTML = `
          <strong style="font-size:1.1em;">${e.Asunto || '(Sin asunto)'}</strong><br>
          <span style="color:#555; font-size:0.95em;">
            ${new Date(e.FechaHoraInicio).toLocaleString('es-AR')} – 
            ${new Date(e.FechaHoraFin).toLocaleString('es-AR')}
          </span><br>
          <span style="color:#2e7d32;">
            ${e.ClienteNombre || 'Interno'} ${e.ProyectoNombre ? `| ${e.ProyectoNombre}` : ''}
          </span>
        `;
        panel.appendChild(div);
      });
    } catch (err) {
      console.error("Error cargando eventos próximos en dashboard:", err);
      panel.innerHTML = `<p style="color:#c62828; padding:10px;">No se pudieron cargar los eventos próximos</p>`;
    }
  }
  let chartProvincia = null;
  let chartPresupuestos = null;
let chartCO2Provincia = null;

  const FACTOR_CO2_KG_POR_M2 = 12; 
// Ejemplo : 12 kg CO2e evitados por m² (AJUSTABLE).
  async function renderDashboardReal() {

  


    // Guard: API disponible
    if (!window.api?.obtenerProyectos || !window.api?.obtenerClientes || !window.api?.obtenerPresupuestos) {
      console.warn("⚠️ API no disponible (preload).");
      return;
    }

    try {
      // Traer datos reales
      const [proyectos, clientes, presupuestos] = await Promise.all([
        window.api.obtenerProyectos(),
        window.api.obtenerClientes(),
        window.api.obtenerPresupuestos()
      ]);

      // ===== KPIs =====
      const totalProyectos = proyectos?.length ?? 0;
      const totalClientes = clientes?.length ?? 0;
      const totalPresupuestos = presupuestos?.length ?? 0;

      const aprobados = (presupuestos || []).filter(p => (p.estado || "").toLowerCase() === "aprobado").length;
      const pctAprobados = totalPresupuestos ? Math.round((aprobados / totalPresupuestos) * 100) : 0;

      document.getElementById("kpi-proyectos").textContent = totalProyectos;
      document.getElementById("kpi-clientes").textContent = totalClientes;
      document.getElementById("kpi-presupuestos").textContent = totalPresupuestos;
      document.getElementById("kpi-aprobados").textContent = `${pctAprobados}%`;

      // ===== Gráfico: Proyectos por Provincia =====
      const conteoProvincia = {};
      (proyectos || []).forEach(p => {
        const prov = (p.Provincia || "Sin provincia").trim();
        conteoProvincia[prov] = (conteoProvincia[prov] || 0) + 1;
      });

      const provincias = Object.keys(conteoProvincia);
      const valoresProv = provincias.map(k => conteoProvincia[k]);

      const ctxProv = document.getElementById("chartProyectosProvincia");
      if (ctxProv) {
        chartProvincia?.destroy();
        chartProvincia = new Chart(ctxProv, {
          type: "bar",
          data: { labels: provincias, datasets: [{ label: "Proyectos", data: valoresProv }] },
          options: { responsive: true, plugins: { legend: { display: false } } }
        });
      }
      const alertas = [];

// Presupuestos pendientes
const pendientes = (presupuestos || []).filter(p => (p.estado || "").toLowerCase() === "pendiente").length;
if (pendientes > 0) alertas.push(`🔴 ${pendientes} presupuestos pendientes`);

// Eventos en 48hs (si ya los traés aparte, podés integrarlo también)
try {
  const evs = await window.api.obtenerEventosProximos();
  const en48 = (evs || []).filter(e => {
    const horas = (new Date(e.FechaHoraInicio) - new Date()) / (1000*60*60);
    return horas >= 0 && horas <= 48;
  }).length;
  if (en48 > 0) alertas.push(`🟠 ${en48} eventos en las próximas 48 hs`);
} catch {}

// Proyectos sin m²
const sinM2 = (proyectos || []).filter(p => !(Number(p.Metros_Cuadrados) > 0)).length;
if (sinM2 > 0) alertas.push(`🔵 ${sinM2} proyectos sin m² cargados`);

const panel = document.getElementById("panel-alertas");
if (panel) {
  panel.innerHTML = alertas.length
    ? `<ul style="margin:0; padding-left:18px;">${alertas.map(a => `<li>${a}</li>`).join("")}</ul>`
    : `<p style="margin:0;">✅ Todo en orden. No hay alertas importantes.</p>`;
}

      // ===== Gráfico: Presupuestos por Estado =====
      const conteoEstado = {};
      (presupuestos || []).forEach(p => {
        const est = (p.estado || "sin_estado").toLowerCase();
        conteoEstado[est] = (conteoEstado[est] || 0) + 1;
      });

      const estados = Object.keys(conteoEstado);
      const valoresEst = estados.map(e => conteoEstado[e]);

      const ctxPres = document.getElementById("chartPresupuestosEstado");
      if (ctxPres) {
        chartPresupuestos?.destroy();
        chartPresupuestos = new Chart(ctxPres, {
          type: "doughnut",
          data: { labels: estados, datasets: [{ data: valoresEst }] },
          options: { responsive: true }
        });
      }
      // ===== Gráfico: CO2 evitado por Provincia =====
const co2PorProvincia = {};
(proyectos || []).forEach(p => {
  const prov = (p.Provincia || "Sin provincia").trim();
  const m2 = Number(p.Metros_Cuadrados) || 0;
  const co2t = (m2 * FACTOR_CO2_KG_POR_M2) / 1000; // en toneladas
  co2PorProvincia[prov] = (co2PorProvincia[prov] || 0) + co2t;
});

const provCO2Labels = Object.keys(co2PorProvincia);
const provCO2Values = provCO2Labels.map(k => Number(co2PorProvincia[k].toFixed(3)));

const ctxCO2 = document.getElementById("chartCO2Provincia");
if (ctxCO2) {
  chartCO2Provincia?.destroy();
  chartCO2Provincia = new Chart(ctxCO2, {
    type: "bar",
    data: {
      labels: provCO2Labels,
      datasets: [{ label: "tCO₂e evitadas (est.)", data: provCO2Values }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } }
    }
  });
}

// ===== KPI CO2 (estimado) =====
let totalM2 = 0;
(proyectos || []).forEach(p => {
  const m2 = Number(p.Metros_Cuadrados) || 0;
  totalM2 += m2;
});

const co2Kg = totalM2 * FACTOR_CO2_KG_POR_M2;
const co2Ton = co2Kg / 1000;

const elCo2 = document.getElementById("kpi-co2");
if (elCo2) elCo2.textContent = `${co2Ton.toFixed(2)} t`;

    } catch (err) {
      console.error("❌ Error renderDashboardReal:", err);
    }
  }

  // === Cargar contenido según sección ===
  const modulos = {};

  async function cargarSeccion(section) {
    titulo.textContent = section.charAt(0).toUpperCase() + section.slice(1);
    contenido.style.opacity = 0;

    setTimeout(async () => {
      try {
        switch (section) {
          case 'inicio':
            contenido.innerHTML = `
  <div class="dash-header">
    <h2>Bienvenido 🌿, ${usuarioLogueado.nombre}</h2>
    <p>Resumen general de la actividad del sistema</p>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card"><i class="fas fa-project-diagram"></i><span>Proyectos: <b id="kpi-proyectos">--</b></span></div>
    <div class="kpi-card"><i class="fas fa-users"></i><span>Clientes: <b id="kpi-clientes">--</b></span></div>
    <div class="kpi-card"><i class="fas fa-file-invoice-dollar"></i><span>Presupuestos: <b id="kpi-presupuestos">--</b></span></div>
    <div class="kpi-card"><i class="fas fa-check-circle"></i><span>% Aprobados: <b id="kpi-aprobados">--%</b></span></div>
    <div class="kpi-card"><i class="fas fa-leaf"></i><span>CO₂ evitado (est.): <b id="kpi-co2">-- t</b></span></div>
  </div>
<div class="dash-chart" style="margin-top:16px;">
  <h3 style="margin:0 0 10px;">Alertas & Estado del sistema</h3>
  <div id="panel-alertas" style="color:#444;">Cargando...</div>
</div>

  <div class="dash-main-layout">
    <div class="dash-chart">
      <h3 style="margin:0 0 10px;">Proyectos por Provincia</h3>
      <canvas id="chartProyectosProvincia"></canvas>
    </div>

    <div class="dash-chart">
      <h3 style="margin:0 0 10px;">Presupuestos por Estado</h3>
      <canvas id="chartPresupuestosEstado"></canvas>
    </div>
  </div>

  <div class="dash-chart" style="margin-top:16px;">
    <h3 style="margin:0 0 10px;">CO₂ evitado estimado por Provincia</h3>
    <canvas id="chartCO2Provincia"></canvas>
    <p style="margin:10px 0 0; font-size:0.9em; color:#666;">
      *Estimación basada en m² y un factor configurable (no verificado).
    </p>
  </div>

  <div class="side-panel" style="margin-top:16px;">
    <div id="dashboard-proximos-eventos" style="padding:15px; background:#fafafa; border-radius:8px; border:1px solid #e0e0e0;">
      <h3>Cargando próximos eventos...</h3>
    </div>
  </div>
`;

            await renderDashboardReal();        // ✅ nuevo
            await renderProximosEventosEnDashboard();
            break;

          case 'proyectos':
            modulos.proyectos ??= await import('./proyectos-ui.js');
            await modulos.proyectos.mostrarProyectos();
            break;

          case 'clientes':
            modulos.clientes ??= await import('./clientes-ui.js');
            await modulos.clientes.mostrarClientes();
            break;

          case 'calendario':
            modulos.calendario ??= await import('./calendario-ui.js');
            await modulos.calendario.mostrarCalendario();
            // Aquí ya se renderiza en calendario-ui.js, no repetimos
            break;

          case 'presupuesto':
            modulos.presupuesto ??= await import('./presupuesto-ui.js');
            await modulos.presupuesto.mostrarPresupuestos();
            break;

          case 'materiales':
            modulos.materiales ??= await import('./materiales-ui.js');
            await modulos.materiales.mostrarMateriales(); break;
          case 'progreso':
            modulos.progreso ??= await import('./progreso-ui.js');
            await modulos.progreso.mostrarProgreso(); break;
          case 'mensajes':
            modulos.mensajes ??= await import('./mensajes-ui.js');
            await modulos.mensajes.mostrarMensajes(); break;
          case 'usuarios':
            modulos.usuarios ??= await import('./usuarios-ui.js');
            await modulos.usuarios.cargarUsuariosUI(); break;
          case 'configuracion':
            modulos.configuracion ??= await import('./configuracion-ui.js');
            await modulos.configuracion.mostrarConfiguracion(); break;

          default:
            contenido.innerHTML = `<h3>Sección en desarrollo: ${section}</h3>`;
        }
      } catch (err) {
        console.error(`❌ Error cargando módulo ${section}:`, err);
        contenido.innerHTML = `<p style="color:#c62828;">Error al cargar la sección ${section}</p>`;
      }

      setTimeout(() => (contenido.style.opacity = 1), 120);
    }, 180);
  }

  // === Manejo de clics en menú ===
  document.querySelectorAll('.menu li').forEach(item => {
    item.addEventListener('click', async () => {
      document.querySelector('.menu li.active')?.classList.remove('active');
      item.classList.add('active');

      const section = item.getAttribute('data-section');
      await cargarSeccion(section);
    });
  });

  // Cargar dashboard inicial
  cargarSeccion('inicio');

  // === User dropdown (ya lo tenías) ===
  const userDropdownBtn = document.getElementById("userDropdownBtn");
  const userDropdown = document.getElementById("userDropdown");
  const btnMiPerfil = document.getElementById("btnMiPerfil");
  const btnConfig = document.getElementById("btnConfig");
  const btnLogout2 = document.getElementById("btnLogout");

  if (userDropdownBtn) {
    userDropdownBtn.addEventListener("click", () => {
      userDropdown.classList.toggle("oculto");
    });
  }

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".user-menu")) {
      userDropdown?.classList.add("oculto");
    }
  });

  if (btnMiPerfil) {
    btnMiPerfil.addEventListener("click", () => {
      userDropdown?.classList.add("oculto");
      import("./perfil-ui.js").then(m => m.mostrarPerfil?.());
    });
  }

  // Ocultar config si no es admin
  if (usuarioLogueado.rol !== "admin" && document.querySelector(".admin-only")) {
    document.querySelector(".admin-only").style.display = "none";
  }

  if (btnConfig) {
    btnConfig.addEventListener("click", () => {
      userDropdown?.classList.add("oculto");
      document.querySelector("[data-section='configuracion']")?.click();
    });
  }

  if (btnLogout2) {
    btnLogout2.addEventListener("click", () => {
      localStorage.removeItem("usuario");
      window.location.href = "index.html";
    });
  }
});