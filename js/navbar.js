document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const currentPage = window.location.pathname.split("/").pop() || 'index.html';

    // Lógica de rebote (Bouncer): Evita que doctores vean páginas de pacientes
    if (user && (user.rol === 'doctor' || user.role === 'doctor')) {
        if (currentPage !== 'doctor.html' && currentPage !== 'portal-doctor.html') {
            window.location.href = 'doctor.html';
            return;
        }
    }

    const navPlaceholder = document.getElementById('navbar-placeholder');
    if (!navPlaceholder) return;

    // Opciones de navegación
    let menuItems = [];
    if (user && (user.rol === 'doctor' || user.role === 'doctor')) {
        menuItems = [
            { name: 'Panel Médico', url: 'doctor.html' }
        ];
    } else if (user && (user.rol === 'admin' || user.role === 'admin')) {
        menuItems = [
            { name: 'Panel Admin', url: 'admin.html' }
        ];
    } else {
        menuItems = [
            { name: 'Inicio', url: 'index.html' },
            { name: 'Servicios', url: 'services.html' },
            { name: 'Blog', url: 'blog.html' },
            { name: 'Galería', url: 'gallery.html' },
            { name: 'Contacto', url: 'contact.html' }
        ];
    }

    // Lógica dinámica: Iniciar Sesión vs Perfil
    let authSection = '';
    if (user) {
        let profileUrl = 'profile.html';
        let btnText = 'Mi Perfil';
        if (user.rol === 'admin' || user.role === 'admin') {
            profileUrl = 'admin.html';
            btnText = 'Admin';
        } else if (user.rol === 'doctor' || user.role === 'doctor') {
            profileUrl = 'doctor.html';
            btnText = 'Dashboard Médico';
        }

        authSection = `
            <li class="nav-item ms-lg-3">
                <a class="nav-link btn btn-outline-primary px-4 rounded-pill shadow-sm mb-2 mb-lg-0" href="${profileUrl}">
                    <i class="fas fa-user-circle me-2"></i>${btnText}
                </a>
            </li>
            <li class="nav-item ms-lg-2">
                <button onclick="logout()" class="nav-link btn btn-danger text-white px-4 rounded-pill shadow-sm w-100">
                    <i class="fas fa-sign-out-alt me-2"></i>Salir
                </button>
            </li>`;
    } else {
        authSection = `
            <li class="nav-item ms-lg-3">
                <a class="nav-link btn btn-primary text-white px-4 rounded-pill shadow-sm" href="auth.html">
                    <i class="fas fa-sign-in-alt me-2"></i>Iniciar Sesión
                </a>
            </li>`;
    }

    navPlaceholder.innerHTML = `
        <nav class="navbar navbar-expand-lg fixed-top">
            <div class="container d-flex align-items-center">
                ${currentPage !== 'index.html' ? `<button onclick="history.back()" class="btn btn-sm btn-outline-secondary me-3 rounded-circle" title="Regresar"><i class="fas fa-arrow-left"></i></button>` : ''}
                <a class="navbar-brand" href="index.html">
                    <i class="fas fa-tooth me-2"></i>DENTAL CARE
                </a>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navRes">
                    <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse" id="navRes">
                    <ul class="navbar-nav ms-auto align-items-center">
                        ${menuItems.map(item => `
                            <li class="nav-item">
                                <a class="nav-link ${currentPage === item.url ? 'active text-primary fw-bold' : ''}" href="${item.url}">${item.name}</a>
                            </li>
                        `).join('')}
                        ${authSection}
                    </ul>
                </div>
            </div>
        </nav>
    `;
});