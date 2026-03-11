// src/lib/margelet/accessEngine.js
// Access and billing gate for Margelet.
// Owner has full bypass:
// - no paywall
// - no generation caps
// - no download lock

const OWNER_TELEGRAM_ID = "1372669404";
const OWNER_USERNAME = "NStasS";

export function resolveAccess(input = {}) {
  const {
    user = null,
    action = "preview",
    plan = null,
    usage = null,
  } = input;

  const normalizedUser = normalizeUser(user);
  const owner = isOwner(normalizedUser);

  if (owner) {
    return buildOwnerAccess(normalizedUser, action);
  }

  if (action === "preview") {
    return buildPreviewAccess(normalizedUser);
  }

  if (action === "download") {
    return buildDownloadAccess(normalizedUser, plan);
  }

  if (action === "generate") {
    return buildGenerateAccess(normalizedUser, plan, usage);
  }

  return buildUnknownActionAccess(normalizedUser, action);
}

export function isOwner(user = null) {
  const normalized = normalizeUser(user);

  if (!normalized) return false;

  const idMatch =
    normalized.telegramId &&
    String(normalized.telegramId) === String(OWNER_TELEGRAM_ID);

  const usernameMatch =
    normalized.username &&
    normalized.username.toLowerCase() === OWNER_USERNAME.toLowerCase();

  return Boolean(idMatch || usernameMatch);
}

export function getOwnerConfig() {
  return {
    telegramId: OWNER_TELEGRAM_ID,
    username: OWNER_USERNAME,
  };
}

function buildOwnerAccess(user, action) {
  return {
    ok: true,
    action,
    user: user || null,
    owner: true,
    authenticated: true,

    access: {
      allowed: true,
      canPreview: true,
      canGenerate: true,
      canDownload: true,
      requiresAuth: false,
      requiresPlan: false,
      requiresUpgrade: false,
    },

    billing: {
      bypass: true,
      planRequired: false,
      activePlan: true,
      planCode: "owner_unlimited",
      planLabel: "Owner Unlimited",
    },

    limits: {
      hasLimits: false,
      dailyGenerations: null,
      monthlyDownloads: null,
      remainingGenerations: null,
      remainingDownloads: null,
    },

    ui: {
      state: "owner",
      cta: "download",
      reason: null,
      modal: null,
      redirectTo: null,
    },
  };
}

function buildPreviewAccess(user) {
  return {
    ok: true,
    action: "preview",
    user: user || null,
    owner: false,
    authenticated: Boolean(user),

    access: {
      allowed: true,
      canPreview: true,
      canGenerate: true,
      canDownload: false,
      requiresAuth: false,
      requiresPlan: false,
      requiresUpgrade: false,
    },

    billing: {
      bypass: false,
      planRequired: false,
      activePlan: false,
      planCode: null,
      planLabel: null,
    },

    limits: {
      hasLimits: false,
      dailyGenerations: null,
      monthlyDownloads: null,
      remainingGenerations: null,
      remainingDownloads: null,
    },

    ui: {
      state: "preview_free",
      cta: "generate",
      reason: null,
      modal: null,
      redirectTo: null,
    },
  };
}

