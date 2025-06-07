const API_BASE = 'http://localhost:3000/api';

function getUserTypeAndToken() {
    const profesionalToken = localStorage.getItem('profesionalToken');
    const clienteToken = localStorage.getItem('clienteToken');
    if (profesionalToken) return { type: 'profesional', token: profesionalToken };
    if (clienteToken) return { type: 'cliente', token: clienteToken };
    return null;
}

function logout() {
    localStorage.removeItem('profesionalToken');
    localStorage.removeItem('clienteToken');
    window.location.href = 'frontend-login.html';
}

function renderCitas(citas, tipo) {
    if (!Array.isArray(citas) || citas.length === 0) {
        return '<div class="text-muted">No hay citas registradas.</div>';
    }
    let html = '<ul class="list-group">';
    for (const cita of citas) {
        html += `<li class="list-group-item">
            <b>Fecha:</b> ${cita.Fecha || ''} <b>Hora:</b> ${cita.Hora || ''}<br>
            <b>Estado:</b> ${cita.Estado || ''}
        </li>`;
    }
    html += '</ul>';
    return html;
}

async function renderDashboard(user, mainContent) {
    let welcomeMsg = '';
    let userId = '';
    let extraInfo = '';
    let citasHtml = '';
    try {
        if (user.type === 'profesional') {
            const payload = parseJwt(user.token);
            userId = payload.profesionalId;
            welcomeMsg = `¡Bienvenido, Profesional!`;
            const res = await fetch(`${API_BASE}/profesionales/${userId}`, {
                headers: { 'Authorization': 'Bearer ' + user.token }
            });
            if (res.ok) {
                const data = await res.json();
                extraInfo = `<div class='mb-3'><b>Nombre:</b> ${data.Nombre || ''}<br><b>Email:</b> ${data.Email || ''}</div>`;
            }
            const citasRes = await fetch(`${API_BASE}/profesionales/${userId}/citas`, {
                headers: { 'Authorization': 'Bearer ' + user.token }
            });
            if (citasRes.ok) {
                const citas = await citasRes.json();
                citasHtml = renderCitas(citas, 'profesional');
            } else {
                citasHtml = `<div class='text-danger mt-3'>No se pudieron obtener las citas.</div>`;
            }
        } else if (user.type === 'cliente') {
            const payload = parseJwt(user.token);
            userId = payload.clientId;
            welcomeMsg = `¡Bienvenido, Cliente!`;
            const res = await fetch(`${API_BASE}/clientes/${userId}`, {
                headers: { 'Authorization': 'Bearer ' + user.token }
            });
            if (res.ok) {
                const data = await res.json();
                extraInfo = `<div class='mb-3'><b>Nombre:</b> ${data.Nombre || ''}<br><b>Email:</b> ${data.Email || ''}</div>`;
            }
            const citasRes = await fetch(`${API_BASE}/citas/cliente/${userId}`, {
                headers: { 'Authorization': 'Bearer ' + user.token }
            });
            if (citasRes.ok) {
                const citas = await citasRes.json();
                citasHtml = renderCitas(citas, 'cliente');
            } else {
                citasHtml = `<div class='text-danger mt-3'>No se pudieron obtener las citas.</div>`;
            }
        }
    } catch (err) {
        extraInfo = `<div class='text-danger mt-3'>No se pudo obtener información adicional.</div>`;
    }
    mainContent.innerHTML = `
        <h2>${welcomeMsg}</h2>
        <div class='mb-2'><b>ID:</b> ${userId}</div>
        ${extraInfo}
        <div class='mt-4'>
            <h4>Mis Citas</h4>
            ${citasHtml}
        </div>
    `;
}

async function renderProfile(user, mainContent) {
    let userId = '';
    let profileHtml = '';
    let data = {};
    try {
        if (user.type === 'profesional') {
            const payload = parseJwt(user.token);
            userId = payload.profesionalId;
            const res = await fetch(`${API_BASE}/profesionales/${userId}`, {
                headers: { 'Authorization': 'Bearer ' + user.token }
            });
            if (res.ok) {
                data = await res.json();
                profileHtml = renderProfileView('profesional', data, false);
            }
        } else if (user.type === 'cliente') {
            const payload = parseJwt(user.token);
            userId = payload.clientId;
            const res = await fetch(`${API_BASE}/clientes/${userId}`, {
                headers: { 'Authorization': 'Bearer ' + user.token }
            });
            if (res.ok) {
                data = await res.json();
                profileHtml = renderProfileView('cliente', data, false);
            }
        }
    } catch (err) {
        profileHtml = `<div class='text-danger mt-3'>No se pudo obtener el perfil.</div>`;
    }
    mainContent.innerHTML = profileHtml;
    const editBtn = document.getElementById('edit-profile-btn');
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            mainContent.innerHTML = renderProfileView(user.type, data, true);
            attachProfileFormHandler(user, mainContent, data);
        });
    }
}

