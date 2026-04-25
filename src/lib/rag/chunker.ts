/**
 * Text chunking utilities for RAG pipeline.
 * Splits documents into overlapping chunks to preserve context at boundaries.
 */

const cleanText = (text: string): string => {
  return text
    // Remove page numbers (e.g., "Page 1", "- 1 -", "1 of 10")
    .replace(/\b[Pp]age\s*\d+\b/g, '')
    .replace(/[-–—]\s*\d+\s*[-–—]/g, '')
    .replace(/\d+\s*of\s*\d+/g, '')
    // Remove common headers/footers
    .replace(/^(chapter|section)\s*\d+\s*/gim, '')
    // Collapse multiple newlines into double newline
    .replace(/\n{3,}/g, '\n\n')
    // Collapse multiple spaces/tabs into single space
    .replace(/[ \t]{2,}/g, ' ')
    // Trim lines
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n')
    .trim();
};

const chunkText = (
  text: string,
  chunkSize: number = 500,
  overlap: number = 50
): string[] => {
  const cleaned = cleanText(text);

  if (cleaned.length <= chunkSize) {
    return cleaned.length > 0 ? [cleaned] : [];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < cleaned.length) {
    let end = start + chunkSize;

    // If not at the end of text, try to break at a sentence or word boundary
    if (end < cleaned.length) {
      // Prefer sentence boundary (.!?\n) within last 20% of chunk
      const searchStart = Math.floor(end - chunkSize * 0.2);
      const searchRegion = cleaned.slice(searchStart, end);
      const sentenceBreak = searchRegion.lastIndexOf('.');
      const newlineBreak = searchRegion.lastIndexOf('\n');
      const bestBreak = Math.max(sentenceBreak, newlineBreak);

      if (bestBreak > 0) {
        end = searchStart + bestBreak + 1;
      } else {
        // Fall back to word boundary
        const spaceIndex = cleaned.lastIndexOf(' ', end);
        if (spaceIndex > start) {
          end = spaceIndex;
        }
      }
    } else {
      end = cleaned.length;
    }

    const chunk = cleaned.slice(start, end).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    // Move start forward, accounting for overlap
    start = end - overlap;
    if (start >= cleaned.length) break;
    // Ensure forward progress
    if (start < end - chunkSize + overlap) {
      start = end;
    }
  }

  return chunks;
};

export { chunkText, cleanText };
