# 🏆 Sistema de Gestión de Concursos de Investigación — CNPPE

Sistema web completo para la administración de concursos de proyectos de investigación y emprendimiento, basado en el stack MERN (MongoDB, Express, React, Node.js).

---

## ✨ Características recientes

- **Video del proyecto (YouTube)**: captura obligatoria de `youtubeUrl` al registrar un proyecto, con validación del formato `https://youtu.be/<id>?si=<token>`.
- **Acción “Ver video”**: cuando el proyecto tiene `youtubeUrl`, se muestra un botón para abrir el video en una pestaña nueva.
- **PDF del proyecto más robusto**: mejoras para descargar/visualizar el PDF usando respuesta tipo *blob* y mejor manejo de errores (incluyendo casos de token/404).
- **Envío de correos con Resend**: soporte de notificaciones por email mediante API (`RESEND_API_KEY`).
- **Soporte de despliegue**: ajustes para despliegue vía `Dockerfile` (pensado para Railway).

---

## 📁 Estructura del Proyecto

```
concursos/
├── server/                  ← Backend (Node.js + Express)
│   ├── config/
│   │   └── db.js            ← Conexión MongoDB
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── rubric.controller.js
│   │   ├── contest.controller.js
│   │   ├── project.controller.js
│   │   ├── evaluation.controller.js
│   │   ├── evaluationController.js
│   │   ├── assignment.controller.js
│   │   ├── assignmentController.js
│   │   ├── dashboard.controller.js
│   │   ├── dashboardController.js
│   │   └── userController.js
│   ├── middlewares/
│   │   ├── auth.middleware.js   ← JWT + checkRole
│   │   ├── auth.js
│   │   └── upload.middleware.js ← Multer PDF
│   ├── models/
│   │   ├── User.js
│   │   ├── Rubric.js            ← Secciones y criterios dinámicos
│   │   ├── Contest.js
│   │   ├── Project.js
│   │   ├── Evaluation.js
│   │   ├── Assignment.js
│   │   └── Assignment.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── auth.js
│   │   ├── user.routes.js
│   │   ├── users.js
│   │   ├── rubric.routes.js
│   │   ├── rubrics.js
│   │   ├── contest.routes.js
│   │   ├── contests.js
│   │   ├── project.routes.js
│   │   ├── projects.js
│   │   ├── evaluation.routes.js
│   │   ├── evaluations.js
│   │   ├── assignment.routes.js
│   │   ├── assignments.js
│   │   ├── dashboard.routes.js
│   │   └── dashboard.js
│   ├── services/
│   │   ├── email.service.js
│   │   └── emailService.js
│   ├── utils/
│   │   └── jwt.js
│   ├── uploads/
│   │   └── projects/            ← PDFs de proyectos
│   ├── app.js
│   ├── server.js
│   ├── seed.js                  ← Datos de prueba
│   └── .env.example
│
└── client/
    ├── index.html               ← Frontend SPA (React CDN)
    ├── index.css
    ├── index.js
    ├── api/
    │   └── axios.js
    ├── components/
    │   ├── common/
    │   │   ├── Layout.js
    │   │   └── UI.js
    │   ├── admin/
    │   ├── reviewer/
    │   └── student/
    ├── context/
    │   ├── AuthContext.js
    │   └── AuthContext.jsx
    ├── hooks/
    ├── pages/
    │   ├── admin/
    │   │   ├── AdminDashboard.js
    │   │   └── [otros]
    │   ├── reviewer/
    │   │   ├── ReviewerDashboard.js
    │   │   ├── EvaluateProject.js
    │   │   └── ContestProjects.js
    │   ├── student/
    │   └── AuthPages.js
    ├── routes/
    ├── utils/
    └── App.js
```

---

## 🚀 Instalación y Arranque

### Prerrequisitos
- Node.js 18+ 
- MongoDB 6+ (local o Atlas)
- npm 9+

### 1. Backend

```bash
cd server

# Copiar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales SMTP y URI de MongoDB

# Instalar dependencias
npm install

# (Opcional) Cargar datos de prueba	node seed.js
# Resetear e inicializar datos vacíos
node inicializarTodo.js

# Iniciar servidor
node server.js
# → Servidor en http://localhost:5000
```

### 2. Frontend

Abre el archivo `client/index.html` directamente en el navegador, o sírvelo con cualquier servidor estático:

```bash
# Opción 1: Abrir directamente
open client/index.html

# Opción 2: Con npx serve
npx serve client/

# Opción 3: Con Python
cd client && python3 -m http.server 3000
```

---

## 🔑 Cuentas de Prueba (después de ejecutar seed.js)

