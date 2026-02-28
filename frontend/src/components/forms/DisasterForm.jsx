import React, { useState } from 'react'
import { createDisaster } from '../../api/disasters'

export default function DisasterForm({ onSubmitted }) {
  const [form, setForm] = useState({ type: '', description: '', image: null, location: null })
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    const { name, value, files } = e.target
    if (name === 'image') return setForm(f => ({ ...f, image: files[0] }))
    setForm(f => ({ ...f, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    const location = form.location || { lat: 24.86, lng: 67.01 }
    const payload = { ...form, location }
    await createDisaster(payload)
    setLoading(false)
    onSubmitted && onSubmitted()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-white p-4 rounded shadow">
      <div>
        <label className="block text-sm">Type</label>
        <input name="type" value={form.type} onChange={handleChange} className="w-full border rounded p-2" required />
      </div>
      <div>
        <label className="block text-sm">Description</label>
        <textarea name="description" value={form.description} onChange={handleChange} className="w-full border rounded p-2" required />
      </div>
      <div>
        <label className="block text-sm">Upload Image</label>
        <input type="file" name="image" onChange={handleChange} />
      </div>
      <div>
        <button className="px-4 py-2 bg-brand-600 text-white rounded">{loading ? 'Submitting...' : 'Submit'}</button>
      </div>
    </form>
  )
}
