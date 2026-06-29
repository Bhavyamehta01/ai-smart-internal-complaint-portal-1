/**
 * Generates a unique complaint ticket number in the format COMP-XXXXXXX
 */
export function generateTicketNo(): string {
  const timestamp = Date.now().toString().slice(-7);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `COMP-${timestamp}${random}`;
}
