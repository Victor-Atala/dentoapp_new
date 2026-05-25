// auth.js — Funciones globales de autenticación

function logout() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    let redirectUrl = 'index.html';
    if (user && (user.rol === 'doctor' || user.role === 'doctor')) {
        redirectUrl = 'portal-doctor.html';
    }
    localStorage.removeItem('currentUser');
    window.location.href = redirectUrl;
}

// Wrapper para fetch que incluye automáticamente los headers de seguridad
async function secureFetch(url, options = {}) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!options.headers) options.headers = {};
    
    // Solo enviamos headers si hay un usuario logueado
    if (user) {
        options.headers['X-User-Id'] = user.id;
        options.headers['X-User-Role'] = user.rol || user.role;
    }
    
    // Aseguramos que el content-type sea JSON si hay body
    if (options.body && !options.headers['Content-Type']) {
        options.headers['Content-Type'] = 'application/json';
    }

    try {
        const res = await fetch(url, options);
        
        // Si el bouncer detecta que no tenemos permiso o la sesión es falsa
        if (res.status === 401 || res.status === 403) {
            console.error('Bouncer: Acceso denegado o sesión inválida');
            localStorage.removeItem('currentUser');
            window.location.href = 'auth.html';
            return null;
        }
        
        return res;
    } catch (error) {
        console.error('Error de red:', error);
        throw error;
    }
}

// Función para verificar si el usuario tiene el rol adecuado al cargar la página
function checkSession(rolesPermitidos = []) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        window.location.href = 'auth.html';
        return null;
    }
    if (rolesPermitidos.length > 0 && !rolesPermitidos.includes(user.rol)) {
        alert('No tienes permiso para acceder a esta sección.');
        window.location.href = 'index.html';
        return null;
    }
    return user;
}
