import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Divide } from 'lucide-react';

interface CompareSliderProps {
  originalImage: string;
  generatedImage: string;
  className?: string;
}

const CompareSlider: React.FC<CompareSliderProps> = ({ originalImage, generatedImage, className = '' }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMove = useCallback((clientX: number) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const percentage = (x / rect.width) * 100;
      setSliderPosition(percentage);
    }
  }, []);

  const onMouseDown = () => (isDragging.current = true);
  const onMouseUp = () => (isDragging.current = false);
  const onMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current) handleMove(e.clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => (isDragging.current = false);
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging.current) handleMove(e.clientX);
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('mousemove', handleGlobalMouseMove);

    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [handleMove]);

  return (
    <div 
      className={`relative w-full h-full overflow-hidden select-none cursor-ew-resize group ${className}`}
      ref={containerRef}
      onMouseDown={onMouseDown}
      onTouchStart={onMouseDown}
      onTouchMove={onTouchMove}
      onTouchEnd={onMouseUp}
    >
      {/* Background Image (Modified/Generated) */}
      <img
        src={generatedImage}
        alt="New Design"
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* Foreground Image (Original) - Clipped */}
      <div
        className="absolute inset-0 w-full h-full overflow-hidden"
        style={{ width: `${sliderPosition}%` }}
      >
        <img
          src={originalImage}
          alt="Original"
          className="absolute inset-0 w-full h-full object-cover max-w-none"
          // We need to set the width of this image to the container width to prevent squishing
          style={{ width: containerRef.current ? containerRef.current.clientWidth : '100%' }}
          draggable={false}
        />
      </div>

      {/* Slider Handle */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] z-20"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-600">
          <Divide className="w-4 h-4 rotate-90" />
        </div>
      </div>
      
      {/* Labels */}
      <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm pointer-events-none">
        Originale
      </div>
      <div className="absolute top-4 right-4 bg-indigo-600/80 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm pointer-events-none">
        Reimmaginato
      </div>
    </div>
  );
};

export default CompareSlider;