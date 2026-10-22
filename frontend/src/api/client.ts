import axios from 'axios'
import { useAuthStore } from '@/stores/auth-store'
import { getLanguage } from '@/lib/i18n'
import { API_URL } from './config'

export const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  // Lets Django return messages in the interface language
  config.headers['Accept-Language'] = getLanguage()
  return config
})
