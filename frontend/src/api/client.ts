import axios from 'axios'

/**
 * Axios instance with base URL and auth header injection.
 * Populated by AuthContext once the user logs in.
 */
const client = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor — attach Bearer token from localStorage if present
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default client
