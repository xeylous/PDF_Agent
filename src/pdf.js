import fs from "node:fs/promises";
import pdfParse from "pdf-parse";

export async function readPdfText(pdfPath) {
  const buffer = await fs.readFile(pdfPath);
  return parsePdfBuffer(buffer);
}

export async function readPdfBytes(pdfPath) {
  return fs.readFile(pdfPath);
}

export async function parsePdfBuffer(buffer) {
  const parsed = await pdfParse(buffer);
  const text = normalizeText(parsed.text);

  if (!text) {
    throw new Error("No selectable text was found in this PDF. Scanned image PDFs need OCR first.");
  }

  return {
    text,
    pages: parsed.numpages ?? 0,
    bytes: buffer
  };
}

function normalizeText(text) {
  return text
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
