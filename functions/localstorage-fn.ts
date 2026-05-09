const PREFIX_KEY = "moneyplus."

// ======== AUTH ========
export const AUTH_KEY = {
  USER: "user.info",
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
  setLocalStorageItem,
  getLocalStorageItem,
  removeLocalStorageItem
}

export default localStorageFn