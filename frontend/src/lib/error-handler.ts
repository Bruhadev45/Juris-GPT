import { toast } from "sonner";

/**
 * Extract a user-friendly error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === "object") {
    // Handle API error responses
    if ("message" in error && typeof error.message === "string") {
      return error.message;
    }
    if ("detail" in error && typeof error.detail === "string") {
      return error.detail;
    }
    if ("error" in error && typeof error.error === "string") {
      return error.error;
    }
  }

  return "An unexpected error occurred";
}

/**
 * Centralized error handler for API and application errors.
 * Logs errors and displays user-friendly toast notifications.
 */
export function handleApiError(error: unknown, context?: string): void {
  const message = getErrorMessage(error);
  const fullMessage = context ? `${context}: ${message}` : message;

  // Log error for debugging
  console.error("API Error:", {
    context,
    error,
    message,
  });

  // Show user-friendly toast notification
  toast.error(fullMessage);
}

/**
 * Handle success responses with toast notifications
 */
export function handleApiSuccess(message: string): void {
  toast.success(message);
}

/**
 * Handle warning messages with toast notifications
 */
export function handleApiWarning(message: string): void {
  toast.warning(message);
}

/**
 * Handle info messages with toast notifications
 */
export function handleApiInfo(message: string): void {
  toast.info(message);
}
