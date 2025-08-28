import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Minus, Edit, Trash2, AlertTriangle } from 'lucide-react'
import { apiService } from '../services/api'

interface TransactionAudit {
  transaction_id: string
  javers_changes: any[]
  audit_logs: any[]
}

export default function TransactionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [auditData, setAuditData] = useState<TransactionAudit | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    if (id) {
      fetchTransactionAudit(id)
    }
  }, [id])

  const fetchTransactionAudit = async (transactionId: string) => {
    try {
      setLoading(true)
      const response = await apiService.getTransactionAudit(transactionId)
      setAuditData(response.data)
    } catch (err) {
      setError('Failed to load transaction audit data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getChangeTypeIcon = (changeType: string) => {
    switch (changeType) {
      case 'CREATED':
        return <Plus className="h-4 w-4 text-success-500" />
      case 'UPDATED':
        return <Edit className="h-4 w-4 text-warning-500" />
      case 'DELETED':
        return <Trash2 className="h-4 w-4 text-danger-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  const getChangeTypeBadge = (changeType: string) => {
    switch (changeType) {
      case 'CREATED':
        return <span className="badge badge-success">Created</span>
      case 'UPDATED':
        return <span className="badge badge-warning">Updated</span>
      case 'DELETED':
        return <span className="badge badge-danger">Deleted</span>
      default:
        return <span className="badge badge-info">{changeType}</span>
    }
  }

  const handleDeleteTransaction = async () => {
    if (!id) return

    try {
      await apiService.deleteTransaction(id)
      navigate('/transactions')
    } catch (err) {
      console.error('Failed to delete transaction:', err)
    }
  }

  const renderValueChanges = (oldValues: any, newValues: any, changedFields: string[], changeType: string) => {
    // For CREATE operations, show all new values
    if (changeType === 'CREATED') {
      if (!newValues || typeof newValues !== 'object') {
        return <div className="text-sm text-gray-500 italic">No data available</div>
      }
      return (
        <div className="space-y-2">
          <div className="text-sm font-medium text-success-700 mb-2">New Entity Created:</div>
          {Object.entries(newValues).map(([field, value]) => (
            <div key={field} className="flex items-center space-x-2 text-sm">
              <span className="font-medium text-gray-700 capitalize">{field.replace(/_/g, ' ')}:</span>
              <span className="text-success-600 font-medium">{String(value)}</span>
            </div>
          ))}
        </div>
      )
    }

    // For DELETE operations, show all deleted values
    if (changeType === 'DELETED') {
      // For delete operations, the deleted data is in newValues
      const deletedData = newValues || oldValues
      if (!deletedData || typeof deletedData !== 'object') {
        return <div className="text-sm text-gray-500 italic">No data available</div>
      }
      return (
        <div className="space-y-2">
          <div className="text-sm font-medium text-danger-700 mb-2">Entity Deleted:</div>
          {Object.entries(deletedData).map(([field, value]) => (
            <div key={field} className="flex items-center space-x-2 text-sm">
              <span className="font-medium text-gray-700 capitalize">{field.replace(/_/g, ' ')}:</span>
              <span className="text-danger-600 line-through">{String(value)}</span>
            </div>
          ))}
        </div>
      )
    }

    // For UPDATE operations, show all fields with highlighted changes
    if (changeType === 'UPDATED') {
      if (!newValues || typeof newValues !== 'object') {
        return <div className="text-sm text-gray-500 italic">No data available</div>
      }

      const actualChangedFields = changedFields || Object.keys(newValues).filter(key => 
        oldValues?.[key] !== newValues?.[key]
      )

      return (
        <div className="space-y-2">
          <div className="text-sm font-medium text-warning-700 mb-2">Entity Updated:</div>
          {Object.entries(newValues).map(([field, value]) => {
            const isChanged = actualChangedFields.includes(field)
            return (
              <div key={field} className={`flex items-center space-x-2 text-sm ${isChanged ? 'bg-warning-50 p-2 rounded border border-warning-200' : ''}`}>
                <span className={`font-medium capitalize ${isChanged ? 'text-warning-700' : 'text-gray-700'}`}>
                  {field.replace(/_/g, ' ')}:
                </span>
                {isChanged && oldValues?.[field] !== undefined && (
                  <span className="text-danger-600 line-through">{String(oldValues[field])}</span>
                )}
                {isChanged && oldValues?.[field] !== undefined && newValues?.[field] !== undefined && (
                  <ArrowLeft className="h-3 w-3 text-warning-500" />
                )}
                <span className={`${isChanged ? 'text-success-600 font-medium' : 'text-gray-600'}`}>
                  {String(value)}
                </span>
              </div>
            )
          })}
        </div>
      )
    }

    // Default case for unknown change types
    return (
      <div className="text-sm text-gray-500 italic">
        Unknown change type: {changeType}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-danger-500 mx-auto mb-4" />
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!auditData) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/transactions"
          className="text-primary-600 hover:text-primary-900 flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Transactions
        </Link>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="btn-danger flex items-center"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Transaction
        </button>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transaction Audit</h1>
        <p className="text-gray-600">Detailed audit information for transaction</p>
        <p className="text-sm font-mono text-gray-500 mt-1">{auditData.transaction_id}</p>
      </div>



      {/* Audit Logs */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Audit Logs</h2>
        {auditData.audit_logs.length === 0 ? (
          <p className="text-gray-500">No audit logs found for this transaction.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Operation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Author
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {auditData.audit_logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{log.entity_type}</div>
                        <div className="text-gray-500">ID: {log.entity_id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getChangeTypeIcon(log.change_type)}
                        <span className="ml-2">{getChangeTypeBadge(log.change_type)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {renderValueChanges(log.old_values, log.new_values, log.changed_fields, log.change_type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.author || 'System'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(log.commit_date).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Operations</h3>
          <p className="text-2xl font-bold text-gray-900">
            {auditData.audit_logs.length}
          </p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Created</h3>
          <p className="text-2xl font-bold text-success-600">
            {auditData.audit_logs.filter(c => c.change_type === 'CREATED').length}
          </p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Updated</h3>
          <p className="text-2xl font-bold text-warning-600">
            {auditData.audit_logs.filter(c => c.change_type === 'UPDATED').length}
          </p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Deleted</h3>
          <p className="text-2xl font-bold text-danger-600">
            {auditData.audit_logs.filter(c => c.change_type === 'DELETED').length}
          </p>
        </div>
      </div>

      {/* Operation Breakdown */}
      {auditData.audit_logs.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Operation Breakdown</h3>
          <div className="space-y-3">
            {auditData.audit_logs.map((change, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getChangeTypeIcon(change.change_type)}
                  <div>
                    <div className="font-medium text-gray-900">
                      {change.change_type} {change.entity_type}
                    </div>
                    <div className="text-sm text-gray-600">
                      ID: {change.entity_id} • {new Date(change.commit_date).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {change.author || 'System'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {change.change_type === 'CREATED' && 'New entity added'}
                    {change.change_type === 'UPDATED' && 'Entity modified'}
                    {change.change_type === 'DELETED' && 'Entity removed'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Transaction Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-danger-100 rounded-full">
                <Trash2 className="h-6 w-6 text-danger-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">Delete Transaction</h3>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to delete this transaction and all its audit data?
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Transaction ID: {id}
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTransaction}
                  className="btn-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
