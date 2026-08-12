import React from 'react';

export default function EmptyState({ title = 'Nothing here yet', message = '', action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3 text-xl">
        📭
      </div>
      <p className="text-sm text-slate-700 font-medium mb-1">{title}</p>
      {message && <p className="text-sm text-slate-500 mb-4 max-w-sm">{message}</p>}
      {action}
    </div>
  );
}
