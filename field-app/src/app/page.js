'use client'

import { useState, useEffect } from 'react'

export default function Home() {
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [file, setFile] = useState(null)
  const [uploadStatus, setUploadStatus] = useState('')
  const [files, setFiles] = useState([])

  useEffect(() => {
    fetchFiles()
  }, [])

  const fetchFiles = async () => {
    const res = await fetch('/api/datasets/list')
    const data = await res.json()
    setFiles(data.files || [])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name || !date || !file) return alert('All fields are required.')

    const formData = new FormData()
    formData.append('name', name)
    formData.append('date', date)
    formData.append('file', file)

    const res = await fetch('/api/datasets', {
      method: 'POST',
      body: formData,
    })
    if (res.ok) {
      setUploadStatus('Upload successful!')
      setName('')
      setDate('')
      setFile(null)
      fetchFiles()
    } else {
      setUploadStatus('Upload failed.')
    }
  }

  return (
    <main className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Upload Dataset</h1>
      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <input
          className="w-full border p-2"
          type="text"
          placeholder="Dataset name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="w-full border p-2"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <input
          className="w-full border p-2"
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <button className="bg-blue-600 text-white px-4 py-2 rounded" type="submit">
          Upload
        </button>
        <p className="text-green-600">{uploadStatus}</p>
      </form>

      <h2 className="text-xl font-semibold mb-2">Available Files</h2>
      {files.length === 0 ? (
        <p>No files found.</p>
      ) : (
        <ul className="space-y-2">
          {files.map((filename) => (
            <li key={filename} className="flex justify-between items-center border p-2 rounded">
              <span>{filename}</span>
              <a
                href={`/api/datasets/${filename}`}
                className="text-blue-600 underline"
                download
              >
                Download
              </a>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
