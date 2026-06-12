export interface Field {
  key: string;
  description: string;
}

export interface SchemaExtractRequest {
  json_example?: Record<string, unknown>;
  csv_example?: string;
}

export interface SchemaExtractResponse {
  fields: Field[];
}

export interface DatasetGenerateRequest {
  language: Language;
  count: number;
  format: OutputFormat;
  fields: Field[];
  mode: GenerationMode;
}

export type Language = 'english' | 'french' | 'malagasy' | 'spanish' | 'german' | 'japanese';

export type OutputFormat = 'json' | 'csv' | 'xlsx';

export type GenerationMode = 'ai';

export interface GenerationSettings {
  language: Language;
  count: number;
  format: OutputFormat;
  mode: GenerationMode;
}

export type InputTab = 'json' | 'csv';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
