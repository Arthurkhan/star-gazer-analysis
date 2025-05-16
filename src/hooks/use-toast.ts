// src/hooks/use-toast.ts
// A clean implementation using Sonner directly, without any potential circular dependencies
import { toast as sonnerToast } from "sonner";

type ToastProps = {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive" | "success" | "warning" | "info";
};

// Map our variants to sonner's variants
const variantMap = {
  default: "default",
  destructive: "error",
  success: "success",
  warning: "warning",
  info: "info"
} as const;

const toast = ({
  title,
  description,
  action,
  variant = "default",
}: ToastProps) => {
  // Get the sonner variant
  const sonnerVariant = variantMap[variant] || "default";
  
  // Use the appropriate sonner toast function
  return sonnerToast[sonnerVariant]({
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
