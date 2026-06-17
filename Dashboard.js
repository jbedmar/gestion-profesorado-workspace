/**
 * Gestión de Profesorado - Dashboard de Control
 * Gestiona el diseño y las estadísticas principales del sistema.
 */

/**
 * Crea o actualiza la pestaña Dashboard en la hoja de cálculo.
 * Diseña una interfaz limpia, moderna y con fórmulas dinámicas.
 */
function crearOActualizarDashboard() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.PAGINA_DASHBOARD);
  
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.PAGINA_DASHBOARD, 0);
  } else {
    // Si ya existe, limpiar todo para rediseñar (respetando si se activa de nuevo)
    sheet.clear();
    // Mover a la primera posición si no lo está
    if (ss.getSheets()[0].getName() !== CONFIG.PAGINA_DASHBOARD) {
      ss.setActiveSheet(sheet);
      ss.moveActiveSheet(1);
    }
  }
  
  // Ocultar cuadrícula por defecto y activar bordes personalizados para un diseño limpio
  var spreadsheetId = ss.getId();
  var sheetId = sheet.getSheetId();
  Sheets.Spreadsheets.batchUpdate({
    requests: [{
      updateSheetProperties: {
        fields: "gridProperties(hideGridlines)",
        properties: {
          sheetId: sheetId,
          gridProperties: { hideGridlines: true }
        }
      }
    }]
  }, spreadsheetId);
  
  // Configurar anchos de columna para visualización adecuada
  sheet.setColumnWidth(1, 40);   // Columna A (Margen)
  sheet.setColumnWidth(2, 220);  // Columna B (Tarjeta 1)
  sheet.setColumnWidth(3, 40);   // Columna C (Espacio)
  sheet.setColumnWidth(4, 220);  // Columna D (Tarjeta 2)
  sheet.setColumnWidth(5, 40);   // Columna E (Espacio)
  sheet.setColumnWidth(6, 220);  // Columna F (Tarjeta 3)
  sheet.setColumnWidth(7, 40);   // Columna G (Margen)

  // 1. Cabecera Principal (Fila 2)
  sheet.getRange("B2:F2").merge();
  var cabecera = sheet.getRange("B2");
  cabecera.setValue("📊 PANEL DE CONTROL Y ADMINISTRACIÓN DE WORKSPACE");
  cabecera.setFontFamily("Outfit");
  cabecera.setFontSize(16);
  cabecera.setFontWeight("bold");
  cabecera.setFontColor("#FFFFFF");
  cabecera.setBackgroundColor("#1E3A8A"); // Azul oscuro premium
  cabecera.setHorizontalAlignment("center");
  cabecera.setVerticalAlignment("middle");
  sheet.setRowHeight(2, 50);

  // 2. Tarjetas de Estadísticas - Fila 4 a 5 (Fórmulas directas vinculadas a 'Profesores')
  // Tarjeta 1: Total Docentes
  crearTarjetaEstadistica(sheet, "B4", "B5", "TOTAL DOCENTES", "=COUNTA(Profesores!B2:B)", "#F1F5F9", "#475569");
  
  // Tarjeta 2: Docentes Activos
  crearTarjetaEstadistica(sheet, "D4", "D5", "DOCENTES ACTIVOS", '=COUNTIF(Profesores!F2:F; "ACTIVO")', "#E0F2FE", "#0369A1");
  
  // Tarjeta 3: Docentes de Baja
  crearTarjetaEstadistica(sheet, "F4", "F5", "DOCENTES DE BAJA", '=COUNTIF(Profesores!F2:F; "BAJA")', "#FEE2E2", "#B91C1C");

  // Fila 7 a 8 (Segunda fila de Tarjetas)
  // Tarjeta 4: Cuentas Corporativas Creadas
  crearTarjetaEstadistica(sheet, "B7", "B8", "CUENTAS CORPORATIVAS", '=COUNTIFS(Profesores!F2:F; "ACTIVO"; Profesores!E2:E; "*@*")', "#DCFCE7", "#15803D");
  
  // Tarjeta 5: Altas Pendientes de Crear
  crearTarjetaEstadistica(sheet, "D7", "D8", "PENDIENTES CREAR", '=COUNTIFS(Profesores!F2:F; "ACTIVO"; Profesores!E2:E; "")', "#FEF9C3", "#A16207");
  
  // Tarjeta 6: Bajas Pendientes de Suspender (Se requiere cruzar con datos pero simulado aquí con fórmula simple)
  // En 'Profesores' si situación = BAJA y email no está vacío:
  crearTarjetaEstadistica(sheet, "F7", "F8", "BAJAS POR PROCESAR", '=COUNTIFS(Profesores!F2:F; "BAJA"; Profesores!E2:E; "*@*")', "#F3E8FF", "#6B21A8");

  // Ajustar alturas de filas de tarjetas
  sheet.setRowHeight(4, 25);
  sheet.setRowHeight(5, 45);
  sheet.setRowHeight(7, 25);
  sheet.setRowHeight(8, 45);

  // 3. Sección de Grupos (Fila 10)
  sheet.getRange("B10:F10").merge();
  var titGrupos = sheet.getRange("B10");
  titGrupos.setValue("👥 GESTIÓN DE GRUPOS");
  titGrupos.setFontFamily("Outfit");
  titGrupos.setFontSize(12);
  titGrupos.setFontWeight("bold");
  titGrupos.setFontColor("#FFFFFF");
  titGrupos.setBackgroundColor("#7C3AED");
  titGrupos.setHorizontalAlignment("center");
  titGrupos.setVerticalAlignment("middle");
  sheet.setRowHeight(10, 30);

  // Tarjetas de Grupos - Fila 11 a 12
  // Tarjeta 7: Total Grupos
  crearTarjetaEstadistica(sheet, "B11", "B12", "TOTAL GRUPOS", "=COUNTA(Grupos!B2:B)", "#F5F3FF", "#6D28D9");
  
  // Tarjeta 8: Grupos con Miembros
  crearTarjetaEstadistica(sheet, "D11", "D12", "GRUPOS CON MIEMBROS", '=COUNTIF(Grupos!D2:D; "*@*")', "#EDE9FE", "#7C3AED");
  
  // Tarjeta 9: Total Miembros Asignados
  crearTarjetaEstadistica(sheet, "F11", "F12", "MIEMBROS ASIGNADOS", '=SUMPRODUCT((LEN(Grupos!D2:D)-LEN(SUBSTITUTE(Grupos!D2:D;"@";"")))+1*(Grupos!D2:D<>""))', "#DDD6FE", "#5B21B6");

  sheet.setRowHeight(11, 25);
  sheet.setRowHeight(12, 45);

  // 4. Bloque de Instrucciones y Acceso Rápido (Fila 14)
  sheet.getRange("B14:F14").merge();
  var titInstrucciones = sheet.getRange("B14");
  titInstrucciones.setValue("ℹ️ INSTRUCCIONES DE USO DEL SISTEMA");
  titInstrucciones.setFontFamily("Outfit");
  titInstrucciones.setFontSize(12);
  titInstrucciones.setFontWeight("bold");
  titInstrucciones.setFontColor("#1E293B");
  titInstrucciones.setBorder(false, false, true, false, false, false, "#CBD5E1", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

  sheet.getRange("B15:F20").merge();
  var instrucciones = sheet.getRange("B15");
  var texto = 
    "Este sistema sincroniza de forma segura el listado de profesorado con la consola de Google Workspace for Education.\n\n" +
    "1. Actualización de Datos:\n" +
    "   - Realiza los cambios necesarios (altas o bajas de profesores) en la pestaña 'Profesores'.\n" +
    "   - Modifica el estado en la columna SITUACIÓN (ACTIVO / BAJA).\n" +
    "   - Asigna grupos en las columnas Grupo1, Grupo2, Grupo3.\n\n" +
    "2. Sincronización de Usuarios:\n" +
    "   - Menú '👨‍🏫 Profesorado' > '🔄 Comparar y Previsualizar Cambios'.\n\n" +
    "3. Gestión de Grupos:\n" +
    "   - Menú '📋 Grupos' > '🔄 Gestionar Grupos' (crear/eliminar).\n" +
    "   - Menú '📋 Grupos' > '👥 Gestionar Miembros' (agregar/quitar).";
  instrucciones.setValue(texto);
  instrucciones.setFontFamily("Outfit");
  instrucciones.setFontSize(10.5);
  instrucciones.setFontColor("#475569");
  instrucciones.setVerticalAlignment("top");
  
  sheet.setRowHeight(14, 30);
  sheet.setRowHeight(15, 180);

  // Aplicar formato de bordes sutiles alrededor del área útil del Dashboard
  sheet.getRange("B2:F20").setBorder(true, true, true, true, null, null, "#94A3B8", SpreadsheetApp.BorderStyle.SOLID);
}

