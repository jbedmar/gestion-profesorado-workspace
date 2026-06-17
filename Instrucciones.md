# Guía de Instalación - Gestión de Profesorado para Google Workspace

Herramienta de administración de profesorado y grupos para centros educativos con Google Workspace for Education.

---

## 📋 Requisitos Previos

1. **Google Workspace for Education** con cuenta de administrador
2. **Cuenta de administrador** del centro (ej. `admin@tudominio.es`)
3. **Node.js** instalado (opcional, para usar clasp)

---

## 🛠️ Instalación

### Paso 1: Crear la Hoja de Cálculo
1. Crea una nueva hoja de cálculo en Google Sheets
2. Nómbrala como quieras (ej. "Gestión de Profesorado")

### Paso 2: Abrir el Editor de Apps Script
1. En la hoja de cálculo, ve a **Extensiones** > **Apps Script**

### Paso 3: Crear los Archivos de Código
Crea los siguientes archivos en el editor de Apps Script:

| Archivo | Tipo | Contenido |
|---------|------|-----------|
| `Codigo.gs` | Script | Copia el contenido de `Codigo.js` |
| `WorkspaceSync.gs` | Script | Copia el contenido de `WorkspaceSync.js` |
| `Dashboard.gs` | Script | Copia el contenido de `Dashboard.js` |
| `UI_Confirmacion.html` | HTML | Copia el contenido de `UI_Confirmacion.html` |
| `UI_ALTAS.html` | HTML | Copia el contenido de `UI_ALTAS.html` |
| `UI_BAJAS.html` | HTML | Copia el contenido de `UI_BAJAS.html` |
| `UI_GestionarGrupos.html` | HTML | Copia el contenido de `UI_GestionarGrupos.html` |
| `UI_GestionarMiembros.html` | HTML | Copia el contenido de `UI_GestionarMiembros.html` |

### Paso 4: Configurar el Dominio
En `Codigo.gs`, edita la variable CONFIG:

```javascript
var CONFIG = {
  DOMINIO: "tudominio.es",                    // Tu dominio de Google Workspace
  OU_DESTINO: "/Profesorado",                  // OU destino para nuevos usuarios
  CONTRASENA_DEFECTO: "TuContraseña!",         // Contraseña temporal
  MODO_SIMULACION: true,                       // true = simulación, false = producción
  ...
};
```

### Paso 5: Habilitar Servicios Avanzados
En el editor de Apps Script:

1. **Servicios** > **`+`** > **Admin SDK API** > Añadir (identificador: `AdminDirectory`)
2. **Servicios** > **`+`** > **Google Sheets API** > Añadir (identificador: `Sheets`)

### Paso 6: Habilitar Google Sheets API en Cloud Console
1. Ve a [console.cloud.google.com](https://console.cloud.google.com)
2. Selecciona tu proyecto
3. **APIs y servicios** > **+ HABILITAR API Y SERVICIOS**
4. Busca y habilita **Google Sheets API**

### Paso 7: Autorizar el Script
1. Recarga la hoja de cálculo (F5)
2. Ve al menú que aparece y ejecuta cualquier función
3. Cuando pida permisos, autoriza con tu cuenta de administrador

---

## 🔄 Sincronización con clasp (Opcional)

Para trabajar con los archivos localmente y sincronizar con Apps Script:

### Instalar clasp
```bash
npm install -g @google/clasp
clasp login
```

### Configurar
1. En Apps Script, ve a **Proyecto > Configuración** y copia el **ID del script**
2. Crea el archivo `.clasp.json`:
```json
{
  "scriptId": "TU_SCRIPT_ID_AQUI"
}
```

### Comandos
| Comando | Descripción |
|---------|-------------|
| `npm run push` | Subir cambios a Apps Script |
| `npm run pull` | Descargar cambios de Apps Script |
| `npm run open` | Abrir en el navegador |

---

## 🚀 Uso

### Menús Disponibles

```
👨‍🏫 Profesorado
  ├── 📊 Actualizar Dashboard
  ├── ➕ Actualizar ALTAS
  └── ➖ Actualizar BAJAS

📋 Grupos
  ├── 📋 Listar Grupos
  ├── 🔄 Sincronizar Grupos
  └── 👥 Sincronizar Miembros

🏢 Unidades Organizativas
  └── 📋 Listar Unidades
```

### Estructura de la Hoja "Profesores"

| Columna | Descripción |
|---------|-------------|
| `Profesor/a` | Nombre en formato "Apellido, Nombre" |
| `Cuenta Corporativa` | Email corporativo (se genera si está vacío) |
| `SITUACIÓN` | `ACTIVO` o `BAJA` |
| `Departamento` | Departamento del profesor |
| `Grupo1` | Email del primer grupo |
| `Grupo2` | Email del segundo grupo |
| `Grupo3` | Email del tercer grupo |

### Flujo de Trabajo

1. **Primera vez**: Ejecutar `📋 Listar Grupos` y `📋 Listar Unidades`
2. **Altas**: Añadir profesor en hoja "Profesores" con SITUACIÓN = ACTIVO
3. **Bajas**: Cambiar SITUACIÓN a BAJA
4. **Grupos**: Asignar grupos en columnas Grupo1/2/3
5. **Sincronizar**: Usar los menús correspondientes

---

## 🔒 Seguridad

- **Modo simulación** activado por defecto
- Se requiere escribir **CONFIRMAR** para ejecutar cambios
- Checkboxes para seleccionar qué cambios aplicar
- Todas las acciones se registran en logs

---

## 📝 Licencia

MIT License
