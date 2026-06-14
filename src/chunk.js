export function chunkText(text, options = {}) {
  const chunkSize = options.chunkSize ?? 1400;
  const overlap = options.overlap ?? 250;
  const paragraphs = text.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
  const chunks = [];
  let current = "";

  for (const paragraph of paragraphs) {
    if ((current + "\n\n" + paragraph).trim().length <= chunkSize) {
      current = (current + "\n\n" + paragraph).trim();
      continue;
    }

    if (current) {
      chunks.push(current);
      current = tail(current, overlap);
    }

    if (paragraph.length <= chunkSize) {
      current = (current + "\n\n" + paragraph).trim();
      continue;
    }

    for (let start = 0; start < paragraph.length; start += chunkSize - overlap) {
      chunks.push(paragraph.slice(start, start + chunkSize).trim());
    }
    current = "";
  }

  if (current) {
    chunks.push(current);
  }

  return chunks.map((content, index) => ({
    id: index + 1,
    content
  }));
}

function tail(text, size) {
  if (text.length <= size) {
    return text;
  }

  return text.slice(-size);
}
