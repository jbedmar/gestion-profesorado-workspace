# Contexto del Sistema de Gestión de Profesorado

## Descripción General

Sistema de gestión de profesorado para centros educativos con **Google Workspace for Education**. Permite sincronizar una hoja de cálculo de Google Sheets con la consola de administración, gestionando altas, bajas y reactivaciones de cuentas corporativas, así como la administración de grupos de distribución.

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    Google Sheets (Hoja)                     │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐              │
│  │ Dashboard │  │Profesores │  │  Grupos   │              │
│  └───────────┘  └───────────┘  └───────────┘              │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Google Apps Script (Backend)                   │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐      │
│  │Codigo.js │  │WorkspaceSync │  │  Dashboard.js    │      │
│  │  (Menú)  │  │   .js        │  │  (Estadísticas)  │      │
│  └──────────┘  └──────────────┘  └──────────────────┘      │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  Google Workspace API                       │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   Admin SDK     │  │  Sheets API     │                  │
│  │ (Users/Groups)  │  │ (Gridlines)     │                  │
│  └─────────────────┘  └─────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Archivos del Proyecto

### Archivos de Código (Apps Script)

| Archivo | Función |
|---------|---------|
| `Codigo.js` | Script principal: Configuración global, menú de Apps Script, funciones puente (bridge) entre el frontend HTML y las funciones backend |
| `WorkspaceSync.js` | Motor de sincronización: Comparación de hoja con Workspace vía Admin SDK. Gestión de usuarios (crear/suspender/reactivar) y grupos (crear/eliminar/agregar/quitar miembros) |
| `Dashboard.js` | Dashboard de control: Crea pestaña visual con tarjetas de estadísticas usando fórmulas vinculadas a la hoja Profesores |
| `UI_Confirmacion.html` | Panel lateral de usuarios: Interfaz HTML/CSS/JS para previsualizar y confirmar sincronización de cuentas de usuario |
| `UI_ALTAS.html` | Panel lateral de altas: Interfaz para sincronizar nuevas altas de profesorado |
| `UI_BAJAS.html` | Panel lateral de bajas: Interfaz para sincronizar bajas de profesorado |
| `UI_GestionarGrupos.html` | Panel lateral de grupos: Interfaz para crear/eliminar grupos |
| `UI_GestionarMiembros.html` | Panel lateral de miembros: Interfaz para agregar/quitar miembros de grupos |

### Archivos de Configuración

| Archivo | Función |
|---------|---------|
| `appsscript.json` | Manifiesto de Apps Script: define servicios avanzados habilitados (Admin SDK, Sheets API) |
| `.clasp.json` | Configuración de clasp: ID del script y directorio raíz (excluido del repositorio) |
| `.claspignore` | Archivos excluidos de la sincronización con clasp |
| `package.json` | Scripts npm para comandos de clasp |

### Archivos de Documentación

| Archivo | Función |
|---------|---------|
| `README.md` | Este archivo: documentación principal del proyecto |
| `Instrucciones.md` | Guía de instalación paso a paso |
| `contexto.md` | Contexto completo del proyecto |

---

## Configuración Global (CONFIG)

```javascript
var CONFIG = {
  DOMINIO: "tudominio.es",                    // Dominio de Google Workspace
  OU_DESTINO: "/Profesorado",                  // Unidad Organizativa destino
  CONTRASENA_DEFECTO: "TuContraseña!",         // Contraseña temporal para nuevas cuentas
  MODO_SIMULACION: true,                       // true = simulación, false = producción
  PAGINA_DASHBOARD: "Dashboard",               // Nombre de la pestaña Dashboard
  PAGINA_PROFESORES: "Profesores",             // Nombre de la pestaña Profesores
  PAGINA_GRUPOS: "Grupos"                      // Nombre de la pestaña Grupos
};
```

---

## Estructura de la Hoja de Cálculo

### Pestaña "Dashboard"
- Tarjetas de estadísticas dinámicas con fórmulas
- Total docentes, activos, bajas
- Cuentas corporativas creadas, pendientes, bajas por procesar
- Instrucciones de uso del sistema

### Pestaña "Profesores"
Columnas requeridas:
| Columna | Nombre | Descripción |
|---------|--------|-------------|
| B | `Profesor/a` | Nombre en formato "Apellido1 Apellido2, Nombre" |
| E | `Cuenta Corporativa` | Email corporativo (se genera automáticamente si está vacío) |
| F | `SITUACIÓN` | `ACTIVO` o `BAJA` |
| - | `Departamento` | Departamento del profesor (opcional) |
| - | `Grupo1` | Email del primer grupo |
| - | `Grupo2` | Email del segundo grupo |
| - | `Grupo3` | Email del tercer grupo |

