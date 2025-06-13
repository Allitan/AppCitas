const API_BASE = 'http://localhost:3000/api';

// Traducción de día de inglés a español para mostrar al cliente
const diasMapEnEs = {
    'Monday': 'Lunes',
    'Tuesday': 'Martes',
    'Wednesday': 'Miércoles',
    'Thursday': 'Jueves',
    'Friday': 'Viernes',
    'Saturday': 'Sábado',
    'Sunday': 'Domingo'
};

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
        html += `<li class="list-group-item d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-2 shadow-sm border rounded">
            <div class="d-flex align-items-center mb-2 mb-md-0">
                <i class="bi bi-calendar-event me-3 text-primary" style="font-size:1.7rem;"></i>
                <div>
                    <div><b>Fecha:</b> <span class="badge bg-light text-dark border">${cita.Fecha || ''}</span></div>
                    <div><b>Hora:</b> <span class="badge bg-info text-dark">${cita.Hora ? cita.Hora.slice(0,5) : ''}</span></div>
                    ${cita.NombreProfesional ? `<div><b>Profesional:</b> <span class="badge bg-primary">${cita.NombreProfesional}</span></div>` : ''}
                    ${cita.EspecialidadProfesional ? `<div><b>Especialidad:</b> <span class="badge bg-secondary">${cita.EspecialidadProfesional}</span></div>` : ''}
                </div>
            </div>
            <div class="d-flex flex-column flex-md-row align-items-md-center gap-2">
                <span class="badge ${cita.Estado === 'Pendiente' ? 'bg-warning text-dark' : cita.Estado === 'Confirmada' ? 'bg-success' : 'bg-secondary'}">${cita.Estado || ''}</span>
                ${cita.NombreServicio ? `<span class="badge bg-secondary">${cita.NombreServicio}</span>` : ''}
                <button class="btn btn-outline-danger btn-sm btn-eliminar-cita" data-id="${cita.ID_Cita}"><i class="bi bi-trash"></i> Eliminar</button>
            </div>
        </li>`;
    }
    html += '</ul>';
    return html;
}

