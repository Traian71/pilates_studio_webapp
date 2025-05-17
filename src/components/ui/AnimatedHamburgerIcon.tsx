'use client';

import { cn } from '@/lib/utils';

interface AnimatedHamburgerIconProps {
  isOpen: boolean;
  className?: string;
}

const AnimatedHamburgerIcon: React.FC<AnimatedHamburgerIconProps> = ({
  isOpen,
  className,
}) => {
  const commonLineClasses =
    'block absolute h-[1px] w-full bg-current transform transition duration-300 ease-in-out left-0';

  return (
    <div className={cn("relative h-5 w-5", className)}> {/* Reduced size from h-6 w-6 */}
      <span
        className={cn(
          commonLineClasses,
          'top-1/2 -translate-y-1/2', 
          isOpen
            ? 'rotate-45'
            : '-translate-y-[4px]' // Adjusted translation
        )}
      ></span>
      <span
        className={cn(
          commonLineClasses,
          'top-1/2 -translate-y-1/2', 
          isOpen
            ? '-rotate-45'
            : 'translate-y-[4px]' // Adjusted translation
        )}
      ></span>
    </div>
  );
};

export default AnimatedHamburgerIcon;
