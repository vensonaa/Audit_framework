import { useState, useEffect } from 'react'
import { X, Plus, User, Package, Edit, Trash2, Search } from 'lucide-react'
import { apiService, User as UserType, Product as ProductType } from '../services/api'

interface TransactionOperationsProps {
  transactionId: string
  isOpen: boolean
  onClose: () => void
  onOperationsExecuted: () => void
  inline?: boolean
}

interface Operation {
  type: 'user' | 'product'
  operation: 'create' | 'update' | 'delete'
  user_id?: number
  product_id?: number
  data?: any
}

export default function TransactionOperations({
  transactionId,
  isOpen,
  onClose,
  onOperationsExecuted,
  inline
}: TransactionOperationsProps) {
  const [operations, setOperations] = useState<Operation[]>([])
  const [currentOperation, setCurrentOperation] = useState<Operation>({
    type: 'user',
    operation: 'create',
    data: {}
  })
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<UserType[]>([])
  const [products, setProducts] = useState<ProductType[]>([])
  const [showUserSelect, setShowUserSelect] = useState(false)
  const [showProductSelect, setShowProductSelect] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch users and products when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUsers()
      fetchProducts()
    }
  }, [isOpen])

  const fetchUsers = async () => {
    try {
      const response = await apiService.getUsers()
      setUsers(response.data)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await apiService.getProducts()
      setProducts(response.data)
    } catch (error) {
      console.error('Failed to fetch products:', error)
    }
  }

  const handleSelectEntity = (entity: any, entityType: 'user' | 'product') => {
    if (entityType === 'user') {
      setCurrentOperation({
        ...currentOperation,
        user_id: entity.id,
        data: currentOperation.operation === 'update' ? {
          username: entity.username,
          email: entity.email,
          full_name: entity.full_name,
          is_active: entity.is_active
        } : undefined
      })
      setShowUserSelect(false)
    } else {
      setCurrentOperation({
        ...currentOperation,
        product_id: entity.id,
        data: currentOperation.operation === 'update' ? {
          name: entity.name,
          description: entity.description,
          price: entity.price,
          category: entity.category,
          stock_quantity: entity.stock_quantity
        } : undefined
      })
      setShowProductSelect(false)
    }
  }

  const getFilteredEntities = () => {
    const entities = currentOperation.type === 'user' ? users : products
    if (!searchTerm) return entities
    
    return entities.filter(entity => {
      if (currentOperation.type === 'user') {
        const user = entity as UserType
        return user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
               user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
               user.full_name.toLowerCase().includes(searchTerm.toLowerCase())
      } else {
        const product = entity as ProductType
        return product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
               product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
               (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
      }
    })
  }

  const handleAddOperation = () => {
    setOperations([...operations, { ...currentOperation }])
    setCurrentOperation({
      type: 'user',
      operation: 'create',
      data: {}
    })
  }

  const handleRemoveOperation = (index: number) => {
    setOperations(operations.filter((_, i) => i !== index))
  }

  const handleExecuteOperations = async () => {
    if (operations.length === 0) return

    setLoading(true)
    try {
      await apiService.executeTransactionOperations(transactionId, operations)
      // Complete the transaction right after successful execution
      await apiService.completeTransaction(transactionId)
      setOperations([])
      onOperationsExecuted()
      onClose()
    } catch (error) {
      console.error('Failed to execute operations:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateCurrentOperationData = (field: string, value: any) => {
    setCurrentOperation({
      ...currentOperation,
      data: {
        ...currentOperation.data,
        [field]: value
      }
    })
  }

  const getOperationFields = () => {
    if (currentOperation.type === 'user') {
      if (currentOperation.operation === 'create') {
        return (
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Username"
              value={currentOperation.data?.username || ''}
              onChange={(e) => updateCurrentOperationData('username', e.target.value)}
              className="input-field"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={currentOperation.data?.email || ''}
              onChange={(e) => updateCurrentOperationData('email', e.target.value)}
              className="input-field"
              required
            />
            <input
              type="text"
              placeholder="Full Name"
              value={currentOperation.data?.full_name || ''}
              onChange={(e) => updateCurrentOperationData('full_name', e.target.value)}
              className="input-field"
              required
            />
            <select
              value={currentOperation.data?.is_active !== false}
              onChange={(e) => updateCurrentOperationData('is_active', e.target.value === 'true')}
              className="input-field"
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        )
      } else if (currentOperation.operation === 'update') {
        const selectedUser = users.find(user => user.id === currentOperation.user_id)
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select User to Update</label>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowUserSelect(true)}
                  className="flex-1 input-field text-left bg-white"
                >
                  {selectedUser ? `${selectedUser.username} (${selectedUser.email})` : 'Select a user...'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentOperation({ ...currentOperation, user_id: undefined, data: undefined })
                  }}
                  className="btn-secondary px-3"
                >
                  Clear
                </button>
              </div>
            </div>
            {selectedUser && (
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Username"
                  value={currentOperation.data?.username || selectedUser.username}
                  onChange={(e) => updateCurrentOperationData('username', e.target.value)}
                  className="input-field"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={currentOperation.data?.email || selectedUser.email}
                  onChange={(e) => updateCurrentOperationData('email', e.target.value)}
                  className="input-field"
                />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={currentOperation.data?.full_name || selectedUser.full_name}
                  onChange={(e) => updateCurrentOperationData('full_name', e.target.value)}
                  className="input-field"
                />
                <select
                  value={currentOperation.data?.is_active !== undefined ? currentOperation.data.is_active : selectedUser.is_active}
                  onChange={(e) => updateCurrentOperationData('is_active', e.target.value === 'true')}
                  className="input-field"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            )}
          </div>
        )
      } else {
        const selectedUser = users.find(user => user.id === currentOperation.user_id)
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select User to Delete</label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setShowUserSelect(true)}
                className="flex-1 input-field text-left bg-white"
              >
                {selectedUser ? `${selectedUser.username} (${selectedUser.email})` : 'Select a user...'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentOperation({ ...currentOperation, user_id: undefined })
                }}
                className="btn-secondary px-3"
              >
                Clear
              </button>
            </div>
            {selectedUser && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Warning:</strong> This will delete user "{selectedUser.full_name}" ({selectedUser.email})
                </p>
              </div>
            )}
          </div>
        )
      }
    } else {
      if (currentOperation.operation === 'create') {
        return (
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Name"
              value={currentOperation.data?.name || ''}
              onChange={(e) => updateCurrentOperationData('name', e.target.value)}
              className="input-field"
              required
            />
            <input
              type="text"
              placeholder="Category"
              value={currentOperation.data?.category || ''}
              onChange={(e) => updateCurrentOperationData('category', e.target.value)}
              className="input-field"
              required
            />
            <input
              type="number"
              step="0.01"
              placeholder="Price"
              value={currentOperation.data?.price || ''}
              onChange={(e) => updateCurrentOperationData('price', parseFloat(e.target.value))}
              className="input-field"
              required
            />
            <input
              type="number"
              placeholder="Stock Quantity"
              value={currentOperation.data?.stock_quantity || ''}
              onChange={(e) => updateCurrentOperationData('stock_quantity', parseInt(e.target.value))}
              className="input-field"
              required
            />
            <textarea
              placeholder="Description"
              value={currentOperation.data?.description || ''}
              onChange={(e) => updateCurrentOperationData('description', e.target.value)}
              className="input-field col-span-2"
              rows={3}
            />
          </div>
        )
      } else if (currentOperation.operation === 'update') {
        const selectedProduct = products.find(product => product.id === currentOperation.product_id)
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Product to Update</label>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowProductSelect(true)}
                  className="flex-1 input-field text-left bg-white"
                >
                  {selectedProduct ? `${selectedProduct.name} (${selectedProduct.category})` : 'Select a product...'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentOperation({ ...currentOperation, product_id: undefined, data: undefined })
                  }}
                  className="btn-secondary px-3"
                >
                  Clear
                </button>
              </div>
            </div>
            {selectedProduct && (
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Name"
                  value={currentOperation.data?.name || selectedProduct.name}
                  onChange={(e) => updateCurrentOperationData('name', e.target.value)}
                  className="input-field"
                />
                <input
                  type="text"
                  placeholder="Category"
                  value={currentOperation.data?.category || selectedProduct.category}
                  onChange={(e) => updateCurrentOperationData('category', e.target.value)}
                  className="input-field"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Price"
                  value={currentOperation.data?.price || selectedProduct.price}
                  onChange={(e) => updateCurrentOperationData('price', parseFloat(e.target.value))}
                  className="input-field"
                />
                <input
                  type="number"
                  placeholder="Stock Quantity"
                  value={currentOperation.data?.stock_quantity || selectedProduct.stock_quantity}
                  onChange={(e) => updateCurrentOperationData('stock_quantity', parseInt(e.target.value))}
                  className="input-field"
                />
                <textarea
                  placeholder="Description"
                  value={currentOperation.data?.description || selectedProduct.description || ''}
                  onChange={(e) => updateCurrentOperationData('description', e.target.value)}
                  className="input-field col-span-2"
                  rows={3}
                />
              </div>
            )}
          </div>
        )
      } else {
        const selectedProduct = products.find(product => product.id === currentOperation.product_id)
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Product to Delete</label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setShowProductSelect(true)}
                className="flex-1 input-field text-left bg-white"
              >
                {selectedProduct ? `${selectedProduct.name} (${selectedProduct.category})` : 'Select a product...'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentOperation({ ...currentOperation, product_id: undefined })
                }}
                className="btn-secondary px-3"
              >
                Clear
              </button>
            </div>
            {selectedProduct && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Warning:</strong> This will delete product "{selectedProduct.name}" (Category: {selectedProduct.category})
                </p>
              </div>
            )}
          </div>
        )
      }
    }
  }

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'create':
        return <Plus className="h-4 w-4 text-success-500" />
      case 'update':
        return <Edit className="h-4 w-4 text-warning-500" />
      case 'delete':
        return <Trash2 className="h-4 w-4 text-danger-500" />
      default:
        return <Plus className="h-4 w-4" />
    }
  }

  if (!inline && !isOpen) return null

  const Content = (
    <div className="p-6 border w-full shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Transaction Operations</h3>
          {!inline && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          )}
        </div>

        {/* Current Operations List */}
        {operations.length > 0 && (
          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-900 mb-3">Operations to Execute</h4>
            <div className="space-y-2">
              {operations.map((op, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {op.type === 'user' ? <User className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                    {getOperationIcon(op.operation)}
                    <span className="font-medium">
                      {op.operation.charAt(0).toUpperCase() + op.operation.slice(1)} {op.type}
                    </span>
                    {op.user_id && <span className="text-sm text-gray-500">(ID: {op.user_id})</span>}
                    {op.product_id && <span className="text-sm text-gray-500">(ID: {op.product_id})</span>}
                  </div>
                  <button
                    onClick={() => handleRemoveOperation(index)}
                    className="text-danger-600 hover:text-danger-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add New Operation */}
        <div className="mb-6">
          <h4 className="text-lg font-medium text-gray-900 mb-3">Add Operation</h4>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <select
                value={currentOperation.type}
                onChange={(e) => setCurrentOperation({ ...currentOperation, type: e.target.value as 'user' | 'product' })}
                className="input-field"
              >
                <option value="user">User</option>
                <option value="product">Product</option>
              </select>
              <select
                value={currentOperation.operation}
                onChange={(e) => setCurrentOperation({ ...currentOperation, operation: e.target.value as 'create' | 'update' | 'delete' })}
                className="input-field"
              >
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
              </select>
              <button
                onClick={handleAddOperation}
                className="btn-primary"
              >
                Add Operation
              </button>
            </div>
            <div className="mt-4">
              {getOperationFields()}
            </div>
          </div>
        </div>

        {/* Execute Operations */}
        <div className="flex justify-end space-x-3">
          {!inline && (
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleExecuteOperations}
            disabled={operations.length === 0 || loading}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? 'Executing...' : `Execute ${operations.length} Operation${operations.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      
      {/* User Selection Modal */}
      {showUserSelect && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[60]">
          <div className="relative top-20 mx-auto p-6 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Select User</h3>
              <button onClick={() => setShowUserSelect(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto">
              {getFilteredEntities().map((user: any) => (
                <div
                  key={user.id}
                  onClick={() => handleSelectEntity(user, 'user')}
                  className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                >
                  <div className="font-medium">{user.full_name}</div>
                  <div className="text-sm text-gray-600">{user.username} • {user.email}</div>
                  <div className="text-xs text-gray-500">
                    {user.is_active ? 'Active' : 'Inactive'} • Created: {new Date(user.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Product Selection Modal */}
      {showProductSelect && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[60]">
          <div className="relative top-20 mx-auto p-6 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Select Product</h3>
              <button onClick={() => setShowProductSelect(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto">
              {getFilteredEntities().map((product: any) => (
                <div
                  key={product.id}
                  onClick={() => handleSelectEntity(product, 'product')}
                  className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                >
                  <div className="font-medium">{product.name}</div>
                  <div className="text-sm text-gray-600">{product.category} • ${product.price}</div>
                  <div className="text-xs text-gray-500">
                    Stock: {product.stock_quantity} • Created: {new Date(product.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )

  if (inline) {
    return Content
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto w-11/12 max-w-4xl">
        {Content}
      </div>
    </div>
  )
}
