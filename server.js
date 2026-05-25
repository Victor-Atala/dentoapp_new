// ============================================
// BACKEND - DentoApp con PostgreSQL (Neon)
// ============================================

require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middlewares ──────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

// ── Base de Datos (PostgreSQL) ───────────────────
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

pool.connect((err, client, release) => {
    if (err) {
        console.error('Error al conectar a la base de datos PostgreSQL', err.stack);
    } else {
        console.log('Conectado a la base de datos PostgreSQL en la nube.');
        inicializarTablas();
        release();
    }
});

async function inicializarTablas() {
    try {
        await pool.query(`CREATE TABLE IF NOT EXISTS usuarios (
            id SERIAL PRIMARY KEY,
            nombre TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            rol TEXT NOT NULL,
            fechaRegistro TEXT NOT NULL,
            verificado INTEGER DEFAULT 0,
            token_verificacion TEXT
        )`);

        await pool.query(`CREATE TABLE IF NOT EXISTS citas (
            id SERIAL PRIMARY KEY,
            id_paciente INTEGER,
            id_doctor INTEGER,
            servicio TEXT,
            fecha TEXT,
            hora TEXT,
            notas TEXT,
            estado TEXT,
            FOREIGN KEY(id_paciente) REFERENCES usuarios(id),
            FOREIGN KEY(id_doctor) REFERENCES usuarios(id)
        )`);

        await pool.query(`CREATE TABLE IF NOT EXISTS historial_medico (
            id SERIAL PRIMARY KEY,
            id_paciente INTEGER UNIQUE,
            enfermedades TEXT,
            alergias TEXT,
            medicamentos TEXT,
            radiografias TEXT,
            presion_arterial TEXT,
            motivo_consulta TEXT,
            ultima_visita TEXT,
            habitos_higiene TEXT,
            tratamientos_previos TEXT,
            FOREIGN KEY(id_paciente) REFERENCES usuarios(id)
        )`);

        const resAdmin = await pool.query("SELECT * FROM usuarios WHERE email = $1", ['admin@dental.com']);
        if (resAdmin.rows.length === 0) {
            await pool.query("INSERT INTO usuarios (nombre, email, password, rol, fechaRegistro, verificado) VALUES ($1, $2, $3, $4, $5, $6)",
            ['Administrador', 'admin@dental.com', 'admin123', 'admin', new Date().toISOString(), 1]);
        } else {
            await pool.query("UPDATE usuarios SET verificado = 1 WHERE email = 'admin@dental.com'");
        }
        
        const resDoctor = await pool.query("SELECT * FROM usuarios WHERE email = $1", ['doctor@dental.com']);
        if (resDoctor.rows.length === 0) {
            await pool.query("INSERT INTO usuarios (nombre, email, password, rol, fechaRegistro, verificado) VALUES ($1, $2, $3, $4, $5, $6)",
            ['Dr. Juan Pérez', 'doctor@dental.com', 'doctor123', 'doctor', new Date().toISOString(), 1]);
        } else {
            await pool.query("UPDATE usuarios SET verificado = 1 WHERE email = 'doctor@dental.com'");
        }

        const pacientesMock = [
            {
                nombre: 'Carlos Mendoza', email: 'carlos@correo.com', password: 'carlos123', rol: 'usuario',
                fecha: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                historial: {
                    enfermedades: 'Hipertensión arterial sistémica primaria controlada.',
                    alergias: 'Alergia severa a la Penicilina.',
                    medicamentos: 'Enalapril 10mg diario.', radiografias: 'radiografia_panoramica_carlos_mendoza.png',
                    presion_arterial: '120/80 mmHg', motivo_consulta: 'Limpieza dental profunda',
                    ultima_visita: 'Hace menos de 6 meses', habitos_higiene: 'Cepillado 2 veces al día.',
                    tratamientos_previos: 'Dos resinas compuestas.'
                },
                citas: [
                    { servicio: 'Limpieza Dental', fecha: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], hora: '10:00', notas: 'Limpieza profunda', estado: 'Confirmada', id_doctor: 2 },
                    { servicio: 'Diagnóstico', fecha: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], hora: '11:30', notas: 'Evaluación de molar', estado: 'Pendiente', id_doctor: null }
                ]
            },
            {
                nombre: 'Laura Torres', email: 'laura@correo.com', password: 'laura123', rol: 'usuario',
                fecha: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                historial: {
                    enfermedades: 'Ninguna patología.', alergias: 'Sin alergias.',
                    medicamentos: 'Ninguno.', radiografias: 'radiografia_periapical_laura.jpg',
                    presion_arterial: '110/70 mmHg', motivo_consulta: 'Valoración inicial Ortodoncia.',
                    ultima_visita: 'Hace más de 1 año', habitos_higiene: 'Cepillado 3 veces al día.',
                    tratamientos_previos: 'Ninguno.'
                },
                citas: [
                    { servicio: 'Ortodoncia (Brackets)', fecha: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], hora: '16:00', notas: 'Toma de modelos', estado: 'Confirmada', id_doctor: 2 }
                ]
            },
            {
                nombre: 'Andrés Silva', email: 'andres@correo.com', password: 'andres123', rol: 'usuario',
                fecha: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                historial: {
                    enfermedades: 'Diabetes Mellitus Tipo 2.', alergias: 'Alergia al Látex.',
                    medicamentos: 'Metformina 850mg.', radiografias: 'radiografia_oclusal_andres.png',
                    presion_arterial: '130/85 mmHg', motivo_consulta: 'Dolor severo muela del juicio.',
                    ultima_visita: 'Hace más de 2 años', habitos_higiene: 'Cepillado irregular.',
                    tratamientos_previos: 'Endodoncia.'
                },
                citas: [
                    { servicio: 'Extracción', fecha: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], hora: '09:00', notas: 'Cirugía menor', estado: 'Pendiente', id_doctor: null }
                ]
            }
        ];

        for (const p of pacientesMock) {
            const check = await pool.query("SELECT * FROM usuarios WHERE email = $1", [p.email]);
            if (check.rows.length === 0) {
                const insertUser = await pool.query(
                    "INSERT INTO usuarios (nombre, email, password, rol, fechaRegistro, verificado) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
                    [p.nombre, p.email, p.password, p.rol, p.fecha, 1]
                );
                const newUserId = insertUser.rows[0].id;
                
                const h = p.historial;
                await pool.query(`INSERT INTO historial_medico (
                    id_paciente, enfermedades, alergias, medicamentos, radiografias,
                    presion_arterial, motivo_consulta, ultima_visita, habitos_higiene, tratamientos_previos
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [
                    newUserId, h.enfermedades, h.alergias, h.medicamentos, h.radiografias,
                    h.presion_arterial, h.motivo_consulta, h.ultima_visita, h.habitos_higiene, h.tratamientos_previos
                ]);

                for (const c of p.citas) {
                    await pool.query(`INSERT INTO citas (id_paciente, id_doctor, servicio, fecha, hora, notas, estado)
                            VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [newUserId, c.id_doctor, c.servicio, c.fecha, c.hora, c.notas, c.estado]);
                }
            }
        }
    } catch (e) {
        console.error("Error inicializando tablas:", e);
    }
}

