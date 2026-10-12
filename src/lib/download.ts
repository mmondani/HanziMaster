/** Descarga un texto como archivo. Con BOM para que Excel lo abra como UTF-8. */
export function downloadText(filename: string, content: string, mime = 'text/csv;charset=utf-8'): void {
  const bom = String.fromCharCode(0xfeff);
  const url = URL.createObjectURL(new Blob([bom, content], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