| Rol          | Nombre                           | Email                                    | Contraseña    |
|--------------|----------------------------------|------------------------------------------|---------------|
| **Admin**    | Administrador CNPPE              | admin@cnppe.mx                           | admin1234     |
| **Revisor**  | Ernesto Valadez Renteria         | ernesto.vr@zacatecasocc.tecnm.mx         | revisor1234   |
| **Revisor**  | José Antonio Flores Lara         | antonioflores30@hotmail.com              | revisor1234   |
| **Revisor**  | Oscar Daniel Vacio Loera         | oscar.vl@zacatecasocc.tecnm.mx           | revisor1234   |
| **Revisor**  | Verónica Rebe                    | veronicarebe69@hotmail.com               | revisor1234   |
| **Revisor**  | Verónica Rebe (Genérico)         | revisor@cnppe.mx                         | revisor1234   |
| **Alumno**   | Alumno Demo                      | alumno@cnppe.mx                          | alumno1234    |
| **Alumno**   | Alumno Demo 2                    | alumno2@cnppe.mx                         | alumno1234    |

---

## 🌐 API Endpoints

### Autenticación
| Método | Ruta                        | Descripción                    |
|--------|-----------------------------|--------------------------------|
| POST   | /api/v1/auth/register       | Registro de alumno + envía OTP |
| POST   | /api/v1/auth/verify-email   | Verificar código OTP           |
| POST   | /api/v1/auth/login          | Login → JWT                    |
| POST   | /api/v1/auth/refresh        | Renovar access token           |
| POST   | /api/v1/auth/logout         | Cerrar sesión                  |
| POST   | /api/v1/auth/resend-code    | Reenviar código OTP            |

### Usuarios (Admin)
| Método | Ruta                        | Descripción             |
|--------|-----------------------------|-------------------------|
| GET    | /api/v1/users               | Listar usuarios         |
| POST   | /api/v1/users/reviewer      | Crear revisor           |
| PATCH  | /api/v1/users/:id/status    | Activar/suspender       |

### Rúbricas (Admin)
| Método | Ruta                | Descripción                    |
|--------|---------------------|--------------------------------|
| GET    | /api/v1/rubrics     | Listar rúbricas                |
| POST   | /api/v1/rubrics     | Crear rúbrica dinámica         |
| PUT    | /api/v1/rubrics/:id | Actualizar rúbrica             |
| DELETE | /api/v1/rubrics/:id | Eliminar (si no está en uso)   |

### Concursos
| Método | Ruta                          | Descripción                      |
|--------|-------------------------------|----------------------------------|
| GET    | /api/v1/contests              | Listar concursos                 |
| POST   | /api/v1/contests              | Crear concurso (Admin)           |
| PATCH  | /api/v1/contests/:id/status   | Cambiar estado (Admin)           |
| POST   | /api/v1/contests/:id/categories | Agregar categoría (Admin)      |

### Proyectos
| Método | Ruta                    | Descripción                   |
|--------|-------------------------|-------------------------------|
| GET    | /api/v1/projects        | Listar (filtrado por rol)     |
| POST   | /api/v1/projects        | Subir proyecto + PDF + `youtubeUrl` |
| GET    | /api/v1/projects/:id/file | Descargar/Ver PDF (blob)    |

### Evaluaciones
| Método | Ruta                          | Descripción                  |
|--------|-------------------------------|------------------------------|
| POST   | /api/v1/evaluations           | Crear evaluación (borrador)  |
| PUT    | /api/v1/evaluations/:id       | Actualizar borrador          |
| PATCH  | /api/v1/evaluations/:id/submit | Enviar evaluación            |

### Asignaciones (Admin)
| Método | Ruta                  | Descripción                       |
|--------|-----------------------|-----------------------------------|
| POST   | /api/v1/assignments   | Asignar proyectos a revisor       |

### Dashboard
| Método | Ruta                                | Descripción          |
|--------|-------------------------------------|----------------------|
| GET    | /api/v1/dashboard/admin             | Stats generales      |
| GET    | /api/v1/dashboard/rankings/:id      | Ranking por concurso |
| GET    | /api/v1/dashboard/reviewer          | Stats del revisor    |
| GET    | /api/v1/dashboard/student           | Proyectos del alumno |

---

## 🎨 Flujos de Uso

### Flujo Administrador
1. Login → Dashboard con estadísticas
2. Crear Rúbrica → Agregar secciones y criterios dinámicamente
3. Crear Concurso → Asignar rúbrica y categorías → Activar
4. Gestión de Usuarios → Crear revisores, validar alumnos
5. Asignaciones → Asignar proyectos a revisores
6. Ver Rankings por concurso

### Flujo Alumno
1. Registro → Verificar email (OTP 6 dígitos)
2. Login → Dashboard
3. Subir Proyecto → Seleccionar concurso y categoría → Datos del equipo → Cargar PDF → Capturar liga de YouTube (video)
4. Ver calificación final cuando esté disponible

### Flujo Revisor
1. Login → Ver concursos asignados con progreso
2. Seleccionar concurso → Ver proyectos asignados
3. Evaluar proyecto → Rúbrica dinámica con puntaje por criterio
4. Guardar borrador o Enviar evaluación definitiva

---

## 🎯 Datos Generados en seed.js

