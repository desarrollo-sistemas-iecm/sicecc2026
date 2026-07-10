# Manual de Usuario: Sistema SISEC CC 2026

Este manual detalla el funcionamiento, la arquitectura de permisos y los flujos de trabajo de los tres perfiles de usuario del sistema **SISEC CC 2026** (Sistema de Información y Seguimiento de Educación Cívica).

---

## 1. Introducción al Sistema

El **SISEC CC 2026** es una plataforma web integral diseñada para planificar, registrar y dar seguimiento a las actividades de educación cívica y participación ciudadana del Instituto Electoral de la Ciudad de México (IECM). Permite la colaboración entre las sedes distritales (operadores) y la oficina central (administradores y superadministradores), centralizando evidencias físicas, reportes y métricas de avance.

---

## 2. Niveles de Permiso (Roles)

El sistema cuenta con una estructura jerárquica basada en tres perfiles de usuario:

| ID de Permiso | Nombre del Rol | Sede Asociada | Descripción General |
| :--- | :--- | :--- | :--- |
| **1** | **Operador (Distrito)** | Sede Distrital Específica (1 a 33) | Registra la planeación, captura evidencias de actividades, aplica encuestas de satisfacción y descarga formatos oficiales. |
| **2** | **Administrador (Sede Central)** | General / Consulta | Consulta reportes de cumplimiento global, analiza métricas y exporta consolidados para toma de decisiones. No captura evidencias. |
| **3** | **SuperAdmin (Sistemas / Dirección)** | Sede Central (Sede 0) | Posee acceso total. Administra usuarios, habilita fechas y excepciones de captura, gestiona plantillas de formatos oficiales y explora archivos. |

---

## 3. Flujo de Trabajo por Tipo de Usuario

### 3.1. Flujo del Operador (Distrito / Sede Distrital)

El operador es el encargado directo de ingresar la información operativa de campo en su respectiva demarcación territorial. Su flujo habitual consta de las siguientes etapas:

1. **Dashboard y Diagnóstico**: Al ingresar, el operador observa el porcentaje de avance específico de su distrito, comparado con las metas calendarizadas.
2. **Programación**:
   * Planea las actividades mensuales/anuales (talleres de formación ciudadana, acciones educativas de ludoteca cívica, convenios con demarcaciones territoriales).
   * Registra fechas estimadas, número proyectado de asistentes y tipo de actividad.
3. **Descarga de Formatos**:
   * Accede al repositorio de **Formatos** para descargar los anexos y plantillas oficiales (`.docx`) requeridos para la comprobación física.
4. **Captura de Evidencias**:
   * Carga los datos reales ejecutados de las actividades planeadas.
   * Sube las evidencias requeridas (fotografías, minutas, listas de asistencia) asociadas a cada actividad.
   * *Restricciones*: Si el periodo límite mensual ha expirado, el módulo de captura se bloqueará. En tal caso, el operador visualizará un aviso de bloqueo y podrá ver la fecha límite vigente.
5. **Registro de Encuestas**:
   * Introduce la encuesta de satisfacción respondida por los ciudadanos en los talleres.
   * El sistema procesa los datos y genera un folio único para cada evaluación capturada.
6. **Reportes Distritales**:
   * Consulta sus propias métricas e imprime/exporta sus reportes de actividades.

---

### 3.2. Flujo del Administrador (Sede Central / Validador)

El administrador central tiene un rol de supervisión y análisis estadístico. No edita datos directamente, pero valida el cumplimiento de las sedes.

1. **Monitoreo en Tiempo Real**: Observa el panel de control interactivo con el estatus general de cumplimiento de los 33 distritos electorales mediante gráficos dinámicos de barras y pastel.
2. **Filtros Avanzados de Consulta**:
   * Consulta actividades específicas filtrando por distrito, tipo de actividad (Servicio Social, Ludoteca, Acciones Educativas) o rango de fechas.
3. **Generación de Reportes Consolidados**:
   * Descarga reportes completos exportables a Excel con las estadísticas agregadas de asistencia, satisfacción de encuestas y carga de evidencias.

---

