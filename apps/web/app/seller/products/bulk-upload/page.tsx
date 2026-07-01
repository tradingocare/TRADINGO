'use client';

import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import { DashboardPageHeader, StatusBadge } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Upload, Download, AlertCircle, CheckCircle, X, FileSpreadsheet } from 'lucide-react';
import api from '@/lib/api/client';
import { useToast } from '@/components/ui/use-toast';

interface PreviewRow {
  row: number;
  name: string;
  category: string;
  price: string;
  stock: string;
  unit: string;
  errors: string[];
}

function parseCSV(text: string): PreviewRow[] {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  const rows: PreviewRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.replace(/^"|"$/g, '').trim());
    const errors: string[] = [];
    if (!cols[0]) errors.push('Product name is required');
    if (cols[2] && isNaN(Number(cols[2].replace(/,/g, '')))) errors.push('Price must be a number');
    rows.push({
      row: i,
      name: cols[0] || '',
      category: cols[1] || '',
      price: cols[2] || '',
      stock: cols[3] || '',
      unit: cols[4] || '',
      errors,
    });
  }
  return rows;
}

function parseFile(file: File): Promise<PreviewRow[]> {
  return new Promise((resolve, reject) => {
    if (file.name.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = (e) => resolve(parseCSV(e.target?.result as string || ''));
      reader.onerror = reject;
      reader.readAsText(file);
    } else {
      reject(new Error('Only CSV files are supported. Upload a CSV file.'));
    }
  });
}

export default function BulkUploadPage() {
  const { toast } = useToast();
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; failed: number; errors: any[] } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  };

  const processFile = async (f: File) => {
    setFile(f);
    setUploaded(false);
    setImportResult(null);
    try {
      const rows = await parseFile(f);
      setPreview(rows);
    } catch {
      toast({ title: 'Failed to parse file', description: 'Upload a valid CSV file', variant: 'destructive' });
    }
  };

  const handleSubmit = async () => {
    if (preview.length === 0) return;
    setUploading(true);
    try {
      const validRows = preview.filter(r => r.errors.length === 0);
      const res = await api.post('/seller/bulk/import', {
        rows: validRows.map(r => ({ name: r.name, category: r.category, originalPrice: Number(r.price.replace(/,/g, '')) || undefined, sku: undefined, unit: r.unit, moq: r.stock ? Number(r.stock) : undefined })),
      });
      const result = res.data?.data || res.data || res;
      setImportResult({ imported: result.imported || 0, failed: result.failed || 0, errors: result.errors || [] });
      setUploaded(true);
      toast({ title: `Import complete: ${result.imported || 0} products imported` });
    } catch {
      toast({ title: 'Import failed', variant: 'destructive' });
    }
    finally { setUploading(false); }
  };

  const handleDownloadTemplate = () => {
    const csv = 'Name,Category,Price,Stock,Unit\nProduct A,Electronics,1500,100,pcs\nProduct B,Textiles,250,500,meters';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk-upload-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasErrors = preview.some((r) => r.errors.length > 0);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Bulk Upload Products"
        description="Upload multiple products at once using a CSV or Excel file"
        actions={
          <Button variant="outline" onClick={handleDownloadTemplate}>
            <Download className="mr-2 h-4 w-4" />
            Download Template
          </Button>
        }
      />

      {uploaded ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <CheckCircle className="h-12 w-12 text-accent-600" />
            <h3 className="mt-4 text-lg font-semibold text-text-primary dark:text-dark-text-primary">
              Upload Complete
            </h3>
            <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">
              {importResult ? `${importResult.imported} products imported` : `${preview.length} products processed.`}
            </p>
            {importResult?.failed ? (
              <p className="mt-1 text-sm text-red-500">{importResult.failed} rows failed</p>
            ) : null}
            <Button className="mt-6" onClick={() => { setFile(null); setPreview([]); setUploaded(false); setImportResult(null); }}>
              Upload Another File
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-colors ${
              dragOver
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-border bg-surface hover:border-primary-400 dark:border-dark-border dark:bg-dark-surface dark:hover:border-primary-500'
            }`}
          >
            <Upload className={`h-10 w-10 ${dragOver ? 'text-primary-600' : 'text-text-tertiary'}`} />
            <p className="mt-4 text-base font-medium text-text-primary dark:text-dark-text-primary">
              Drop your file here or click to browse
            </p>
            <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">
              Supports CSV and Excel files (.xlsx, .xls)
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={handleChange}
          />

          {file && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-8 w-8 text-accent-600" />
                    <div>
                      <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">
                        {file.name}
                      </p>
                      <p className="text-xs text-text-secondary dark:text-dark-text-secondary">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setFile(null); setPreview([]); }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {preview.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-text-primary dark:text-dark-text-primary">
                      Preview ({preview.length} rows)
                    </h3>
                    {hasErrors && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                        Some rows have validation errors
                      </p>
                    )}
                  </div>
                  <StatusBadge status={hasErrors ? 'pending' : 'verified'} />
                </div>
                <Separator className="mb-4" />
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs font-medium uppercase text-text-secondary dark:border-dark-border dark:text-dark-text-secondary">
                        <th className="px-3 py-2">#</th>
                        <th className="px-3 py-2">Name</th>
                        <th className="px-3 py-2">Category</th>
                        <th className="px-3 py-2">Price</th>
                        <th className="px-3 py-2">Stock</th>
                        <th className="px-3 py-2">Unit</th>
                        <th className="px-3 py-2">Errors</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row) => (
                        <tr
                          key={row.row}
                          className={`border-b border-border last:border-0 dark:border-dark-border ${
                            row.errors.length > 0 ? 'bg-red-50 dark:bg-red-900/10' : ''
                          }`}
                        >
                          <td className="px-3 py-3 text-text-secondary">{row.row}</td>
                          <td className={`px-3 py-3 font-medium ${!row.name ? 'text-red-600' : 'text-text-primary dark:text-dark-text-primary'}`}>
                            {row.name || '(empty)'}
                          </td>
                          <td className="px-3 py-3 text-text-secondary">{row.category}</td>
                          <td className="px-3 py-3 text-text-primary dark:text-dark-text-primary">₹{row.price}</td>
                          <td className="px-3 py-3 text-text-secondary">{row.stock}</td>
                          <td className="px-3 py-3 text-text-secondary">{row.unit}</td>
                          <td className="px-3 py-3">
                            {row.errors.map((err, i) => (
                              <span key={i} className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                                <AlertCircle className="h-3 w-3" />
                                {err}
                              </span>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {preview.length > 0 && (
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setFile(null); setPreview([]); }}>
                Clear
              </Button>
              <Button onClick={handleSubmit} disabled={hasErrors || uploading}>
                {uploading ? 'Uploading...' : `Upload ${preview.length} Products`}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
