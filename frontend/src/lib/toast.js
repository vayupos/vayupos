import { toast } from "sonner";

// Deduplication: prevent the same error message from stacking
const _shownErrors = new Set();

function _dedupedError(msg, opts = {}) {
  const key = String(msg);
  if (_shownErrors.has(key)) return;
  _shownErrors.add(key);
  toast.error(key, {
    duration: 5000,
    onDismiss:   () => _shownErrors.delete(key),
    onAutoClose: () => _shownErrors.delete(key),
    ...opts,
  });
}

/**
 * Parses a backend error into a human-readable string.
 * Handles FastAPI validation arrays, detail strings, and plain JS errors.
 */
function parseError(err, fallback = "Something went wrong. Please try again.") {
  if (!err) return fallback;
  const d = err?.response?.data?.detail;
  if (Array.isArray(d) && d.length) {
    return d[0]?.msg || fallback;
  }
  if (typeof d === "string" && d.trim()) return d.trim();
  if (err?.message && err.message !== "Network Error") return err.message;
  if (err?.message === "Network Error") return "Cannot reach the server. Check your connection.";
  return fallback;
}

export const toastError = (errOrMsg, fallback) => {
  const msg = typeof errOrMsg === "string"
    ? errOrMsg
    : parseError(errOrMsg, fallback);
  _dedupedError(msg);
};

export const toastSuccess = (msg, opts) =>
  toast.success(msg, { duration: 3000, ...opts });

export const toastWarning = (msg, opts) =>
  toast.warning(msg, { duration: 4000, ...opts });

export const toastInfo = (msg, opts) =>
  toast.info(msg, { duration: 3000, ...opts });
