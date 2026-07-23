export const validateAndFormatDesignLink = (url) => {
  if (!url || typeof url !== 'string') {
    return { isValid: false, isImage: false, url: null, error: 'No link provided', status: 'missing' };
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return { isValid: false, isImage: false, url: null, error: 'Empty link', status: 'missing' };
  }

  try {
    const parsed = new URL(trimmed);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { isValid: false, isImage: false, url: trimmed, error: 'Must start with http:// or https://', status: 'invalid' };
    }

    // Check if it's an image format based on extension
    const isImage = /\.(jpeg|jpg|gif|png|webp|svg)(\?.*)?$/i.test(parsed.pathname + parsed.search);

    return { isValid: true, isImage, url: trimmed, error: null, status: 'valid' };
  } catch (err) {
    return { isValid: false, isImage: false, url: trimmed, error: 'Invalid URL format', status: 'invalid' };
  }
};