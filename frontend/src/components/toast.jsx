import { useEffect } from "react";

const config = {
  success: {
    bg: "bg-emerald-50 border-emerald-400",
    icon: "bg-emerald-500",
    text: "text-emerald-800",
    bar: "bg-emerald-500",
    svg: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  error: {
    bg: "bg-red-50 border-red-400",
    icon: "bg-red-500",
    text: "text-red-800",
    bar: "bg-red-500",
    svg: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
  warning: {
    bg: "bg-amber-50 border-amber-400",
    icon: "bg-amber-500",
    text: "text-amber-800",
    bar: "bg-amber-500",
    svg: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 3l9.66 16.5H2.34L12 3z" />
      </svg>
    ),
  },
};

export default function Toast({ message, show, type = "success", onClose }) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => onClose(), 3500);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  const c = config[type] || config.success;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] animate-[toast-in_0.35s_ease-out]">
      <div className={`flex items-center gap-3 rounded-xl border-l-4 ${c.bg} px-5 py-4 shadow-xl backdrop-blur-sm min-w-[300px] max-w-[480px]`}>
        {/* icon */}
        <div className={`flex-shrink-0 h-9 w-9 rounded-full ${c.icon} flex items-center justify-center shadow-md`}>
          {c.svg}
        </div>

        {/* message */}
        <p className={`flex-1 text-sm font-medium ${c.text} leading-snug`}>{message}</p>

        {/* close btn */}
        <button
          onClick={onClose}
          className={`flex-shrink-0 rounded-full p-1 ${c.text} opacity-60 hover:opacity-100 transition-opacity`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* progress bar */}
      <div className="mt-0.5 mx-5 h-0.5 rounded-full overflow-hidden bg-black/5">
        <div className={`h-full ${c.bar} rounded-full animate-[toast-bar_3.5s_linear_forwards]`} />
      </div>

      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateX(-50%) translateY(-16px) scale(0.96); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
        @keyframes toast-bar {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}