'use client'
import { useState, useEffect, useRef } from 'react'
import { Upload, UserMinus, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'

type Employee = { id: string; empIdHash: string; status: string; enrolledAt: string }
type UploadResult = { ok: boolean; added: number; skipped: number; errors: number; totalActive: number; errorDetails?: string[] }

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [totalActive, setTotalActive] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [uploadError, setUploadError] = useState('')
  const [mode, setMode] = useState<'add' | 'replace'>('add')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadEmployees() }, [])

  async function loadEmployees() {
    const res = await fetch('/api/employees')
    const data = await res.json()
    setEmployees(data.employees || [])
    setTotalActive(data.totalActive || 0)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadResult(null)
    setUploadError('')
    const fd = new FormData()
    fd.append('file', file)
    fd.append('mode', mode)
    const res = await fetch('/api/employees/upload', { method: 'POST', body: fd })
    const data = await res.json()
    if (!res.ok) { setUploadError(data.error || 'Upload failed'); setUploading(false); return }
    setUploadResult(data)
    setUploading(false)
    loadEmployees()
    if (fileRef.current) fileRef.current.value = ''
  }

  async function removeEmployee(id: string) {
    await fetch(`/api/employees/${id}`, { method: 'DELETE' })
    loadEmployees()
  }

  const shortHash = (h: string) => h.slice(0, 8) + '…'

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 500, margin: 0 }}>Employees</h1>
        <p style={{ color: '#888', fontSize: 13, margin: '4px 0 0' }}>
          Manage who receives benefits. No email or personal data is shared with talabat.
        </p>
      </div>

      {/* Upload box */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 500, margin: '0 0 12px' }}>Upload employee list</h2>
        <div style={{ background: '#F7F6F3', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#5f5e5a' }}>
          <strong style={{ display: 'block', marginBottom: 4 }}>Privacy-first upload</strong>
          Upload a CSV with one employee ID per row. talabat stores only a one-way hash — your employee IDs are never readable or reversible.
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label className="form-label">Upload mode</label>
            <select className="form-input" style={{ width: 'auto', minWidth: 180 }} value={mode} onChange={e => setMode(e.target.value as 'add' | 'replace')}>
              <option value="add">Add to existing list</option>
              <option value="replace">Replace entire list</option>
            </select>
          </div>
          <div>
            <input ref={fileRef} type="file" accept=".csv,.txt" id="csv-upload" style={{ display: 'none' }} onChange={handleUpload} />
            <label htmlFor="csv-upload">
              <button className="btn-tlb" onClick={() => fileRef.current?.click()} disabled={uploading} type="button">
                <Upload size={14} />
                {uploading ? 'Processing…' : 'Choose CSV file'}
              </button>
            </label>
          </div>
        </div>

        {uploadResult && (
          <div style={{ marginTop: 14, background: '#EAF3DE', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <CheckCircle size={16} color="#3B6D11" style={{ marginTop: 1, flexShrink: 0 }} />
            <div style={{ fontSize: 13, color: '#3B6D11' }}>
              Upload complete — {uploadResult.added} added, {uploadResult.skipped} already enrolled,
              {uploadResult.errors > 0 ? ` ${uploadResult.errors} errors.` : ' no errors.'}
              {' '}Total active: {uploadResult.totalActive.toLocaleString()}
            </div>
          </div>
        )}
        {uploadError && (
          <div style={{ marginTop: 14, background: '#FCEBEB', borderRadius: 8, padding: '10px 14px', display: 'flex', gap: 10 }}>
            <AlertCircle size={16} color="#A32D2D" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: '#A32D2D' }}>{uploadError}</span>
          </div>
        )}
      </div>

      {/* Employee list */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <span style={{ fontSize: 15, fontWeight: 500 }}>Active employees</span>
            <span style={{ fontSize: 13, color: '#888', marginLeft: 8 }}>{totalActive.toLocaleString()} total</span>
          </div>
          <button className="btn-secondary" onClick={loadEmployees} style={{ padding: '6px 12px', fontSize: 12 }}>
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
        {employees.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#aaa' }}>
            No employees yet. Upload a CSV to get started.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid #e0dfd7' }}>
                <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, color: '#888', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hash (first 8 chars)</th>
                <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, color: '#888', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, color: '#888', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Enrolled</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id} style={{ borderBottom: '0.5px solid #f0efe7' }}>
                  <td style={{ padding: '10px 10px', fontFamily: 'monospace', fontSize: 12, color: '#5f5e5a' }}>{shortHash(emp.empIdHash)}</td>
                  <td style={{ padding: '10px 10px' }}><span className={`badge badge-${emp.status}`}>{emp.status}</span></td>
                  <td style={{ padding: '10px 10px', color: '#888' }}>{new Date(emp.enrolledAt).toLocaleDateString()}</td>
                  <td style={{ padding: '10px 10px', textAlign: 'right' }}>
                    <button onClick={() => removeEmployee(emp.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A32D2D', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, marginLeft: 'auto' }}>
                      <UserMinus size={12} /> Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