/**
 * Función auxiliar para dar formato a cada tarjeta del Dashboard.
 */
function crearTarjetaEstadistica(sheet, celdaTitulo, celdaValor, titulo, formula, colorFondo, colorTexto) {
  var rangeTitulo = sheet.getRange(celdaTitulo);
  rangeTitulo.setValue(titulo);
  rangeTitulo.setFontFamily("Outfit");
  rangeTitulo.setFontSize(9);
  rangeTitulo.setFontWeight("bold");
  rangeTitulo.setFontColor("#64748B");
  rangeTitulo.setBackgroundColor(colorFondo);
  rangeTitulo.setHorizontalAlignment("center");
  rangeTitulo.setVerticalAlignment("bottom");
  
  var rangeValor = sheet.getRange(celdaValor);
  rangeValor.setFormula(formula);
  rangeValor.setFontFamily("Outfit");
  rangeValor.setFontSize(22);
  rangeValor.setFontWeight("bold");
  rangeValor.setFontColor(colorTexto);
  rangeValor.setBackgroundColor(colorFondo);
  rangeValor.setHorizontalAlignment("center");
  rangeValor.setVerticalAlignment("middle");

  // Bordes sutiles para la tarjeta
  var colStart = rangeTitulo.getColumn();
  var rowStart = rangeTitulo.getRow();
  sheet.getRange(rowStart, colStart, 2, 1).setBorder(true, true, true, true, null, null, "#CBD5E1", SpreadsheetApp.BorderStyle.SOLID);
}
