import axios from 'axios'

const API_URL =
  import.meta.env.VITE_API_URL ||
  'https://ecomora-backend-xv2e.onrender.com'

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export default client