import { AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { useConfirmStore } from "../hooks/useConfirm";

export function ConfirmDialog() {
  const {
    isOpen,
    title,
    message,
    confirmText,
    cancelText,
    variant,
    confirm,
    cancel,
  } = useConfirmStore();

  if (!isOpen) return null;

  const variantStyles = {
    danger: "bg-red-600 hover:bg-red-700",
    warning: "bg-orange-600 hover:bg-orange-700",
    info: "bg-primary hover:bg-orange-600",
  };

  const variantIcons = {
    danger: <AlertCircle className="text-red-600" size={48} />,
    warning: <AlertTriangle className="text-orange-600" size={48} />,
    info: <Info className="text-blue-600" size={48} />,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-dark-light rounded-lg shadow-2xl max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-4">
            {variantIcons[variant || "info"]}
            <h2 className="text-xl font-bold text-white">{title}</h2>
          </div>
          <button
            onClick={cancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-gray-300 leading-relaxed">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-700">
          <button
            onClick={cancel}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={confirm}
            className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors font-medium ${variantStyles[variant || "info"]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
