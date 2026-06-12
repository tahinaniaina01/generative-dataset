import type {
  Field,
  SchemaExtractRequest,
  SchemaExtractResponse,
  DatasetGenerateRequest,
} from "../types";

const API_BASE = "/api";

function inferDefaultValue(key: string): unknown {
  const lower = key.toLowerCase();
  if (
    lower.includes("age") ||
    lower.includes("count") ||
    lower.includes("number") ||
    lower.includes("num") ||
    lower.includes("year") ||
    lower.includes("quantity") ||
    lower.includes("amount") ||
    lower.includes("price") ||
    lower.includes("salary") ||
    lower.includes("id")
  ) {
    return 0;
  }
  if (
    lower.includes("active") ||
    lower.includes("enabled") ||
    lower.includes("verified") ||
    lower.includes("available")
  ) {
    return false;
  }
  return "";
}

export async function extractSchema(
  request: SchemaExtractRequest,
): Promise<SchemaExtractResponse> {
  try {
    const res = await fetch(`${API_BASE}/schema/extract`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (res.ok) return await res.json();
  } catch {
    /* backend unavailable */
  }

  if (request.json_example) {
    return {
      fields: Object.keys(request.json_example).map((key) => ({
        key,
        description: "",
      })),
    };
  }
  if (request.csv_example) {
    const lines = request.csv_example.trim().split("\n");
    if (lines.length > 0) {
      const headers = lines[0].split(",").map((h) => h.trim());
      return { fields: headers.map((key) => ({ key, description: "" })) };
    }
  }
  return { fields: [] };
}

export async function generateExample(
  fields: Field[],
): Promise<Record<string, unknown>> {
  try {
    const res = await fetch(`${API_BASE}/schema/generate-example`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields }),
    });
    if (res.ok) return await res.json();
  } catch {
    /* backend unavailable */
  }

  const example: Record<string, unknown> = {};
  for (const field of fields) {
    example[field.key] = inferDefaultValue(field.key);
  }
  return example;
}

export async function generateDataset(
  request: DatasetGenerateRequest,
): Promise<Record<string, unknown>[]> {
  try {
    const res = await fetch(`${API_BASE}/dataset/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!res.ok) {
      let message = `Dataset generation failed with status ${res.status}`;
      try {
        const errorBody = await res.json();
        if (typeof errorBody?.detail === "string") {
          message = errorBody.detail;
        }
      } catch {
        // Keep the default status-based message.
      }
      throw new Error(message);
    }

    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (data.format === "csv" && data.data) {
      return parseCSVToRecords(data.data);
    }
    return data;
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("Dataset generation failed");
  }
}

function parseCSVToRecords(csv: string): Record<string, unknown>[] {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    const record: Record<string, unknown> = {};
    headers.forEach((h, i) => {
      const val = values[i] ?? "";
      const num = Number(val);
      record[h] = !Number.isNaN(num) && val !== "" ? num : val;
    });
    return record;
  });
}

export function datasetToCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return "";
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers
      .map((h) => {
        const val = row[h];
        const str = typeof val === "string" ? val : String(val ?? "");
        return str.includes(",") || str.includes('"') || str.includes("\n")
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      })
      .join(","),
  );
  return [headers.join(","), ...rows].join("\n");
}

export function datasetToXLSX(data: Record<string, unknown>[]): ArrayBuffer {
  if (data.length === 0) return new ArrayBuffer(0);
  const headers = Object.keys(data[0]);
  const escapeXml = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const headerRow =
    "<Row>" +
    headers
      .map((h) => `<Cell><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`)
      .join("") +
    "</Row>";
  const xmlRows = data.map(
    (row) =>
      "<Row>" +
      headers
        .map((h) => {
          const val = row[h];
          const str = typeof val === "string" ? val : String(val ?? "");
          const type = typeof val === "number" ? "Number" : "String";
          return `<Cell><Data ss:Type="${type}">${escapeXml(str)}</Data></Cell>`;
        })
        .join("") +
      "</Row>",
  );
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?>' +
    '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">' +
    '<Worksheet ss:Name="Sheet1"><Table>' +
    headerRow +
    xmlRows.join("") +
    "</Table></Worksheet></Workbook>";
  return new TextEncoder().encode(xml).buffer;
}

export function downloadFile(
  content: string | ArrayBuffer,
  filename: string,
  mimeType: string,
) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}
