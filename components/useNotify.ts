// Centralized notification hook for react-hot-toast
import { toast, ToastOptions } from "react-hot-toast";

export type NotifyType = "success" | "error" | "info";

export function useNotify() {
  // Usage: notify('Message', 'success')
  function notify(message: string, type: NotifyType = "info", options?: ToastOptions) {
    if (type === "success") toast.success(message, options);
    else if (type === "error") toast.error(message, options);
    else toast(message, options);
  }
  return notify;
}
