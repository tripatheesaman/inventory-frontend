'use client'

import { useToast } from "@/components/ui/use-toast"

interface ToastProps {
  title: string;
  message: string;
}

export function useCustomToast() {
  const { toast } = useToast();

  const showSuccessToast = ({ title, message }: ToastProps) => {
    toast({
      title,
      description: message,
      className: "bg-green-600 text-white border-none",
    });
  };

  const showErrorToast = ({ title, message }: ToastProps) => {
    toast({
      title,
      description: message,
      variant: "destructive",
      className: "bg-red-600 text-white border-none",
    });
  };

  return {
    showSuccessToast,
    showErrorToast,
  };
} 