### Pestaña "Grupos"
Columnas:
| Columna | Nombre | Descripción |
|---------|--------|-------------|
| A | `Nombre` | Nombre del grupo |
| B | `Email` | Email del grupo |
| C | `Descripción` | Descripción del grupo |
| D | `Miembros` | Emails separados por comas |
| E | `ID` | ID del grupo en Workspace |

---

## Funcionalidades

### 1. Dashboard de Control
- **Menú**: `📊 Actualizar Dashboard`
- Crea/actualiza pestaña con estadísticas
- Fórmulas dinámicas vinculadas a hoja Profesores
- Diseño limpio con tarjetas de colores

### 2. Actualización de Usuarios (ALTAS)
- **Menú**: `➕ Actualizar ALTAS`
- Compara hoja Profesores con Admin SDK
- Detecta:
  - **Altas**: Profesor activo sin cuenta creada
  - **Reactivaciones**: Profesor activo con cuenta suspendida
- Panel lateral con checkboxes
- Requiere palabra "CONFIRMAR" para ejecutar
- Modo simulación por defecto

### 3. Actualización de Usuarios (BAJAS)
- **Menú**: `➖ Actualizar BAJAS`
- Compara hoja Profesores con Admin SDK
- Detecta:
  - **Bajas**: Profesor de baja con cuenta activa en Workspace
- Panel lateral con checkboxes
- Requiere palabra "CONFIRMAR" para ejecutar
- Incluye advertencia sobre acción irreversible
- Modo simulación por defecto

### 4. Listado de Grupos
- **Menú**: `📋 Listar Grupos`
- Obtiene todos los grupos de Workspace
- Incluye miembros de cada grupo
- Crea/actualiza pestaña "Grupos"

### 5. Sincronización de Grupos
- **Menú**: `🔄 Sincronizar Grupos`
- Crea o elimina grupos según la hoja "Grupos"
- Panel lateral con checkboxes
- Requiere palabra "CONFIRMAR" para ejecutar

### 6. Sincronización de Miembros
- **Menú**: `👥 Sincronizar Miembros`
- Actualiza miembros de grupos según columnas Grupo1/2/3 de la hoja "Profesores"
- Agrega o quita miembros según corresponda
- Panel lateral con checkboxes
- Requiere palabra "CONFIRMAR" para ejecutar

### 7. Listado de Unidades Organizativas
- **Menú**: `📋 Listar Unidades`
- Obtiene todas las OUs del dominio
- Crea/actualiza pestaña "Unidades Organizativas"

---

## Generación de Emails

El sistema genera automáticamente emails corporativos a partir del nombre:

**Formato de entrada**: `Apellido1 Apellido2, Nombre`

**Ejemplo**: `García López, María`

**Email generado**: `mariagarcia@tudominio.es`

**Proceso**:
1. Separar por coma: `["García López", "María"]`
2. Obtener primer apellido: `García`
3. Obtener primer nombre: `María`
4. Concatenar: `maria` + `garcia` = `mariagarcia`
5. Limpiar acentos y caracteres especiales
6. Añadir dominio: `mariagarcia@tudominio.es`

---

## Servicios de Google API Habilitados

### Admin SDK API (AdminDirectory)
- **serviceId**: `admin`
- **version**: `directory_v1`
- **Permisos requeridos**:
  - `AdminDirectory.User.readonly` (lectura de usuarios)
  - `AdminDirectory.User` (crear/suspender usuarios)
  - `AdminDirectory.Group` (gestión de grupos)
  - `AdminDirectory.Member` (gestión de miembros)

### Google Sheets API (Sheets)
- **serviceId**: `sheets`
- **version**: `v4`
- **Uso**: Ocultar líneas de cuadrícula en Dashboard

---

## Configuración de Google Cloud Console

### Proyecto GCP
- **Pantalla de consentimiento OAuth**: Configurada como "Interno" o "Externo"
- **APIs habilitadas**:
  - Admin SDK API
  - Google Sheets API

