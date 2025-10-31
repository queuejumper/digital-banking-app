import { useEffect, useState } from "react";

export type ToastKind = "success" | "warning" | "error" | "info";

export function Toast({ message, kind = "info", onClose }: { message: string; kind?: ToastKind; onClose?: () => void }) {
  const color = kind === "success" ? "bg-emerald-600" : kind === "warning" ? "bg-amber-500" : kind === "error" ? "bg-red-600" : "bg-slate-800";
  return (
    <div className={`text-white ${color} rounded-md shadow px-3 py-2 text-sm`}>{message}</div>
  );
}

export default function Toaster({ queue }: { queue: { id: number; message: string; kind?: ToastKind }[] }) {
  const [items, setItems] = useState(queue);
  useEffect(() => {
    setItems(queue);
  }, [queue]);
  return (
    <div className="fixed right-4 top-16 z-[100] grid gap-2">
      {items.map((t) => (
        <Toast key={t.id} message={t.message} kind={t.kind} />
      ))}
    </div>
  );
}


