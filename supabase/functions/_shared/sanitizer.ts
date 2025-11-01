export function sanitizePhone(input: string | null | undefined): string {
  if (!input) return '';
  return String(input).replace(/[^\d+]/g, '');
}
export default sanitizePhone;
