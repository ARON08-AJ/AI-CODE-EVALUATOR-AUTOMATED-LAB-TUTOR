import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface AppBackButtonProps {
  fallbackPath: string;
  label?: string;
  className?: string;
  onBeforeNavigate?: () => boolean | void;
}

/**
 * Shared, consistent Back navigation button across AutoLab v1.0.
 *
 * Rules:
 * 1. If the user navigated from another page within AutoLab (location.key !== 'default'),
 *    it calls navigate(-1) to return to the previous page.
 * 2. If opened directly, from bookmark, or refreshed (location.key === 'default'),
 *    it safely redirects to fallbackPath, never leaving AutoLab or navigating to a blank page.
 * 3. Accessible, keyboard focusable, and adheres to dark/light theme tokens.
 */
export const AppBackButton: React.FC<AppBackButtonProps> = ({
  fallbackPath,
  label = 'Back',
  className = '',
  onBeforeNavigate,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (onBeforeNavigate) {
      const allowed = onBeforeNavigate();
      if (allowed === false) return;
    }

    const isDirectEntry = location.key === 'default';

    if (!isDirectEntry && window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallbackPath, { replace: true });
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shrink-0 ${className}`}
      aria-label={label}
      title={label}
    >
      <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
};
