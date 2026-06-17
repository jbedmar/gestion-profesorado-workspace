/**
 * Gestión de Profesorado - Sincronización con Workspace
 * Contiene la lógica para comparar la hoja con el directorio y aplicar los cambios.
 */

/**
 * Obtiene solo las ALTAS pendientes (profesores activos sin cuenta)
 */
function obtenerSoloAltas() {
  var estado = obtenerEstadoCambios();
  return {
    crear: estado.crear,
    activar: estado.activar,
    sinCambios: estado.sinCambios,
    advertencias: estado.advertencias
  };
}

/**
 * Obtiene solo las BAJAS pendientes (profesores de baja con cuenta activa)
 */
function obtenerSoloBajas() {
  var estado = obtenerEstadoCambios();
  return {
    suspender: estado.suspender,
    sinCambios: estado.sinCambios,
    advertencias: estado.advertencias
  };
}

/**
 * Compara los profesores en la hoja con los usuarios en Google Workspace
 * y devuelve la lista de altas, bajas y reactivaciones propuestas.
 */
function obtenerEstadoCambios() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.PAGINA_PROFESORES);
  if (!sheet) {
    throw new Error("No se encontró la pestaña '" + CONFIG.PAGINA_PROFESORES + "'.");
  }

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  
  // Buscar índices de las columnas
  var idxNombre = headers.indexOf("Porfesor/a");
  var idxEmail = headers.indexOf("Cuenta Corporativa");
  var idxSituacion = headers.indexOf("SITUACIÓN");
  var idxDpto = headers.indexOf("Departamento");
  
  Logger.log("Columnas encontradas - Nombre:" + idxNombre + " Email:" + idxEmail + " Situación:" + idxSituacion + " Depto:" + idxDpto);
  
  if (idxNombre === -1 || idxEmail === -1 || idxSituacion === -1) {
    throw new Error("No se encontraron las columnas requeridas ('Porfesor/a', 'Cuenta Corporativa', 'SITUACIÓN') en la pestaña Profesores.");
  }

  // 1. Obtener usuarios de Google Workspace
  var usuariosWorkspace = {};
  try {
    var pageToken;
    var opciones = {
      customer: "my_customer",
      maxResults: 150,
      projection: "basic"
    };

    Logger.log("Consultando Admin SDK...");
    do {
      opciones.pageToken = pageToken;
      var respuesta = AdminDirectory.Users.list(opciones);
      var lista = respuesta.users;
      if (lista) {
        Logger.log("Usuarios obtenidos de Workspace: " + lista.length);
        lista.forEach(function(u) {
          usuariosWorkspace[u.primaryEmail.toLowerCase()] = {
            primaryEmail: u.primaryEmail,
            suspended: u.suspended,
            fullName: u.name.fullName
          };
        });
      } else {
        Logger.log("No se devolvieron usuarios de Workspace");
      }
      pageToken = respuesta.nextPageToken;
    } while (pageToken);
  } catch (error) {
    Logger.log("ERROR Admin SDK: " + error.message);
    throw new Error("Error al consultar Google Workspace (¿Está activado el servicio Admin SDK y concedidos los permisos?): " + error.message);
  }

  var propuestas = {
    crear: [],       // Altas pendientes en Workspace
    suspender: [],   // Bajas pendientes de suspender en Workspace
    activar: [],     // Reactivaciones (activo en hoja, suspendido en Workspace)
    sinCambios: 0,
    advertencias: []
  };

  // 2. Analizar profesores de la hoja
  for (var r = 1; r < data.length; r++) {
    var fila = data[r];
    var nombre = fila[idxNombre] ? fila[idxNombre].toString().trim() : "";
    var emailCelda = fila[idxEmail] ? fila[idxEmail].toString().trim().toLowerCase() : "";
    var situacion = fila[idxSituacion] ? fila[idxSituacion].toString().trim().toUpperCase() : "";
    var dpto = idxDpto !== -1 ? fila[idxDpto].toString().trim() : "";

    if (!nombre) continue;

    var emailPropuesto = emailCelda || generarEmailPropuesto(nombre);
    var usuarioWS = usuariosWorkspace[emailPropuesto];

    if (situacion === "ACTIVO") {
      if (!emailCelda || !usuarioWS) {
        // No tiene email en la celda o no existe la cuenta en Workspace
        propuestas.crear.push({
          fila: r + 1,
          nombre: nombre,
          emailPropuesto: emailPropuesto,
          departamento: dpto,
          tipo: "CREAR",
          razon: "Profesor activo sin cuenta corporativa creada"
        });
      } else if (usuarioWS.suspended) {
        // Existe pero está suspendida
        propuestas.activar.push({
          fila: r + 1,
          nombre: nombre,
          emailPropuesto: emailPropuesto,
          departamento: dpto,
          tipo: "ACTIVAR",
          razon: "Profesor activo con cuenta suspendida en Workspace"
        });
      } else {
        propuestas.sinCambios++;
      }
    } else if (situacion === "BAJA") {
      if (emailCelda && usuarioWS && !usuarioWS.suspended) {
        propuestas.suspender.push({
          fila: r + 1,
          nombre: nombre,
          emailPropuesto: emailCelda,
          departamento: dpto,
          tipo: "SUSPENDER",
          razon: "Profesor de baja con cuenta activa en Workspace"
        });
      } else {
        propuestas.sinCambios++;
      }
    }
  }

  return propuestas;
}

