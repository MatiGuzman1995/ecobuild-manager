console.log("💬 Módulo Mensajes cargado");

const contenido = document.getElementById('contenido');

// Almacena los cambios pendientes (estado modificado)
let cambiosPendientes = new Map(); // id_mensaje → nuevo estado

async function renderizarMensajes() {
  try {
    const mensajes = await window.api.obtenerMensajes();

    const leidos = mensajes.filter(m => m.estado === "leido").length;
    const noLeidos = mensajes.filter(m => m.estado === "no_leido").length;

    let html = `
      <div style="display:flex; gap:20px; margin-bottom:20px;">
        <div style="color:#ffc107;">No leídos: ${noLeidos}</div>
        <div style="color:#28a745;">Leídos: ${leidos}</div>
        <div>Total: ${mensajes.length}</div>
      </div>

      <div class="mensajes-lista" style="display:flex; flex-direction: column; gap: 10px;">
    `;

    mensajes.forEach((m) => {
      const borde = m.estado === "leido" ? "#28a745" : "#ffc107";
      const colorTitulo = m.estado === "leido" ? "#28a745" : "#ffc107";
      const btnLeido = m.estado === "leido" ? "Marcar no leído" : "Marcar leído";

      html += `
        <div class="mensaje" style="background:#fff; border-left:5px solid ${borde}; padding:15px; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
          <h3 style="margin:0 0 5px 0; color:${colorTitulo}">${m.asunto}</h3>
          <p style="margin:2px 0; font-weight:bold; color:black;">${m.nombre} ${m.apellido ?? ''}</p>
          <p style="margin:0 0 5px 0; font-style:italic; font-size:0.9em; color:black;">${m.email}</p>
          <p style="margin:5px 0; color:black;">${m.contenido}</p>
          <div style="margin-top:10px;">
            <button class="btn-estado" data-id="${m.id_mensaje}" style="padding:6px 12px; border:1px solid #000; border-radius:4px; background:#fff; color:#000; cursor:pointer;">
              ${btnLeido}
            </button>
            <button class="btn-borrar" data-id="${m.id_mensaje}" style="padding:6px 12px; border:none; border-radius:4px; background:#dc3545; color:white; cursor:pointer; margin-left:5px;">
              Borrar
            </button>
          </div>
        </div>
      `;
    });

    html += `
      </div>
      <div style="margin-top:25px; text-align:center;">
        <button id="btn-guardar" style="padding:10px 20px; background:#007bff; color:white; border:none; border-radius:5px; cursor:pointer;">
          💾 Guardar cambios
        </button>
      </div>
    `;

    contenido.innerHTML = html;

    // Cambiar estado
    document.querySelectorAll('.btn-estado').forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        const mensaje = mensajes.find(m => m.id_mensaje == id);
        const nuevoEstado = mensaje.estado === "leido" ? "no_leido" : "leido";
        mensaje.estado = nuevoEstado;
        cambiosPendientes.set(id, nuevoEstado);
        btn.textContent = nuevoEstado === "leido" ? "Marcar no leído" : "Marcar leído";
        btn.style.background = "#ffc107";
      };
    });

    // Borrar mensaje
    document.querySelectorAll('.btn-borrar').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        if (confirm("¿Seguro que querés borrar este mensaje?")) {
          await window.api.borrarMensaje(id);
          renderizarMensajes();
        }
      };
    });

    // Guardar todos los cambios
    document.getElementById('btn-guardar').onclick = async () => {
      if (cambiosPendientes.size === 0) {
        alert("No hay cambios para guardar.");
        return;
      }

      for (const [id, nuevoEstado] of cambiosPendientes.entries()) {
        await window.api.cambiarEstadoMensaje(id, nuevoEstado);
      }

      alert("✅ Cambios guardados correctamente.");
      cambiosPendientes.clear();
      renderizarMensajes();
    };

  } catch (error) {
    console.error("❌ Error al obtener mensajes:", error);
    contenido.innerHTML = `<p style="color:red;">Error al cargar los mensajes.</p>`;
  }
}

// Primer render
renderizarMensajes();
