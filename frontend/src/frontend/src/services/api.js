const BASE_URL = import.meta.env.VITE_API_URL || ''

export const api = (path) => `${BASE_URL}${path}`
