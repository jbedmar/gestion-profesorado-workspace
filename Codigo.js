/**
 * Gestión de Profesorado - Script Principal
 * Herramienta de administración de Google Workspace para centros educativos.
 * 
 * Requisitos:
 * - Google Workspace for Education
 * - Cuenta de administrador
 * - Servicios habilitados: Admin SDK API, Google Sheets API
 * 
 * Configura las variables de CONFIG antes de usar.
 */

// Configuración global - EDITAR CON LOS DATOS DE TU CENTRO
var CONFIG = {
  DOMINIO: "tudominio.es",                    // Dominio de Google Workspace
  OU_DESTINO: "/Profesorado",                  // Unidad Organizativa destino
  CONTRASENA_DEFECTO: "TuContraseñaTemporal!", // Contraseña temporal para nuevas cuentas
  MODO_SIMULACION: true,                       // true = simulación, false = producción
  PAGINA_DASHBOARD: "Dashboard",
  PAGINA_PROFESORES: "Profesores",
  PAGINA_GRUPOS: "Grupos",
  PAGINA_OU: "Unidades Organizativas"
};

/**
 * Evento onOpen que se ejecuta automáticamente al abrir la hoja de cálculo.
 * Crea el menú personalizado en la barra de navegación superior.
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  
  ui.createMenu('👨‍🏫 Profesorado')
    .addItem('📊 Actualizar Dashboard', 'actualizarDashboardMenu')
    .addSeparator()
    .addItem('➕ Actualizar ALTAS', 'actualizarAltasMenu')
    .addItem('➖ Actualizar BAJAS', 'actualizarBajasMenu')
    .addToUi();
  
  ui.createMenu('📋 Grupos')
    .addItem('📋 Listar Grupos', 'listarGruposMenu')
    .addSeparator()
    .addItem('🔄 Sincronizar Grupos', 'gestionarGruposMenu')
    .addItem('👥 Sincronizar Miembros', 'gestionarMiembrosMenu')
    .addToUi();

  ui.createMenu('🏢 Unidades Organizativas')
    .addItem('📋 Listar Unidades', 'listarOUNMenu')
    .addToUi();
}

/**
 * Controlador para la opción de menú: Actualizar Dashboard
 */
function actualizarDashboardMenu() {
  try {
    SpreadsheetApp.getActiveSpreadsheet().toast('Calculando estadísticas...', 'Dashboard', 3);
    crearOActualizarDashboard();
    SpreadsheetApp.getActiveSpreadsheet().toast('Dashboard actualizado con éxito.', 'Dashboard', 3);
  } catch (error) {
    SpreadsheetApp.getUi().alert('Error al actualizar el Dashboard: ' + error.message);
  }
}

/**
 * Controlador para la opción de menú: Actualizar ALTAS
 */
function actualizarAltasMenu() {
  try {
    mostrarSidebarAltas();
  } catch (error) {
    SpreadsheetApp.getUi().alert('Error al abrir panel de altas: ' + error.message);
  }
}

/**
 * Controlador para la opción de menú: Actualizar BAJAS
 */
function actualizarBajasMenu() {
  try {
    mostrarSidebarBajas();
  } catch (error) {
    SpreadsheetApp.getUi().alert('Error al abrir panel de bajas: ' + error.message);
  }
}

/**
 * Controlador para la opción de menú: Listar Grupos
 */
function listarGruposMenu() {
  try {
    SpreadsheetApp.getActiveSpreadsheet().toast('Obteniendo grupos de Workspace...', 'Grupos', 3);
    var resultado = obtenerGruposWorkspace();
    crearHojaGrupos(resultado);
    SpreadsheetApp.getActiveSpreadsheet().toast('Listado de grupos actualizado.', 'Grupos', 3);
  } catch (error) {
    SpreadsheetApp.getUi().alert('Error al obtener grupos: ' + error.message);
  }
}

/**
 * Controlador para la opción de menú: Listar Unidades Organizativas
 */
function listarOUNMenu() {
  try {
    SpreadsheetApp.getActiveSpreadsheet().toast('Obteniendo unidades organizativas...', 'Unidades', 3);
    var resultado = obtenerUnidadesOrganizativas();
    crearHojaOU(resultado);
    SpreadsheetApp.getActiveSpreadsheet().toast('Listado de unidades organizativas actualizado.', 'Unidades', 3);
  } catch (error) {
    SpreadsheetApp.getUi().alert('Error al obtener unidades organizativas: ' + error.message);
  }
}

/**
 * Controlador para la opción de menú: Gestionar Grupos
 */
function gestionarGruposMenu() {
  try {
    mostrarSidebarGestionarGrupos();
  } catch (error) {
    SpreadsheetApp.getUi().alert('Error al abrir la gestión de grupos: ' + error.message);
  }
}

/**
 * Controlador para la opción de menú: Gestionar Miembros
 */
function gestionarMiembrosMenu() {
  try {
    mostrarSidebarGestionarMiembros();
  } catch (error) {
    SpreadsheetApp.getUi().alert('Error al abrir la gestión de miembros: ' + error.message);
  }
}

/**
 * Abre el panel lateral para gestionar grupos (crear/eliminar)
 */
