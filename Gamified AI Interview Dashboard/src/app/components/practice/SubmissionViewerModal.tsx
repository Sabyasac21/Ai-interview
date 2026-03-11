import React, { useState } from 'react';
import { X, CheckCircle, XCircle, ClipboardCopy } from 'lucide-react';

interface SubmissionViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: any | null;
}

export const SubmissionViewerModal: React.FC<SubmissionViewerModalProps> = ({ isOpen, onClose, submission }) => {
  if (!isOpen || !submission) return null;

  const status = submission.passed ?? submission.correct ? 'passed' : (submission.status || 'failed');
  const date = submission.completed_at || submission.submitted_at || submission.created_at || null;
  const code = submission.code || submission.submission || submission.payload || submission.submitted_code || submission.source || null;

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (code) {
      navigator.clipboard.writeText(code).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {
        // ignore
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 border-b border-slate-800 flex items-start gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" aria-hidden>
            {status === 'passed' ? (
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            ) : (
              <XCircle className="w-8 h-8 text-red-400" />
            )}
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">Submission Details</h3>
            <p className="text-sm text-slate-400">{status === 'passed' ? 'Passed' : submission.status || 'Failed/Pending'}</p>
            {date && <p className="text-xs text-slate-500 mt-1">{new Date(date).toLocaleString()}</p>}
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-slate-300 mb-2">Submitted Code</h4>
            {code && (
              <button
                onClick={handleCopy}
                className="relative p-1 text-slate-400 hover:text-white"
                title={copied ? 'Copied!' : 'Copy code'}
              >
                <ClipboardCopy className="w-5 h-5" />
                {copied && (
                  <span className="absolute -top-5 right-0 text-xs bg-slate-700 text-white rounded px-1">
                    Copied
                  </span>
                )}
              </button>
            )}
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 overflow-auto max-h-72">
            {code ? (
              <pre className="text-sm text-slate-200 whitespace-pre-wrap">{code}</pre>
            ) : (
              <p className="text-sm text-slate-500">Code not available for this submission.</p>
            )}
          </div>

          {submission.results && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-slate-300 mb-2">Test Results</h4>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                <p className="text-sm text-slate-300">{submission.testsPassed ?? submission.tests_passed ?? submission.testsPassed}/{submission.testsTotal ?? submission.tests_total ?? submission.testsTotal} passed</p>
              </div>
            </div>
          )}

          {submission.feedback && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-slate-300 mb-2">Feedback</h4>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                <p className="text-sm text-slate-400">{submission.feedback}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmissionViewerModal;
