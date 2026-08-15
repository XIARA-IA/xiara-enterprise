window.XIARA = window.XIARA || {};

import { firebaseConfig } from "../../../firebase-config.js";

import {
  initializeApp,
  getApps,
  getApp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const log = function (msg, data) {
  if (window.XIARA && typeof XIARA.log === "function") {
    XIARA.log("[DB] " + msg, data);
  } else {
    console.log("[XIARA DB]", msg, data || "");
  }
};

const app = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

const firestore = getFirestore(app);

XIARA.dbService = XIARA.dbService || {};

XIARA.dbService.app = app;
XIARA.dbService.firestore = firestore;
XIARA.dbService.listeners = new Map();

XIARA.dbService.buildQuery = function (collectionName, options = {}) {
  const constraints = [];

  if (options.empresaId) {
    constraints.push(
      where(
        options.empresaField || "empresa_id",
        "==",
        options.empresaId
      )
    );
  }

  if (Array.isArray(options.filters)) {
    options.filters.forEach(function (filter) {
      if (!Array.isArray(filter) || filter.length < 3) {
        return;
      }
      constraints.push(
        where(filter[0], filter[1], filter[2])
      );
    });
  }

  if (options.orderBy) {
    if (Array.isArray(options.orderBy)) {
      constraints.push(
        orderBy(
          options.orderBy[0],
          options.orderBy[1] || "asc"
        )
      );
    } else {
      constraints.push(orderBy(options.orderBy));
    }
  }

  if (Number(options.limit) > 0) {
    constraints.push(limit(Number(options.limit)));
  }

  const ref = collection(firestore, collectionName);

  return constraints.length
    ? query(ref, ...constraints)
    : ref;
};

XIARA.dbService.get = async function (collectionName, id) {
  const ref = doc(firestore, collectionName, id);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data()
  };
};

XIARA.dbService.list = async function (
  collectionName,
  options = {}
) {
  const q = XIARA.dbService.buildQuery(
    collectionName,
    options
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map(function (item) {
    return {
      id: item.id,
      ...item.data()
    };
  });
};

XIARA.dbService.upsert = async function (
  collectionName,
  id,
  data
) {
  if (!collectionName) {
    throw new Error("collectionName requerido");
  }

  if (!id) {
    throw new Error("id requerido");
  }

  const ref = doc(
    firestore,
    collectionName,
    id
  );

  await setDoc(
    ref,
    {
      ...data,
      id: id,
      updatedAt: serverTimestamp()
    },
    {
      merge: true
    }
  );

  log(
    "Documento guardado",
    collectionName + "/" + id
  );

  return id;
};

XIARA.dbService.remove = async function (
  collectionName,
  id
) {
  if (!collectionName || !id) {
    throw new Error(
      "collectionName e id son requeridos"
    );
  }

  await deleteDoc(
    doc(
      firestore,
      collectionName,
      id
    )
  );

  log(
    "Documento eliminado",
    collectionName + "/" + id
  );

  return true;
};

XIARA.dbService.subscribe = function (
  listenerId,
  collectionName,
  options,
  callback,
  errorCallback
) {
  if (!listenerId) {
    throw new Error("listenerId requerido");
  }

  XIARA.dbService.unsubscribe(listenerId);

  const q = XIARA.dbService.buildQuery(
    collectionName,
    options || {}
  );

  const unsubscribe = onSnapshot(
    q,
    function (snapshot) {
      const rows = snapshot.docs.map(
        function (item) {
          return {
            id: item.id,
            ...item.data()
          };
        }
      );

      callback(rows);
    },
    function (error) {
      console.error(
        "[XIARA DB] Error listener",
        listenerId,
        error
      );

      if (typeof errorCallback === "function") {
        errorCallback(error);
      }
    }
  );

  XIARA.dbService.listeners.set(
    listenerId,
    unsubscribe
  );

  log(
    "Listener iniciado",
    listenerId
  );

  return unsubscribe;
};

XIARA.dbService.unsubscribe = function (listenerId) {
  const unsubscribe =
    XIARA.dbService.listeners.get(listenerId);

  if (!unsubscribe) {
    return false;
  }

  try {
    unsubscribe();
  } finally {
    XIARA.dbService.listeners.delete(listenerId);
  }

  log(
    "Listener detenido",
    listenerId
  );

  return true;
};

XIARA.dbService.unsubscribeAll = function () {
  Array.from(
    XIARA.dbService.listeners.keys()
  ).forEach(function (listenerId) {
    XIARA.dbService.unsubscribe(listenerId);
  });
};

XIARA.dbService.healthCheck = async function () {
  return {
    ok: true,
    projectId: firebaseConfig.projectId,
    listeners:
      XIARA.dbService.listeners.size
  };
};

log(
  "Servicio Firestore V6 preparado",
  firebaseConfig.projectId
);