### 3.3. Flujo del SuperAdmin (Administrador General de Sistemas)

El SuperAdmin tiene el control absoluto de la base de datos, configuraciones globales y mantenimiento de la plataforma.

1. **Gestión de Cuentas de Usuarios (Usuarios)**:
   * Crea, modifica y da de baja cuentas de operadores y administradores. 
   * Restablece contraseñas y asigna o reasigna sedes distritales.
2. **Control de Restricciones Temporales (Restricciones)**:
   * Configura las fechas de cierre mensuales para la captura de información de los operadores.
   * **Gestión de Prórrogas**: Evalúa y aprueba/rechaza solicitudes excepcionales de prórroga para distritos específicos que no lograron capturar a tiempo sus actividades debido a causas de fuerza mayor.
3. **Administración de Formatos Oficiales (Formatos)**:
   * Actualiza el repositorio de plantillas Word (`.docx`). Sube las nuevas versiones de los anexos (Servicio Social, Ludotecas, etc.) para que se distribuyan automáticamente a los distritos.
4. **Administración y Auditoría de Evidencias (Explorador de Archivos)**:
   * Utiliza el explorador de archivos en árbol para auditar los PDF y JPG subidos por los distritos.
   * Cuenta con herramientas para reemplazar archivos corruptos o incorrectos, y para eliminar evidencias si es necesario.

---

## 4. Guía Detallada de Módulos

### 4.1. Dashboard
* **Visualización**: Gráficos interactivos de avance de metas.
* **Componentes**: Indicadores numéricos de total de actividades registradas, asistentes alcanzados y promedio de satisfacción ciudadana.
* **Mapa de Calor**: Distribución de actividades por distrito electoral.

### 4.2. Programación (Planificación de Actividades)
* **Objetivo**: Evitar la improvisación y alinear el trabajo a las metas anuales del IECM.
* **Operativa**: El sistema requiere registrar el tipo de actividad, fecha programada, tema, facilitador y la meta de asistentes proyectada.

### 4.3. Captura de Evidencias
* **Estructura**: Formulario dinámico adaptado al tipo de actividad programada.
* **Carga de Archivos**: Validador de archivos PDF y de imagen. El operador debe anexar los archivos obligatorios para poder cambiar el estatus de la actividad a "Completada".

### 4.4. Encuesta de Satisfacción
* **Objetivo**: Evaluar de forma cuantitativa la calidad del servicio del IECM.
* **Captura**: Consiste en preguntas cerradas de opción múltiple (métrica Likert). Genera un gráfico de satisfacción automático en el módulo de reportes.

### 4.5. Reportes
* **Filtros**: Permite segmentar por distrito, tipo de programa y fechas.
* **Exportación**: Genera archivos planos compatibles con Excel y reportes visuales en PDF listos para impresión.

### 4.6. Administración (Sólo SuperAdmin)
* **Usuarios**: Alta y control de credenciales.
* **Restricciones**: Configuración de cierres de sistema y aprobaciones excepcionales.
* **Formatos**: Gestor del repositorio oficial de plantillas.
* **Archivos**: Explorador de las carpetas de almacenamiento físico de evidencias cargadas en el servidor.

---

## 5. Preguntas Frecuentes y Soporte Operativo

### ¿Qué hacer si aparece "Módulo de Captura Bloqueado"?
Esto significa que la fecha límite configurada por el SuperAdmin para el mes correspondiente ya ha transcurrido. El operador distrital debe comunicarse con la oficina central para justificar el retraso y solicitar una **fecha de excepción (prórroga)** en el sistema.

### ¿Qué formatos de archivo se permiten en las evidencias?
Únicamente se admiten archivos comprimidos, imágenes (`.jpg`, `.png`) y documentos `.pdf`. Los archivos no deben exceder el peso máximo configurado en el servidor para evitar fallos en la carga.

### ¿Cómo sé si mi actividad fue registrada correctamente?
Al finalizar la carga de datos y evidencias en el módulo de Captura, el estatus de la actividad cambiará de color a color verde (**Completado**) y estará disponible para la consulta en el panel global de reportes de la Sede Central.