### Concurso Configurado
**Concurso Nacional de Prototipos XXVIII - Fase Estatal 2026**
- **Periodo:** 01 de enero - 31 de diciembre 2026
- **Periodicidad:** Anual
- **Estado:** Activo
- **Categorías:**
  1. Mejora de procesos productivos, telecomunicaciones y electromovilidad
  2. Medio ambiente, energías renovables y sustentabilidad
  3. Educación, desarrollo social y sistemas económico-administrativos
  4. Biotecnología, innovación en alimentos y nutrición

### Rúbrica Configurada
**Rúbrica Tecnológico** - Modalidad técnica para evaluación de prototipos

**Sección I: INFORME DEL PROTOTIPO (40 puntos)**
- Introducción (1 pt)
- Planteamiento del problema (1 pt)
- Justificación (2 pts)
- Hipótesis (2 pts)
- Objetivo (4 pts)
- Tipo de investigación (2 pts)
- Marco Teórico (2 pts)
- Descripción del desarrollo e implementación (4 pts)
- Propuesta de valor (4 pts)
- Estudio de viabilidad (2 pts)
- Estudio de factibilidad técnica y financiera (4 pts)
- Impacto social, ecológico, tecnológico (4 pts)
- Estrategia propiedad intelectual (2 pts)
- Análisis de resultados (2 pts)
- Conclusiones (2 pts)
- Bibliografía APA 7ª edición (mín. 10 referencias) (2 pts)

**Sección II: MODALIDAD DEL PROTOTIPO (20 puntos)**
- Propone elementos tecnológicos innovadores (5 pts)
- Contribuye a mejorar el proceso para el cual fue diseñado (5 pts)
- Aplica teorías y métodos con alto nivel de dominio (5 pts)
- Usa normas y estándares nacionales/internacionales (5 pts)

**Sección III: EXPOSICIÓN ORAL, DOCUMENTOS Y MATERIALES (40 puntos)**
- Dominio verbal, corporal y facial en la exposición (5 pts)
- Demuestra funcionamiento del prototipo (5 pts)
- Contextos de aplicación del prototipo (5 pts)
- Detalla puntos clave de operación (5 pts)
- Bitácora de actividades (5 pts)
- Cartel con todos los elementos requeridos (5 pts)
- Manuales de usuario/instalación (5 pts)
- Materiales de exposición útiles y claros (5 pts)

**Total: 100 puntos**

---

## ⚙️ Variables de Entorno (.env)

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/concursos_db

JWT_SECRET=cambia_este_secreto
JWT_REFRESH_SECRET=otro_secreto
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Emails (Resend)
RESEND_API_KEY=tu_api_key_de_resend
EMAIL_FROM="Concursos de Investigación <no-reply@tudominio.com>"

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu@email.com
EMAIL_PASS=app_password

CLIENT_URL=http://localhost:3000
UPLOAD_DIR=uploads/projects
MAX_FILE_SIZE=10485760
```

### Configurar Gmail para 2FA
1. Activar verificación en 2 pasos en tu cuenta Google
2. Ir a Seguridad → Contraseñas de aplicación
3. Generar contraseña para "Correo" → usar en `EMAIL_PASS`

---

## 🔒 Seguridad
- Contraseñas con **bcrypt** (saltRounds: 12)
- **JWT** access token (15 min) + refresh token en cookie httpOnly
- **2FA** por email con código OTP de 6 dígitos (TTL: 15 min)
- **Helmet.js** para headers HTTP seguros
- **Rate limiting** en rutas de auth (20 req/min)
- **Multer** con filtro MIME (solo PDF) y límite de 10 MB
- **CORS** configurado por origen

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 (CDN + Babel), Hash Router |
| Backend | Node.js 20 + Express 4 |
| Base de Datos | MongoDB + Mongoose |
| Auth | JWT + bcryptjs + Nodemailer |
| Archivos | Multer → sistema de archivos |
| Seguridad | Helmet, cors, express-rate-limit |

---

## 📝 Notas de Desarrollo

- El frontend usa React desde CDN con Babel transpilado en el navegador (ideal para desarrollo). En producción, crear un proyecto con Vite/CRA.
- Los PDFs se almacenan en `server/uploads/projects/`. En producción, migrar a AWS S3 o similar.
- Para producción usar HTTPS y configurar Nginx como reverse proxy.

---

## 📋 Inicialización de Datos

### seed.js
Ejecutar `node seed.js` para cargar:
- ✅ 1 usuario Admin
- ✅ 5 usuarios Revisores con información de evaluadores institucionales
- ✅ 2 usuarios Alumnos de prueba
- ✅ Rúbrica de evaluación completa (Tecnológico - 100 puntos)
- ✅ Concurso Nacional de Prototipos XXVIII - Fase Estatal 2026
- ✅ 4 categorías de proyecto

### inicializarTodo.js
Ejecutar `node inicializarTodo.js` para resetear la base de datos completamente sin datos de prueba.

**Nota:** Ambos scripts limpian la base de datos de datos existentes, así que usarlos con cuidado en producción.
