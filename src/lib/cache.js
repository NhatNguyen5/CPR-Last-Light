import {validatePlayerSheet} from './projection.js'

// The offline copy is player-known data, NOT the authoritative campaign save.
// The OAuth token is deliberately never stored in browser storage.
export const PLAYER_CACHE_KEY = 'cpr-last-light:offline-player-sheet-v1'

export function readCachedPlayerSheet(storage, expectedFileId) {
  try {
    const raw = storage?.getItem(PLAYER_CACHE_KEY)
    if (!raw) return null
    const cached = JSON.parse(raw)
    if (cached?.fileId !== expectedFileId || !Number.isFinite(cached?.savedAt)) {
      storage?.removeItem(PLAYER_CACHE_KEY)
      return null
    }
    return {
      sheet: validatePlayerSheet(cached.sheet),
      savedAt: cached.savedAt,
    }
  } catch {
    try { storage?.removeItem(PLAYER_CACHE_KEY) } catch {}
    return null
  }
}

export function writeCachedPlayerSheet(storage, fileId, expectedFileId, sheet, savedAt = Date.now()) {
  if (fileId !== expectedFileId || !Number.isFinite(savedAt)) return false
  try {
    const valid = validatePlayerSheet(sheet)
    storage?.setItem(PLAYER_CACHE_KEY, JSON.stringify({fileId, savedAt, sheet:valid}))
    return true
  } catch {
    // Failed browser storage (quota, disabled storage, or invalid projection)
    // must not prevent viewing the authenticated Drive data.
    return false
  }
}

export function clearCachedPlayerSheet(storage) {
  try { storage?.removeItem(PLAYER_CACHE_KEY); return true } catch { return false }
}
