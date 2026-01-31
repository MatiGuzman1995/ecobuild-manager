console.log("📈 Módulo Progreso cargado");

export async function mostrarProgreso() {
  const contenido = document.getElementById('contenido');

  // Datos simulados
  const obras = [
    { id: 1, nombre: "Vivienda Norte", avance: 80 },
    { id: 2, nombre: "Centro Verde", avance: 35 },
    { id: 3, nombre: "Oficina Eco", avance: 100 }
  ];

  let html = `
    <h2>Progreso de Obras</h2>
    <div class="progreso-lista">
  `;

  obras.forEach(o => {
    html += `
      <div class="progreso-item">
        <p><strong>${o.nombre}</strong> — ${o.avance}%</p>
        <div class="barra-externa">
          <div class="barra-interna" style="width:${o.avance}%;"></div>
        </div>
      </div>
    `;
  });

  html += `</div>`;
  contenido.innerHTML = html;
}