/**
 * Aplica los cambios aprobados por el administrador
 */
function aplicarCambiosWorkspace(cambios) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.PAGINA_PROFESORES);
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idxEmail = headers.indexOf("Cuenta Corporativa");

  var resultados = {
    creados: 0,
    suspendidos: 0,
    activados: 0,
    errores: [],
    modoSimulacion: CONFIG.MODO_SIMULACION
  };

  // 1. Procesar Altas (Crear)
  if (cambios.crear && cambios.crear.length > 0) {
    cambios.crear.forEach(function(item) {
      try {
        var email = item.emailPropuesto;
        if (CONFIG.MODO_SIMULACION) {
          Logger.log("[SIMULACIÓN] Se crearía usuario: " + item.nombre + " con email " + email);
        } else {
          // Llamar a Directory API
          var partes = item.nombre.split(",");
          var apellido = partes[0] ? partes[0].trim() : "Docente";
          var nombre = partes[1] ? partes[1].trim() : "Profesor";

          var recursoUsuario = {
            primaryEmail: email,
            name: {
              givenName: nombre,
              familyName: apellido
            },
            password: CONFIG.CONTRASENA_DEFECTO,
            changePasswordAtNextLogin: true,
            orgUnitPath: CONFIG.OU_DESTINO
          };

          AdminDirectory.Users.insert(recursoUsuario);
          
          // Escribir el email en la hoja
          sheet.getRange(item.fila, idxEmail + 1).setValue(email);
        }
        resultados.creados++;
      } catch (e) {
        resultados.errores.push("Error creando a " + item.nombre + ": " + e.message);
      }
    });
  }

  // 2. Procesar Bajas (Suspender)
  if (cambios.suspender && cambios.suspender.length > 0) {
    cambios.suspender.forEach(function(item) {
      try {
        var email = item.emailPropuesto;
        if (CONFIG.MODO_SIMULACION) {
          Logger.log("[SIMULACIÓN] Se suspendería la cuenta: " + email);
        } else {
          var recursoUsuario = {
            suspended: true
          };
          AdminDirectory.Users.update(recursoUsuario, email);
        }
        resultados.suspendidos++;
      } catch (e) {
        resultados.errores.push("Error suspendiendo a " + item.nombre + ": " + e.message);
      }
    });
  }

  // 3. Procesar Reactivaciones (Activar)
  if (cambios.activar && cambios.activar.length > 0) {
    cambios.activar.forEach(function(item) {
      try {
        var email = item.emailPropuesto;
        if (CONFIG.MODO_SIMULACION) {
          Logger.log("[SIMULACIÓN] Se reactivaría la cuenta: " + email);
        } else {
          var recursoUsuario = {
            suspended: false
          };
          AdminDirectory.Users.update(recursoUsuario, email);
        }
        resultados.activados++;
      } catch (e) {
        resultados.errores.push("Error reactivando a " + item.nombre + ": " + e.message);
      }
    });
  }

  return resultados;
}

