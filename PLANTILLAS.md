# Plantillas de Hoja de Cálculo

Estas plantillas te ayudan a configurar rápidamente la hoja de cálculo para el sistema de gestión de profesorado.

---

## 📋 Estructura Completa de la Hoja

Tu hoja de cálculo debe tener **4 pestañas** con esta estructura:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        HOJA DE CÁLCULO                                      │
├─────────────────┬─────────────────┬─────────────────┬───────────────────────┤
│    Dashboard    │   Profesores    │     Grupos      │ Unidades Organizativas│
│   (Automático) │   (Manual)      │   (Manual)      │    (Automático)      │
└─────────────────┴─────────────────┴─────────────────┴───────────────────────┘
```

---

## 📊 Pestaña 1: Dashboard

**Se crea automáticamente** al ejecutar `📊 Actualizar Dashboard`.

| Columna | Contenido |
|---------|-----------|
| B2:F2 | Título principal "PANEL DE CONTROL Y ADMINISTRACIÓN DE WORKSPACE" |
| B4:B5 | Tarjeta: TOTAL DOCENTES |
| D4:D5 | Tarjeta: DOCENTES ACTIVOS |
| F4:F5 | Tarjeta: DOCENTES DE BAJA |
| B7:B8 | Tarjeta: CUENTAS CORPORATIVAS |
| D7:D8 | Tarjeta: PENDIENTES CREAR |
| F7:F8 | Tarjeta: PENDIENTES BAJA |
| B10:B11 | Tarjeta: TOTAL GRUPOS |
| D10:D11 | Tarjeta: GRUPOS EN WORKSPACE |
| F10:F11 | Tarjeta: GRUPOS PENDIENTES |
| B13:F18 | Instrucciones de uso |

**Fórmulas automáticas** (referencian pestaña "Profesores"):
```
TOTAL DOCENTES:       =COUNTA(Profesores!B2:B)
DOCENTES ACTIVOS:     =COUNTIF(Profesores!F2:F; "ACTIVO")
DOCENTES DE BAJA:     =COUNTIF(Profesores!F2:F; "BAJA")
CUENTAS CREADAS:      =COUNTIFS(Profesores!F2:F; "ACTIVO"; Profesores!E2:E; "*@*")
PENDIENTES CREAR:     =COUNTIFS(Profesores!F2:F; "ACTIVO"; Profesores!E2:E; "")
```

---

## 👨‍🏫 Pestaña 2: Profesores

**Esta pestaña se crea manualmente** o importando `plantilla_profesores.csv`.

| Columna | Letra | Nombre | Tipo | Ejemplo | Obligatorio |
|---------|-------|--------|------|---------|-------------|
| 1 | A | *(índice)* | Número | 1, 2, 3... | No |
| 2 | B | `Profesor/a` | Texto | García López María | **Sí** |
| 3 | C | *(vacía)* | - | - | No |
| 4 | D | *(vacía)* | - | - | No |
| 5 | E | `Cuenta Corporativa` | Email | mgarcialopez@tudominio.es | **Sí** |
| 6 | F | `SITUACIÓN` | Texto | `ACTIVO` o `BAJA` | **Sí** |
| 7 | G | `Departamento` | Texto | Matemáticas | No |
| 8 | H | `Grupo1` | Email | matematicas@tudominio.es | No |
| 9 | I | `Grupo2` | Email | profesorado@tudominio.es | No |
| 10 | J | `Grupo3` | Email | orientacion@tudominio.es | No |

### Formato del Nombre (Columna B)
```
Formato:  Apellido1 Apellido2, Nombre
Ejemplo:  García López, María
```

### Estados de SITUACIÓN (Columna F)
| Valor | Significado |
|-------|-------------|
| `ACTIVO` | Profesor activo - se creará/sincronizará cuenta |
| `BAJA` | Profesor dado de baja - se suspenderá cuenta |

### Generación Automática de Email (Columna E)
Si la columna E está vacía, el sistema genera el email automáticamente:
```
Entrada:  García López, María
Proceso:  maria + garcia = mariagarcia
Salida:   mariagarcia@tudominio.es
```

---

## 📋 Pestaña 3: Grupos

**Esta pestaña se crea manualmente** o importando `plantilla_grupos.csv`.

| Columna | Letra | Nombre | Tipo | Ejemplo | Obligatorio |
|---------|-------|--------|------|---------|-------------|
| 1 | A | `Nombre` | Texto | Profesorado | **Sí** |
| 2 | B | `Email` | Email | profesorado@tudominio.es | **Sí** |
| 3 | C | `Descripción` | Texto | Grupo de todos los profesores | No |
| 4 | D | `Miembros` | Texto | user1@dominio.es,user2@dominio.es | No |
| 5 | E | `ID` | Texto | *(automático)* | No |

### Notas sobre Miembros (Columna D)
- Separar emails con **comas** (sin espacios)
- Ejemplo: `maria@dominio.es,juan@dominio.es,pedro@dominio.es`
- Los miembros deben existir en Google Workspace
- Se sincroniza con las columnas Grupo1/2/3 de la pestaña "Profesores"

---

## 🏢 Pestaña 4: Unidades Organizativas

**Se crea automáticamente** al ejecutar `📋 Listar Unidades`.

| Columna | Letra | Nombre | Tipo | Ejemplo |
|---------|-------|--------|------|---------|
| 1 | A | `Nombre` | Texto | Profesorado |
| 2 | B | `Ruta` | Texto | /Profesorado |
| 3 | C | `Descripción` | Texto | Unidad de profesorado |

**No editar manualmente** - se actualiza desde Google Workspace.

---

## 🚀 Cómo Usar las Plantillas

### Opción 1: Importar CSV (Recomendado)

1. Crea hoja nueva en Google Sheets
2. Crea pestaña "Profesores"
3. **Archivo** > **Importar** > **Subir** > `plantilla_profesores.csv`
4. Selecciona: Separador = **Coma**, Ubicación = **Insertar nuevas hojas**
5. Repite para "Grupos" con `plantilla_grupos.csv`
6. Borra la pestaña importada (queda como "Hoja 1")
7. Renombra las pestañas a "Profesores" y "Grupos"

### Opción 2: Crear Manualmente

1. Crea 2 pestañas: "Profesores" y "Grupos"
2. Copia los encabezados de las tablas de arriba
3. Añade datos de ejemplo
4. Asegúrate de que los emails de grupos existan en Workspace

---

## ⚠️ Importante

1. **Dominio**: Cambia `tudominio.es` por tu dominio real
2. **Pestañas**: Los nombres deben ser exactos (sensible a mayúsculas)
3. **Columnas**: No cambies el orden de las columnas
4. **Grupos**: Los emails de grupos deben existir primero en Workspace
5. **Dashboard**: Se crea automáticamente - no edites manualmente

---

## 🔄 Flujo Completo

```
1. Crear hoja → 2. Importar CSV → 3. Configurar dominio → 4. Habilitar APIs
                                                              ↓
6. Producción ← 5. Modo simulación ← 4. Ejecutar sincronización
```
