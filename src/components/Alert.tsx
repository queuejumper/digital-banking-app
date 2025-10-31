import type { ReactNode } from "react";

export default function Alert({
  title,
  children,
  onClose,
  variant = "error",
}: {
  title?: string;
  children?: ReactNode;
  onClose?: () => void;
  variant?: "error" | "info" | "success";
}) {
  const styles =
    variant === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : variant === "info"
      ? "border-sky-200 bg-sky-50 text-sky-900"
      : "border-red-200 bg-red-50 text-red-900";

  return (
    <div className={`relative rounded-md border ${styles} px-3 py-2`}> 
      {title && <div className="font-medium">{title}</div>}
      {children && <div className="text-sm">{children}</div>}
      {onClose && (
        <button
          aria-label="Close alert"
          className="absolute right-2 top-2 rounded p-1 text-current/70 hover:bg-black/5"
          onClick={onClose}
        >
          ×
        </button>
      )}
    </div>
  );
}


