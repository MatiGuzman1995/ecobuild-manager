console.log("🔐 Sistema de login cargado");

const form = document.getElementById('loginForm');
const mensaje = document.getElementById('mensaje');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const usuario = document.getElementById('username').value.trim();
  const contraseña = document.getElementById('password').value.trim();

  if (!usuario || !contraseña) {
    mensaje.textContent = '⚠️ Ingresá tu usuario y contraseña';
    mensaje.style.color = 'orange';
    return;
  }

  try {
    const user = await window.api.loginUsuario(usuario, contraseña);

    if (user) {
      console.log(`✅ Login correcto: ${user.usuario} (${user.rol})`);

      // Guardamos los datos del usuario logueado
      const datosUsuario = {
        id: user.id,
        nombre: user.nombre,
        rol: user.rol
      };

      localStorage.setItem('usuario', JSON.stringify(datosUsuario));

      // Mensaje visual de confirmación
      mensaje.textContent = `Bienvenido ${user.nombre} 👋`;
      mensaje.style.color = 'green';

      // Redirige al dashboard
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);
    } else {
      mensaje.textContent = '❌ Usuario o contraseña incorrectos';
      mensaje.style.color = 'red';
    }
  } catch (error) {
    console.error('Error durante el login:', error);
    mensaje.textContent = '⚠️ Error de conexión con la base de datos';
    mensaje.style.color = 'red';
  }
});
