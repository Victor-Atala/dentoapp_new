// ============================================
// BACKEND - DentoApp con SQLite
// ============================================

require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'database.sqlite');

// ── Middlewares ──────────────────────────────
app.use(express.json({ limit: '10mb' })); // Permitir payloads grandes por si mandan imágenes base64
app.use(express.static(__dirname));

// ── Base de Datos (SQLite) ───────────────────
const db = new sqlite3.Database(DB_FILE, (err) => {
    if (err) {
        console.error('Error al abrir la base de datos', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite.');
        inicializarTablas();
    }
});

function inicializarTablas() {
    db.serialize(() => {
        // Tabla de usuarios
        db.run(`CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            rol TEXT NOT NULL,
            fechaRegistro TEXT NOT NULL,
            verificado INTEGER DEFAULT 0,
            token_verificacion TEXT
        )`);

        // Agregar columnas si la tabla ya existía (ignoramos errores si ya existen)
        db.run(`ALTER TABLE usuarios ADD COLUMN verificado INTEGER DEFAULT 0`, (err) => {});
        db.run(`ALTER TABLE usuarios ADD COLUMN token_verificacion TEXT`, (err) => {});

        // Tabla de citas
        db.run(`CREATE TABLE IF NOT EXISTS citas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
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

        // Tabla de historial médico
        db.run(`CREATE TABLE IF NOT EXISTS historial_medico (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            id_paciente INTEGER UNIQUE,
            enfermedades TEXT,
            alergias TEXT,
            medicamentos TEXT,
            radiografias TEXT,
            FOREIGN KEY(id_paciente) REFERENCES usuarios(id)
        )`);

        // Agregar columnas clínicas avanzadas si no existen
        db.run(`ALTER TABLE historial_medico ADD COLUMN presion_arterial TEXT`, (err) => {});
        db.run(`ALTER TABLE historial_medico ADD COLUMN motivo_consulta TEXT`, (err) => {});
        db.run(`ALTER TABLE historial_medico ADD COLUMN ultima_visita TEXT`, (err) => {});
        db.run(`ALTER TABLE historial_medico ADD COLUMN habitos_higiene TEXT`, (err) => {});
        db.run(`ALTER TABLE historial_medico ADD COLUMN tratamientos_previos TEXT`, (err) => {});

        // Insertar usuario admin por defecto si no existe
        db.get("SELECT * FROM usuarios WHERE email = ?", ['admin@dental.com'], (err, row) => {
            if (!row) {
                db.run("INSERT INTO usuarios (nombre, email, password, rol, fechaRegistro, verificado) VALUES (?, ?, ?, ?, ?, ?)",
                ['Administrador', 'admin@dental.com', 'admin123', 'admin', new Date().toISOString(), 1]);
            } else {
                db.run("UPDATE usuarios SET verificado = 1 WHERE email = 'admin@dental.com'");
            }
        });
        
        // Insertar un doctor por defecto si no existe
        db.get("SELECT * FROM usuarios WHERE email = ?", ['doctor@dental.com'], (err, row) => {
            if (!row) {
                db.run("INSERT INTO usuarios (nombre, email, password, rol, fechaRegistro, verificado) VALUES (?, ?, ?, ?, ?, ?)",
                ['Dr. Juan Pérez', 'doctor@dental.com', 'doctor123', 'doctor', new Date().toISOString(), 1]);
            } else {
                db.run("UPDATE usuarios SET verificado = 1 WHERE email = 'doctor@dental.com'");
            }
        });

        // ============================================
        // SEMILLAS DE PACIENTES ULTRA-REALISTAS
        // ============================================

        const pacientesMock = [
            {
                nombre: 'Carlos Mendoza',
                email: 'carlos@correo.com',
                password: 'carlos123',
                rol: 'usuario',
                fecha: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // Hace 10 días
                historial: {
                    enfermedades: 'Hipertensión arterial sistémica primaria controlada.',
                    alergias: 'Alergia severa a la Penicilina (reacción anafiláctica previa).',
                    medicamentos: 'Enalapril 10mg diario por las mañanas.',
                    radiografias: 'radiografia_panoramica_carlos_mendoza.png',
                    presion_arterial: '120/80 mmHg',
                    motivo_consulta: 'Limpieza dental profunda y evaluación de dolor persistente en zona del molar superior izquierdo.',
                    ultima_visita: 'Hace menos de 6 meses',
                    habitos_higiene: 'Cepillado 2 veces al día. No utiliza hilo dental ni enjuague bucal.',
                    tratamientos_previos: 'Dos resinas compuestas en molares inferiores hace 2 años.'
                },
                citas: [
                    {
                        servicio: 'Limpieza Dental',
                        fecha: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Hace 5 días
                        hora: '10:00',
                        notas: 'Limpieza profunda de sarro supra y subgingival, y aplicación de flúor protector.',
                        estado: 'Confirmada',
                        id_doctor: 2
                    },
                    {
                        servicio: 'Diagnóstico',
                        fecha: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // En 3 días
                        hora: '11:30',
                        notas: 'Evaluación del molar superior izquierdo por alta sensibilidad al frío y calor.',
                        estado: 'Pendiente',
                        id_doctor: null
                    }
                ]
            },
            {
                nombre: 'Laura Torres',
                email: 'laura@correo.com',
                password: 'laura123',
                rol: 'usuario',
                fecha: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                historial: {
                    enfermedades: 'Ninguna patología sistémica registrada. Goza de buena salud.',
                    alergias: 'Sin alergias conocidas a medicamentos, alimentos o látex.',
                    medicamentos: 'Ninguno.',
                    radiografias: 'radiografia_periapical_laura.jpg',
                    presion_arterial: '110/70 mmHg',
                    motivo_consulta: 'Valoración inicial y estudio completo para tratamiento de Ortodoncia (brackets).',
                    ultima_visita: 'Hace más de 1 año',
                    habitos_higiene: 'Cepillado de 3 veces al día con pasta fluorada. Uso de hilo dental una vez al día.',
                    tratamientos_previos: 'Ninguno. Estructura dental intacta.'
                },
                citas: [
                    {
                        servicio: 'Ortodoncia (Brackets)',
                        fecha: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // En 4 días
                        hora: '16:00',
                        notas: 'Toma de modelos de estudio, fotografías clínicas y plan preliminar de colocación de brackets.',
                        estado: 'Confirmada',
                        id_doctor: 2
                    }
                ]
            },
            {
                nombre: 'Andrés Silva',
                email: 'andres@correo.com',
                password: 'andres123',
                rol: 'usuario',
                fecha: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                historial: {
                    enfermedades: 'Diabetes Mellitus Tipo 2 controlada bajo dieta y fármaco oral.',
                    alergias: 'Alergia al Látex natural. Requiere el uso estricto de guantes de Nitrilo durante la consulta.',
                    medicamentos: 'Metformina 850mg una vez al día con la comida.',
                    radiografias: 'radiografia_oclusal_andres.png',
                    presion_arterial: '130/85 mmHg',
                    motivo_consulta: 'Dolor severo y punzante en zona de muela del juicio inferior derecha. Dificultad para masticar.',
                    ultima_visita: 'Hace más de 2 años',
                    habitos_higiene: 'Cepillado irregular (1 o 2 veces al día). No usa hilo dental.',
                    tratamientos_previos: 'Tratamiento de conducto (endodoncia) previo en primer molar inferior izquierdo hace 4 años.'
                },
                citas: [
                    {
                        servicio: 'Extracción',
                        fecha: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // En 5 días
                        hora: '09:00',
                        notas: 'Programación para posible cirugía menor de tercer molar (muela del juicio) con técnica atraumática.',
                        estado: 'Pendiente',
                        id_doctor: null
                    }
                ]
            }
        ];

        // Insertar cada paciente de manera segura
        pacientesMock.forEach(p => {
            db.get("SELECT * FROM usuarios WHERE email = ?", [p.email], (err, row) => {
                if (!row) {
                    db.run("INSERT INTO usuarios (nombre, email, password, rol, fechaRegistro, verificado) VALUES (?, ?, ?, ?, ?, ?)",
                    [p.nombre, p.email, p.password, p.rol, p.fecha, 1], function(err) {
                        if (!err) {
                            const newUserId = this.lastID;
                            
                            // Insertar historial médico correspondiente
                            const h = p.historial;
                            db.run(`INSERT INTO historial_medico (
                                id_paciente, enfermedades, alergias, medicamentos, radiografias,
                                presion_arterial, motivo_consulta, ultima_visita, habitos_higiene, tratamientos_previos
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                newUserId, h.enfermedades, h.alergias, h.medicamentos, h.radiografias,
                                h.presion_arterial, h.motivo_consulta, h.ultima_visita, h.habitos_higiene, h.tratamientos_previos
                            ]);

                            // Insertar citas correspondientes
                            p.citas.forEach(c => {
                                db.run(`INSERT INTO citas (id_paciente, id_doctor, servicio, fecha, hora, notas, estado)
                                        VALUES (?, ?, ?, ?, ?, ?, ?)`,
                                [newUserId, c.id_doctor, c.servicio, c.fecha, c.hora, c.notas, c.estado]);
                            });
                        }
                    });
                }
            });
        });

    });
}

