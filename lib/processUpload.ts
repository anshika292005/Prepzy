export function validateAndPrepareFile(file: File): { valid: boolean; error?: string; mimeType?: string } {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
  const maxSizeBytes = 10 * 1024 * 1024; // 10MB

  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: `Invalid file format (${file.type}). Please upload a PDF or an image (JPEG, PNG, WEBP).` 
    };
  }

  if (file.size > maxSizeBytes) {
    return { 
      valid: false, 
      error: `File is too large (${(file.size / (1024 * 1024)).toFixed(2)}MB). Maximum allowed size is 10MB.` 
    };
  }

  return { valid: true, mimeType: file.type };
}

export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.round(text.length / 4);
}