function mostrarSidebarGestionarGrupos() {
  var html = HtmlService.createHtmlOutputFromFile('UI_GestionarGrupos')
      .setTitle('Gestionar Grupos en Workspace')
      .setWidth(500);
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Abre el panel lateral para gestionar miembros (agregar/quitar)
 */
function mostrarSidebarGestionarMiembros() {
  var html = HtmlService.createHtmlOutputFromFile('UI_GestionarMiembros')
      .setTitle('Gestionar Miembros de Grupos')
      .setWidth(500);
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Función puente para obtener el estado de grupos (crear/eliminar)
 */
function obtenerEstadoGruposBridge() {
  try {
    Logger.log("Iniciando obtención de estado de grupos...");
    var resultado = obtenerEstadoGrupos();
    Logger.log("Estado de grupos obtenido correctamente");
    return JSON.stringify(resultado);
  } catch (error) {
    Logger.log("ERROR en obtenerEstadoGrupos: " + error.message);
    return JSON.stringify({ error: error.message });
  }
}

/**
 * Función puente para obtener el estado de miembros
 */
function obtenerEstadoMiembrosBridge() {
  try {
    Logger.log("Iniciando obtención de estado de miembros...");
    var resultado = obtenerEstadoMiembros();
    Logger.log("Estado de miembros obtenido correctamente");
    return JSON.stringify(resultado);
  } catch (error) {
    Logger.log("ERROR en obtenerEstadoMiembros: " + error.message);
    return JSON.stringify({ error: error.message });
  }
}

/**
 * Función puente para aplicar cambios de grupos
 */
function aplicarCambiosGruposBridge(cambiosJSON) {
  try {
    var cambios = JSON.parse(cambiosJSON);
    var resultado = aplicarCambiosGrupos(cambios);
    return JSON.stringify(resultado);
  } catch (error) {
    Logger.log("ERROR en aplicarCambiosGrupos: " + error.message);
    return JSON.stringify({ error: error.message });
  }
}

/**
 * Función puente para aplicar cambios de miembros
 */
function aplicarCambiosMiembrosBridge(cambiosJSON) {
  try {
    var cambios = JSON.parse(cambiosJSON);
    var resultado = aplicarCambiosMiembros(cambios);
    return JSON.stringify(resultado);
  } catch (error) {
    Logger.log("ERROR en aplicarCambiosMiembros: " + error.message);
    return JSON.stringify({ error: error.message });
  }
}

/**
 * Abre el panel lateral derecho con la interfaz HTML de confirmación
 */
function mostrarSidebarConfirmacion() {
  var html = HtmlService.createHtmlOutputFromFile('UI_Confirmacion')
      .setTitle('Sincronización con Google Workspace')
      .setWidth(450);
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Abre el panel lateral para ALTAS
 */
function mostrarSidebarAltas() {
  var html = HtmlService.createHtmlOutputFromFile('UI_ALTAS')
      .setTitle('Actualizar ALTAS - Crear Cuentas')
      .setWidth(450);
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Abre el panel lateral para BAJAS
 */
function mostrarSidebarBajas() {
  var html = HtmlService.createHtmlOutputFromFile('UI_BAJAS')
      .setTitle('Actualizar BAJAS - Suspender Cuentas')
      .setWidth(450);
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Función puente (Bridge) llamada por el frontend HTML para obtener el estado de la sincronización.
 */
function obtenerEstadoCambiosBridge() {
  try {
    Logger.log("Iniciando obtención de estado de cambios...");
    var resultado = obtenerEstadoCambios();
    Logger.log("Estado obtenido correctamente: " + JSON.stringify(resultado).substring(0, 200));
    return JSON.stringify(resultado);
  } catch (error) {
    Logger.log("ERROR en obtenerEstadoCambios: " + error.message);
    Logger.log("Stack: " + error.stack);
    return JSON.stringify({ error: error.message, stack: error.stack });
  }
}

/**
 * Función puente (Bridge) llamada por el frontend HTML para aplicar los cambios aprobados.
 */
function aplicarCambiosWorkspaceBridge(cambiosJSON) {
  try {
    var cambios = JSON.parse(cambiosJSON);
    var resultado = aplicarCambiosWorkspace(cambios);
    // Después de aplicar cambios, actualizamos el dashboard automáticamente
    crearOActualizarDashboard();
    return JSON.stringify(resultado);
  } catch (error) {
    return JSON.stringify({ error: error.message });
  }
}

/**
 * Función puente para obtener solo altas
 */
function obtenerSoloAltasBridge() {
  try {
    Logger.log("Obteniendo solo altas...");
    var resultado = obtenerSoloAltas();
    return JSON.stringify(resultado);
  } catch (error) {
    Logger.log("ERROR en obtenerSoloAltas: " + error.message);
    return JSON.stringify({ error: error.message });
  }
}

/**
 * Función puente para obtener solo bajas
 */
function obtenerSoloBajasBridge() {
  try {
    Logger.log("Obteniendo solo bajas...");
    var resultado = obtenerSoloBajas();
    return JSON.stringify(resultado);
  } catch (error) {
    Logger.log("ERROR en obtenerSoloBajas: " + error.message);
    return JSON.stringify({ error: error.message });
  }
}

/**
 * Función puente para aplicar solo altas
 */
function aplicarSoloAltasBridge(cambiosJSON) {
  try {
    var cambios = JSON.parse(cambiosJSON);
    // Asegurar que solo procesamos crear y activar
    var soloAltas = {
      crear: cambios.crear || [],
      suspender: [],
      activar: cambios.activar || []
    };
    var resultado = aplicarCambiosWorkspace(soloAltas);
    crearOActualizarDashboard();
    return JSON.stringify(resultado);
  } catch (error) {
    return JSON.stringify({ error: error.message });
  }
}

/**
 * Función puente para aplicar solo bajas
 */
function aplicarSoloBajasBridge(cambiosJSON) {
  try {
    var cambios = JSON.parse(cambiosJSON);
    // Asegurar que solo procesamos suspender
    var soloBajas = {
      crear: [],
      suspender: cambios.suspender || [],
      activar: []
    };
    var resultado = aplicarCambiosWorkspace(soloBajas);
    crearOActualizarDashboard();
    return JSON.stringify(resultado);
  } catch (error) {
    return JSON.stringify({ error: error.message });
  }
}
