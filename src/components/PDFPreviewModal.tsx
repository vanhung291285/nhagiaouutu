import React from 'react';
import { X } from 'lucide-react';

interface Props {
  fileUrl: string;
  onClose: () => void;
}

export default function PDFPreviewModal({ fileUrl, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-800">Xem trước tài liệu</h3>
          <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 w-full h-[calc(90vh-60px)]">
          <iframe
            src={`${fileUrl}#view=FitH`}
            className="w-full h-full"
            title="PDF Preview"
          />
        </div>
      </div>
    </div>
  );
}
