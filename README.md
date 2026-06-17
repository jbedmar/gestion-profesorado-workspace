# Gestión de Profesorado para Google Workspace

Herramienta de administración de profesorado y grupos para centros educativos con Google Workspace for Education.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 📋 Características

- **Sincronización de profesorado**: Altas y bajas automáticas en Google Workspace
- **Gestión de grupos**: Creación/eliminación de grupos y miembros
- **Unidades Organizativas**: Listado de OUs del dominio
- **Dashboard interactivo**: Estadísticas en tiempo real
- **Interfaz segura**: Confirmación requerida antes de cada cambio

## 🚀 Inicio Rápido

### Requisitos
- Google Workspace for Education
- Cuenta de administrador
- Node.js (opcional, para usar clasp)

### Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/TU_USUARIO/gestion-profesorado-workspace.git
   cd gestion-profesorado-workspace
   ```

2. **Crear hoja de cálculo**
   - Crea una nueva hoja en Google Sheets
   - Copia el contenido de los archivos `.js` y `.html` al editor de Apps Script

3. **Configurar dominio**
   - Edita `Codigo.js` y establece tu dominio:
     ```javascript
     var CONFIG = {
       DOMINIO: "tudominio.es",
       // ...
     };
     ```

4. **Habilitar servicios**
   - Admin SDK API (`AdminDirectory`)
   - Google Sheets API (`Sheets`)

5. **Autorizar permisos**
   - Ejecuta cualquier función desde el menú
   - Autoriza con tu cuenta de administrador

## 📁 Estructura del Proyecto

```
├── Codigo.js                    # Script principal y configuración
├── WorkspaceSync.js             # Lógica de sincronización con Workspace
├── Dashboard.js                 # Dashboard de estadísticas
├── UI_Confirmacion.html         # Panel de confirmación de sincronización
├── UI_ALTAS.html                # Panel de altas de profesorado
├── UI_BAJAS.html                # Panel de bajas de profesorado
├── UI_GestionarGrupos.html      # Panel de gestión de grupos
├── UI_GestionarMiembros.html    # Panel de gestión de miembros
├── appsscript.json              # Configuración de Apps Script
└── Instrucciones.md             # Guía detallada de instalación
```

## 🔧 Uso

### Menús Disponibles

| Menú | Función | Descripción |
|------|---------|-------------|
| 👨‍🏫 Profesorado | 📊 Actualizar Dashboard | Muestra estadísticas del sistema |
| 👨‍🏫 Profesorado | ➕ Actualizar ALTAS | Sincroniza nuevos profesores |
| 👨‍🏫 Profesorado | ➖ Actualizar BAJAS | Marca profesores de baja |
| 📋 Grupos | 📋 Listar Grupos | Lista todos los grupos del dominio |
| 📋 Grupos | 🔄 Sincronizar Grupos | Crea/elimina grupos según la hoja |
| 📋 Grupos | 👥 Sincronizar Miembros | Actualiza miembros de grupos |
| 🏢 Unidades Org. | 📋 Listar Unidades | Lista todas las OUs del dominio |

### Estructura de la Hoja "Profesores"

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `Profesor/a` | Texto | Nombre en formato "Apellido1 Apellido2, Nombre" |
| `Cuenta Corporativa` | Email | Se genera automáticamente si está vacío |
| `SITUACIÓN` | `ACTIVO`/`BAJA` | Estado del profesor |
| `Departamento` | Texto | Departamento académico |
| `Grupo1` | Email | Primer grupo de pertenencia |
| `Grupo2` | Email | Segundo grupo de pertenencia |
| `Grupo3` | Email | Tercer grupo de pertenencia |

## 🛡️ Seguridad

- **Modo simulación** activado por defecto
- Se requiere escribir **CONFIRMAR** para ejecutar cambios reales
- Checkboxes para seleccionar qué cambios aplicar
- Registro completo de todas las acciones

## 🔄 Sincronización con clasp

Para trabajar localmente y sincronizar con Apps Script:

```bash
# Instalar clasp (opcional)
npm install -g @google/clasp
clasp login

# Configurar
# 1. Copia el ID del script desde Apps Script > Proyecto > Configuración
# 2. Crea .clasp.json con tu scriptId

# Sincronizar
npm run push    # Subir cambios a Apps Script
npm run pull    # Descargar cambios de Apps Script
```

## 📄 Documentación

Consulta `Instrucciones.md` para una guía detallada de instalación y uso.

## 🤝 Contribuir

1. Forke el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Haz commit de tus cambios (`git commit -m 'Add nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 👥 Autores

- **Desarrollo inicial** - Sistema de gestión para centro educativo

## 🙏 Agradecimientos

- Google Apps Script por la plataforma
- Google Workspace for Education por las APIs
- Comunidad educativa por los feedbacks
