window.XIARA = window.XIARA || {};

import { firebaseConfig } from "../../../firebase-config.js";

import {
  getApps,
  getApp,
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

const log = function (msg, data) {
  if (window.XIARA && typeof XIARA.log === "function") {
    XIARA.log("[STORAGE] " + msg, data);
  } else {
    console.log("[XIARA STORAGE]", msg, data || "");
  }
};

const app = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

const storage = getStorage(app);

XIARA.storageService = XIARA.storageService || {};

XIARA.storageService.app = app;
XIARA.storageService.storage = storage;

/*
  IMPORTANTE:
  El proyecto actual todavía no tiene Firebase Storage operativo.
  Por seguridad V6 nace desactivado y ninguna subida se ejecutará
  hasta que se habilite de forma explícita.
*/
XIARA.storageService.enabled = false;

XIARA.storageService.setEnabled = function (value) {
  XIARA.storageService.enabled = value === true;
  log(
    "Estado cambiado",
    XIARA.storageService.enabled ? "habilitado" : "deshabilitado"
  );
  return XIARA.storageService.enabled;
};

XIARA.storageService.sanitizeSegment = function (value) {
  return String(value || "")
    .trim()
    .replace(/[\\/#?[\]]+/g, "-")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
};

XIARA.storageService.extensionFromFile = function (file) {
  const name = file && file.name ? String(file.name) : "";
  const dot = name.lastIndexOf(".");
  if (dot < 0) return "";
  return name.slice(dot).toLowerCase();
};

XIARA.storageService.buildPath = function (options = {}) {
  const empresaId =
    XIARA.storageService.sanitizeSegment(options.empresaId);
  const modulo =
    XIARA.storageService.sanitizeSegment(options.modulo);
  const entidadTipo =
    XIARA.storageService.sanitizeSegment(options.entidadTipo);
  const entidadId =
    XIARA.storageService.sanitizeSegment(options.entidadId);
  const categoria =
    XIARA.storageService.sanitizeSegment(options.categoria);
  const documentoId =
    XIARA.storageService.sanitizeSegment(options.documentoId);

  if (!empresaId) {
    throw new Error("empresaId requerido");
  }

  if (!modulo) {
    throw new Error("modulo requerido");
  }

  if (!documentoId) {
    throw new Error("documentoId requerido");
  }

  const ext = options.extension
    ? String(options.extension).toLowerCase()
    : XIARA.storageService.extensionFromFile(options.file);

  const parts = [
    "empresas",
    empresaId,
    modulo
  ];

  if (entidadTipo) {
    parts.push(entidadTipo);
  }

  if (entidadId) {
    parts.push(entidadId);
  }

  if (categoria) {
    parts.push(categoria);
  }

  parts.push(documentoId + ext);

  return parts.join("/");
};

XIARA.storageService.upload = async function (options = {}) {
  if (!XIARA.storageService.enabled) {
    const error = new Error(
      "Firebase Storage V6 está deshabilitado. No se ha realizado ninguna subida."
    );
    error.code = "XIARA_STORAGE_DISABLED";
    throw error;
  }

  if (!options.file) {
    throw new Error("file requerido");
  }

  const path = options.path ||
    XIARA.storageService.buildPath(options);

  const storageRef = ref(storage, path);

  const snapshot = await uploadBytes(
    storageRef,
    options.file,
    {
      contentType:
        options.file.type ||
        "application/octet-stream",
      customMetadata: {
        empresaId: String(options.empresaId || ""),
        modulo: String(options.modulo || ""),
        entidadTipo: String(options.entidadTipo || ""),
        entidadId: String(options.entidadId || ""),
        categoria: String(options.categoria || ""),
        documentoId: String(options.documentoId || "")
      }
    }
  );

  const url = await getDownloadURL(snapshot.ref);

  log("Archivo subido", path);

  return {
    path: path,
    url: url,
    size: Number(options.file.size || 0),
    mimeType:
      options.file.type ||
      "application/octet-stream",
    filename:
      options.file.name ||
      documentoId
  };
};

XIARA.storageService.remove = async function (path) {
  if (!XIARA.storageService.enabled) {
    const error = new Error(
      "Firebase Storage V6 está deshabilitado. No se ha eliminado ningún archivo."
    );
    error.code = "XIARA_STORAGE_DISABLED";
    throw error;
  }

  if (!path) {
    throw new Error("path requerido");
  }

  await deleteObject(ref(storage, path));

  log("Archivo eliminado", path);

  return true;
};

XIARA.storageService.healthCheck = async function () {
  return {
    ok: true,
    configuredProject:
      firebaseConfig.projectId,
    enabled:
      XIARA.storageService.enabled,
    mode:
      XIARA.storageService.enabled
        ? "active"
        : "safe-disabled"
  };
};

log(
  "Servicio Storage V6 preparado en modo seguro",
  firebaseConfig.projectId
);
