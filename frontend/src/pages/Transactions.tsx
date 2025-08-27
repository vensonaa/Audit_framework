import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Eye, CheckCircle, Clock, AlertTriangle, Settings } from 'lucide-react'
import { apiService, Transaction } from '../services/api'
import TransactionOperations from '../components/TransactionOperations'

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showOperationsModal, setShowOperationsModal] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [newTransaction, setNewTransaction] = useState({ description: '', user_id: '' })

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const response = await apiService.getTransactions()
      setTransactions(response.data)
    } catch (err) {
      setError('Failed to load transactions')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await apiService.createTransaction({
        description: newTransaction.description,
        user_id: newTransaction.user_id ? parseInt(newTransaction.user_id) : undefined
      })
      setTransactions([response.data, ...transactions])
      setShowCreateModal(false)
      setNewTransaction({ description: '', user_id: '' })
    } catch (err) {
      console.error('Failed to create transaction:', err)
    }
  }

  const handleCompleteTransaction = async (transactionId: string) => {
    try {
      await apiService.completeTransaction(transactionId)
      fetchTransactions() // Refresh the list
    } catch (err) {
      console.error('Failed to complete transaction:', err)
    }
  }

  const handleOpenOperations = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setShowOperationsModal(true)
  }

  const handleOperationsExecuted = () => {
    fetchTransactions() // Refresh the list
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-success-500" />
      case 'pending':
        return <Clock className="h-5 w-5 text-warning-500" />
      default:
        return <AlertTriangle className="h-5 w-5 text-danger-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="badge badge-success">Completed</span>
      case 'pending':
        return <span className="badge badge-warning">Pending</span>
      default:
        return <span className="badge badge-danger">Failed</span>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600">Manage and monitor transaction boundaries</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Transaction
        </button>
      </div>

      {error && (
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-danger-400" />
            <p className="ml-3 text-sm text-danger-700">{error}</p>
          </div>
        </div>
      )}

      {/* Transactions List */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {transaction.transaction_id.slice(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(transaction.status)}
                      <span className="ml-2">{getStatusBadge(transaction.status)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(transaction.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Link
                        to={`/transactions/${transaction.transaction_id}`}
                        className="text-primary-600 hover:text-primary-900 flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Link>
                      {transaction.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleOpenOperations(transaction)}
                            className="text-warning-600 hover:text-warning-900 flex items-center"
                          >
                            <Settings className="h-4 w-4 mr-1" />
                            Operations
                          </button>
                          <button
                            onClick={() => handleCompleteTransaction(transaction.transaction_id)}
                            className="text-success-600 hover:text-success-900 flex items-center"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Complete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Transaction Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Transaction</h3>
              <form onSubmit={handleCreateTransaction} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    required
                    value={newTransaction.description}
                    onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                    className="input-field"
                    placeholder="Enter transaction description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    User ID (Optional)
                  </label>
                  <input
                    type="number"
                    value={newTransaction.user_id}
                    onChange={(e) => setNewTransaction({ ...newTransaction, user_id: e.target.value })}
                    className="input-field"
                    placeholder="Enter user ID"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Operations Modal */}
      {selectedTransaction && showOperationsModal && (
        <TransactionOperations
          transactionId={selectedTransaction.transaction_id}
          isOpen={showOperationsModal}
          onClose={() => {
            setShowOperationsModal(false)
            setSelectedTransaction(null)
          }}
          onOperationsExecuted={handleOperationsExecuted}
        />
      )}
    </div>
  )
}
