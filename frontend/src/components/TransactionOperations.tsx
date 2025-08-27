import { useState } from 'react'
import { X, Plus, User, Package, Edit, Trash2 } from 'lucide-react'
import { apiService } from '../services/api'

interface TransactionOperationsProps {
  transactionId: string
  isOpen: boolean
  onClose: () => void
  onOperationsExecuted: () => void
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
  onOperationsExecuted
}: TransactionOperationsProps) {
  const [operations, setOperations] = useState<Operation[]>([])
  const [currentOperation, setCurrentOperation] = useState<Operation>({
    type: 'user',
    operation: 'create',
    data: {}
  })
  const [loading, setLoading] = useState(false)

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
            />
            <input
              type="email"
              placeholder="Email"
              value={currentOperation.data?.email || ''}
              onChange={(e) => updateCurrentOperationData('email', e.target.value)}
              className="input-field"
            />
            <input
              type="text"
              placeholder="Full Name"
              value={currentOperation.data?.full_name || ''}
              onChange={(e) => updateCurrentOperationData('full_name', e.target.value)}
              className="input-field"
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
        return (
          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              placeholder="User ID"
              value={currentOperation.user_id || ''}
              onChange={(e) => setCurrentOperation({ ...currentOperation, user_id: parseInt(e.target.value) })}
              className="input-field"
            />
            <input
              type="text"
              placeholder="Username"
              value={currentOperation.data?.username || ''}
              onChange={(e) => updateCurrentOperationData('username', e.target.value)}
              className="input-field"
            />
            <input
              type="email"
              placeholder="Email"
              value={currentOperation.data?.email || ''}
              onChange={(e) => updateCurrentOperationData('email', e.target.value)}
              className="input-field"
            />
            <input
              type="text"
              placeholder="Full Name"
              value={currentOperation.data?.full_name || ''}
              onChange={(e) => updateCurrentOperationData('full_name', e.target.value)}
              className="input-field"
            />
          </div>
        )
      } else {
        return (
          <input
            type="number"
            placeholder="User ID"
            value={currentOperation.user_id || ''}
            onChange={(e) => setCurrentOperation({ ...currentOperation, user_id: parseInt(e.target.value) })}
            className="input-field"
          />
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
            />
            <input
              type="text"
              placeholder="Category"
              value={currentOperation.data?.category || ''}
              onChange={(e) => updateCurrentOperationData('category', e.target.value)}
              className="input-field"
            />
            <input
              type="number"
              placeholder="Price"
              value={currentOperation.data?.price || ''}
              onChange={(e) => updateCurrentOperationData('price', parseFloat(e.target.value))}
              className="input-field"
            />
            <input
              type="number"
              placeholder="Stock Quantity"
              value={currentOperation.data?.stock_quantity || ''}
              onChange={(e) => updateCurrentOperationData('stock_quantity', parseInt(e.target.value))}
              className="input-field"
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
        return (
          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              placeholder="Product ID"
              value={currentOperation.product_id || ''}
              onChange={(e) => setCurrentOperation({ ...currentOperation, product_id: parseInt(e.target.value) })}
              className="input-field"
            />
            <input
              type="text"
              placeholder="Name"
              value={currentOperation.data?.name || ''}
              onChange={(e) => updateCurrentOperationData('name', e.target.value)}
              className="input-field"
            />
            <input
              type="text"
              placeholder="Category"
              value={currentOperation.data?.category || ''}
              onChange={(e) => updateCurrentOperationData('category', e.target.value)}
              className="input-field"
            />
            <input
              type="number"
              placeholder="Price"
              value={currentOperation.data?.price || ''}
              onChange={(e) => updateCurrentOperationData('price', parseFloat(e.target.value))}
              className="input-field"
            />
          </div>
        )
      } else {
        return (
          <input
            type="number"
            placeholder="Product ID"
            value={currentOperation.product_id || ''}
            onChange={(e) => setCurrentOperation({ ...currentOperation, product_id: parseInt(e.target.value) })}
            className="input-field"
          />
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-6 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Transaction Operations</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
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
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleExecuteOperations}
            disabled={operations.length === 0 || loading}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? 'Executing...' : `Execute ${operations.length} Operation${operations.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}