function renderProfileView(type, data, editing) {
    if (!editing) {
        if (type === 'profesional' || type === 'cliente') {
            return `
            <div class="card profile-card mx-auto shadow">
                <div class="card-body text-center">
                    <div class="mb-3">
                        <i class="bi bi-person-circle" style="font-size: 4rem; color: #2575fc;"></i>
                    </div>
                    <h4 class="card-title mb-2">${data.Nombre || ''}</h4>
                    <div class="mb-2 text-muted">${type === 'profesional' ? 'Profesional' : 'Cliente'}</div>
                    <div class="mb-2"><b>Email:</b> ${data.Email || ''}</div>
                    ${type === 'profesional' ? `<div class="mb-2"><b>Especialidad:</b> ${data.Especialidad || ''}</div>` : ''}
                    <div class="mb-2"><b>Teléfono:</b> ${data.Teléfono || ''}</div>
                    <button class='btn btn-primary mt-3' id='edit-profile-btn'>Editar</button>
                </div>
            </div>
            `;
        }
    } else {
        if (type === 'profesional') {
            return `
            <div class="card profile-card mx-auto shadow">
                <div class="card-body">
                    <h4 class="card-title mb-3 text-center">Editar Perfil Profesional</h4>
                    <form id='profile-form'>
                        <div class='mb-2'><label>Nombre</label><input class='form-control' name='Nombre' value='${data.Nombre || ''}' required></div>
                        <div class='mb-2'><label>Email</label><input class='form-control' name='Email' value='${data.Email || ''}' required></div>
                        <div class='mb-2'><label>Especialidad</label><input class='form-control' name='Especialidad' value='${data.Especialidad || ''}'></div>
                        <div class='mb-2'><label>Teléfono</label><input class='form-control' name='Teléfono' value='${data.Teléfono || ''}'></div>
                        <div class='d-flex justify-content-between'>
                            <button class='btn btn-success mt-2' type='submit'>Guardar</button>
                            <button class='btn btn-secondary mt-2 ms-2' type='button' id='cancel-edit-btn'>Cancelar</button>
                        </div>
                        <div id='profile-msg' class='mt-2'></div>
                    </form>
                </div>
            </div>
            `;
        } else {
            return `
            <div class="card profile-card mx-auto shadow">
                <div class="card-body">
                    <h4 class="card-title mb-3 text-center">Editar Perfil Cliente</h4>
                    <form id='profile-form'>
                        <div class='mb-2'><label>Nombre</label><input class='form-control' name='Nombre' value='${data.Nombre || ''}' required></div>
                        <div class='mb-2'><label>Email</label><input class='form-control' name='Email' value='${data.Email || ''}' required></div>
                        <div class='mb-2'><label>Teléfono</label><input class='form-control' name='Teléfono' value='${data.Teléfono || ''}'></div>
                        <div class='d-flex justify-content-between'>
                            <button class='btn btn-success mt-2' type='submit'>Guardar</button>
                            <button class='btn btn-secondary mt-2 ms-2' type='button' id='cancel-edit-btn'>Cancelar</button>
                        </div>
                        <div id='profile-msg' class='mt-2'></div>
                    </form>
                </div>
            </div>
            `;
        }
    }
}

function attachProfileFormHandler(user, mainContent, data) {
    const form = document.getElementById('profile-form');
    const cancelBtn = document.getElementById('cancel-edit-btn');
    const msg = document.getElementById('profile-msg');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const body = {};
        for (const [key, value] of formData.entries()) {
            body[key] = value;
        }
        msg.textContent = 'Actualizando...';
        msg.className = '';
        let endpoint = '';
        let id = '';
        if (user.type === 'profesional') {
            id = parseJwt(user.token).profesionalId;
            endpoint = `${API_BASE}/profesionales/${id}`;
        } else {
            id = parseJwt(user.token).clientId;
            endpoint = `${API_BASE}/clientes/${id}`;
        }
        try {
            const res = await fetch(endpoint, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + user.token
                },
                body: JSON.stringify(body)
            });
            const result = await res.json();
            if (res.ok) {
                msg.textContent = 'Perfil actualizado exitosamente.';
                msg.className = 'text-success';
                setTimeout(() => renderProfile(user, mainContent), 1200);
            } else {
                msg.textContent = result.error || 'Error al actualizar el perfil.';
                msg.className = 'text-danger';
            }
        } catch (err) {
            msg.textContent = 'Error de red.';
            msg.className = 'text-danger';
        }
    });
    cancelBtn.addEventListener('click', () => {
        mainContent.innerHTML = renderProfileView(user.type, data, false);
        const editBtn = document.getElementById('edit-profile-btn');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                mainContent.innerHTML = renderProfileView(user.type, data, true);
                attachProfileFormHandler(user, mainContent, data);
            });
        }
    });
}

