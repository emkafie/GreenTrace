/**
 * Returns Tailwind classes for an incident card's left-border & background
 * based on severity — implements the "Attention Logic" visual cue.
 */
export const getRowStyle = (severity) => {
  switch (severity) {
    case 'CRITICAL':
      return 'bg-red-50 border-l-4 border-red-600 shadow-sm';
    default:
      return 'bg-white border-l-4 border-gray-200';
  }
};
