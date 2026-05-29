const PREFIX_KEY = "moneyplus."

// ======== AUTH ========
export const AUTH_KEY = {
  USER: "user.info",
}

// ======== SETTINGS ========
export const SETTINGS_KEY = {
  /** Bật/tắt xem lại giao dịch tự động qua form thủ công trước khi lưu (mặc định: true) */
  SMART_TX_PREVIEW: "settings.smart_tx_preview",
  /** Chế độ nhận diện giao dịch tự động: 'offline' (Regex) hoặc 'ai' (Gemini) (mặc định: 'offline') */
  SMART_TX_MODE: "settings.smart_tx_mode",
}

export const setLocalStorageItem = (key: string, value: string) => {
  localStorage.setItem(PREFIX_KEY + key, value);
}

export const getLocalStorageItem = (key: string) => {
  return localStorage.getItem(PREFIX_KEY + key);
}

export const removeLocalStorageItem = (key: string) => {
  localStorage.removeItem(PREFIX_KEY + key);
}

const localStorageFn = {
  AUTH_KEY,
  SETTINGS_KEY,
  setLocalStorageItem,
  getLocalStorageItem,
  removeLocalStorageItem
}

export default localStorageFn