#  SISEC CC 2026 — Referencia Técnica Oficial

### Instituto Electoral de la Ciudad de México (IECM)
* **Área Responsable:** Dirección Ejecutiva de Educación Cívica y Construcción de Ciudadanía (DEECyCC) / Unidad Técnica de Servicios Informáticos (UTSI)
* **Versión Actual:** `1.0.0`
* **Stack Tecnológico:** Node.js (Express) + Vue 3 (Vite, Pinia, Vue Router) + SQL Server + Tailwind CSS + GSAP

---

##  Tabla de Contenidos
1. [Descripción General](#-descripción-general)
2. [Stack Tecnológico](#-stack-tecnológico)
3. [Arquitectura y Estructura del Proyecto](#-arquitectura-y-estructura-del-proyecto)
4. [Modelo de Datos y Base de Datos](#-modelo-de-datos-y-base-de-datos)
5. [Seguridad y Control de Acceso](#-seguridad-y-control-de-acceso)
6. [Flujos de Operación y Reglas de Negocio](#-flujos-de-operación-y-reglas-de-negocio)
7. [Endpoints de la API (Backend)](#-endpoints-de-la-api-backend)
8. [Configuración y Variables de Entorno](#-configuración-y-variables-de-entorno)
9. [Guía de Despliegue y Puesta en Marcha](#-guía-de-despliegue-y-puesta-en-marcha)
10. [Auditoría, Logging y Solución de Problemas](#-auditoría-logging-y-solución-de-problemas)

---

##  Descripción General

**SISEC CC 2026** (Sistema de Información de Servicio Social y Educación Cívica 2026) es la plataforma tecnológica oficial del **Instituto Electoral de la Ciudad de México (IECM)** diseñada para planificar, registrar, controlar y auditar las actividades de Servicio Social, Talleres de Formación Ciudadana e Intervenciones Educativas, así como el vínculo institucional con las Demarcaciones Territoriales de la Ciudad de México.

El sistema funciona bajo un esquema centralizado que permite a los operadores de los **33 Órganos Distritales (Sedes)** registrar el avance físico de sus metas de capacitación y subir evidencias fotográficas o documentales. Al mismo tiempo, provee al personal de oficinas centrales (**Administradores y Super Administradores**) de herramientas avanzadas para la monitorización de avance en tiempo real, habilitación de plazos de captura extraordinarios por sede, auditoría de archivos subidos y exportación masiva de reportes en formato Excel plenamente formateados.

### Módulos del Sistema
* **Módulo de Autenticación y Perfiles:** Controla el acceso basado en tokens seguros y restringe las operaciones según el nivel jerárquico del usuario.
* **Módulo de Programación:** Permite la calendarización de actividades detallando curso, fecha, hora, lugar, personal asignado e institución receptora.
* **Módulo de Captura y Evidencias:** Espacio donde los operadores registran la asistencia real (dividida por rangos de edad y género) y suben los archivos probatorios obligatorios (Anexo 1, Anexo 2 e Imagen).
* **Módulo de Encuestas de Satisfacción:** Permite digitalizar y foliar de manera consecutiva las encuestas aplicadas a los participantes de los talleres de forma aleatoria.
* **Módulo de Notificaciones:** Sistema interno de alertas que avisa sobre actualizaciones de plazos, solicitudes de reemplazo de archivos o avisos institucionales.
* **Módulo de Administración (Exclusivo SuperAdmin/Admin):**
  * *Control de Usuarios:* Altas, bajas lógicas y reasignaciones de distritos.
  * *Restricciones de Fechas:* Panel global o específico por distrito para abrir/cerrar plazos de captura de forma dinámica.
  * *Explorador e Historial de Archivos:* Permite explorar físicamente los directorios de almacenamiento, descargar, eliminar y reemplazar archivos de evidencias.
  * *Gestión de Formatos:* Permite actualizar dinámicamente los archivos plantilla `.docx` descargables por los distritos.
* **Módulo de Reportes:** Generador dinámico y parametrizable de 14 tipos de reportes con estilización personalizada mediante bibliotecas nativas de hojas de cálculo.

---

## ⚡ Stack Tecnológico

| Capa | Tecnología | Versión | Propósito |
| :--- | :--- | :--- | :--- |
| **Runtime (Backend)** | Node.js | `>= 20.0.0` | Entorno de ejecución para el servidor de API. |
| **Framework (Backend)** | Express | `^5.1.0` | Middleware y ruteo HTTP para la arquitectura REST. |
| **Controlador de Base de Datos** | mssql | `^12.5.4` | Driver cliente oficial de Microsoft SQL Server para Node.js. |
| **Seguridad de Contraseñas** | bcryptjs | `^3.0.2` | Encriptación y hashing seguro de contraseñas. |
| **Generación de Reportes** | exceljs | `^4.4.0` | Escritura y estilización nativa de libros de trabajo Excel (`.xlsx`). |
| **Carga de Archivos** | multer | `^2.0.2` | Middleware para manejo de datos `multipart/form-day` y cargas de evidencias. |
| **Bitácoras y Logging** | winston | `^3.18.1` | Registro estructurado de eventos en consola y archivos locales de log. |
| **Seguridad de Encabezados** | helmet | `^8.1.0` | Asegura la API Express configurando diversos encabezados HTTP. |
| **Framework (Frontend)** | Vue.js | `^3.5.34` | Framework progresivo para el desarrollo de la interfaz de usuario. |
| **Gestión de Estado** | Pinia | `^3.0.3` | Almacén de estado global y persistencia de sesión. |
| **Enrutador** | Vue Router | `^4.6.2` | Manejo de rutas SPA y guardias de navegación por rol. |
| **Cliente HTTP (Frontend)** | axios | `^1.12.2` | Consumo de la API REST del backend mediante promesas. |
| **Estilos** | Tailwind CSS | `^3.4.17` | Framework de CSS orientado a utilidades para el diseño visual. |
| **Animaciones** | GSAP | `^3.15.0` | Animación fluida de componentes de UI y transiciones de páginas. |
| **Alertas Visuales** | SweetAlert2 | `^11.23.1` | Cuadros de diálogo emergentes estéticos e interactivos. |
| **Gestor de Paquetes** | pnpm | `>= 9.0.0` | Administración eficiente y veloz de las dependencias de node. |

---

##  Arquitectura y Estructura del Proyecto

El proyecto se divide físicamente en dos directorios independientes (`backend` y `frontend`), lo que facilita la modularidad, el despliegue desacoplado y el mantenimiento autónomo de las capas de datos y visualización.

```
sicec_2026/
├── backend/                  # Capa de Servidor API REST
│   ├── logs/                 # Registro de bitácoras del servidor (app.log)
│   ├── src/
│   │   ├── config/           # Base de datos, variables y loggers
│   │   ├── controllers/      # Controladores que enlazan rutas con modelos
│   │   ├── middlewares/      # Autenticación, validación y control de errores
│   │   ├── models/           # Abstracción de base de datos SQL Server
│   │   ├── routes/           # Mapeo de endpoints HTTP
│   │   ├── services/         # Generación de reportes y subida de archivos
│   │   ├── utils/            # Utilidades generales
│   │   ├── app.js            # Inicialización de middlewares Express
│   │   └── server.js         # Bootstrap y punto de arranque del servidor
│   ├── uploads/              # Almacenamiento local de evidencias subidas
│   │   └── DTO-[N]/          # Directorio organizado por número de distrito (Sede)
│   ├── public/               # [NUEVO] Carpeta estática del frontend (dist compilado)
│   ├── .env.development      # Configuración local / desarrollo
│   └── package.json
│
├── frontend/                 # Capa de Cliente SPA (Single Page Application)
│   ├── public/               # Activos estáticos públicos del navegador
│   ├── src/
│   │   ├── assets/           # Logotipos institucionales, imágenes y CSS base
│   │   ├── components/       # Componentes visuales reutilizables
│   │   ├── composables/      # Lógica Vue reutilizable (GSAP, Toasts, Auth)
│   │   ├── router/           # Enrutamiento y control de acceso por roles
│   │   ├── services/         # Configuración de Axios e interceptores
│   │   ├── stores/           # Manejador de estado de sesión (Pinia)
│   │   ├── views/            # Vistas principales del sistema (Vistas y admin/)
│   │   ├── App.vue           # Componente raíz de la interfaz
│   │   └── main.js           # Inicializador de la aplicación Vue
│   ├── tailwind.config.js    # Diseño del sistema de colores del IECM
│   ├── vite.config.js        # Configurador del empaquetador Vite
│   └── package.json
└── README.md                 # El presente manual técnico
```

---

##  Modelo de Datos y Base de Datos

La base de datos utiliza Microsoft SQL Server. Se conecta principalmente a la base de datos configurada en las variables de entorno, y realiza consultas directas o cruzadas (mediante nombres de objetos calificados de base de datos) a la base de datos histórica `sisecycc2024` para conservar catálogos y registros agregados.

### 1. Tabla de Usuarios (`sisec_usuarios`)
Almacena las credenciales y el distrito asignado de todo el personal que interactúa con la plataforma.
```sql
CREATE TABLE sisec_usuarios (
    idusuario INT IDENTITY(1,1) PRIMARY KEY,
    usuario VARCHAR(20) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,    -- Hash Bcrypt (dev/prod) o texto plano (legacy)
    pass2 VARCHAR(100) NULL,           -- Respaldo de contraseña
    idsede INT NOT NULL,               -- Identificador de Distrito (1 a 33), 0 para central
    idpermiso INT NOT NULL,            -- Rol (1 = Operador, 2 = Administrador, 3 = SuperAdmin)
    estado INT NOT NULL DEFAULT 1      -- 1 = Activo, 0 = Inactivo (Baja lógica)
);
```

### 2. Tabla de Configuración de Plazos (`sisec_config_fechas`)
Determina si los operadores tienen permitido registrar programación o subir evidencias basándose en la fecha actual del servidor.
```sql
CREATE TABLE sisec_config_fechas (
    id INT IDENTITY(1,1) PRIMARY KEY,
    modulo VARCHAR(20) NOT NULL,                  -- 'programacion' o 'captura'
    fecha_inicio DATE NOT NULL,                   -- Inicio del periodo permitido
    fecha_fin DATE NOT NULL,                      -- Fin del periodo permitido
    habilitado BIT NOT NULL DEFAULT 1,            -- Switch lógico general
    idsede INT NOT NULL DEFAULT 0,                -- 0 = Regla global, [N] = Regla específica para Distrito N
    fecha_actualizado DATETIME DEFAULT GETDATE(),
    idusuario_actualizo INT NULL
);
```

### 3. Tabla de Notificaciones e Historial de Solicitudes (`sisec_notificaciones`)
Canal de mensajería asíncrona dentro del sistema. Se utiliza para notificaciones del sistema e intercambio de solicitudes de extensión de fecha o archivos entre el operador y el SuperAdmin.
```sql
CREATE TABLE sisec_notificaciones (
    id INT IDENTITY(1,1) PRIMARY KEY,
    tipo VARCHAR(30) NOT NULL,                    -- 'solicitud_fecha', 'fecha_habilitada', 'solicitud_archivo', 'archivo_formatos_actualizado'
    titulo VARCHAR(120) NOT NULL,
    mensaje VARCHAR(500) NOT NULL,
    idsede_origen INT NOT NULL DEFAULT 0,         -- Distrito que emite la solicitud (0 si es sistema/central)
    idsede_destino INT NOT NULL DEFAULT 0,        -- Distrito destino (0 = Todos los distritos)
    idusuario_destino INT NOT NULL DEFAULT 0,     -- Usuario destino (0 = General)
    leida BIT NOT NULL DEFAULT 0,                 -- Estado de lectura
    fecha_creacion DATETIME DEFAULT GETDATE()
);
```

### 4. Tabla de Auditoría de Archivos (`sisec_auditoria_archivos`)
Ubicada opcionalmente en el esquema `sisecycc2024.dbo`, registra cada vez que un administrador sube, reemplaza o elimina plantillas de formatos o evidencias físicas del servidor.
```sql
CREATE TABLE sisecycc2024.dbo.sisec_auditoria_archivos (
    id INT IDENTITY(1,1) PRIMARY KEY,
    idusuario INT NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    accion VARCHAR(50) NOT NULL,                  -- 'subir', 'reemplazar', 'eliminar'
    fecha_registro DATETIME DEFAULT GETDATE()
);
```

### 5. Tablas Externas y de Catálogo (`sisecycc2024.dbo`)
* **`sisec_talleres_intervenciones`:** Contiene la información de cada taller o intervención. El campo `status` define su estado (`1` = Programada, `2` = En proceso, `3` = Realizada).
* **`sisec_encuestas`:** Almacena los resultados foliados de las encuestas de satisfacción.
* **`sisec_cat_cursos`:** Catálogo oficial de temáticas de cursos y talleres disponibles.
* **`sisec_sedes`:** Tabla de distritos y demarcaciones territoriales.

---

## 🔐 Seguridad y Control de Acceso

El acceso a los recursos y APIs del sistema está protegido bajo un esquema híbrido de tokens y verificación jerárquica de permisos.

### Niveles de Acceso (Roles)
1. **Operador (Rol 1):** Pertenece a un distrito en específico (`idsede` de 1 a 33). Sus alcances están acotados únicamente a la información generada por usuarios de su sede.
2. **Administrador (Rol 2):** Rol centralizado de lectura y generación de reportes avanzados. No puede alterar configuraciones críticas de usuario ni del sistema.
3. **Super Administrador (Rol 3):** Acceso irrestricto a todos los módulos. Administra usuarios, restringe fechas, reemplaza o elimina evidencias directas y gestiona los formatos oficiales `.docx`.

### Flujo de Autenticación
```
[ Frontend: Login ] ──( Credenciales )──> [ Backend: API /auth/login ]
                                                    │
                                             ( Valida BD )
                                                    │
[ Frontend: Almacena ] <──( JWT + Perfil )──────────┘
```
* **Verificación de Credenciales (`authModel.js`):** El sistema determina automáticamente si la contraseña almacenada está encriptada mediante Hashing **Bcrypt**. Si lo está, realiza una comparación criptográfica asíncrona; de lo contrario, valida por coincidencia directa en texto plano (método legacy de compatibilidad).
* **Firma de Token:** Se firma un JSON Web Token (JWT) utilizando el secreto configurado y con un tiempo de expiración de sesión por defecto de **8 horas**.
* **Protección de Rutas (Backend):** El middleware [auth.js](file:///c:/xampp/htdocs/2026/sicec_2026/backend/src/middlewares/auth.js) intercepta las llamadas, verifica la autenticidad del token en la cabecera `Authorization: Bearer <token>` e inyecta los datos del usuario decodificados en `req.user`.
* **Guardias de Navegación (Frontend):** Configurado en [router/index.js](file:///c:/xampp/htdocs/2026/sicec_2026/frontend/src/router/index.js), intercepta el cambio de vistas evaluando la propiedad `meta.roles`. Si el usuario no cuenta con el rol requerido o el token expiró, lo redirige al Login.

---

##  Flujos de Operación y Reglas de Negocio

###  Control de Fechas y Excepciones
El sistema restringe la creación y modificación de registros en base a reglas de calendario:
* Antes de guardar una programación o captura, el backend evalúa mediante `isFechaHabilitada` en `configFechasModel.js` si la fecha actual está comprendida dentro de algún periodo autorizado.
* **Flujo de Excepción:** Si un Órgano Distrital requiere capturar de forma extemporánea, utiliza el botón "Solicitar Habilitación de Fecha" en su interfaz. Esto genera una notificación de tipo `solicitud_fecha` en la bandeja del SuperAdmin.
* El SuperAdmin puede aprobar la solicitud directamente desde su panel, lo cual inserta una regla de excepción en `sisec_config_fechas` exclusivamente para el `idsede` solicitante, abriendo una ventana de captura particular sin alterar los bloqueos de los otros 32 distritos.

### 📂 Proceso de Carga y Nomenclatura de Evidencias
Al marcar una actividad programada como "Realizada" (status = 3), es obligatorio proporcionar tres evidencias digitales: Anexo 1 (Registro de asistencia en PDF), Anexo 2 (Desarrollo del taller en PDF) e Imagen (Evidencia fotográfica en formato de imagen).

```
[ Frontend: Subir Evidencias ] ──> [ Middleware: prepareUploadContext ]
                                                   │
                                      ( Crea carpeta DTO-X/ID_TIPO_FECHA/ )
                                                   │
                                   [ Multer: Procesa y Renombra Archivo ]
                                                   │
                                      ( Guarda en disco local )
```

1. **Estructura de Directorios:** El archivo se almacena en el servidor dentro de la ruta:
   `backend/uploads/DTO-[N]/[idcurso]_[idtipo]_[AAAAMMDD]_[HHMMSS]/`
2. **Nomenclatura Estricta de Archivos:** Multer renombra físicamente los archivos recibidos bajo el estándar:
   * `ANEXO1_D[distrito]_[AAAAMMDD]_[HHMMSS].[ext]`
   * `ANEXO2_D[distrito]_[AAAAMMDD]_[HHMMSS].[ext]`
   * `IMAGEN_D[distrito]_[AAAAMMDD]_[HHMMSS].[ext]`
3. **Formatos Permitidos:** Únicamente `.pdf`, `.jpg`, `.jpeg`, `.png` y `.gif`. Tamaño máximo: **5 MB**.

---

## 🌐 Endpoints de la API (Backend)

Todos los endpoints (a excepción de login) requieren la cabecera HTTP `Authorization: Bearer <JWT>`. Las respuestas de error de validación retornan un código HTTP `422 Unprocessable Entity`.

### 🔐 Autenticación (`/api/auth`)
* `POST /login` - Inicia sesión. Parámetros: `{ usuario, contrasena }`.
* `POST /logout` - Registra el cierre de sesión en bitácora.

### 📅 Programación de Actividades (`/api/programacion`)
* `GET /` - Retorna las actividades programadas/realizadas de la sede del usuario.
* `POST /` - Calendariza una nueva actividad.

### 📝 Captura de Evidencias (`/api/actividades`)
* `GET /` - Lista histórica de actividades por distrito.
* `GET /dashboard/metricas` - Estadísticas y porcentajes de avance del distrito actual.
* `GET /admin/dashboard/metricas` - Resumen estadístico global de los 33 distritos para administradores.
* `PUT /:id/realizada` - Pasa una actividad a realizada. Carga los archivos correspondientes a través de `multipart/form-data`.
* `PUT /:id/norealizada` - Cancela o anula una actividad registrando el motivo correspondiente (mínimo 10 caracteres).
* `PUT /:id/reprogramar` - Cambia la fecha y hora programada de la actividad.
* `DELETE /:id` - Eliminación física de la actividad de la base de datos.

### 📊 Encuestas de Satisfacción (`/api/encuestas`)
* `GET /folio` - Calcula el siguiente folio autoconsecutivo disponible. Parámetros de consulta: `tipo` ('T' para Talleres, 'I' para Intervenciones). Ejemplo de folio generado: `050014T26` (Sede 05, consecutivo 14, sufijo T26).
* `POST /` - Guarda los datos digitalizados de una encuesta. Cuenta con un disparador automático de seguridad que recalcula el folio en caso de colisión o duplicidad concurrente.

### 📄 Formatos Oficiales (`/api/formatos`)
* `GET /` - Lista de formatos disponibles.
* `GET /descargar/:archivo` - Descarga del archivo plantilla `.docx` validando seguridad contra path traversal.

### 🔔 Notificaciones (`/api/notificaciones`)
* `GET /` - Carga el feed de avisos para el usuario actual.
* `PATCH /:id/leer` - Marca una notificación o solicitud como leída/atendida.
* `GET /solicitudes-pendientes` - Solicitudes de fechas sin resolver (Exclusivo SuperAdmin).

### ⚙️ Administración (`/api/admin`)
* `GET /restricciones` - Muestra la tabla de configuraciones de plazos.
* `POST /restricciones` - Modifica u otorga un plazo general o específico.
* `GET /usuarios` - Lista de usuarios activos del sistema.
* `POST /usuarios` - Crea un nuevo usuario encriptando la clave con Bcrypt.
* `PUT /usuarios/:id` - Edita el rol o distrito de un usuario y actualiza la clave en caso de ser provista.
* `DELETE /usuarios/:id` - Borrado lógico (establece `estado = 0`).
* `GET /archivos` - Explora las carpetas físicas de evidencias. Soporta el parámetro `folder` para navegar.
* `POST /archivos/replace` - Reemplaza físicamente un archivo de evidencia dañado o incorrecto en el disco.
* `DELETE /archivos` - Elimina un archivo de evidencias físicamente del almacenamiento.
* `GET /formatos` - Lista de archivos de plantilla `.docx` en el servidor.
* `POST /formatos/subir` - Sube o reemplaza un archivo de plantilla `.docx`.
* `DELETE /formatos/:archivo` - Elimina un archivo de plantilla del catálogo.

### 📈 Reportes Dinámicos (`/api/reportes`)
* `GET /catalogos` - Retorna los catálogos para filtros de reportes (sedes, demarcaciones, talleres).
* `POST /generar` - Genera y descarga un reporte en formato Excel (`.xlsx`). Soporta 14 tipos de estructura de datos:
  1. *Talleres por vertiente*
  2. *Intervenciones educativas*
  3. *Talleres e intervenciones (todos)*
  4. *Encuestas de satisfacción*
  5. *Grupos de Edad — Talleres*
  6. *Grupos de Edad — Intervenciones*
  7. *Actividades programadas no realizadas*
  8. *Actividades programadas realizadas*
  9. *Actividades realizadas por convenio*
  10. *Avance acumulado por distrito (talleres)* (Admin)
  11. *Avance acumulado por distrito (con intervenciones)* (Admin)
  12. *Concentrado de talleres por demarcación territorial* (Admin)
  13. *Concentrado de talleres por grupos de edad* (Admin)
  14. *Programadas, realizadas y no realizadas (histórico)*

---

## ⚙️ Configuración y Variables de Entorno

El backend soporta configuraciones diferenciadas según el entorno (`development` o `production`). El archivo cargado depende de la variable `NODE_ENV` (cargando `.env.development` por defecto).

### Configuración del Backend

#### Archivo `backend/.env.development`
```ini
NODE_ENV=development
PORT=3000
DB_SERVER=145.0.40.72               # IP de pruebas del servidor de base de datos
DB_DATABASE=sisecycc2024            # Nombre de la base de datos principal
DB_USER=user1
DB_PASSWORD=u53r1
DB_PORT=1433
DB_ENCRYPT=false
DB_TRUST_SERVER_CERT=true
JWT_SECRET=clave_super_secreta_dev
JWT_EXPIRES_IN=8h
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=debug
UPLOAD_PATH=./uploads
FORMATOS_PATH=./uploads/temp/Archivos/2026/
```

#### Archivo `backend/.env.production`
```ini
NODE_ENV=production
PORT=3000
DB_SERVER=servidor_prod
DB_DATABASE=SISEC_DB
DB_USER=usuario_prod
DB_PASSWORD=password_prod
DB_PORT=1433
JWT_SECRET=clave_super_secreta_prod
JWT_EXPIRES_IN=8h
CORS_ORIGIN=https://sicec.iecm.mx    # Dominio oficial del cliente
LOG_LEVEL=info
UPLOAD_PATH=./uploads
FORMATOS_PATH=./uploads/temp/Archivos/2026/
```

---

### Configuración del Frontend

#### Archivo `frontend/.env.development`
```ini
VITE_API_URL=http://localhost:3000/api
VITE_APP_TITLE=SISEC CC 2026 (Desarrollo)
```

#### Archivo `frontend/.env.production`
```ini
VITE_API_URL=https://sicec.iecm.mx/api
VITE_APP_TITLE=SISEC CC 2026
```

---

## 🚀 Guía de Despliegue y Puesta en Marcha

### Prerrequisitos en el Servidor
1. **Node.js:** Versión `>= 20.0.0` instalada globalmente.
2. **PNPM:** Gestor de paquetes oficial del proyecto (`pnpm`).
3. **Microsoft SQL Server:** Instancia de base de datos accesible con permisos de lectura, escritura y ejecución para el usuario configurado.

### Instalación de Dependencias
Ejecutar el proceso de instalación en ambos directorios desde la raíz del proyecto:
```bash
# Instalar dependencias del backend
cd backend
pnpm install

# Instalar dependencias del frontend
cd ../frontend
pnpm install
```

### Ejecución en Modo Desarrollo
Para levantar los servidores de prueba locales:
```bash
# En la carpeta backend/ (Inicia en puerto 3000 con recarga automática por nodemon)
pnpm run dev

# En la carpeta frontend/ (Inicia el servidor de Vite en el puerto 5173)
pnpm run dev
```

### Compilación y Despliegue en Producción
Para desplegar en un entorno de producción oficial:

1. **Compilar el Frontend:**
   ```bash
   cd frontend
   pnpm run build
   ```
   Esto generará una carpeta optimizada `frontend/dist`. Transfiere los archivos contenidos a tu servidor web de producción (IIS, Nginx o Apache).

2. **Arrancar el Backend:**
   Asegúrate de configurar correctamente el archivo `backend/.env.production` con las credenciales de producción y arranca el proceso:
   ```bash
   cd backend
   # Iniciar directamente con Node
   pnpm run start
   ```
   > [!TIP]
   > Para asegurar alta disponibilidad del backend en producción, se recomienda gestionar el proceso mediante un administrador de procesos como **PM2**:
   > ```bash
   > pm2 start src/server.js --name "sicec-backend-2026"
   > ```

---

## 🪵 Auditoría, Logging y Solución de Problemas

### Sistema de Bitácoras (Winston Logger)
El backend cuenta con un logger automatizado estructurado mediante Winston. Todos los eventos quedan registrados con su marca de tiempo en la consola del servidor y se añaden de forma persistente al archivo local `backend/logs/app.log`.

Ejemplos de registros en bitácora:
* **Autenticación:** `[2026-06-12 13:05:12] [AUTH]    ✅ Login exitoso — Usuario: Juan Perez | Sede: 5 | Permiso: 1`
* **Acciones:** `[2026-06-12 13:06:45] [ACTION]  📋 Programación creada — Usuario: Juan Perez | Curso: 12 | Sede: 5`
* **Reportes:** `[2026-06-12 13:08:22] [REPORT]  📊 Reporte generado — Tipo: 3 | Usuario: Admin General | Registros: 145`
* **Errores:** `[2026-06-12 13:09:01] [ERROR]   💥 Error en POST /api/encuestas — El folio ya existe.`

### Solución de Problemas Comunes

#### 1. Error de Conexión a Base de Datos al Iniciar
* **Mensaje en Consola:** `❌ ERROR DE CONEXIÓN A BASE DE DATOS ... Connection lost - read ECONNRESET`
* **Causa:** La dirección IP del servidor SQL Server no es accesible desde el servidor de Node o los puertos (1433 por defecto) están bloqueados por un firewall.
* **Solución:** Valida las variables `DB_SERVER` y `DB_PORT`. Verifica que el servidor SQL Server tenga habilitadas las conexiones TCP/IP en el Administrador de Configuración de SQL Server.

#### 2. Error en la Carga de Evidencias
* **Mensaje en API:** `Error: Tipo de archivo no permitido.` o `Error: File too large`
* **Causa:** El operador intentó subir un formato no admitido (por ejemplo `.zip` o `.docx` como evidencia) o el archivo excede los 5 MB configurados en el middleware de Multer.
* **Solución:** Revisa las restricciones de extensión y tamaño de Multer en [services/fileUpload.js](file:///c:/xampp/htdocs/2026/sicec_2026/backend/src/services/fileUpload.js). Asegúrate de que el directorio `uploads` tenga permisos de lectura y escritura para el usuario de Node.js.

#### 3. Error en la Descarga de Reportes Excel
* **Causa:** La base de datos cruzada `sisecycc2024` no contiene los registros esperados o falta alguna columna en los catálogos.
* **Solución:** Verifica que el modelo del reporte en `reporteModel.js` corresponda exactamente con la estructura de tablas de la base de datos de producción. Puedes consultar las consultas SQL integradas directamente en [models/reporteModel.js](file:///c:/xampp/htdocs/2026/sicec_2026/backend/src/models/reporteModel.js#L148-L612).


*Generado por Bruno Corona Ing. especializado en desarrollo de aplicaciones web.*