// src/lib/margelet/previewStore.js
// Ephemeral in-memory preview store for Margelet.
// Temporary development/runtime store. Not persistent.

const DEFAULT_TTL_MINUTES = 30;

function getStore() {
  if (!globalThis.__margeletPreviewStore) {
    globalThis.__margeletPreviewStore = new Map();
  }
  return globalThis.__margeletPreviewStore;
}

function now() {
  return Date.now();
}

function buildKey(requestId, variantId) {
  return `${requestId}::${variantId}`;
}

export function savePreviewDescriptors(previewResult, options = {}) {
  const store = getStore();
  const ttlMinutes =
    Number.isFinite(options.ttlMinutes) && options.ttlMinutes > 0
      ? options.ttlMinutes
      : DEFAULT_TTL_MINUTES;

  const expiresAt = now() + ttlMinutes * 60 * 1000;

  const requestId = previewResult?.input?.requestId || previewResult?.requestId || null;
  const previews = previewResult?.previews || [];

  if (!requestId || !Array.isArray(previews) || previews.length === 0) {
    return {
      ok: false,
      error: {
        code: "PREVIEW_STORE_INPUT_INVALID",
        message: "Preview store input is invalid.",
      },
    };
  }

  let saved = 0;

  for (const preview of previews) {
    const variantId = preview?.id;
    if (!variantId) continue;

    const key = buildKey(requestId, variantId);

    store.set(key, {
      requestId,
      variantId,
      createdAt: now(),
      expiresAt,
      data: preview,
    });

    saved += 1;
  }

  return {
    ok: true,
    requestId,
    saved,
    expiresAt,
    ttlMinutes,
  };
}

export function getPreviewDescriptor(requestId, variantId) {
  cleanupExpiredPreviews();

  const store = getStore();
  const key = buildKey(requestId, variantId);
  const item = store.get(key);

  if (!item) {
    return null;
  }

  if (item.expiresAt <= now()) {
    store.delete(key);
    return null;
  }

  return item;
}

export function cleanupExpiredPreviews() {
  const store = getStore();
  const current = now();

  for (const [key, value] of store.entries()) {
    if (!value || value.expiresAt <= current) {
      store.delete(key);
    }
  }
}

export function deletePreviewDescriptor(requestId, variantId) {
  const store = getStore();
  const key = buildKey(requestId, variantId);
  return store.delete(key);
}