/**
 * Genera una propuesta de correo a partir del nombre en formato "Apellido1 Apellido2, Nombre"
 * Siguiendo el patrón: nombreapellido@dominio
 */
function generarEmailPropuesto(nombreCompleto) {
  var partes = nombreCompleto.split(",");
  if (partes.length < 2) return "";
  
  var apellidos = partes[0].trim();
  var nombre = partes[1].trim();
  
  // Obtener primer apellido (primera palabra de los apellidos)
  var primerApellido = apellidos.split(" ")[0].trim();
  
  // Concatenar primera palabra del nombre con el primer apellido
  var primerNombre = nombre.split(" ")[0].trim();
  var emailBase = primerNombre + primerApellido;
  
  return sanitizarTexto(emailBase).toLowerCase() + "@" + CONFIG.DOMINIO;
}

/**
 * Elimina acentos, eñes, espacios y caracteres especiales
 */
function sanitizarTexto(texto) {
  var mapaAcentos = {
    'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
    'Á': 'a', 'É': 'e', 'Í': 'i', 'Ó': 'o', 'Ú': 'u',
    'ñ': 'n', 'Ñ': 'n', 'ü': 'u', 'Ü': 'u',
    'à': 'a', 'è': 'e', 'ì': 'i', 'ò': 'o', 'ù': 'u'
  };
  
  var limpio = texto.split('').map(function(letra) {
    return mapaAcentos[letra] || letra;
  }).join('');
  
  return limpio.replace(/[^a-zA-Z0-9]/g, "");
}

/**
 * Obtiene la lista completa de grupos de Google Workspace con sus miembros
 */
function obtenerGruposWorkspace() {
  var grupos = [];
  try {
    var pageToken;
    var opciones = {
      customer: "my_customer",
      maxResults: 200
    };

    do {
      opciones.pageToken = pageToken;
      var respuesta = AdminDirectory.Groups.list(opciones);
      var lista = respuesta.groups;
      if (lista) {
        lista.forEach(function(g) {
          var miembros = obtenerMiembrosGrupo(g.email);
          grupos.push({
            nombre: g.name || "",
            email: g.email || "",
            descripcion: g.description || "",
            id: g.id || "",
            miembros: miembros
          });
        });
      }
      pageToken = respuesta.nextPageToken;
    } while (pageToken);

    Logger.log("Grupos obtenidos de Workspace: " + grupos.length);
  } catch (error) {
    Logger.log("ERROR al obtener grupos: " + error.message);
    throw new Error("Error al consultar grupos de Workspace: " + error.message);
  }

  return grupos;
}

/**
 * Obtiene los miembros de un grupo específico
 */
function obtenerMiembrosGrupo(groupEmail) {
  var miembros = [];
  try {
    Logger.log("Obteniendo miembros del grupo: " + groupEmail);
    var pageToken;

    do {
      var opciones = {
        maxResults: 200
      };
      if (pageToken) {
        opciones.pageToken = pageToken;
      }
      var respuesta = AdminDirectory.Members.list(groupEmail, opciones);
      var lista = respuesta.members;
      if (lista) {
        Logger.log("Miembros encontrados en " + groupEmail + ": " + lista.length);
        lista.forEach(function(m) {
          miembros.push(m.email || "");
        });
      } else {
        Logger.log("No se devolvieron miembros para " + groupEmail);
      }
      pageToken = respuesta.nextPageToken;
    } while (pageToken);
  } catch (error) {
    Logger.log("ERROR al obtener miembros de " + groupEmail + ": " + error.message);
  }

  return miembros;
}