// Renderizar sección de disponibilidad para profesionales
async function renderDisponibilidad(user, mainContent) {
    let userId = '';
    let dispHtml = '';
    let data = {};
    try {
        const payload = parseJwt(user.token);
        userId = payload.profesionalId;
        // Obtener disponibilidad actual
        const res = await fetch(`${API_BASE}/profesionales/${userId}/disponibilidad`, {
            headers: { 'Authorization': 'Bearer ' + user.token }
        });
        let lista = [];
        if (res.ok) {
            const result = await res.json();
            lista = Array.isArray(result) ? result : (result.data || []);
        }
        dispHtml = `
            <div class="card profile-card mx-auto shadow">
                <div class="card-body">
                    <h4 class="card-title mb-3 text-center">Gestionar Disponibilidad</h4>
                    <form id="disponibilidad-form" class="row g-2 justify-content-center mb-4">
                        <div class="col-12 col-md-4">
                            <select class="form-select" name="dia" required>
                                <option value="">Día</option>
                                <option value="Lunes">Lunes</option>
                                <option value="Martes">Martes</option>
                                <option value="Miércoles">Miércoles</option>
                                <option value="Jueves">Jueves</option>
                                <option value="Viernes">Viernes</option>
                                <option value="Sábado">Sábado</option>
                                <option value="Domingo">Domingo</option>
                            </select>
                        </div>
                        <div class="col-6 col-md-3">
                            <input type="time" class="form-control" name="horaInicio" required placeholder="Inicio">
                        </div>
                        <div class="col-6 col-md-3">
                            <input type="time" class="form-control" name="horaFin" required placeholder="Fin">
                        </div>
                        <div class="col-12 mt-2">
                            <button type="submit" class="btn btn-success w-100">Agregar</button>
                        </div>
                        <div id="disponibilidad-msg" class="mt-2"></div>
                    </form>
                    <h5 class="mb-3">Horarios Registrados</h5>
                    <ul class="list-group" id="disponibilidad-list">
                        ${lista.length === 0 ? '<li class="list-group-item text-muted">No hay disponibilidad registrada.</li>' :
                            lista.map(d => `<li class="list-group-item"><b>${d.Dia}</b>: ${d.HoraInicio} - ${d.HoraFin}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
    } catch (err) {
        dispHtml = `<div class='text-danger mt-3'>No se pudo obtener la disponibilidad.</div>`;
    }
    mainContent.innerHTML = dispHtml;
    // Formulario de agregar disponibilidad
    const dispForm = document.getElementById('disponibilidad-form');
    if (dispForm) {
        dispForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const msg = document.getElementById('disponibilidad-msg');
            msg.textContent = 'Enviando...';
            msg.className = '';
            const formData = new FormData(dispForm);
            const body = {};
            for (const [key, value] of formData.entries()) {
                body[key] = value;
            }
            const profesionalId = parseJwt(user.token).profesionalId;
            try {
                const res = await fetch(`${API_BASE}/profesionales/${profesionalId}/disponibilidad`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + user.token
                    },
                    body: JSON.stringify(body)
                });
                const result = await res.json();
                if (res.ok) {
                    msg.textContent = 'Disponibilidad agregada exitosamente.';
                    msg.className = 'text-success';
                    dispForm.reset();
                    setTimeout(() => renderDisponibilidad(user, mainContent), 1000);
                } else {
                    msg.textContent = result.error || 'Error al agregar disponibilidad.';
                    msg.className = 'text-danger';
                }
            } catch (err) {
                msg.textContent = 'Error de red.';
                msg.className = 'text-danger';
            }
        });
    }
}

function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return {};
    }
}

document.addEventListener('DOMContentLoaded', async function () {
    const user = getUserTypeAndToken();
    if (!user) {
        window.location.href = 'frontend-login.html';
        return;
    }
    const mainContent = document.getElementById('main-content');
    const logoutBtn = document.getElementById('logout-btn');
    const navDashboard = document.getElementById('nav-dashboard');
    const navProfile = document.getElementById('nav-profile');
    const navDispItem = document.getElementById('nav-disponibilidad-item');
    const navDisp = document.getElementById('nav-disponibilidad');

    if (user.type === 'profesional' && navDispItem) {
        navDispItem.style.display = '';
    }

    navDashboard.addEventListener('click', (e) => {
        e.preventDefault();
        setActiveNav('dashboard');
        renderDashboard(user, mainContent);
    });
    navProfile.addEventListener('click', (e) => {
        e.preventDefault();
        setActiveNav('profile');
        renderProfile(user, mainContent);
    });
    if (navDisp) {
        navDisp.addEventListener('click', (e) => {
            e.preventDefault();
            setActiveNav('disponibilidad');
            renderDisponibilidad(user, mainContent);
        });
    }
    logoutBtn.addEventListener('click', logout);

    setActiveNav('dashboard');
    renderDashboard(user, mainContent);
});

function setActiveNav(section) {
    document.getElementById('nav-dashboard').classList.remove('active');
    document.getElementById('nav-profile').classList.remove('active');
    const navDisp = document.getElementById('nav-disponibilidad');
    if (navDisp) navDisp.classList.remove('active');
    if (section === 'dashboard') {
        document.getElementById('nav-dashboard').classList.add('active');
    } else if (section === 'disponibilidad') {
        if (navDisp) navDisp.classList.add('active');
    } else {
        document.getElementById('nav-profile').classList.add('active');
    }
}
