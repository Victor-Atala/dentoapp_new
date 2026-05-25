# 🦷 DentoApp — Proyecto de Clase

Aplicación web de clínica dental con frontend mejorado y backend simple en Node.js.

---

## 🚀 Cómo ejecutar

### 1. Instala las dependencias
```bash
npm install
```

### 2. Inicia el servidor
```bash
npm start
```

### 3. Abre el navegador
```
http://localhost:3000
```

---

## 📁 Estructura del proyecto

```
dentoapp/
├── server.js          ← Backend (Node.js + Express)
├── package.json       ← Dependencias
├── db.json            ← "Base de datos" en JSON (se crea automáticamente)
│
├── index.html         ← Página principal
├── auth.html          ← Login + Registro
├── admin.html         ← Panel de admin (ver usuarios)
├── profile.html       ← Perfil del paciente
├── services.html
├── appointments.html
├── blog.html
├── gallery.html
├── contact.html
│
├── css/styles.css     ← Estilos mejorados
└── js/
    ├── auth.js        ← logout()
    ├── navbar.js      ← Navbar dinámica
    ├── main.js
    └── script.js
```

---

## 🔌 API del Backend

| Método   | Ruta                | Descripción               |
|----------|---------------------|---------------------------|
| `GET`    | `/api/usuarios`     | Lista todos los usuarios  |
| `POST`   | `/api/login`        | Autenticar usuario        |
| `POST`   | `/api/registro`     | Crear nuevo usuario       |
| `DELETE` | `/api/usuarios/:id` | Eliminar un usuario       |

### Ejemplos con fetch

```javascript
// Registrar usuario
fetch('/api/registro', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre: 'Ana', email: 'ana@test.com', password: '123456' })
});

// Login
fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ana@test.com', password: '123456' })
});
```

---

## ⚠️ Nota de Seguridad Educativa

> Las contraseñas se guardan en **texto plano** adrede para esta lección.
> En producción siempre se usa `bcrypt` o similar para encriptarlas.

---

## 👤 Usuario admin por defecto

| Campo    | Valor             |
|----------|-------------------|
| Email    | admin@dental.com  |
| Password | admin123          |
| Rol      | admin             |
