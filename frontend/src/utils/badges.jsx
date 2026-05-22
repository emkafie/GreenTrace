import { AlertTriangle, AlertCircle, Clock, CheckCircle } from 'lucide-react';

/**
 * Severity badge component.
 */
export const SeverityBadge = ({ severity }) => {
  switch (severity) {
    case 'CRITICAL':
      return (
        <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold flex items-center gap-1">
          <AlertTriangle size={12} /> CRITICAL
        </span>
      );
    default:
      return (
        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-bold">
          LOW
        </span>
      );
  }
};

/**
 * Status badge component.
 */
export const StatusBadge = ({ status }) => {
  switch (status) {
    case 'OPEN':
      return (
        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1">
          <AlertCircle size={12} /> OPEN
        </span>
      );
    case 'IN_PROGRESS':
      return (
        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium flex items-center gap-1">
          <Clock size={12} /> IN PROGRESS
        </span>
      );
    case 'RESOLVED':
      return (
        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
          <CheckCircle size={12} /> RESOLVED
        </span>
      );
    default:
      return null;
  }
};
