import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';

interface FileUploadProps {
  onFileAccepted: (content: string) => void;
}

const FileUpload = ({ onFileAccepted }: FileUploadProps) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (!text.toLowerCase().includes('url')) {
          toast.error('CSV must contain a URL column');
          return;
        }
        onFileAccepted(text);
      };
      reader.readAsText(file);
    }
  }, [onFileAccepted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    maxFiles: 1
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
        ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'}`}
    >
      <input {...getInputProps()} />
      <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
      <p className="text-lg font-medium">
        {isDragActive ? 'Drop your CSV file here' : 'Drag & drop your CSV file here'}
      </p>
      <p className="text-sm text-gray-500 mt-2">or click to select file</p>
    </div>
  );
};

export default FileUpload;