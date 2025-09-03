import React from 'react';

interface TooltipProps {
  children: React.ReactNode;
  content: string | React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ children, content, position = 'top', className = '' }) => {
  const getPositionClasses = () => {
    switch (position) {
      case 'bottom':
        return 'top-full mt-2 left-1/2 -translate-x-1/2';
      case 'left':
        return 'right-full mr-2 top-1/2 -translate-y-1/2';
      case 'right':
        return 'left-full ml-2 top-1/2 -translate-y-1/2';
      case 'top':
      default:
        return 'bottom-full mb-2 left-1/2 -translate-x-1/2';
    }
  };

  return (
    <div className="relative inline-flex group">
      {children}
      <div
        role="tooltip"
        className={`absolute z-10 w-max px-3 py-1.5 text-sm font-medium text-white transition-opacity duration-300 bg-slate-700 dark:bg-slate-900 rounded-lg shadow-sm opacity-0 invisible group-hover:opacity-100 group-hover:visible ${getPositionClasses()} ${className}`}
      >
        {content}
      </div>
    </div>
  );
};

export default Tooltip;
