export function mostrarConfiguracion() {
  const contenido = document.getElementById("contenido");

  contenido.innerHTML = `
    <h2>⚙️ Configuración del Sistema</h2>

    <div class="config-box">

      <div class="config-item">
        <h3>👤 Mi Perfil</h3>
        <p>Editar datos personales y contraseña</p>
        <button id="btnIrPerfil" class="btn-primary">Ir a Mi Perfil</button>
      </div>

      <div class="config-item">
        <h3>🌱 Información del sistema</h3>
        <p>EcoBuildManager v1.0</p>
        <p>Desarrollado para Terra C</p>
      </div>

      <div class="config-item">
        <h3>🛡️ Seguridad</h3>
        <p>Próximamente: Roles avanzados, auditoría, logs</p>
      </div>

    </div>
  `;

  document.getElementById("btnIrPerfil").addEventListener("click", () => {
    import("./perfil-ui.js").then(m => m.mostrarPerfil());
  });
}
