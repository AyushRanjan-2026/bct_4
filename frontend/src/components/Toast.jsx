import { useEffect } from 'react';

function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  const bgColor = type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800';
  const icon = type === 'error' ? '❌' : '✓';

  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg border shadow-lg animate-slide-up ${bgColor}`}>
      <div className="flex items-center space-x-2">
        <span className="text-lg">{icon}</span>
        <span className="font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-4 text-current opacity-70 hover:opacity-100"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default Toast;