/**
 * Crea o actualiza la pestaña Grupos con el listado de Workspace
 */
function crearHojaGrupos(grupos) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.PAGINA_GRUPOS);

  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.PAGINA_GRUPOS);
  } else {
    sheet.clear();
  }

  // Cabeceras
  var cabeceras = ["Nombre", "Email", "Descripción", "Miembros", "ID"];
  sheet.getRange(1, 1, 1, cabeceras.length).setValues([cabeceras]);
  sheet.getRange(1, 1, 1, cabeceras.length)
    .setFontWeight("bold")
    .setBackground("#1E3A8A")
    .setFontColor("#FFFFFF")
    .setFontFamily("Outfit")
    .setHorizontalAlignment("center");

  // Datos
  if (grupos.length > 0) {
    var datos = grupos.map(function(g) {
      return [g.nombre, g.email, g.descripcion, g.miembros.join(", "), g.id];
    });
    sheet.getRange(2, 1, datos.length, cabeceras.length).setValues(datos);
  }

  // Ajustar anchos de columna
  sheet.setColumnWidth(1, 250);
  sheet.setColumnWidth(2, 300);
  sheet.setColumnWidth(3, 350);
  sheet.setColumnWidth(4, 450);
  sheet.setColumnWidth(5, 150);

  // Congelar cabecera
  sheet.setFrozenRows(1);
}

/**
 * Compara los grupos en la hoja con los de Workspace y devuelve los cambios de GRUPOS.
 * Solo gestiona creación y eliminación de grupos.
 */
function obtenerEstadoGrupos() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Leer hoja "Grupos"
  var sheetGrupos = ss.getSheetByName(CONFIG.PAGINA_GRUPOS);
  if (!sheetGrupos) {
    throw new Error("No se encontró la pestaña '" + CONFIG.PAGINA_GRUPOS + "'. Ejecuta primero '📋 Listar Grupos'.");
  }

  var dataGrupos = sheetGrupos.getDataRange().getValues();
  var headersGrupos = dataGrupos[0];
  
  var idxNombre = headersGrupos.indexOf("Nombre");
  var idxEmail = headersGrupos.indexOf("Email");
  var idxDescripcion = headersGrupos.indexOf("Descripción");
  
  if (idxNombre === -1 || idxEmail === -1) {
    throw new Error("No se encontraron las columnas requeridas ('Nombre', 'Email') en la pestaña Grupos.");
  }

  // 2. Obtener grupos de Workspace
  var gruposWorkspace = {};
  try {
    var pageToken;
    var opciones = { customer: "my_customer", maxResults: 200 };
    do {
      opciones.pageToken = pageToken;
      var respuesta = AdminDirectory.Groups.list(opciones);
      if (respuesta.groups) {
        respuesta.groups.forEach(function(g) {
          gruposWorkspace[g.email.toLowerCase()] = { email: g.email, name: g.name, id: g.id };
        });
      }
      pageToken = respuesta.nextPageToken;
    } while (pageToken);
  } catch (error) {
    throw new Error("Error al consultar grupos de Workspace: " + error.message);
  }

  var propuestas = { crearGrupo: [], eliminarGrupo: [], sinCambios: 0 };

  // 3. Grupos en hoja que no están en Workspace → crear
  var emailsGruposHoja = {};
  for (var r = 1; r < dataGrupos.length; r++) {
    var fila = dataGrupos[r];
    var nombre = fila[idxNombre] ? fila[idxNombre].toString().trim() : "";
    var emailGrupo = fila[idxEmail] ? fila[idxEmail].toString().trim().toLowerCase() : "";
    var descripcion = idxDescripcion !== -1 ? (fila[idxDescripcion] ? fila[idxDescripcion].toString().trim() : "") : "";
    
    if (!nombre || !emailGrupo) continue;
    emailsGruposHoja[emailGrupo] = true;
    
    if (!gruposWorkspace[emailGrupo]) {
      propuestas.crearGrupo.push({
        fila: r + 1,
        nombre: nombre,
        email: emailGrupo,
        descripcion: descripcion,
        tipo: "CREAR_GRUPO",
        razon: "Grupo en hoja pero no existe en Workspace"
      });
    } else {
      propuestas.sinCambios++;
    }
  }

  // 4. Grupos en Workspace que no están en la hoja → eliminar
  Object.keys(gruposWorkspace).forEach(function(emailGrupo) {
    if (!emailsGruposHoja[emailGrupo]) {
      propuestas.eliminarGrupo.push({
        email: emailGrupo,
        nombre: gruposWorkspace[emailGrupo].name,
        tipo: "ELIMINAR_GRUPO",
        razon: "Grupo en Workspace pero no en hoja"
      });
    }
  });

  Logger.log("Grupos: crear=" + propuestas.crearGrupo.length + " eliminar=" + propuestas.eliminarGrupo.length);
  return propuestas;
}

