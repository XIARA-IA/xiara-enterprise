window.XIARA = window.XIARA || {};

XIARA.version = "6.0.0-enterprise";
XIARA.env = "v6-enterprise";

XIARA.log = function (msg, data) {
  const time = new Date().toISOString();
  console.log("[XIARA CORE]", time, msg, data || "");
};

XIARA.safeRun = function (name, fn) {
  try {
    XIARA.log("Ejecutando: " + name);
    return fn();
  } catch (err) {
    console.error("[XIARA ERROR]", name, err);
    alert("Error en módulo: " + name + "\n" + err.message);
  }
};

XIARA.modules = {};

XIARA.registerModule = function (name, module) {
  XIARA.modules[name] = module;
  XIARA.log("Módulo registrado: " + name);
};

XIARA.startModule = function (name) {
  if (!XIARA.modules[name]) {
    XIARA.log("Módulo no encontrado: " + name);
    return;
  }
  if (typeof XIARA.modules[name].init === "function") {
    XIARA.safeRun("init " + name, XIARA.modules[name].init);
  }
};

XIARA.startAllModules = function () {
  Object.keys(XIARA.modules).forEach(function (name) {
    XIARA.startModule(name);
  });
};