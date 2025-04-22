/**
 * Main API endpoints for handling all dataset operations.
 * POST: Receives datasets with metadata and stores them.
 * GET: Retrieves all datasets or a specific dataset with ID as query parameter.
 * DELETE: Removes a dataset from the system using ID as query parameter.
 */

import { writeFile, mkdir, readFile, readdir } from "fs/promises";
import path from "path";
import InducedPolarizationSurvey from "../../../data/InducedPolarizationSurvey";

const uploadDir = path.join(process.cwd(), "uploads");
const metadataDir = path.join(process.cwd(), "metadata");

// Helper to determine file format from extension
function getFormatFromFilename(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".csv") return "csv";
  if (ext === ".txt" || ext === ".dat") return "text"; // Treat .dat as text format
  return "binary"; // Default to binary for other formats
}

export async function POST(req) {
  const formData = await req.formData();

  const name = formData.get("name");
  const date = formData.get("date");
  const file = formData.get("file");

  if (!name || !date || !file) {
    return new Response(JSON.stringify({ error: "Missing fields" }), {
      status: 400,
    });
  }

  await mkdir(uploadDir, { recursive: true });
  await mkdir(metadataDir, { recursive: true });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const filename = `${name}-${date}`.replaceAll(" ", "_");
  const filepath = path.join(uploadDir, filename);

  await writeFile(filepath, buffer);

  // Process the file with InducedPolarizationSurvey
  try {
    const format = getFormatFromFilename(file.name);
    const survey = new InducedPolarizationSurvey(buffer, format);

    // Extract useful metadata
    const bounds = survey.getCoordinateBounds();
    const lines = survey.getLines();

    // Store metadata separately
    const metadata = {
      name,
      date,
      filename,
      format,
      bounds,
      lines,
      size: buffer.length,
      uploadTime: new Date().toISOString(),
    };

    await writeFile(
      path.join(metadataDir, `${filename}.json`),
      JSON.stringify(metadata, null, 2)
    );

    return new Response(
      JSON.stringify({
        message: "Upload successful",
        filename,
        metadata,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Failed to process dataset",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function GET(req) {
  // Get URL to extract search parameters
  const url = new URL(req.url);
  const filename = url.searchParams.get("id");

  // If no specific file requested, list all datasets
  if (!filename) {
    try {
      const files = await readdir(metadataDir);
      const metadataFiles = files.filter((file) => file.endsWith(".json"));

      const datasetsPromises = metadataFiles.map(async (file) => {
        const metadataContent = await readFile(
          path.join(metadataDir, file),
          "utf8"
        );
        return JSON.parse(metadataContent);
      });

      const datasets = await Promise.all(datasetsPromises);

      return new Response(JSON.stringify({ datasets }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: "Failed to list datasets" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  // Request for a specific file
  const filePath = path.join(uploadDir, filename);
  const metadataPath = path.join(metadataDir, `${filename}.json`);

  try {
    const buffer = await readFile(filePath);
    const metadataContent = await readFile(metadataPath, "utf8");
    const metadata = JSON.parse(metadataContent);

    // Process with InducedPolarizationSurvey if detailed data requested
    if (url.searchParams.get("processed") === "true") {
      const survey = new InducedPolarizationSurvey(buffer, metadata.format);
      return new Response(
        JSON.stringify({
          metadata,
          bounds: survey.getCoordinateBounds(),
          lines: survey.getLines(),
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Otherwise return the raw file
    return new Response(buffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "File not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function DELETE(req) {
  const url = new URL(req.url);
  const filename = url.searchParams.get("id");

  if (!filename) {
    return new Response(JSON.stringify({ error: "Missing file ID" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const filePath = path.join(uploadDir, filename);
  const metadataPath = path.join(metadataDir, `${filename}.json`);

  try {
    await Promise.all([
      readFile(filePath)
        .then(() => unlink(filePath))
        .catch(() => {}),
      readFile(metadataPath)
        .then(() => unlink(metadataPath))
        .catch(() => {}),
    ]);

    return new Response(
      JSON.stringify({ message: "File deleted successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to delete file" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
