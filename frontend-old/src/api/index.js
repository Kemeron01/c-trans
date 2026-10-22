import axios from 'axios'
import router from '@/router'

// Asosiy backend (VITE_API_URL .env faylidan olinadi)
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://89.169.2.238:8002/api/v1',
})

// Hali backendga ulanmagan sahifalar uchun vaqtinchalik json-server
export const mockApi = axios.create({
  baseURL: import.meta.env.VITE_MOCK_API_URL || 'http://localhost:3000',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    // Token eskirgan bo'lsa — login sahifasiga qaytaramiz
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      router.push('/')
    }
    return Promise.reject(error)
  }
)

export const errorMessage = (error) =>
  error.response?.data?.message || error.message || 'Serverga ulanib bo‘lmadi'
