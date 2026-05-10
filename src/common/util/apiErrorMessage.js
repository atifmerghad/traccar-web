/**
 * Map Traccar API error bodies (plain-text Java traces, JSON, etc.) to UI-safe messages.
 * @param {string} rawText
 * @param {(key: string) => string} t - useTranslation()
 */
export function userMessageFromApiErrorBody(rawText, t) {
  const raw = String(rawText || '').trim();
  if (!raw) return t('deviceSaveErrorGeneric');

  const lower = raw.toLowerCase();

  if (lower.includes('image size limit exceeded')) {
    return t('deviceImageErrorTooLarge');
  }

  if (
    lower.includes('write access denied') ||
    lower.includes('securityexception') ||
    lower.includes('permissionservice')
  ) {
    return t('deviceSaveErrorNoPermission');
  }

  if (raw.startsWith('{')) {
    try {
      const j = JSON.parse(raw);
      const m = j.message || j.title || j.error;
      if (typeof m === 'string' && m.trim() && m !== raw) {
        return userMessageFromApiErrorBody(m, t);
      }
    } catch {
      /* ignore */
    }
  }

  // "Human text - SomeException ( … )" without dumping the stack
  const beforeException = raw.replace(/\s*-\s*[\w.]+Exception\b[\s\S]*$/i, '').trim();
  if (
    beforeException.length > 0 &&
    beforeException.length < 220 &&
    !/\bat\s+[\w$.]+(\.|\/)/i.test(beforeException)
  ) {
    return beforeException;
  }

  const firstLine = raw.split(/\r?\n/)[0].trim();
  if (firstLine.length > 0 && firstLine.length < 160 && !/\bat\s+[\w$.]+(\.|\/)/i.test(raw)) {
    return firstLine;
  }

  return t('deviceSaveErrorGeneric');
}
