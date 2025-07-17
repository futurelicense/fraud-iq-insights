
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Download, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CSVParser } from '../services/csvParser';
import { ClaimData } from '../types/fraud';

interface FileUploadProps {
  onDataLoaded: (data: ClaimData[]) => void;
  isLoading?: boolean;
}

export function FileUpload({ onDataLoaded, isLoading }: FileUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setError(null);
    
    try {
      const data = await CSVParser.parseCSV(file);
      onDataLoaded(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV file');
    }
  }, [onDataLoaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv']
    },
    multiple: false,
    disabled: isLoading
  });

  const downloadSample = () => {
    const sampleCSV = CSVParser.generateSampleCSV();
    const blob = new Blob([sampleCSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_claims.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <Card className={`card-hover ${isDragActive ? 'border-primary' : ''}`}>
        <CardContent className="p-8">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
              ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-primary/5'}
            `}
          >
            <input {...getInputProps()} />
            
            <div className="flex flex-col items-center space-y-4">
              <div className={`p-4 rounded-full ${isDragActive ? 'bg-primary/20' : 'bg-muted'}`}>
                <Upload className={`h-8 w-8 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">
                  {isDragActive ? 'Drop your CSV file here' : 'Upload Claims Data'}
                </h3>
                <p className="text-muted-foreground">
                  {isLoading 
                    ? 'Processing your file...' 
                    : 'Drag and drop your CSV file here, or click to browse'
                  }
                </p>
              </div>

              {!isLoading && (
                <Button variant="outline" className="mt-4">
                  <FileText className="h-4 w-4 mr-2" />
                  Select CSV File
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div className="text-sm text-muted-foreground">
          Need a sample file to test with?
        </div>
        <Button variant="outline" size="sm" onClick={downloadSample}>
          <Download className="h-4 w-4 mr-2" />
          Download Sample CSV
        </Button>
      </div>
    </div>
  );
}
