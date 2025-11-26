import React, { useRef } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface UploadZoneProps {
  onImageSelected: (base64: string) => void;
}

const UploadZone: React.FC<UploadZoneProps> = ({ onImageSelected }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      onImageSelected(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    }
  };

  return (
    <div 
      className="flex flex-col items-center justify-center w-full h-96 border-2 border-dashed border-slate-300 rounded-3xl bg-slate-50/50 hover:bg-slate-100 hover:border-indigo-400 transition-all cursor-pointer group"
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <input 
        type="file" 
        ref={inputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />
      
      <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        <Upload className="w-8 h-8 text-indigo-600" />
      </div>
      
      <h3 className="text-xl font-bold text-slate-700 mb-2">Carica la tua stanza</h3>
      <p className="text-slate-500 text-sm max-w-xs text-center">
        Trascina qui la tua foto, o clicca per sfogliare. 
        <br/><span className="text-xs text-slate-400 mt-2 block">Supporta JPG, PNG</span>
      </p>
    </div>
  );
};

export default UploadZone;