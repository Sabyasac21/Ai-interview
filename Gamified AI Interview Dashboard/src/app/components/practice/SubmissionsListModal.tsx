import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface SubmissionsListModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissions: any[];
  onView: (submission: any) => void;
  onOpen?: () => void;
}

export const SubmissionsListModal: React.FC<SubmissionsListModalProps> = ({ isOpen, onClose, submissions, onView, onOpen }) => {
  useEffect(() => {
    if (isOpen && onOpen) {
      onOpen();
    }
  }, [isOpen, onOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 border-b border-slate-800">
          <h3 className="text-lg font-semibold text-white">Recent Submissions</h3>
          <p className="text-sm text-slate-400 mt-1">Submissions judged by the backend for this question.</p>
        </div>

        <div className="p-4 max-h-96 overflow-auto">
          {submissions.length === 0 ? (
            <p className="text-sm text-slate-500">No submissions found for this question.</p>
          ) : (
            <ul className="space-y-2">
              {submissions.map((s, idx) => (
                <li key={s.submission_id || s.id || idx} className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-md p-3">
                  <div>
                    <div className="text-sm font-medium text-slate-200">
                      {s.passed || s.correct ? (
                        <span className="text-emerald-400">Passed</span>
                      ) : s.status === 'processing' || s.status === 'queued' ? (
                        <span className="text-yellow-400">Pending</span>
                      ) : (
                        <span className="text-red-400">Failed</span>
                      )}
                      {s.score ? <span className="text-slate-400 ml-2">• {s.score} pts</span> : null}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{new Date(s.completed_at || s.submitted_at || s.created_at || Date.now()).toLocaleString()}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => onView(s)} className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-sm">View</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmissionsListModal;