// Evento para eliminar cita (cliente o profesional)
document.addEventListener('click', async function(e) {
    if (e.target.classList.contains('btn-eliminar-cita')) {
        const citaId = e.target.getAttribute('data-id');
        if (!citaId) return;
        if (!confirm('¿Seguro que deseas eliminar esta cita?')) return;
        try {
            const user = getUserTypeAndToken();
            const res = await fetch(`${API_BASE}/citas/${citaId}`, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + user.token }
            });
            if (res.ok) {
                // Recargar dashboard para reflejar el cambio
                const mainContent = document.getElementById('main-content');
                renderDashboard(user, mainContent);
            } else {
                alert('No se pudo eliminar la cita.');
            }
        } catch (err) {
            alert('Error de red al eliminar la cita.');
        }
    }
});

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
            // CORREGIDO: endpoint correcto para obtener citas del cliente
            const citasRes = await fetch(`${API_BASE}/citas/clientes/${userId}/citas`, {
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
        <div class="row justify-content-center">
            <div class="col-12 col-md-8 col-lg-6">
                <div class="card shadow-lg border-0 mb-4">
                    <div class="card-body text-center">
                        <div class="mb-3">
                            <i class="bi bi-person-circle" style="font-size: 4rem; color: #2575fc;"></i>
                        </div>
                        <h2 class="card-title mb-2">${welcomeMsg}</h2>
                        <div class="mb-2"><span class="badge bg-primary">ID: ${userId}</span></div>
                        ${extraInfo}
                    </div>
                </div>
            </div>
        </div>
        <div class="row justify-content-center">
            <div class="col-12 col-md-8 col-lg-6">
                <div class="card shadow-sm border-0">
                    <div class="card-body">
                        <h4 class="card-title mb-3">Mis Citas</h4>
                        ${citasHtml}
                    </div>
                </div>
            </div>
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
                    <div class="alert alert-info">Recuerda: solo los horarios que agregues aquí estarán disponibles para que los clientes agenden citas. Asegúrate de cubrir todos los días y horas en los que realmente puedes atender.</div>
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
                    lista.map(d => `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                    <b>${d.Dia}</b>: ${d.HoraInicio} - ${d.HoraFin}
                    </div>
                    <div class="d-flex flex-column flex-md-row gap-2 align-items-stretch mt-2 mt-md-0">
                        <button class="btn btn-sm btn-outline-primary btn-actualizar-disp" 
                            data-id="${d.ID_Disponibilidad}"
                            data-dia="${d.Dia}"
                            data-horainicio="${d.HoraInicio}"
                            data-horafin="${d.HoraFin}">
                            <i class="bi bi-pencil"></i> Actualizar
                        </button>
                        <button class="btn btn-sm btn-outline-danger btn-eliminar-disp" data-id="${d.ID_Disponibilidad}"><i class="bi bi-trash"></i> Eliminar</button>
                    </div>
                    </li>
                    `).join('')}
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
            // Traducción de día español a inglés para guardar en la base de datos
            const diasMap = {
                'Lunes': 'Monday',
                'Martes': 'Tuesday',
                'Miércoles': 'Wednesday',
                'Jueves': 'Thursday',
                'Viernes': 'Friday',
                'Sábado': 'Saturday',
                'Domingo': 'Sunday'
            };
            for (const [key, value] of formData.entries()) {
                if (key === 'dia') {
                    body[key] = diasMap[value] || value;
                } else {
                    body[key] = value;
                }
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

    // Botón Eliminar Disponibilidad
    document.querySelectorAll('.btn-eliminar-disp').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = btn.getAttribute('data-id');
            if (!confirm('¿Seguro que deseas eliminar este horario?')) return;
            try {
                const profesionalId = parseJwt(user.token).profesionalId;
                const res = await fetch(`${API_BASE}/profesionales/${profesionalId}/disponibilidad/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': 'Bearer ' + user.token }
                });
                if (res.ok) {
                    renderDisponibilidad(user, mainContent);
                } else {
                    alert('No se pudo eliminar la disponibilidad.');
                }
            } catch (err) {
                alert('Error de red al eliminar.');
            }
        });
    });

    // Botón Actualizar Disponibilidad
    document.querySelectorAll('.btn-actualizar-disp').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = btn.getAttribute('data-id');
            const li = btn.closest('li');
            const infoDiv = li.querySelector('div');
            // Extraer datos actuales de los atributos data-
            const dia = btn.getAttribute('data-dia');
            const horaInicio = btn.getAttribute('data-horainicio');
            const horaFin = btn.getAttribute('data-horafin');
            // Reemplazar contenido por formulario de edición
            infoDiv.innerHTML = `
                <form class="d-flex flex-wrap align-items-center w-100 update-disp-form">
                    <select class="form-select form-select-sm me-2 mb-1" name="dia" required>
                        <option value="Lunes"${dia==='Lunes'?' selected':''}>Lunes</option>
                        <option value="Martes"${dia==='Martes'?' selected':''}>Martes</option>
                        <option value="Miércoles"${dia==='Miércoles'?' selected':''}>Miércoles</option>
                        <option value="Jueves"${dia==='Jueves'?' selected':''}>Jueves</option>
                        <option value="Viernes"${dia==='Viernes'?' selected':''}>Viernes</option>
                        <option value="Sábado"${dia==='Sábado'?' selected':''}>Sábado</option>
                        <option value="Domingo"${dia==='Domingo'?' selected':''}>Domingo</option>
                    </select>
                    <input type="time" class="form-control form-control-sm me-2 mb-1" name="horaInicio" value="${horaInicio}" required>
                    <input type="time" class="form-control form-control-sm me-2 mb-1" name="horaFin" value="${horaFin}" required>
                    <button type="submit" class="btn btn-success btn-sm me-2 mb-1">Guardar</button>
                    <button type="button" class="btn btn-secondary btn-sm mb-1 btn-cancelar-actualizar">Cancelar</button>
                </form>
            `;
            // Manejar submit de actualización
            const form = infoDiv.querySelector('.update-disp-form');
            form.addEventListener('submit', async (ev) => {
                ev.preventDefault();
                const formData = new FormData(form);
                // Traducción de día español a inglés para guardar en la base de datos
                const diasMap = {
                    'Lunes': 'Monday',
                    'Martes': 'Tuesday',
                    'Miércoles': 'Wednesday',
                    'Jueves': 'Thursday',
                    'Viernes': 'Friday',
                    'Sábado': 'Saturday',
                    'Domingo': 'Sunday'
                };
                const body = {
                    dia: diasMap[formData.get('dia')] || formData.get('dia'),
                    horaInicio: (formData.get('horaInicio') || '').slice(0,5),
                    horaFin: (formData.get('horaFin') || '').slice(0,5)
                };
                try {
                    const profesionalId = parseJwt(user.token).profesionalId;
                    const res = await fetch(`${API_BASE}/profesionales/${profesionalId}/disponibilidad/${id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + user.token
                        },
                        body: JSON.stringify(body)
                    });
                    if (res.ok) {
                        renderDisponibilidad(user, mainContent);
                    } else {
                        const result = await res.json();
                        alert(result.error || result.message || 'No se pudo actualizar la disponibilidad.');
                    }
                } catch (err) {
                    alert('Error de red al actualizar.');
                }
            });
            // Manejar cancelar
            infoDiv.querySelector('.btn-cancelar-actualizar').addEventListener('click', () => {
                renderDisponibilidad(user, mainContent);
            });
        });
    });
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
    const navProfesionalesItem = document.getElementById('nav-profesionales-item');
    const navProfesionales = document.getElementById('nav-profesionales');

    if (user.type === 'profesional' && navDispItem) {
        navDispItem.style.display = '';
    }
    if (user.type === 'cliente' && navProfesionalesItem) {
        navProfesionalesItem.style.display = '';
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
    if (navProfesionales) {
        navProfesionales.addEventListener('click', (e) => {
            e.preventDefault();
            setActiveNav('profesionales');
            renderProfesionales(user, mainContent);
        });
    }
    logoutBtn.addEventListener('click', logout);

    setActiveNav('dashboard');
    renderDashboard(user, mainContent);
});

