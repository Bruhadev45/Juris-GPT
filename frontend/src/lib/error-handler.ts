import { toast } from "sonner";

/**
 * Centralized error handler for API and application errors.
 * Logs errors and displays user-friendly toast notifications.
 */
export function handleApiError(error: unknown, context: string): string {
  const message = error instanceof Error ? error.message : "An error occurred";
  console.error(`[${context}]`, error);
  toast.error(message);
  return message;
}

/**
 * Extract error message from various error formats.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unexpected error occurred";
}
