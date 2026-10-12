/** Identificador único para documentos nuevos. */
export function newId(): string {
  return crypto.randomUUID();
}