// Renderizar lista de profesionales para clientes
async function renderProfesionales(user, mainContent) {
    let html = '';
    try {
        const res = await fetch(`${API_BASE}/profesionales`, {
            headers: { 'Authorization': 'Bearer ' + user.token }
        });
        if (res.ok) {
            const profesionales = await res.json();
            if (Array.isArray(profesionales) && profesionales.length > 0) {
                html = `<div class="row g-4">` +
                    profesionales.map(prof => `
                        <div class="col-12 col-md-6 col-lg-4">
                            <div class="card h-100 shadow-sm">
                                <div class="card-body text-center">
                                    <i class="bi bi-person-badge" style="font-size:2.5rem;color:#2575fc;"></i>
                                    <h5 class="card-title mt-2 mb-1">${prof.Nombre || ''}</h5>
                                    <div class="mb-1 text-muted">${prof.Especialidad ? prof.Especialidad : ''}</div>
                                    <div class="mb-1"><b>Email:</b> ${prof.Email || ''}</div>
                                    <button class="btn btn-primary btn-sm mt-2 btn-ver-disponibilidad" 
                                        data-id="${prof.ID_Profesional || prof.id || prof._id}" 
                                        data-nombre="${prof.Nombre || ''}">
                                        <i class="bi bi-calendar-range"></i> Ver disponibilidad
                                    </button>
                                    <div class="agendar-cita-form mt-3" id="agendar-cita-form-${prof.ID_Profesional || prof.id || prof._id}"></div>
                                </div>
                            </div>
                        </div>
                    `).join('') + `</div>`;
            } else {
                html = '<div class="alert alert-info">No hay profesionales registrados.</div>';
            }
        } else {
            html = '<div class="alert alert-danger">No se pudo obtener la lista de profesionales.</div>';
        }
    } catch (err) {
        html = '<div class="alert alert-danger">Error de red al obtener profesionales.</div>';
    }
    mainContent.innerHTML = `
        <h2 class="mb-4 text-center">Profesionales Disponibles</h2>
        ${html}
    `;

    // Lógica para ver disponibilidad y agendar cita
    document.querySelectorAll('.btn-ver-disponibilidad').forEach(btn => {
        btn.addEventListener('click', async () => {
            const profId = btn.getAttribute('data-id');
            const profNombre = btn.getAttribute('data-nombre');
            const formDiv = document.getElementById(`agendar-cita-form-${profId}`);
            // Si ya hay un panel visible, ocultar
            if (formDiv.innerHTML.trim() !== '') {
                formDiv.innerHTML = '';
                return;
            }
            formDiv.innerHTML = '<div class="text-muted">Cargando disponibilidad...</div>';
            try {
                // Obtener disponibilidad, servicios y citas del profesional
                let disponibilidad = [];
                let servicios = [];
                let citas = [];
                try {
                    // Disponibilidad
                    const res = await fetch(`${API_BASE}/profesionales/${profId}/disponibilidad`, {
                        headers: { 'Authorization': 'Bearer ' + user.token }
                    });
                    if (res.ok) {
                        const result = await res.json();
                        disponibilidad = Array.isArray(result) ? result : (result.data || []);
                    }
                    // Servicios
                    const resServ = await fetch(`${API_BASE}/profesionales/${profId}/servicios`, {
                        headers: { 'Authorization': 'Bearer ' + user.token }
                    });
                    if (resServ.ok) {
                        const resultServ = await resServ.json();
                        servicios = Array.isArray(resultServ) ? resultServ : (resultServ.data || []);
                    }
                    // Citas agendadas
                    const resCitas = await fetch(`${API_BASE}/profesionales/${profId}/citas`, {
                        headers: { 'Authorization': 'Bearer ' + user.token }
                    });
                    if (resCitas.ok) {
                        const resultCitas = await resCitas.json();
                        citas = Array.isArray(resultCitas) ? resultCitas : (resultCitas.data || []);
                    }
                } catch (err) {
                    formDiv.innerHTML = `<div class='alert alert-danger'>Error al obtener la disponibilidad: ${err.message || err}</div>`;
                    return;
                }
                if (!Array.isArray(disponibilidad) || disponibilidad.length === 0) {
                    formDiv.innerHTML = '<div class="alert alert-warning">Este profesional no tiene horarios disponibles.</div>';
                    return;
                }
                // Filtrar disponibilidad para mostrar solo horarios realmente libres
                // Se asume que solo se puede agendar para la próxima semana (como en la lógica actual)
                // Usar días en inglés para comparar con la disponibilidad
                const diasSemanaEn = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
                const hoy = new Date();
                const disponibilidadFiltrada = disponibilidad.filter(d => {
                    // Calcular la próxima fecha para el día seleccionado (en inglés)
                    let diaTarget = diasSemanaEn.indexOf(d.Dia);
                    if (diaTarget === -1) return false;
                    let diasParaProximo = (diaTarget - hoy.getDay() + 7) % 7;
                    if (diasParaProximo === 0) diasParaProximo = 7;
                    const fechaCita = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + diasParaProximo);
                    const fechaStr = fechaCita.toISOString().split('T')[0];
                    // Revisar si ya hay una cita para ese profesional, ese día y esa hora
                    const ocupado = citas.some(cita => cita.Fecha === fechaStr && cita.Hora === d.HoraInicio && cita.Estado !== 'Cancelada');
                    return !ocupado;
                });
                if (disponibilidadFiltrada.length === 0) {
                    // Mensaje de depuración: mostrar la disponibilidad cruda recibida
                    formDiv.innerHTML = `
                        <div class="alert alert-warning">No hay horarios disponibles para agendar en la próxima semana.</div>
                        <details class="mt-2">
                            <summary>Ver disponibilidad recibida del backend</summary>
                            <pre style="max-height:200px;overflow:auto;font-size:0.9em;background:#f8f9fa;border:1px solid #ddd;padding:8px;">${JSON.stringify(disponibilidad, null, 2)}</pre>
                        </details>
                    `;
                    return;
                }
                // Mostrar tabla de disponibilidad filtrada
                let serviciosHtml = '';
                if (servicios.length > 1) {
                    serviciosHtml = `
                        <div class="mb-2">
                            <label class="form-label">Servicio</label>
                            <select class="form-select" id="select-servicio-agendar">
                                ${servicios.map(s => `<option value="${s.ID_Servicio}">${s.Nombre}</option>`).join('')}
                            </select>
                        </div>
                    `;
                } else if (servicios.length === 1) {
                    serviciosHtml = `<input type="hidden" id="select-servicio-agendar" value="${servicios[0].ID_Servicio}">`;
                } else {
                    serviciosHtml = `<div class="alert alert-warning">Este profesional no tiene servicios registrados.</div>`;
                }
                formDiv.innerHTML = `
                    ${serviciosHtml}
                    <div class="table-responsive">
                        <table class="table table-bordered table-sm align-middle mb-2">
                            <thead class="table-light">
                                <tr><th>Día</th><th>Hora inicio</th><th>Hora fin</th><th></th></tr>
                            </thead>
                            <tbody>
                                ${disponibilidadFiltrada.map((d, idx) => `
                                    <tr>
                                        <td>${diasMapEnEs[d.Dia] || d.Dia}</td>
                                        <td>${d.HoraInicio}</td>
                                        <td>${d.HoraFin}</td>
                                        <td><button class="btn btn-success btn-sm btn-agendar-horario" data-idx="${idx}">Agendar</button></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div id="form-agendar-cita-panel"></div>
                    <button type="button" class="btn btn-secondary btn-sm mt-2 btn-cancelar-agendar">Cerrar</button>
                `;
                // Cerrar panel
                formDiv.querySelector('.btn-cancelar-agendar').addEventListener('click', () => {
                    formDiv.innerHTML = '';
                });
                // Lógica para agendar en un horario específico
                formDiv.querySelectorAll('.btn-agendar-horario').forEach(btnAgendar => {
                    btnAgendar.addEventListener('click', async () => {
                        const profId = btn.getAttribute('data-id') || btn.closest('.agendar-cita-form').id.replace('agendar-cita-form-', '');
                        const idx = btnAgendar.getAttribute('data-idx');
                        const horario = disponibilidadFiltrada[idx]; // CORREGIDO: usar la lista filtrada
                        const panel = formDiv.querySelector('#form-agendar-cita-panel');
                        panel.innerHTML = '';
                        // Calcular la próxima fecha para el día seleccionado (usar día en inglés)
                        const diasSemanaEn = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
                        const hoy = new Date();
                        let diaTarget = diasSemanaEn.indexOf(horario.Dia);
                        if (diaTarget === -1) {
                            panel.innerHTML = '<div class="alert alert-danger">No se pudo determinar el día.</div>';
                            return;
                        }
                        // ¡CORRECCIÓN FINAL! Si hoy es domingo (0), getDay() devuelve 0, pero si seleccionas lunes (1), debe ser mañana
                        let hoyIdx = hoy.getDay();
                        let diasParaProximo = (diaTarget - hoyIdx + 7) % 7;
                        if (diasParaProximo === 0) diasParaProximo = 7; // Siempre el próximo, no hoy
                        // DEBUG: mostrar en consola el cálculo de fecha
                        console.log('Hoy:', hoy.toISOString().split('T')[0], 'getDay:', hoyIdx, 'Target:', horario.Dia, 'TargetIdx:', diaTarget, 'diasParaProximo:', diasParaProximo);
                        const fechaCita = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + diasParaProximo);
                        const fechaStr = fechaCita.toISOString().split('T')[0];
                        // DEBUG: mostrar en consola la fecha que se enviará
                        console.log('Agendando para:', fechaStr, 'Hora:', horario.HoraInicio);
                        panel.innerHTML = '<div class="text-muted">Agendando cita...</div>';
                        try {
                            const payload = parseJwt(user.token);
                            const clienteId = payload.clientId;
                            // Obtener el servicio seleccionado
                            let servicioId = 1;
                            const selectServicio = formDiv.querySelector('#select-servicio-agendar');
                            if (selectServicio) {
                                servicioId = selectServicio.value;
                            }
                            let horaFormateada = horario.HoraInicio;
                            if (horaFormateada.length === 5) horaFormateada += ':00';
                            else if (horaFormateada.length === 8) horaFormateada = horaFormateada.slice(0,5) + ':00';
                            const body = {
                                ID_Profesional: profId,
                                ID_Cliente: clienteId,
                                ID_Servicio: servicioId,
                                Fecha: fechaStr,
                                Hora: horaFormateada
                            };
                            // Antes de agendar la cita, asociar el servicio al profesional si no existe
                            try {
                                const asociarRes = await fetch(`${API_BASE}/profesionales/asociar-servicio`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ ID_Profesional: profId, ID_Servicio: servicioId })
                                });
                                // No importa si ya existe, solo intentamos asociar
                            } catch (e) {}
                            // Ahora sí, agendar la cita
                            const res = await fetch(`${API_BASE}/citas`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': 'Bearer ' + user.token
                                },
                                body: JSON.stringify(body)
                            });
                            const result = await res.json();
                            if (res.ok) {
                                panel.innerHTML = '<div class="alert alert-success">Cita agendada exitosamente para el próximo ' + horario.Dia + ' (' + fechaStr + ') a las ' + horario.HoraInicio + '.</div>';
                                setTimeout(() => { panel.innerHTML = ''; formDiv.innerHTML = ''; }, 1800);
                            } else {
                                panel.innerHTML = '<div class="alert alert-danger">' + (result.error || 'No se pudo agendar la cita.') + '</div>';
                            }
                        } catch (err) {
                            panel.innerHTML = '<div class="alert alert-danger">Error de red al agendar la cita.</div>';
                        }
                    });
                });
            } catch (err) {
                formDiv.innerHTML = `<div class='alert alert-danger'>Error al obtener la disponibilidad: ${err.message || err}</div>`;
            }
        });
    });
}

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
