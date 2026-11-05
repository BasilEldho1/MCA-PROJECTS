import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, X, RefreshCw, Eye } from 'lucide-react';

export interface UploadedDocInfo {
  file?: File;
  name: string;
  size: number;
  mimeType: string;
  base64Data?: string;
}

interface LicenseUploadFieldProps {
  label?: string;
  description?: string;
  required?: boolean;
  docInfo: UploadedDocInfo | null;
  onChange: (doc: UploadedDocInfo | null) => void;
  error?: string;
}

export const LicenseUploadField: React.FC<LicenseUploadFieldProps> = ({
  label = 'Upload Professional License / Certificate',
  description = 'Upload a copy of your valid license or official registration certificate (PDF, JPG, JPEG, PNG, max 10MB).',
  required = true,
  docInfo,
  onChange,
  error: parentError
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateAndProcessFile = (file: File) => {
    setLocalError(null);

    // Format validation
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(ext)) {
      setLocalError('Invalid file type. Please upload a PDF, JPG, JPEG, or PNG document.');
      return;
    }

    // Size validation: 10MB = 10 * 1024 * 1024 bytes
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setLocalError(`File size exceeds 10MB limit (${formatFileSize(file.size)}). Please choose a smaller file.`);
      return;
    }

    // Progress animation
    setUploadProgress(15);
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev === null) return 15;
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 25;
      });
    }, 80);

    // Read as Base64 for flexible transmission
    const reader = new FileReader();
    reader.onload = e => {
      clearInterval(progressInterval);
      setUploadProgress(100);
      setTimeout(() => {
        setUploadProgress(null);
        onChange({
          file,
          name: file.name,
          size: file.size,
          mimeType: file.type || (ext === '.pdf' ? 'application/pdf' : 'image/jpeg'),
          base64Data: e.target?.result as string
        });
      }, 200);
    };

    reader.onerror = () => {
      clearInterval(progressInterval);
      setUploadProgress(null);
      setLocalError('Failed to read file. Please try again.');
    };

    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    onChange(null);
    setLocalError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isImage = docInfo?.mimeType.startsWith('image/') || docInfo?.name.match(/\.(jpg|jpeg|png)$/i);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
          <span>{label}</span>
          {required && <span className="text-rose-500 font-bold">*</span>}
        </label>
        {docInfo && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
            <CheckCircle2 className="w-3 h-3 text-teal-600" /> Document attached
          </span>
        )}
      </div>

      {description && <p className="text-[11px] text-slate-500 leading-relaxed">{description}</p>}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Upload Progress Bar */}
      {uploadProgress !== null && (
        <div className="bg-slate-100 rounded-xl p-4 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-700">
            <span className="flex items-center gap-2 font-medium">
              <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
              Reading & Validating Document...
            </span>
            <span className="font-semibold text-emerald-700">{uploadProgress}%</span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-150"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Upload Dropzone when empty */}
      {!docInfo && uploadProgress === null && (
        <div
          onDragOver={e => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-200 ${
            localError || parentError
              ? 'border-rose-400 bg-rose-50/40'
              : dragOver
              ? 'border-teal-500 bg-teal-50/70 scale-[0.99]'
              : 'border-slate-300 hover:border-teal-500 bg-slate-50/70 hover:bg-teal-50/30'
          }`}
        >
          <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3 shadow-sm group-hover:scale-105 transition-transform">
            <Upload className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-800">
            Click to upload or drag & drop license document
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Supported: PDF, JPG, JPEG, PNG (Max 10MB)
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
            <span>Browse Computer</span>
          </div>
        </div>
      )}

      {/* Uploaded File Preview Card */}
      {docInfo && uploadProgress === null && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:border-emerald-300 transition-colors">
          <div className="flex items-start gap-3">
            {/* Thumbnail or File Icon */}
            {isImage && docInfo.base64Data ? (
              <div
                onClick={() => setPreviewOpen(true)}
                className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0 cursor-pointer relative group bg-slate-100"
              >
                <img
                  src={docInfo.base64Data}
                  alt={docInfo.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Eye className="w-4 h-4 text-white" />
                </div>
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
                <FileText className="w-6 h-6" />
              </div>
            )}

            {/* Document Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-800 truncate" title={docInfo.name}>
                  {docInfo.name}
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                <span>{formatFileSize(docInfo.size)}</span>
                <span>•</span>
                <span className="uppercase text-[10px] bg-slate-100 font-semibold px-1.5 py-0.5 rounded text-slate-600">
                  {docInfo.mimeType.split('/')[1] || 'PDF'}
                </span>
                <span>•</span>
                <span className="text-emerald-600 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3 h-3" /> Verified size & format
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100">
                {isImage && (
                  <button
                    type="button"
                    onClick={() => setPreviewOpen(true)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 px-2.5 py-1 rounded-md transition-colors"
                  >
                    <Eye className="w-3 h-3" /> Preview
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 px-2.5 py-1 rounded-md transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> Replace
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/70 px-2.5 py-1 rounded-md transition-colors"
                >
                  <X className="w-3 h-3" /> Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewOpen && isImage && docInfo?.base64Data && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
              <span className="text-sm font-semibold truncate">{docInfo.name}</span>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-slate-950/20">
              <img
                src={docInfo.base64Data}
                alt={docInfo.name}
                className="max-h-[70vh] object-contain rounded-lg shadow"
              />
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {(localError || parentError) && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{localError || parentError}</span>
        </div>
      )}
    </div>
  );
};
