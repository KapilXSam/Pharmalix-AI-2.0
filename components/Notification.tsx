import React, { useEffect } from 'react';
import { Info, X } from 'lucide-react';

interface NotificationProps {
  title: string;
  message: string;
  onClose: () => void;
  duration?: number;
}

const Notification: React.FC<NotificationProps> = ({ title, message, onClose, duration = 7000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div
      className="fixed top-5 right-5 z-50 w-full max-w-sm p-4 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 animate-slideInRight"
      role="alert"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 pt-0.5">
          <div className="p-2 bg-sky-100 dark:bg-sky-900/50 rounded-full">
            <Info className="h-5 w-5 text-sky-500" />
          </div>
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-bold text-slate-900 dark:text-white">{title}</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{message}</p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            type="button"
            className="inline-flex rounded-md p-1 text-slate-400 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
            onClick={onClose}
            aria-label="Close notification"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Notification;
