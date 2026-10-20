// Same limits as the backend, for instant feedback. The API still enforces them.
export const MAX_UPLOAD_MB = 4;

export const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "image/png",
  "image/jpeg",
];

export const ACCEPT_ATTRIBUTE = ".pdf,.docx,.txt,.png,.jpg,.jpeg";

export function validateFile(file: File): string | null {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return "Unsupported file type. Use PDF, DOCX, TXT, PNG or JPG.";
  }
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
    return `The file is too large. Maximum size is ${MAX_UPLOAD_MB} MB.`;
  }
  return null;
}
