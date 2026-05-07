/**
 * Tests for error handling utilities
 */

import { toast } from "sonner";
import { getErrorMessage, handleApiError, handleApiSuccess, handleApiWarning } from "../error-handler";

// Mock sonner
jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  },
}));

describe("Error Handler Utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getErrorMessage", () => {
    it("should extract message from Error object", () => {
      const error = new Error("Test error");
      expect(getErrorMessage(error)).toBe("Test error");
    });

    it("should return string error as-is", () => {
      expect(getErrorMessage("String error")).toBe("String error");
    });

    it("should extract message from API error with message field", () => {
      const error = { message: "API error message" };
      expect(getErrorMessage(error)).toBe("API error message");
    });

    it("should extract message from API error with detail field", () => {
      const error = { detail: "API error detail" };
      expect(getErrorMessage(error)).toBe("API error detail");
    });

    it("should extract message from API error with error field", () => {
      const error = { error: "API error string" };
      expect(getErrorMessage(error)).toBe("API error string");
    });

    it("should return default message for unknown error types", () => {
      expect(getErrorMessage(null)).toBe("An unexpected error occurred");
      expect(getErrorMessage(undefined)).toBe("An unexpected error occurred");
      expect(getErrorMessage(42)).toBe("An unexpected error occurred");
      expect(getErrorMessage({})).toBe("An unexpected error occurred");
    });
  });

  describe("handleApiError", () => {
    it("should log error and show toast", () => {
      const error = new Error("Test error");
      handleApiError(error);

      expect(console.error).toHaveBeenCalledWith("API Error:", {
        context: undefined,
        error,
        message: "Test error",
      });
      expect(toast.error).toHaveBeenCalledWith("Test error");
    });

    it("should include context in error message", () => {
      const error = new Error("Test error");
      handleApiError(error, "Test context");

      expect(console.error).toHaveBeenCalledWith("API Error:", {
        context: "Test context",
        error,
        message: "Test error",
      });
      expect(toast.error).toHaveBeenCalledWith("Test context: Test error");
    });
  });

  describe("handleApiSuccess", () => {
    it("should show success toast", () => {
      handleApiSuccess("Operation successful");
      expect(toast.success).toHaveBeenCalledWith("Operation successful");
    });
  });

  describe("handleApiWarning", () => {
    it("should show warning toast", () => {
      handleApiWarning("Warning message");
      expect(toast.warning).toHaveBeenCalledWith("Warning message");
    });
  });
});