/**
 * Compara los miembros de cada grupo con la hoja Profesores.
 * Lee las columnas Grupo1, Grupo2, Grupo3 para construir la lista de miembros.
 */
function obtenerEstadoMiembros() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Leer hoja "Grupos" para obtener lista de grupos
  var sheetGrupos = ss.getSheetByName(CONFIG.PAGINA_GRUPOS);
  if (!sheetGrupos) {
    throw new Error("No se encontró la pestaña '" + CONFIG.PAGINA_GRUPOS + "'.");
  }

  var dataGrupos = sheetGrupos.getDataRange().getValues();
  var headersGrupos = dataGrupos[0];
  var idxEmailGrupo = headersGrupos.indexOf("Email");
  
  if (idxEmailGrupo === -1) {
    throw new Error("No se encontró la columna 'Email' en la pestaña Grupos.");
  }

  // 2. Leer hoja "Profesores" para obtener pertenencia a grupos
  var sheetProfesores = ss.getSheetByName(CONFIG.PAGINA_PROFESORES);
  if (!sheetProfesores) {
    throw new Error("No se encontró la pestaña '" + CONFIG.PAGINA_PROFESORES + "'.");
  }

  var dataProfesores = sheetProfesores.getDataRange().getValues();
  var headersProfesores = dataProfesores[0];
  
  var idxEmailProf = headersProfesores.indexOf("Cuenta Corporativa");
  var idxGrupo1 = headersProfesores.indexOf("Grupo1");
  var idxGrupo2 = headersProfesores.indexOf("Grupo2");
  var idxGrupo3 = headersProfesores.indexOf("Grupo3");
  
  Logger.log("Columnas Profesores - Email:" + idxEmailProf + " G1:" + idxGrupo1 + " G2:" + idxGrupo2 + " G3:" + idxGrupo3);

  // 3. Construir mapa de miembros por grupo desde la hoja Profesores
  var miembrosPorGrupo = {};
  
  for (var p = 1; p < dataProfesores.length; p++) {
    var filaProf = dataProfesores[p];
    var emailProfesor = filaProf[idxEmailProf] ? filaProf[idxEmailProf].toString().trim().toLowerCase() : "";
    if (!emailProfesor || emailProfesor.indexOf("@") === -1) continue;
    
    var gruposProfesor = [];
    if (idxGrupo1 !== -1 && filaProf[idxGrupo1]) gruposProfesor.push(filaProf[idxGrupo1].toString().trim().toLowerCase());
    if (idxGrupo2 !== -1 && filaProf[idxGrupo2]) gruposProfesor.push(filaProf[idxGrupo2].toString().trim().toLowerCase());
    if (idxGrupo3 !== -1 && filaProf[idxGrupo3]) gruposProfesor.push(filaProf[idxGrupo3].toString().trim().toLowerCase());
    
    gruposProfesor.forEach(function(emailGrupo) {
      if (!emailGrupo || emailGrupo.indexOf("@") === -1) return;
      if (!miembrosPorGrupo[emailGrupo]) miembrosPorGrupo[emailGrupo] = [];
      if (miembrosPorGrupo[emailGrupo].indexOf(emailProfesor) === -1) {
        miembrosPorGrupo[emailGrupo].push(emailProfesor);
      }
    });
  }
  
  Logger.log("Miembros construidos desde Profesores: " + JSON.stringify(miembrosPorGrupo));

  // 4. Obtener miembros actuales de cada grupo en Workspace
  var propuestas = { agregarMiembro: [], eliminarMiembro: [], sinCambios: 0 };

  for (var r = 1; r < dataGrupos.length; r++) {
    var emailGrupo = dataGrupos[r][idxEmailGrupo] ? dataGrupos[r][idxEmailGrupo].toString().trim().toLowerCase() : "";
    if (!emailGrupo) continue;
    
    var miembrosHoja = miembrosPorGrupo[emailGrupo] || [];
    var miembrosWS = obtenerMiembrosGrupo(emailGrupo).map(function(m) { return m.toLowerCase(); });
    
    // Miembros en hoja que no están en Workspace → agregar
    miembrosHoja.forEach(function(emailMiembro) {
      if (miembrosWS.indexOf(emailMiembro) === -1) {
        propuestas.agregarMiembro.push({
          grupo: emailGrupo,
          miembro: emailMiembro,
          tipo: "AGREGAR_MIEMBRO",
          razon: "Profesor asignado en hoja pero no en grupo de Workspace"
        });
      }
    });

    // Miembros en Workspace que no están en hoja → eliminar
    miembrosWS.forEach(function(emailMiembro) {
      if (miembrosHoja.indexOf(emailMiembro) === -1) {
        propuestas.eliminarMiembro.push({
          grupo: emailGrupo,
          miembro: emailMiembro,
          tipo: "ELIMINAR_MIEMBRO",
          razon: "Miembro en Workspace pero no asignado en hoja Profesores"
        });
      }
    });

    propuestas.sinCambios++;
  }

  Logger.log("Miembros: agregar=" + propuestas.agregarMiembro.length + " eliminar=" + propuestas.eliminarMiembro.length);
  return propuestas;
}

