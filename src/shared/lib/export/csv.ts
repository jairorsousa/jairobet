const CSV_DELIMITER = ";";

function escapeCsvValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (/[;"\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function buildCsv(
  headers: string[],
  rows: Array<Array<string | number | null | undefined>>,
): string {
  const lines = [
    headers.map(escapeCsvValue).join(CSV_DELIMITER),
    ...rows.map((row) => row.map(escapeCsvValue).join(CSV_DELIMITER)),
  ];
  return `\uFEFF${lines.join("\r\n")}`;
}

export function csvResponse(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number | null | undefined>>,
): Response {
  const body = buildCsv(headers, rows);
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}