### Apps Script API
- Habilitada en: [script.google.com/home/usersettings](https://script.google.com/home/usersettings)
- Necesaria para sincronización con clasp

---

## Herramienta de Sincronización (clasp)

### Instalación
```bash
# Node.js ya instalado
npm install -g @google/clasp

# Login
clasp login

# Verificar conexión
clasp list
```

### Comandos
| Comando | Descripción |
|---------|-------------|
| `npm run push` | Sube archivos locales a Apps Script |
| `npm run pull` | Descarga archivos de Apps Script a local |
| `npm run open` | Abre el proyecto en el navegador |
| `npm run logs` | Muestra registros de ejecución |

### Archivos excluidos (`.claspignore`)
- `node_modules/`
- `.git/`
- `Instrucciones.md`
- `README.md`
- `*.xlsx`, `*.gsheet`
- `.clasp.json`, `.claspignore`
- `package.json`, `package-lock.json`

---

## Medidas de Seguridad

1. **Modo simulación** (`MODO_SIMULACION: true`):
   - Por defecto activado
   - Las acciones se registran pero no se ejecutan
   - Cambiar a `false` para producción

2. **Palabra de seguridad**:
   - Requiere escribir "CONFIRMAR" en mayúsculas
   - Obliga a revisar los cambios antes de ejecutar

3. **Checkboxes individuales**:
   - Permite seleccionar qué cambios aplicar
   - Se puede desmarcar cambios no deseados

4. **Logging detallado**:
   - Todas las acciones se registran en Apps Script
   - Visible en Ejecuciones > Registros de Cloud

5. **Botones separados ALTAS/BAJAS**:
   - Acciones separadas para crear y suspender cuentas
   - Cada una con su propia confirmación
   - Panel de bajas incluye advertencia de acción irreversible

---

## Flujo de Trabajo Típico

### Sincronización de Usuarios
1. Editar pestaña "Profesores" (altas/bajas)
2. Menú `➕ Actualizar ALTAS` o `➖ Actualizar BAJAS`
3. Revisar cambios en panel lateral
4. Desmarcar cambios no deseados
5. Escribir "CONFIRMAR"
6. Ejecutar

### Sincronización de Grupos
1. Menú `📋 Listar Grupos` (obtener estado actual)
2. Editar pestaña "Grupos" o columnas Grupo1/2/3 de "Profesores"
3. Menú `🔄 Sincronizar Grupos` o `👥 Sincronizar Miembros`
4. Revisar cambios en panel lateral
5. Desmarcar cambios no deseados
6. Escribir "CONFIRMAR"
7. Ejecutar

---

## Solución de Problemas Comunes

### Error: "setGridlinesActive is not a function"
- **Causa**: Método no disponible en servicio básico
- **Solución**: Usar Sheets API v4 con `Sheets.Spreadsheets.batchUpdate()`

### Error: "Cannot read properties of undefined (reading 'list')"
- **Causa**: Servicio Admin SDK no configurado correctamente
- **Solución**: Verificar `appsscript.json` tiene `serviceId: "admin"` y `version: "directory_v1"`

### Error: "Resource Not Found: groupKey"
- **Causa**: Parámetro `groupKey` pasada incorrectamente a API
- **Solución**: Usar `AdminDirectory.Members.list(email, opciones)` en lugar de `AdminDirectory.Members.list({groupKey: email, ...})`

### Error: "No credentials found" en clasp
- **Causa**: clasp no autenticado
- **Solución**: Ejecutar `clasp login` y autorizar en navegador

### Error: "User has not enabled the Apps Script API"
- **Causa**: API de Apps Script no habilitada en cuenta
- **Solución**: Visitar [script.google.com/home/usersettings](https://script.google.com/home/usersettings) y activar

---

## Permisos Requeridos

### Cuenta de Administrador
- **Rol**: Administrador de usuarios + Administrador de grupos
- **Permisos mínimos**:
  - Gestión de usuarios (crear, editar, suspender)
  - Gestión de grupos (crear, editar, eliminar)
  - Gestión de miembros (agregar, eliminar)

### En Apps Script
- Autorización con cuenta de administrador
- Permisos de Admin SDK API
- Permisos de Sheets API (solo para Dashboard)

---

## Desarrollo y Mantenimiento

### Añadir nueva funcionalidad
1. Editar archivos localmente
2. Ejecutar `npm run push`
3. Recargar hoja de cálculo

### Descargar cambios de Apps Script
1. Ejecutar `npm run pull`
2. Los archivos locales se actualizan

### Ver logs de ejecución
1. Apps Script > Ejecuciones (menú izquierdo)
2. O ejecutar `npm run logs`

---

## Versión Actual

- **Funcionalidades implementadas**:
  - Dashboard de estadísticas
  - Sincronización de usuarios (crear/suspender/reactivar)
  - Listado de grupos con miembros
  - Sincronización de grupos y miembros
  - Listado de unidades organizativas
  - Panel lateral interactivo con seguridad
  - Integración con clasp para deployment
