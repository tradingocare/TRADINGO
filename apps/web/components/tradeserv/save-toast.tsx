import { CheckCircle } from 'lucide-react';

export function SaveToast({ show, message }: { show: boolean; message: string }) {
  if (!show) return null;
  return (
    <div className="fixed bottom-8 right-8 z-50 flex items-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-5 py-3 text-sm text-emerald-400 shadow-2xl backdrop-blur-xl animate-slide-up">
      <CheckCircle className="h-4 w-4" /> {message}
    </div>
  );
}
