import { useState, useEffect } from 'react'
import { Activity, Calendar, Filter, AlertTriangle, Plus, Edit, Trash2 } from 'lucide-react'
import { apiService, AuditLog } from '../services/api'

export default function AuditLogs() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState(7)
  const [limit, setLimit] = useState(50)

  useEffect(() => {
    fetchAuditLogs()
  }, [days, limit])

  const fetchAuditLogs = async () => {
    try {
      setLoading(true)
      const response = await apiService.getRecentAuditLogs(limit, days)
      setAuditLogs(response.data.audit_logs)
    } catch (err) {
      setError('Failed to load audit logs')
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
        return <Activity className="h-4 w-4 text-gray-500" />
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-gray-600">Recent audit activities and changes</p>
      </div>

      {error && (
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-danger-400" />
            <p className="ml-3 text-sm text-danger-700">{error}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Time period:</span>
            <select
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="input-field max-w-xs"
            >
              <option value={1}>Last 24 hours</option>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Limit:</span>
            <select
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value))}
              className="input-field max-w-xs"
            >
              <option value={25}>25 records</option>
              <option value={50}>50 records</option>
              <option value={100}>100 records</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Logs List */}
      <div className="card">
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
                  Transaction ID
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
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No audit logs found for the selected time period.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{log.entity_type}</div>
                        <div className="text-sm text-gray-500">ID: {log.entity_id}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getChangeTypeIcon(log.change_type)}
                        <span className="ml-2">{getChangeTypeBadge(log.change_type)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-900">
                        {log.transaction_id.slice(0, 8)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.author || 'System'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(log.commit_date).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Activity className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Logs</p>
              <p className="text-2xl font-bold text-gray-900">{auditLogs.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Plus className="h-8 w-8 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Created</p>
              <p className="text-2xl font-bold text-gray-900">
                {auditLogs.filter(log => log.change_type === 'CREATED').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Edit className="h-8 w-8 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Updated</p>
              <p className="text-2xl font-bold text-gray-900">
                {auditLogs.filter(log => log.change_type === 'UPDATED').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Trash2 className="h-8 w-8 text-danger-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Deleted</p>
              <p className="text-2xl font-bold text-gray-900">
                {auditLogs.filter(log => log.change_type === 'DELETED').length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
