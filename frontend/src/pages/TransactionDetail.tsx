import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Minus, Edit, Trash2, AlertTriangle } from 'lucide-react'
import { apiService } from '../services/api'

interface TransactionAudit {
  transaction_id: string
  javers_changes: any[]
  audit_logs: any[]
}

export default function TransactionDetail() {
  const { id } = useParams<{ id: string }>()
  const [auditData, setAuditData] = useState<TransactionAudit | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const renderValueChanges = (oldValues: any, newValues: any, changedFields: string[]) => {
    if (!oldValues && !newValues) return null

    return (
      <div className="space-y-2">
        {changedFields?.map((field) => (
          <div key={field} className="flex items-center space-x-2 text-sm">
            <span className="font-medium text-gray-700">{field}:</span>
            {oldValues?.[field] !== undefined && (
              <span className="text-danger-600 line-through">{String(oldValues[field])}</span>
            )}
            {oldValues?.[field] !== undefined && newValues?.[field] !== undefined && (
              <ArrowLeft className="h-3 w-3 text-gray-400" />
            )}
            {newValues?.[field] !== undefined && (
              <span className="text-success-600 font-medium">{String(newValues[field])}</span>
            )}
          </div>
        ))}
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
      <div className="flex items-center space-x-4">
        <Link
          to="/transactions"
          className="text-primary-600 hover:text-primary-900 flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Transactions
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transaction Audit</h1>
        <p className="text-gray-600">Detailed audit information for transaction</p>
        <p className="text-sm font-mono text-gray-500 mt-1">{auditData.transaction_id}</p>
      </div>

      {/* Javers Changes */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Javers Changes</h2>
        {auditData.javers_changes.length === 0 ? (
          <p className="text-gray-500">No Javers changes found for this transaction.</p>
        ) : (
          <div className="space-y-4">
            {auditData.javers_changes.map((change, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getChangeTypeIcon(change.change_type)}
                    <span className="font-medium text-gray-900">
                      {change.entity_type} - {change.entity_id}
                    </span>
                    {getChangeTypeBadge(change.change_type)}
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(change.commit_date).toLocaleString()}
                  </span>
                </div>
                
                {change.old_values && change.new_values && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Value Changes:</h4>
                    {renderValueChanges(change.old_values, change.new_values, change.changed_fields)}
                  </div>
                )}
                
                {change.author && (
                  <div className="mt-2 text-sm text-gray-500">
                    Author: {change.author}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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
                    Change Type
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Changes</h3>
          <p className="text-2xl font-bold text-gray-900">
            {auditData.javers_changes.length + auditData.audit_logs.length}
          </p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Javers Changes</h3>
          <p className="text-2xl font-bold text-gray-900">{auditData.javers_changes.length}</p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Audit Logs</h3>
          <p className="text-2xl font-bold text-gray-900">{auditData.audit_logs.length}</p>
        </div>
      </div>
    </div>
  )
}
