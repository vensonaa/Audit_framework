import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add timeout and other configurations
  timeout: 10000,
})

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url)
    return config
  },
  (error) => {
    console.error('API Request Error:', error)
    return Promise.reject(error)
  }
)

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url)
    return response
  },
  (error) => {
    console.error('API Response Error:', error.response?.status, error.response?.data)
    return Promise.reject(error)
  }
)

// Types
export interface User {
  id: number
  username: string
  email: string
  full_name: string
  is_active: boolean
  created_at: string
  updated_at?: string
}

export interface Product {
  id: number
  name: string
  description?: string
  price: number
  category: string
  stock_quantity: number
  created_at: string
  updated_at?: string
}

export interface Transaction {
  id: number
  transaction_id: string
  description: string
  user_id?: number
  status: string
  created_at: string
  completed_at?: string
}

export interface AuditLog {
  id: number
  transaction_id: string
  entity_type: string
  entity_id: string
  change_type: string
  old_values?: any
  new_values?: any
  changed_fields?: string[]
  author?: string
  commit_date: string
  created_at: string
}

export interface AuditSummary {
  period_days: number
  total_audit_logs: number
  unique_transactions: number
  change_type_breakdown: Record<string, number>
  entity_type_breakdown: Record<string, number>
}

// API functions
export const apiService = {
  // Users
  getUsers: () => api.get<User[]>('/users/'),
  createUser: (user: Omit<User, 'id' | 'created_at' | 'updated_at'>) => 
    api.post<User>('/users/', user),
  updateUser: (id: number, user: Partial<User>) => 
    api.put<User>(`/users/${id}`, user),
  deleteUser: (id: number) => api.delete(`/users/${id}`),

  // Products
  getProducts: (category?: string) => 
    api.get<Product[]>('/products/', { params: { category } }),
  createProduct: (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => 
    api.post<Product>('/products/', product),
  updateProduct: (id: number, product: Partial<Product>) => 
    api.put<Product>(`/products/${id}`, product),
  deleteProduct: (id: number) => api.delete(`/products/${id}`),
  getCategories: () => api.get<{ categories: string[] }>('/products/categories/list'),

  // Transactions
  getTransactions: (limit = 50, offset = 0) => 
    api.get<Transaction[]>('/transactions/', { params: { limit, offset } }),
  createTransaction: (transaction: { description: string; user_id?: number }) => 
    api.post<Transaction>('/transactions/', transaction),
  executeTransactionOperations: (transactionId: string, operations: any[]) => 
    api.post(`/transactions/${transactionId}/execute`, { operations }),
  completeTransaction: (transactionId: string) => 
    api.post(`/transactions/${transactionId}/complete`),
  getTransaction: (transactionId: string) => 
    api.get<Transaction>(`/transactions/${transactionId}`),

  // Audit
  getTransactionAudit: (transactionId: string) => 
    api.get(`/audit/transactions/${transactionId}`),
  getEntityHistory: (entityType: string, entityId: string) => 
    api.get(`/audit/entity/${entityType}/${entityId}`),
  getRecentAuditLogs: (limit = 50, days = 7) => 
    api.get<{ audit_logs: AuditLog[] }>('/audit/recent', { params: { limit, days } }),
  getAuditSummary: (days = 30) => 
    api.get<AuditSummary>('/audit/summary', { params: { days } }),
}

export default api
