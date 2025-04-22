import { readFile } from 'fs/promises'
import path from 'path'

const uploadDir = path.join(process.cwd(), 'uploads')

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