/**
 * Aplica los cambios de GRUPOS aprobados (crear/eliminar grupos)
 */
function aplicarCambiosGrupos(cambios) {
  var resultados = {
    gruposCreados: 0,
    gruposEliminados: 0,
    errores: [],
    modoSimulacion: CONFIG.MODO_SIMULACION
  };

  // Crear grupos
  if (cambios.crearGrupo && cambios.crearGrupo.length > 0) {
    cambios.crearGrupo.forEach(function(item) {
      try {
        if (CONFIG.MODO_SIMULACION) {
          Logger.log("[SIMULACIÓN] Se crearía grupo: " + item.nombre + " (" + item.email + ")");
        } else {
          AdminDirectory.Groups.insert({
            email: item.email,
            name: item.nombre,
            description: item.descripcion || ""
          });
        }
        resultados.gruposCreados++;
      } catch (e) {
        resultados.errores.push("Error creando grupo " + item.nombre + ": " + e.message);
      }
    });
  }

  // Eliminar grupos
  if (cambios.eliminarGrupo && cambios.eliminarGrupo.length > 0) {
    cambios.eliminarGrupo.forEach(function(item) {
      try {
        if (CONFIG.MODO_SIMULACION) {
          Logger.log("[SIMULACIÓN] Se eliminaría grupo: " + item.email);
        } else {
          AdminDirectory.Groups.remove(item.email);
        }
        resultados.gruposEliminados++;
      } catch (e) {
        resultados.errores.push("Error eliminando grupo " + item.email + ": " + e.message);
      }
    });
  }

  return resultados;
}

/**
 * Aplica los cambios de MIEMBROS aprobados (agregar/quitar miembros)
 */
