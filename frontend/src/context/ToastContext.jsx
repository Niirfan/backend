import { createContext, useContext, useState, useCallback } from "react";
import Toast from "../components/toast";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showToast = useCallback((message, type = "success") => {
    setToast({ show: true, message, type });
  }, []);

  const showSuccess = useCallback((msg) => showToast(msg, "success"), [showToast]);
  const showError = useCallback((msg) => showToast(msg, "error"), [showToast]);
  const showWarning = useCallback((msg) => showToast(msg, "warning"), [showToast]);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, show: false }));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning }}>
      {children}
      <Toast
        message={toast.message}
        show={toast.show}
        type={toast.type}
        onClose={hideToast}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
