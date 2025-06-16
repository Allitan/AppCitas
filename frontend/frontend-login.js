const API_BASE = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', function () {
    // Login Profesional
    if (document.getElementById('prof-login-form')) {
        document.getElementById('prof-login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const Email = document.getElementById('prof-email').value;
            const Contraseña = document.getElementById('prof-password').value;
            const msg = document.getElementById('prof-login-msg');
            msg.textContent = 'Enviando...';
            msg.className = '';
            try {
                const res = await fetch(`${API_BASE}/profesionales/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ Email, Contraseña })
                });
                const data = await res.json();
                if (res.ok && data.token) {
                    msg.textContent = 'Login exitoso. Redirigiendo...';
                    msg.className = 'text-success';
                    localStorage.setItem('profesionalToken', data.token);
                    setTimeout(() => { window.location.href = 'app.html'; }, 1000);
                } else {
                    msg.textContent = data.error || 'Error en el login';
                    msg.className = 'text-danger';
                }
            } catch (err) {
                msg.textContent = 'Error de red';
                msg.className = 'text-danger';
            }
        });
    }

    // Login Cliente
    if (document.getElementById('cli-login-form')) {
        document.getElementById('cli-login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const Email = document.getElementById('cli-email').value;
            const Contraseña = document.getElementById('cli-password').value;
            const msg = document.getElementById('cli-login-msg');
            msg.textContent = 'Enviando...';
            msg.className = '';
            try {
                const res = await fetch(`${API_BASE}/clientes/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ Email, Contraseña })
                });
                const data = await res.json();
                if (res.ok && data.token) {
                    msg.textContent = 'Login exitoso. Redirigiendo...';
                    msg.className = 'text-success';
                    localStorage.setItem('clienteToken', data.token);
                    setTimeout(() => { window.location.href = 'app.html'; }, 1000);
                } else {
                    msg.textContent = data.error || 'Error en el login';
                    msg.className = 'text-danger';
                }
            } catch (err) {
                msg.textContent = 'Error de red';
                msg.className = 'text-danger';
            }
        });
    }

    // Registro Profesional
    if (document.getElementById('prof-reg-form')) {
        document.getElementById('prof-reg-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const Nombre = document.getElementById('prof-reg-nombre').value;
            const Email = document.getElementById('prof-reg-email').value;
            const Teléfono = document.getElementById('prof-reg-telefono').value;
            const Contraseña = document.getElementById('prof-reg-password').value;
            const Especialidad = document.getElementById('prof-reg-especialidad') ? document.getElementById('prof-reg-especialidad').value : '';
            const Duración = document.getElementById('prof-reg-duracion').value;
            const Precio = document.getElementById('prof-reg-precio').value;
            const msg = document.getElementById('prof-reg-msg');
            msg.textContent = 'Enviando...';
            msg.className = '';
            try {
                const res = await fetch(`${API_BASE}/profesionales/registro`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ Nombre, Email, Teléfono, Contraseña, Especialidad, Duración, Precio })
                });
                const data = await res.json();
                msg.textContent = data.message || data.error;
                msg.className = res.ok ? 'text-success' : 'text-danger';
            } catch (err) {
                msg.textContent = 'Error de red';
                msg.className = 'text-danger';
            }
        });
    }

    // Registro Cliente
    if (document.getElementById('cli-reg-form')) {
        document.getElementById('cli-reg-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const Nombre = document.getElementById('cli-reg-nombre').value;
            const Email = document.getElementById('cli-reg-email').value;
            const Teléfono = document.getElementById('cli-reg-telefono').value;
            const Contraseña = document.getElementById('cli-reg-password').value;
            const msg = document.getElementById('cli-reg-msg');
            msg.textContent = 'Enviando...';
            msg.className = '';
            try {
                const res = await fetch(`${API_BASE}/clientes/registro`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ Nombre, Email, Teléfono, Contraseña })
                });
                const data = await res.json();
                msg.textContent = data.message || data.error;
                msg.className = res.ok ? 'text-success' : 'text-danger';
            } catch (err) {
                msg.textContent = 'Error de red';
                msg.className = 'text-danger';
            }
        });
    }
});