// ── Middleware de Seguridad (The Bouncer) ─────────────────
const verificarAcceso = (rolesPermitidos = []) => {
    return (req, res, next) => {
        const userId = req.headers['x-user-id'];
        const userRole = req.headers['x-user-role'];

        if (!userId || !userRole) {
            return res.status(401).json({ error: 'No autorizado. Inicie sesión.' });
        }

        if (rolesPermitidos.length > 0 && !rolesPermitidos.includes(userRole)) {
            return res.status(403).json({ error: 'Acceso denegado. No tienes permisos para esta área.' });
        }

        // Verificación rápida en DB
        db.get("SELECT rol FROM usuarios WHERE id = ?", [userId], (err, row) => {
            if (err || !row || row.rol !== userRole) {
                return res.status(401).json({ error: 'Sesión inválida o expirada.' });
            }
            req.user = { id: userId, rol: userRole };
            next();
        });
    };
};

// ── RUTAS DE LA API: USUARIOS ─────────────────

// Configurar Nodemailer con cuenta real (ej. Gmail)
const transporter = nodemailer.createTransport({
    service: 'gmail', // Usa el servicio de Gmail
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

transporter.verify().then(() => {
    console.log('Nodemailer configurado para enviar correos reales.');
}).catch(err => {
    console.error('\n⚠️ Error configurando Nodemailer. Verifica tus credenciales en el archivo .env\n', err);
});

app.get('/api/usuarios', verificarAcceso(['admin', 'doctor']), (req, res) => {
    db.all("SELECT id, nombre, email, rol, fechaRegistro, verificado FROM usuarios", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// ... (configuración nodemailer omitida por brevedad en este bloque, se mantiene igual)

app.post('/api/registro', (req, res) => {
    const { nombre, email, password, rol } = req.body;
    if (!nombre || !email || !password) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const rolAsignado = rol === 'doctor' ? 'doctor' : 'usuario';
    const fechaRegistro = new Date().toISOString();
    
    // Generar código de 6 dígitos
    const codigoVerificacion = Math.floor(100000 + Math.random() * 900000).toString();

    db.run("INSERT INTO usuarios (nombre, email, password, rol, fechaRegistro, verificado, token_verificacion) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [nombre, email, password, rolAsignado, fechaRegistro, 0, codigoVerificacion],
        function (err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(409).json({ error: 'El correo ya está registrado' });
                }
                return res.status(500).json({ error: err.message });
            }
            
            // Enviar correo de verificación
            if (transporter) {
                const mailOptions = {
                    from: '"DentoApp Dental Care" <noreply@dentoapp.com>',
                    to: email,
                    subject: 'Verifica tu cuenta en DentoApp',
                    text: `Hola ${nombre}, tu código de verificación es: ${codigoVerificacion}`,
                    html: `<b>Hola ${nombre}</b><br>Tu código de verificación es: <b style="font-size:24px;">${codigoVerificacion}</b>`
                };
                
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error('Error al enviar correo:', error);
                    } else {
                        console.log('Correo de verificación enviado a:', email);
                    }
                });
            }

            res.status(201).json({ mensaje: 'Usuario registrado. Por favor verifica tu correo.', requiereVerificacion: true, email });
        }
    );
});

