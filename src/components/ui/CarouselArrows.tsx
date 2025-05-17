'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselArrowsProps {
  onPrev: () => void;
  onNext: () => void;
  className?: string;
}

export function CarouselArrows({ onPrev, onNext, className = '' }: CarouselArrowsProps) {
  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      <div className="relative w-full h-full">
        <button 
          onClick={onPrev}
          className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/90 hover:bg-white text-vibrant-coral transition-all duration-300 pointer-events-auto shadow-lg hover:shadow-xl transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-vibrant-coral/50"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
        </button>
        <button 
          onClick={onNext}
          className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/90 hover:bg-white text-vibrant-coral transition-all duration-300 pointer-events-auto shadow-lg hover:shadow-xl transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-vibrant-coral/50"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
