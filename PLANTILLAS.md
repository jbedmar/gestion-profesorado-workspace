# Plantillas de Hoja de Cálculo

Estas plantillas te ayudan a configurar rápidamente la hoja de cálculo para el sistema de gestión de profesorado.

## 📋 Archivos Incluidos

| Archivo | Descripción |
|---------|-------------|
| `plantilla_profesores.csv` | Plantilla para la pestaña "Profesores" |
| `plantilla_grupos.csv` | Plantilla para la pestaña "Grupos" |

## 🚀 Cómo Usar las Plantillas

### Paso 1: Crear la Hoja de Cálculo
1. Ve a [Google Sheets](https://sheets.google.com)
2. Crea una hoja nueva
3. Nómbrala como quieras (ej. "Gestión de Profesorado")

### Paso 2: Importar Plantilla de Profesores
1. Crea una pestaña nueva llamada **"Profesores"**
2. Ve a **Archivo** > **Importar**
3. Selecciona **Subir** y elige `plantilla_profesores.csv`
4. Configura:
   - Tipo de separador: **Coma**
   - Ubicación: **Insertar nuevas hojas**
5. Haz clic en **Importar datos**

### Paso 3: Importar Plantilla de Grupos
1. Crea una pestaña nueva llamada **"Grupos"**
2. Repite el proceso de importación con `plantilla_grupos.csv`

### Paso 4: Configurar el Script
1. Abre **Extensiones** > **Apps Script**
2. Copia el código de los archivos `.js` y `.html`
3. Edita `Codigo.js` y cambia `tudominio.es` por tu dominio

## 📝 Estructura de la Plantilla

### Profesores

| Columna | Tipo | Ejemplo | Descripción |
|---------|------|---------|-------------|
| `Profesor/a` | Texto | García López María | Nombre completo (Apellido1 Apellido2, Nombre) |
| `Cuenta Corporativa` | Email | mgarcialopez@tudominio.es | Se genera automáticamente si está vacío |
| `SITUACIÓN` | Texto | ACTIVO / BAJA | Estado del profesor |
| `Departamento` | Texto | Matemáticas | Departamento académico |
| `Grupo1` | Email | matematicas@tudominio.es | Primer grupo de pertenencia |
| `Grupo2` | Email | profesorado@tudominio.es | Segundo grupo de pertenencia |
| `Grupo3` | Email | | Tercer grupo (opcional) |

### Grupos

| Columna | Tipo | Ejemplo | Descripción |
|---------|------|---------|-------------|
| `Nombre` | Texto | Profesorado | Nombre descriptivo del grupo |
| `Email` | Email | profesorado@tudominio.es | Email del grupo en Google Workspace |
| `Descripción` | Texto | Grupo de todos los profesores | Descripción del grupo |
| `Miembros` | Email | user1@dominio.es,user2@dominio.es | Emails separados por comas |

## ⚠️ Notas Importantes

1. **Dominio**: Recuerda cambiar `tudominio.es` por tu dominio real en los CSVs antes de importar
2. **Formato de nombre**: El nombre debe ser "Apellido1 Apellido2, Nombre"
3. **Grupos**: Los emails de los grupos deben existir en Google Workspace
4. **Datos de ejemplo**: Los datos incluidos son ficticios - bórralos después de probar

## 🔄 Después de Importar

1. Ejecuta `📊 Actualizar Dashboard` desde el menú
2. Prueba la sincronización en modo simulación
3. Cuando estés listo, cambia `MODO_SIMULACION: false` en `Codigo.js`