// ── Middleware de Seguridad (The Bouncer) ─────────────────
const verificarAcceso = (rolesPermitidos = []) => {
    return async (req, res, next) => {
        const userId = req.headers['x-user-id'];
        const userRole = req.headers['x-user-role'];

        if (!userId || !userRole) {
            return res.status(401).json({ error: 'No autorizado. Inicie sesión.' });
        }

        if (rolesPermitidos.length > 0 && !rolesPermitidos.includes(userRole)) {
            return res.status(403).json({ error: 'Acceso denegado. No tienes permisos para esta área.' });
        }

        try {
            const resDb = await pool.query("SELECT rol FROM usuarios WHERE id = $1", [userId]);
            if (resDb.rows.length === 0 || resDb.rows[0].rol !== userRole) {
                return res.status(401).json({ error: 'Sesión inválida o expirada.' });
            }
            req.user = { id: userId, rol: userRole };
            next();
        } catch (err) {
            return res.status(500).json({ error: 'Error verificando sesión' });
        }
    };
};

// ── RUTAS DE LA API: USUARIOS ─────────────────

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

transporter.verify().then(() => {
    console.log('Nodemailer configurado para enviar correos reales.');
}).catch(err => {
    console.error('\\n⚠️ Error configurando Nodemailer.\\n', err);
});

