// Arquivo: frontend/src/components/ui/FileUpload.tsx (Novo)

import React, { useState, ChangeEvent } from 'react';
import { Upload } from 'lucide-react';
import Button from './Button';
import Spinner from './Spinner';

interface FileUploadProps {
  onUpload: (file: File) => void;
  isLoading: boolean;
  acceptedFileTypes?: string;
  title: string;
  lastUpload?: string | null;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUpload, isLoading, acceptedFileTypes = ".csv, .xls, .xlsx", title, lastUpload }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUploadClick = () => {
    if (selectedFile) {
      onUpload(selectedFile);
    }
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        {lastUpload && (
          <p className="text-xs text-gray-500">
            Última atualização: <span className="font-medium">{lastUpload}</span>
          </p>
        )}
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <label htmlFor="file-upload" className="flex-1 w-full">
          <div className="flex items-center justify-center w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-gray-100">
            <Upload className="w-5 h-5 text-gray-500 mr-2" />
            <span className="text-sm text-gray-600 truncate">
              {selectedFile ? selectedFile.name : 'Clique para selecionar o arquivo'}
            </span>
          </div>
          <input
            id="file-upload"
            type="file"
            className="sr-only"
            accept={acceptedFileTypes}
            onChange={handleFileChange}
            onClick={(e) => (e.currentTarget.value = '')} // Permite selecionar o mesmo arquivo novamente
          />
        </label>
        <Button onClick={handleUploadClick} disabled={!selectedFile || isLoading} className="w-full sm:w-auto">
          {isLoading ? <Spinner className="h-5 w-5" /> : 'Enviar'}
        </Button>
      </div>
    </div>
  );
};

export default FileUpload;
