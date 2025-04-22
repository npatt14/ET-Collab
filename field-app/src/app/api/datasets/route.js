/**
 * Main API endpoints for handling all dataset operations.
 * POST: Receives datasets with metadata and stores them.
 * GET: Retrieves all datasets or a specific dataset with ID as query parameter.
 * DELETE: Removes a dataset from the system using ID as query parameter.
 */


import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

const uploadDir = path.join(process.cwd(), 'uploads')

export async function POST(req) {
  const formData = await req.formData()

  const name = formData.get('name')
  const date = formData.get('date')
  const file = formData.get('file')

  if (!name || !date || !file) {
    return new Response(JSON.stringify({ error: 'Missing fields' }), {
      status: 400,
    })
  }

  await mkdir(uploadDir, { recursive: true })

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const filename = `${name}-${date}`.replaceAll(' ', '_')
  const filepath = path.join(uploadDir, filename)

  await writeFile(filepath, buffer)

  return new Response(JSON.stringify({ message: 'Upload successful', filename }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}


export async function GET(req, { params }) {
    const { filename } = params
    const filePath = path.join(uploadDir, filename)
  
    try {
      const buffer = await readFile(filePath)
  
      return new Response(buffer, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    } catch (err) {
      return new Response(JSON.stringify({ error: 'File not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }