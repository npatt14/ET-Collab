import { readFileSync } from "fs";

class InducedPolarizationSurvey {
  /**
   * Creates a new IP survey instance from provided data
   * @param {string|Buffer} data - Raw data content
   * @param {string} format - Data format: 'csv', 'text', or 'binary'
   */
  constructor(data, format) {
    this.data = data;
    this.format = format;
    this.lines = {};
    this.parse();
  }

  /**
   * Parses the data based on the specified format
   */
  parse() {
    switch (this.format) {
      case "csv":
        this.parseCSV();
        break;
      case "text":
        this.parseText();
        break;
      case "binary":
        this.parseBinary();
        break;
      default:
        throw new Error(`Unsupported format: ${this.format}`);
    }
  }

  /**
   * Parse CSV data using line breaks and commas
   */
  parseCSV() {
    const lines = this.data.toString().split("\n");

    lines.forEach((line, index) => {
      if (!line.trim()) return; // Skip empty lines

      const values = line.split(",");
      if (values.length >= 5) {
        // Ensure we have enough data (lineId, x, y, transmitter, receiver)
        const lineId = values[0].trim();
        const x = parseFloat(values[1]);
        const y = parseFloat(values[2]);
        const transmitter = parseFloat(values[3]);
        const receiver = parseFloat(values[4]);

        if (!this.lines[lineId]) {
          this.lines[lineId] = [];
        }

        this.lines[lineId].push({
          position: this.lines[lineId].length,
          x,
          y,
          transmitter,
          receiver,
        });
      }
    });
  }

  /**
   * Parse text data using space-delimited values
   */
  parseText() {
    const lines = this.data.toString().split("\n");

    lines.forEach((line) => {
      if (!line.trim()) return; // Skip empty lines

      const values = line.trim().split(/\s+/); // Split by whitespace
      if (values.length >= 5) {
        // Ensure we have enough data
        const lineId = values[0].trim();
        const x = parseFloat(values[1]);
        const y = parseFloat(values[2]);
        const transmitter = parseFloat(values[3]);
        const receiver = parseFloat(values[4]);

        if (!this.lines[lineId]) {
          this.lines[lineId] = [];
        }

        this.lines[lineId].push({
          position: this.lines[lineId].length,
          x,
          y,
          transmitter,
          receiver,
        });
      }
    });
  }

  /**
   * Parse binary data using Buffer methods
   */
  parseBinary() {
    if (!Buffer.isBuffer(this.data)) {
      throw new Error("Binary format requires Buffer data");
    }

    let offset = 0;
    const buffer = this.data;

    // Read 4-byte header containing number of lines
    const numLines = buffer.readUInt32LE(offset);
    offset += 4;

    for (let i = 0; i < numLines; i++) {
      // Read line ID length (1 byte) followed by line ID string
      const lineIdLength = buffer.readUInt8(offset);
      offset += 1;
      const lineId = buffer.toString("utf8", offset, offset + lineIdLength);
      offset += lineIdLength;

      // Read number of points in this line (4 bytes)
      const numPoints = buffer.readUInt32LE(offset);
      offset += 4;

      this.lines[lineId] = [];

      for (let j = 0; j < numPoints; j++) {
        // Read x, y, transmitter, receiver (8 bytes each - 64-bit floats)
        const x = buffer.readDoubleLE(offset);
        offset += 8;
        const y = buffer.readDoubleLE(offset);
        offset += 8;
        const transmitter = buffer.readDoubleLE(offset);
        offset += 8;
        const receiver = buffer.readDoubleLE(offset);
        offset += 8;

        this.lines[lineId].push({
          position: j,
          x,
          y,
          transmitter,
          receiver,
        });
      }
    }
  }

  /**
   * Loads survey data from a file
   * @param {string} filePath - Path to the data file
   * @param {string} format - Data format: 'csv', 'text', or 'binary'
   * @returns {InducedPolarizationSurvey} - New survey instance
   */
  static load(filePath, format) {
    // Determine read mode based on format
    const readMode = format === "binary" ? null : "utf8"; // null uses buffer for binary
    const data = readFileSync(filePath, readMode);
    return new InducedPolarizationSurvey(data, format);
  }

  /**
   * Returns array of all line IDs in the survey
   * @returns {string[]} Array of line IDs
   */
  getLines() {
    return Object.keys(this.lines);
  }

  /**
   * Gets transmitter data at specific position in a line
   * @param {string} lineId - ID of the line
   * @param {number} position - Position index in the line
   * @returns {number|null} Transmitter value or null if not found
   */
  getTransmitterAt(lineId, position) {
    if (!this.lines[lineId] || !this.lines[lineId][position]) {
      return null;
    }
    return this.lines[lineId][position].transmitter;
  }

  /**
   * Gets receiver data at specific position in a line
   * @param {string} lineId - ID of the line
   * @param {number} position - Position index in the line
   * @returns {number|null} Receiver value or null if not found
   */
  getReceiverAt(lineId, position) {
    if (!this.lines[lineId] || !this.lines[lineId][position]) {
      return null;
    }
    return this.lines[lineId][position].receiver;
  }

  /**
   * Gets the coordinate bounds of the entire survey
   * @returns {Object} Object with minX, maxX, minY, maxY properties
   */
  getCoordinateBounds() {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    // Iterate through all points to find min/max coordinates
    Object.values(this.lines).forEach((points) => {
      points.forEach((point) => {
        minX = Math.min(minX, point.x);
        maxX = Math.max(maxX, point.x);
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
      });
    });

    // If no data was found, return zeros
    if (minX === Infinity) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }

    return { minX, maxX, minY, maxY };
  }
}

export default InducedPolarizationSurvey;
