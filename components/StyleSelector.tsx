import React from 'react';
import { DESIGN_STYLES } from '../constants';
import { DesignStyle } from '../types';
import { ChevronRight } from 'lucide-react';

interface StyleSelectorProps {
  selectedStyleId: string;
  onSelectStyle: (style: DesignStyle) => void;
  disabled?: boolean;
}

const StyleSelector: React.FC<StyleSelectorProps> = ({ selectedStyleId, onSelectStyle, disabled }) => {
  return (
    <div className="w-full overflow-x-auto pb-4 pt-2 scrollbar-hide">
      <div className="flex space-x-4 px-1">
        {DESIGN_STYLES.map((style) => (
          <button
            key={style.id}
            onClick={() => onSelectStyle(style)}
            disabled={disabled}
            className={`
              flex-shrink-0 relative group rounded-xl overflow-hidden transition-all duration-300 w-32 h-20 text-left
              ${selectedStyleId === style.id 
                ? 'ring-2 ring-indigo-600 ring-offset-2 scale-105 shadow-lg' 
                : 'hover:scale-105 opacity-80 hover:opacity-100'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <img 
              src={style.thumbnail} 
              alt={style.name} 
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className={`absolute inset-0 bg-gradient-to-t from-black/80 to-transparent ${selectedStyleId === style.id ? 'opacity-90' : 'opacity-70 group-hover:opacity-90'}`} />
            <div className="absolute bottom-2 left-2 right-2">
              <p className="text-white text-xs font-bold truncate leading-tight">{style.name}</p>
            </div>
            {selectedStyleId === style.id && (
                <div className="absolute top-1 right-1 bg-indigo-600 rounded-full p-0.5">
                    <ChevronRight className="w-3 h-3 text-white" />
                </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default StyleSelector;