// NUEVA RUTA: Verificar código
app.post('/api/verificar', (req, res) => {
    const { email, codigo } = req.body;
    db.get("SELECT id, token_verificacion FROM usuarios WHERE email = ?", [email], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Usuario no encontrado' });
        
        if (row.token_verificacion === codigo) {
            db.run("UPDATE usuarios SET verificado = 1, token_verificacion = NULL WHERE id = ?", [row.id], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ mensaje: 'Cuenta verificada exitosamente' });
            });
        } else {
            res.status(400).json({ error: 'Código de verificación incorrecto' });
        }
    });
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.get("SELECT id, nombre, email, rol, verificado FROM usuarios WHERE email = ? AND password = ?", [email, password], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(401).json({ error: 'Credenciales incorrectas' });
        
        if (row.verificado === 0) {
            return res.status(403).json({ error: 'Debes verificar tu correo antes de iniciar sesión.', requiereVerificacion: true });
        }
        
        res.json({ mensaje: 'Login exitoso', usuario: { id: row.id, nombre: row.nombre, email: row.email, rol: row.rol } });
    });
});

app.delete('/api/usuarios/:id', verificarAcceso(['admin']), (req, res) => {
    db.run("DELETE FROM usuarios WHERE id = ?", req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json({ mensaje: 'Usuario eliminado' });
    });
});

