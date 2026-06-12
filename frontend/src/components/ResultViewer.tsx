import { useState, useMemo } from 'react';
import { Copy, FileJson, FileSpreadsheet, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { datasetToCSV, datasetToXLSX, downloadFile, copyToClipboard } from '../lib/api';
import { useToast } from '../hooks/useToast';
import type { OutputFormat } from '../types';

interface ResultViewerProps {
  data: Record<string, unknown>[];
  format: OutputFormat;
}

const PAGE_SIZE = 25;

export function ResultViewer({ data, format }: ResultViewerProps) {
  const [page, setPage] = useState(0);
  const { addToast } = useToast();

  const totalPages = Math.ceil(data.length / PAGE_SIZE);
  const pageData = useMemo(() => data.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE), [data, page]);

  const handleDownloadJSON = () => {
    downloadFile(JSON.stringify(data, null, 2), 'dataset.json', 'application/json');
    addToast('success', 'JSON file downloaded');
  };

  const handleDownloadCSV = () => {
    downloadFile(datasetToCSV(data), 'dataset.csv', 'text/csv');
    addToast('success', 'CSV file downloaded');
  };

  const handleDownloadXLSX = () => {
    downloadFile(datasetToXLSX(data), 'dataset.xls', 'application/vnd.ms-excel');
    addToast('success', 'XLSX file downloaded');
  };

  const handleCopy = async () => {
    try {
      const text = format === 'csv' ? datasetToCSV(data) : JSON.stringify(data, null, 2);
      await copyToClipboard(text);
      addToast('success', 'Copied to clipboard');
    } catch {
      addToast('error', 'Failed to copy to clipboard');
    }
  };

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3 py-16">
        <div className="rounded-full bg-muted p-4"><FileJson className="h-6 w-6" /></div>
        <p className="text-sm font-medium">No data generated yet</p>
        <p className="text-xs text-muted-foreground/60">Configure your schema and click Generate</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Result</h2>
          <Badge variant="secondary" className="text-xs">{data.length} records</Badge>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" onClick={handleDownloadJSON} className="gap-1.5 h-8">
            <FileJson className="h-3.5 w-3.5" /><span className="hidden sm:inline">JSON</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadCSV} className="gap-1.5 h-8">
            <FileText className="h-3.5 w-3.5" /><span className="hidden sm:inline">CSV</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadXLSX} className="gap-1.5 h-8">
            <FileSpreadsheet className="h-3.5 w-3.5" /><span className="hidden sm:inline">XLSX</span>
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5 h-8">
            <Copy className="h-3.5 w-3.5" />Copy
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto rounded-md border border-border">
        {format === 'json' ? (
          <pre className="p-4 text-xs font-mono leading-relaxed whitespace-pre-wrap break-words bg-muted/30">
            {JSON.stringify(pageData, null, 2)}
          </pre>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground border-b border-border">#</th>
                  {data.length > 0 && Object.keys(data[0]).map((key) => (
                    <th key={key} className="px-3 py-2 text-left font-medium text-muted-foreground border-b border-border whitespace-nowrap">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageData.map((row, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-3 py-2 text-muted-foreground font-mono">{page * PAGE_SIZE + i + 1}</td>
                    {Object.values(row).map((val, j) => (
                      <td key={j} className="px-3 py-2 whitespace-nowrap max-w-[200px] truncate">{String(val ?? '')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">Page {page + 1} of {totalPages}</p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
