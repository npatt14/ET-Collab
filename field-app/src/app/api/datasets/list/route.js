import { readdir } from 'fs/promises'
import path from 'path'

const uploadDir = path.join(process.cwd(), 'uploads')

export async function GET() {
  try {
    const files = await readdir(uploadDir)
    return new Response(JSON.stringify({ files }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to list files' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
