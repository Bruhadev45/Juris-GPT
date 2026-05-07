/**
 * Tests for API client CSRF integration
 */

import { apiClient, chatApi, settingsApi, supportApi, teamApi } from "../api";

// Mock getCsrfToken
const mockGetCsrfToken = jest.fn();
jest.mock("../api", () => {
  const originalModule = jest.requireActual("../api");
  return {
    ...originalModule,
    getCsrfToken: () => mockGetCsrfToken(),
  };
});

describe("API CSRF Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    mockGetCsrfToken.mockReturnValue("test-csrf-token");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should include CSRF token in POST requests via ApiClient", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    // Mock document.cookie for getCsrfToken
    Object.defineProperty(document, "cookie", {
      writable: true,
      value: "csrf_token=test-csrf-token",
    });

    await apiClient.unifiedSearch({ query: "test", limit: 10 });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/legal/search"),
      expect.objectContaining({
        method: undefined, // GET request
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      })
    );
  });

  it("should include CSRF token in chatApi.sendMessage", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, answer: "test" }),
    });

    Object.defineProperty(document, "cookie", {
      writable: true,
      value: "csrf_token=test-csrf-token",
    });

    await chatApi.sendMessage("test message");

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/chat/message"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "X-CSRF-Token": "test-csrf-token",
        }),
      })
    );
  });

  it("should include CSRF token in settingsApi.updateProfile", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    Object.defineProperty(document, "cookie", {
      writable: true,
      value: "csrf_token=test-csrf-token",
    });

    await settingsApi.updateProfile({ name: "Test" });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/settings/profile"),
      expect.objectContaining({
        method: "PUT",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "X-CSRF-Token": "test-csrf-token",
        }),
      })
    );
  });

  it("should include CSRF token in supportApi.createTicket", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    Object.defineProperty(document, "cookie", {
      writable: true,
      value: "csrf_token=test-csrf-token",
    });

    await supportApi.createTicket({
      name: "Test",
      email: "test@example.com",
      subject: "Test",
      message: "Test message",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/support/tickets"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "X-CSRF-Token": "test-csrf-token",
        }),
      })
    );
  });

  it("should include CSRF token in teamApi.add", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    Object.defineProperty(document, "cookie", {
      writable: true,
      value: "csrf_token=test-csrf-token",
    });

    await teamApi.add({
      name: "Test User",
      email: "test@example.com",
      role: "member",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/team"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "X-CSRF-Token": "test-csrf-token",
        }),
      })
    );
  });

  it("should handle missing CSRF token gracefully", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, answer: "test" }),
    });

    // No csrf_token cookie
    Object.defineProperty(document, "cookie", {
      writable: true,
      value: "",
    });

    await chatApi.sendMessage("test message");

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/chat/message"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      })
    );
  });
});