function buildDownloadAccess(user, plan) {
  const authenticated = Boolean(user);
  const activePlan = hasActivePlan(plan);

  if (!authenticated) {
    return {
      ok: true,
      action: "download",
      user: null,
      owner: false,
      authenticated: false,

      access: {
        allowed: false,
        canPreview: true,
        canGenerate: true,
        canDownload: false,
        requiresAuth: true,
        requiresPlan: false,
        requiresUpgrade: false,
      },

      billing: {
        bypass: false,
        planRequired: false,
        activePlan: false,
        planCode: null,
        planLabel: null,
      },

      limits: {
        hasLimits: false,
        dailyGenerations: null,
        monthlyDownloads: null,
        remainingGenerations: null,
        remainingDownloads: null,
      },

      ui: {
        state: "auth_required",
        cta: "login",
        reason: "login_required_for_download",
        modal: "auth",
        redirectTo: null,
      },
    };
  }

  if (!activePlan) {
    return {
      ok: true,
      action: "download",
      user,
      owner: false,
      authenticated: true,

      access: {
        allowed: false,
        canPreview: true,
        canGenerate: true,
        canDownload: false,
        requiresAuth: false,
        requiresPlan: true,
        requiresUpgrade: true,
      },

      billing: {
        bypass: false,
        planRequired: true,
        activePlan: false,
        planCode: null,
        planLabel: null,
      },

      limits: {
        hasLimits: true,
        dailyGenerations: null,
        monthlyDownloads: 0,
        remainingGenerations: null,
        remainingDownloads: 0,
      },

      ui: {
        state: "plan_required",
        cta: "pricing",
        reason: "active_plan_required_for_download",
        modal: null,
        redirectTo: "/price",
      },
    };
  }

  return {
    ok: true,
    action: "download",
    user,
    owner: false,
    authenticated: true,

    access: {
      allowed: true,
      canPreview: true,
      canGenerate: true,
      canDownload: true,
      requiresAuth: false,
      requiresPlan: false,
      requiresUpgrade: false,
    },

    billing: {
      bypass: false,
      planRequired: true,
      activePlan: true,
      planCode: plan?.code || "active_plan",
      planLabel: plan?.label || "Active plan",
    },

    limits: {
      hasLimits: false,
      dailyGenerations: null,
      monthlyDownloads: null,
      remainingGenerations: null,
      remainingDownloads: null,
    },

    ui: {
      state: "download_allowed",
      cta: "download",
      reason: null,
      modal: null,
      redirectTo: null,
    },
  };
}

function buildGenerateAccess(user, plan, usage) {
  const normalizedUsage = normalizeUsage(usage);

  return {
    ok: true,
    action: "generate",
    user: user || null,
    owner: false,
    authenticated: Boolean(user),

    access: {
      allowed: true,
      canPreview: true,
      canGenerate: true,
      canDownload: Boolean(user && hasActivePlan(plan)),
      requiresAuth: false,
      requiresPlan: false,
      requiresUpgrade: false,
    },

    billing: {
      bypass: false,
      planRequired: false,
      activePlan: Boolean(user && hasActivePlan(plan)),
      planCode: plan?.code || null,
      planLabel: plan?.label || null,
    },

    limits: {
      hasLimits: false,
      dailyGenerations: normalizedUsage.dailyGenerations,
      monthlyDownloads: normalizedUsage.monthlyDownloads,
      remainingGenerations: normalizedUsage.remainingGenerations,
      remainingDownloads: normalizedUsage.remainingDownloads,
    },

    ui: {
      state: "generate_allowed",
      cta: "generate",
      reason: null,
      modal: null,
      redirectTo: null,
    },
  };
}

function buildUnknownActionAccess(user, action) {
  return {
    ok: false,
    action,
    user: user || null,
    owner: false,
    authenticated: Boolean(user),

    access: {
      allowed: false,
      canPreview: false,
      canGenerate: false,
      canDownload: false,
      requiresAuth: false,
      requiresPlan: false,
      requiresUpgrade: false,
    },

    billing: {
      bypass: false,
      planRequired: false,
      activePlan: false,
      planCode: null,
      planLabel: null,
    },

    limits: {
      hasLimits: false,
      dailyGenerations: null,
      monthlyDownloads: null,
      remainingGenerations: null,
      remainingDownloads: null,
    },

    ui: {
      state: "unknown_action",
      cta: null,
      reason: `unsupported_action:${action}`,
      modal: null,
      redirectTo: null,
    },
  };
}

function hasActivePlan(plan) {
  if (!plan) return false;
  if (plan.active === true) return true;
  if (plan.status === "active") return true;
  return false;
}

function normalizeUser(user) {
  if (!user || typeof user !== "object") return null;

  const telegramId =
    user.telegramId ??
    user.telegram_id ??
    user.id ??
    null;

  const rawUsername =
    user.username ??
    user.userName ??
    user.handle ??
    "";

  const username = String(rawUsername || "")
    .replace(/^@/, "")
    .trim();

  return {
    telegramId: telegramId != null ? String(telegramId) : null,
    username: username || null,
    firstName: user.firstName || user.first_name || null,
    lastName: user.lastName || user.last_name || null,
  };
}

function normalizeUsage(usage) {
  return {
    dailyGenerations: toNullableNumber(usage?.dailyGenerations),
    monthlyDownloads: toNullableNumber(usage?.monthlyDownloads),
    remainingGenerations: toNullableNumber(usage?.remainingGenerations),
    remainingDownloads: toNullableNumber(usage?.remainingDownloads),
  };
}

function toNullableNumber(value) {
  return Number.isFinite(value) ? value : null;
}