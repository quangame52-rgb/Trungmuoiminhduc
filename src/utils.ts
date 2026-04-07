/**
 * Converts various image hosting links to direct image URLs
 */
export const getDirectImageUrl = (url: string): string => {
  if (!url) return '';

  // Handle Google Drive links
  // Standard format: https://drive.google.com/file/d/FILE_ID/view
  // Or: https://drive.google.com/open?id=FILE_ID
  // Or: https://drive.google.com/uc?id=FILE_ID
  // Or: https://drive.google.com/uc?export=view&id=FILE_ID
  const driveMatch = url.match(/(?:file\/d\/|id=|open\?id=|uc\?id=|uc\?export=view&id=)([\w-]+)/);
  if (driveMatch && driveMatch[1]) {
    const fileId = driveMatch[1];
    // This lh3 format is generally the most reliable for embedding in <img> tags
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  return url;
};