app.get('/api/usuarios', verificarAcceso(['admin', 'doctor']), async (req, res) => {
    try {
        const result = await pool.query("SELECT id, nombre, email, rol, fechaRegistro, verificado FROM usuarios");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/registro', async (req, res) => {
    const { nombre, email, password, rol } = req.body;
    if (!nombre || !email || !password) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const rolAsignado = rol === 'doctor' ? 'doctor' : 'usuario';
    const fechaRegistro = new Date().toISOString();
    const codigoVerificacion = Math.floor(100000 + Math.random() * 900000).toString();

    try {
        await pool.query("INSERT INTO usuarios (nombre, email, password, rol, fechaRegistro, verificado, token_verificacion) VALUES ($1, $2, $3, $4, $5, $6, $7)",
            [nombre, email, password, rolAsignado, fechaRegistro, 0, codigoVerificacion]);

        if (transporter) {
            const mailOptions = {
                from: '"DentoApp Dental Care" <noreply@dentoapp.com>',
                to: email,
                subject: 'Verifica tu cuenta en DentoApp',
                text: `Hola ${nombre}, tu código de verificación es: ${codigoVerificacion}`,
                html: `<b>Hola ${nombre}</b><br>Tu código de verificación es: <b style="font-size:24px;">${codigoVerificacion}</b>`
            };
            transporter.sendMail(mailOptions, (error, info) => {});
        }
        res.status(201).json({ mensaje: 'Usuario registrado. Por favor verifica tu correo.', requiereVerificacion: true, email });
    } catch (err) {
        if (err.message.includes('unique') || err.message.includes('UNIQUE')) {
            return res.status(409).json({ error: 'El correo ya está registrado' });
        }
        return res.status(500).json({ error: err.message });
    }
});

app.post('/api/verificar', async (req, res) => {
    const { email, codigo } = req.body;
    try {
        const result = await pool.query("SELECT id, token_verificacion FROM usuarios WHERE email = $1", [email]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
        
        if (result.rows[0].token_verificacion === codigo) {
            await pool.query("UPDATE usuarios SET verificado = 1, token_verificacion = NULL WHERE id = $1", [result.rows[0].id]);
            res.json({ mensaje: 'Cuenta verificada exitosamente' });
        } else {
            res.status(400).json({ error: 'Código de verificación incorrecto' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query("SELECT id, nombre, email, rol, verificado FROM usuarios WHERE email = $1 AND password = $2", [email, password]);
        if (result.rows.length === 0) return res.status(401).json({ error: 'Credenciales incorrectas' });
        
        if (result.rows[0].verificado === 0) {
            return res.status(403).json({ error: 'Debes verificar tu correo antes de iniciar sesión.', requiereVerificacion: true });
        }
        
        res.json({ mensaje: 'Login exitoso', usuario: { id: result.rows[0].id, nombre: result.rows[0].nombre, email: result.rows[0].email, rol: result.rows[0].rol } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/usuarios/:id', verificarAcceso(['admin']), async (req, res) => {
    try {
        const result = await pool.query("DELETE FROM usuarios WHERE id = $1", [req.params.id]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json({ mensaje: 'Usuario eliminado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── RUTAS DE LA API: CITAS ────────────────────

app.get('/api/citas', verificarAcceso(['admin', 'doctor', 'usuario']), async (req, res) => {
    try {
        let sql = `SELECT citas.*, usuarios.nombre as paciente_nombre, usuarios.email as paciente_email 
                   FROM citas 
                   LEFT JOIN usuarios ON citas.id_paciente = usuarios.id`;
        let params = [];

        if (req.user.rol === 'usuario') {
            sql += ` WHERE id_paciente = $1`;
            params.push(req.user.id);
        }

        const result = await pool.query(sql, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/citas', verificarAcceso(['admin', 'usuario']), async (req, res) => {
    const { id_paciente, servicio, fecha, hora, notas } = req.body;
    const pacienteId = req.user.rol === 'usuario' ? req.user.id : id_paciente;

    try {
        const result = await pool.query("INSERT INTO citas (id_paciente, servicio, fecha, hora, notas, estado) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
            [pacienteId, servicio, fecha, hora, notas, 'Pendiente']);
        res.status(201).json({ mensaje: 'Cita registrada', id: result.rows[0].id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/citas/:id', verificarAcceso(['admin', 'doctor']), async (req, res) => {
    const { estado, id_doctor } = req.body;
    try {
        await pool.query("UPDATE citas SET estado = $1, id_doctor = $2 WHERE id = $3", [estado, id_doctor, req.params.id]);
        res.json({ mensaje: 'Cita actualizada' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── RUTAS DE LA API: HISTORIAL MÉDICO ─────────

app.get('/api/historias/:id_paciente', verificarAcceso(['admin', 'doctor', 'usuario']), async (req, res) => {
    if (req.user.rol === 'usuario' && req.user.id != req.params.id_paciente) {
        return res.status(403).json({ error: 'No tienes permiso para ver este historial.' });
    }
    try {
        const result = await pool.query("SELECT * FROM historial_medico WHERE id_paciente = $1", [req.params.id_paciente]);
        res.json(result.rows[0] || {});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/historias', verificarAcceso(['admin', 'doctor', 'usuario']), async (req, res) => {
    const { id_paciente, enfermedades, alergias, medicamentos, radiografias } = req.body;
    const targetId = req.user.rol === 'usuario' ? req.user.id : id_paciente;

    try {
        const sql = `INSERT INTO historial_medico (id_paciente, enfermedades, alergias, medicamentos, radiografias) 
                     VALUES ($1, $2, $3, $4, $5) 
                     ON CONFLICT(id_paciente) DO UPDATE SET 
                     enfermedades=EXCLUDED.enfermedades, 
                     alergias=EXCLUDED.alergias, 
                     medicamentos=EXCLUDED.medicamentos, 
                     radiografias=EXCLUDED.radiografias`;
        
        await pool.query(sql, [targetId, enfermedades, alergias, medicamentos, radiografias]);
        res.json({ mensaje: 'Historial guardado/actualizado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Iniciar servidor ─────────────────────────
app.listen(PORT, () => {
    console.log(`\\n🦷 DentoApp corriendo en http://localhost:${PORT}`);
});
