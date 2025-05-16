// Updated use-toast.ts to use Sonner instead of the custom implementation
import { toast as sonnerToast } from "sonner";

type ToastProps = {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive" | "success" | "warning" | "info";
};

const toast = ({
  title,
  description,
  action,
  variant = "default",
}: ToastProps) => {
  // Map our variant to sonner's variant
  const sonnerVariant = variant === "destructive" ? "error" : variant;
  
  return sonnerToast[sonnerVariant === "default" ? "default" : sonnerVariant]({
    title,
    description,
    action,
    id: Math.random().toString(36).substring(2, 9),
  });
};

export function useToast() {
  return {
    toast,
    dismiss: sonnerToast.dismiss,
  };
}

export { toast };