function aplicarCambiosMiembros(cambios) {
  var resultados = {
    miembrosAgregados: 0,
    miembrosEliminados: 0,
    errores: [],
    modoSimulacion: CONFIG.MODO_SIMULACION
  };

  // Agregar miembros
  if (cambios.agregarMiembro && cambios.agregarMiembro.length > 0) {
    cambios.agregarMiembro.forEach(function(item) {
      try {
        if (CONFIG.MODO_SIMULACION) {
          Logger.log("[SIMULACIÓN] Se agregaría " + item.miembro + " a " + item.grupo);
        } else {
          AdminDirectory.Members.insert({
            email: item.miembro,
            role: "MEMBER"
          }, item.grupo);
        }
        resultados.miembrosAgregados++;
      } catch (e) {
        resultados.errores.push("Error agregando " + item.miembro + " a " + item.grupo + ": " + e.message);
      }
    });
  }

  // Eliminar miembros
  if (cambios.eliminarMiembro && cambios.eliminarMiembro.length > 0) {
    cambios.eliminarMiembro.forEach(function(item) {
      try {
        if (CONFIG.MODO_SIMULACION) {
          Logger.log("[SIMULACIÓN] Se eliminaría " + item.miembro + " de " + item.grupo);
        } else {
          AdminDirectory.Members.remove(item.miembro, item.grupo);
        }
        resultados.miembrosEliminados++;
      } catch (e) {
        resultados.errores.push("Error eliminando " + item.miembro + " de " + item.grupo + ": " + e.message);
      }
    });
  }

  return resultados;
}

/**
 * Obtiene la lista completa de Unidades Organizativas de Google Workspace
 */
function obtenerUnidadesOrganizativas() {
  var unidades = [];
  try {
    Logger.log("Obteniendo unidades organizativas de Workspace...");
    
    var respuesta = AdminDirectory.Orgunits.list("my_customer", {
      type: "all",
      maxResults: 500
    });
    
    Logger.log("Respuesta recibida: " + JSON.stringify(respuesta).substring(0, 500));
    
    var lista = respuesta.organizationUnits;
    if (lista) {
      Logger.log("Número de unidades: " + lista.length);
      lista.forEach(function(ou) {
        Logger.log("OU: " + ou.name + " | Ruta: " + ou.orgUnitPath);
        unidades.push({
          nombre: ou.name || "",
          ruta: ou.orgUnitPath || "",
          descripcion: ou.description || ""
        });
      });
      Logger.log("Unidades organizativas obtenidas: " + unidades.length);
    } else {
      Logger.log("No se devolvieron unidades organizativas (lista es null/undefined)");
      Logger.log("Respuesta completa: " + JSON.stringify(respuesta));
    }
  } catch (error) {
    Logger.log("ERROR al obtener unidades organizativas: " + error.message);
    Logger.log("Stack: " + error.stack);
    throw new Error("Error al consultar unidades organizativas de Workspace: " + error.message);
  }

  return unidades;
}

/**
 * Crea o actualiza la pestaña Unidades Organizativas con el listado de Workspace
 */
function crearHojaOU(unidades) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.PAGINA_OU);

  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.PAGINA_OU);
  } else {
    sheet.clear();
  }

  // Cabeceras
  var cabeceras = ["Nombre", "Ruta", "Descripción"];
  sheet.getRange(1, 1, 1, cabeceras.length).setValues([cabeceras]);
  sheet.getRange(1, 1, 1, cabeceras.length)
    .setFontWeight("bold")
    .setBackground("#1E3A8A")
    .setFontColor("#FFFFFF")
    .setFontFamily("Outfit")
    .setHorizontalAlignment("center");

  // Datos
  if (unidades.length > 0) {
    var datos = unidades.map(function(ou) {
      return [ou.nombre, ou.ruta, ou.descripcion];
    });
    sheet.getRange(2, 1, datos.length, cabeceras.length).setValues(datos);
  }

  // Ajustar anchos de columna
  sheet.setColumnWidth(1, 250);
  sheet.setColumnWidth(2, 350);
  sheet.setColumnWidth(3, 300);

  // Congelar cabecera
  sheet.setFrozenRows(1);
}