// ── RUTAS DE LA API: CITAS ────────────────────

app.get('/api/citas', verificarAcceso(['admin', 'doctor', 'usuario']), (req, res) => {
    // Si es usuario, solo ve sus citas. Si es admin/doctor, ve todas.
    let sql = `SELECT citas.*, usuarios.nombre as paciente_nombre, usuarios.email as paciente_email 
               FROM citas 
               LEFT JOIN usuarios ON citas.id_paciente = usuarios.id`;
    let params = [];

    if (req.user.rol === 'usuario') {
        sql += ` WHERE id_paciente = ?`;
        params.push(req.user.id);
    }

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/citas', verificarAcceso(['admin', 'usuario']), (req, res) => {
    const { id_paciente, servicio, fecha, hora, notas } = req.body;
    // Un usuario solo puede crear citas para sí mismo
    const pacienteId = req.user.rol === 'usuario' ? req.user.id : id_paciente;

    db.run("INSERT INTO citas (id_paciente, servicio, fecha, hora, notas, estado) VALUES (?, ?, ?, ?, ?, ?)",
        [pacienteId, servicio, fecha, hora, notas, 'Pendiente'],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ mensaje: 'Cita registrada', id: this.lastID });
        }
    );
});

app.put('/api/citas/:id', verificarAcceso(['admin', 'doctor']), (req, res) => {
    const { estado, id_doctor } = req.body;
    db.run("UPDATE citas SET estado = ?, id_doctor = ? WHERE id = ?", [estado, id_doctor, req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ mensaje: 'Cita actualizada' });
    });
});

// ── RUTAS DE LA API: HISTORIAL MÉDICO ─────────

app.get('/api/historias/:id_paciente', verificarAcceso(['admin', 'doctor', 'usuario']), (req, res) => {
    // Un usuario solo ve su propia historia
    if (req.user.rol === 'usuario' && req.user.id != req.params.id_paciente) {
        return res.status(403).json({ error: 'No tienes permiso para ver este historial.' });
    }

    db.get("SELECT * FROM historial_medico WHERE id_paciente = ?", [req.params.id_paciente], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row || {});
    });
});

app.post('/api/historias', verificarAcceso(['admin', 'doctor', 'usuario']), (req, res) => {
    const { id_paciente, enfermedades, alergias, medicamentos, radiografias } = req.body;
    
    // Un usuario solo puede editar su propia historia
    const targetId = req.user.rol === 'usuario' ? req.user.id : id_paciente;

    const sql = `INSERT INTO historial_medico (id_paciente, enfermedades, alergias, medicamentos, radiografias) 
                 VALUES (?, ?, ?, ?, ?) 
                 ON CONFLICT(id_paciente) DO UPDATE SET 
                 enfermedades=excluded.enfermedades, 
                 alergias=excluded.alergias, 
                 medicamentos=excluded.medicamentos, 
                 radiografias=excluded.radiografias`;
    
    db.run(sql, [targetId, enfermedades, alergias, medicamentos, radiografias], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ mensaje: 'Historial guardado/actualizado' });
    });
});

// ── Iniciar servidor ─────────────────────────
app.listen(PORT, () => {
    console.log(`\n🦷 DentoApp corriendo en http://localhost:${PORT}`);
});

