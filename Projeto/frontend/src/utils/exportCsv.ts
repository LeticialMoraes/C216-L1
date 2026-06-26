export function exportCsv(
  filename: string,
  headers: string[],
  rows: string[][],
): boolean {
  if (rows.length === 0) {
    return false;
  }

  const escape = (value: string) => {
    const normalized = value.replace(/"/g, '""');
    return /[",;\n\r]/.test(normalized) ? `"${normalized}"` : normalized;
  };

  const lines = [
    headers.map(escape).join(";"),
    ...rows.map((row) => row.map((cell) => escape(String(cell))).join(";")),
  ];

  const blob = new Blob([`\uFEFF${lines.join("\r\n")}`], {
    type: "text/csv;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);

  return true;
}
