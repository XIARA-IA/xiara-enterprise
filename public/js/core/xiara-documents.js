window.XIARA = window.XIARA || {};

const log = function (msg, data) {
  if (window.XIARA && typeof XIARA.log === "function") {
    XIARA.log("[DOCS] " + msg, data);
  } else {
    console.log("[XIARA DOCS]", msg, data || "");
  }
};

XIARA.documents = XIARA.documents || {};

XIARA.documents.COLLECTION = "documentos";

XIARA.documents.makeId = function () {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase();

  return "DOC-" + stamp + "-" + rand;
};

XIARA.documents.normalizeEmpresaId = function (data = {}) {
  return (
    data.empresaId ||
    data.empresa_id ||
    ""
  );
};

XIARA.documents.buildMetadata = function (options = {}) {
  const id =
    options.id ||
    options.documentoId ||
    XIARA.documents.makeId();

  const empresaId =
    XIARA.documents.normalizeEmpresaId(options);

  if (!empresaId) {
    throw new Error("empresaId requerido");
  }

  if (!options.modulo) {
    throw new Error("modulo requerido");
  }

  const file = options.file || null;

  return {
    id: id,

    /* Compatibilidad temporal con V5 + modelo V6 */
    empresaId: empresaId,
    empresa_id: empresaId,

    modulo: String(options.modulo),

    entidadTipo:
      String(options.entidadTipo || ""),

    entidadId:
      String(options.entidadId || ""),

    categoria:
      String(options.categoria || "general"),

    periodo:
      String(options.periodo || ""),

    nombre:
      String(
        options.nombre ||
        (file && file.name) ||
        ""
      ),

    filename:
      String(
        options.filename ||
        (file && file.name) ||
        ""
      ),

    mimeType:
      String(
        options.mimeType ||
        (file && file.type) ||
        "application/octet-stream"
      ),

    size:
      Number(
        options.size ??
        (file && file.size) ??
        0
      ),

    storagePath:
      String(options.storagePath || ""),

    downloadUrl:
      String(options.downloadUrl || ""),

    estado:
      String(options.estado || "pendiente"),

    hash:
      String(options.hash || ""),

    migratedFrom:
      String(options.migratedFrom || ""),

    legacyId:
      String(options.legacyId || ""),

    createdBy:
      String(options.createdBy || ""),

    source:
      String(options.source || "xiara-v6")
  };
};

XIARA.documents.validateMetadata = function (metadata) {
  const errors = [];

  if (!metadata || typeof metadata !== "object") {
    return {
      ok: false,
      errors: ["metadata inválido"]
    };
  }

  if (!metadata.id) {
    errors.push("id requerido");
  }

  if (!metadata.empresaId && !metadata.empresa_id) {
    errors.push("empresaId requerido");
  }

  if (!metadata.modulo) {
    errors.push("modulo requerido");
  }

  return {
    ok: errors.length === 0,
    errors: errors
  };
};

XIARA.documents.prepareUpload = function (options = {}) {
  if (
    !XIARA.storageService ||
    typeof XIARA.storageService.buildPath !== "function"
  ) {
    throw new Error(
      "XIARA.storageService no está cargado"
    );
  }

  const metadata =
    XIARA.documents.buildMetadata(options);

  const storagePath =
    XIARA.storageService.buildPath({
      empresaId: metadata.empresaId,
      modulo: metadata.modulo,
      entidadTipo: metadata.entidadTipo,
      entidadId: metadata.entidadId,
      categoria: metadata.categoria,
      documentoId: metadata.id,
      file: options.file,
      extension: options.extension
    });

  metadata.storagePath = storagePath;

  return {
    id: metadata.id,
    storagePath: storagePath,
    metadata: metadata
  };
};

XIARA.documents.saveMetadata = async function (metadata) {
  if (
    !XIARA.dbService ||
    typeof XIARA.dbService.upsert !== "function"
  ) {
    throw new Error(
      "XIARA.dbService no está cargado"
    );
  }

  const validation =
    XIARA.documents.validateMetadata(metadata);

  if (!validation.ok) {
    throw new Error(
      validation.errors.join(", ")
    );
  }

  await XIARA.dbService.upsert(
    XIARA.documents.COLLECTION,
    metadata.id,
    metadata
  );

  log(
    "Metadatos guardados",
    metadata.id
  );

  return metadata.id;
};

XIARA.documents.upload = async function (options = {}) {
  if (!options.file) {
    throw new Error("file requerido");
  }

  const prepared =
    XIARA.documents.prepareUpload(options);

  /*
    Orden seguro:
    1. subir binario
    2. obtener URL
    3. guardar metadatos
    Si Storage está deshabilitado, falla ANTES de escribir Firestore.
  */
  const uploaded =
    await XIARA.storageService.upload({
      ...options,
      documentoId: prepared.id,
      path: prepared.storagePath
    });

  const metadata = {
    ...prepared.metadata,
    storagePath: uploaded.path,
    downloadUrl: uploaded.url,
    size: uploaded.size,
    mimeType: uploaded.mimeType,
    filename: uploaded.filename,
    nombre:
      prepared.metadata.nombre ||
      uploaded.filename,
    estado: "disponible"
  };

  await XIARA.documents.saveMetadata(metadata);

  return metadata;
};

XIARA.documents.listForEntity = async function (options = {}) {
  if (
    !XIARA.dbService ||
    typeof XIARA.dbService.list !== "function"
  ) {
    throw new Error(
      "XIARA.dbService no está cargado"
    );
  }

  const empresaId =
    XIARA.documents.normalizeEmpresaId(options);

  const filters = [];

  if (options.modulo) {
    filters.push([
      "modulo",
      "==",
      options.modulo
    ]);
  }

  if (options.entidadTipo) {
    filters.push([
      "entidadTipo",
      "==",
      options.entidadTipo
    ]);
  }

  if (options.entidadId) {
    filters.push([
      "entidadId",
      "==",
      options.entidadId
    ]);
  }

  if (options.categoria) {
    filters.push([
      "categoria",
      "==",
      options.categoria
    ]);
  }

  return XIARA.dbService.list(
    XIARA.documents.COLLECTION,
    {
      empresaId: empresaId,
      empresaField: "empresaId",
      filters: filters,
      limit:
        Number(options.limit) > 0
          ? Number(options.limit)
          : 100
    }
  );
};

XIARA.documents.healthCheck = async function () {
  return {
    ok: true,
    collection:
      XIARA.documents.COLLECTION,
    dbReady:
      !!(
        XIARA.dbService &&
        XIARA.dbService.firestore
      ),
    storageReady:
      !!XIARA.storageService,
    storageEnabled:
      !!(
        XIARA.storageService &&
        XIARA.storageService.enabled
      )
  };
};

log(
  "Servicio documental V6 preparado",
  XIARA.documents.COLLECTION
);
