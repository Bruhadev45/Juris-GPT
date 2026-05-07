/**
 * Tests for ChatContext error handling
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { ChatProvider, useChat } from "../chat-context";

// Test component that uses the chat context
function TestComponent() {
  const { conversations, hydrated } = useChat();
  return (
    <div>
      <div data-testid="hydrated">{hydrated ? "hydrated" : "not hydrated"}</div>
      <div data-testid="conversations-count">{conversations.length}</div>
    </div>
  );
}

describe("ChatContext Error Handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
    localStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should handle corrupted localStorage data gracefully", async () => {
    // Set corrupted data in localStorage
    localStorage.setItem("jurisgpt-chat-state", "invalid-json{{{");

    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("hydrated")).toHaveTextContent("hydrated");
    });

    // Should log error
    expect(console.error).toHaveBeenCalledWith(
      "Failed to load chat state from localStorage:",
      expect.any(Error)
    );

    // Should show 0 conversations (fallback to empty state)
    expect(screen.getByTestId("conversations-count")).toHaveTextContent("0");
  });

  it("should load valid localStorage data correctly", async () => {
    const validState = {
      conversations: [
        {
          id: "test-1",
          title: "Test Conversation",
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      activeConversationId: null,
    };

    localStorage.setItem("jurisgpt-chat-state", JSON.stringify(validState));

    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("hydrated")).toHaveTextContent("hydrated");
    });

    expect(screen.getByTestId("conversations-count")).toHaveTextContent("1");
    expect(console.error).not.toHaveBeenCalled();
  });

  it("should handle missing localStorage data", async () => {
    // No data in localStorage
    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("hydrated")).toHaveTextContent("hydrated");
    });

    expect(screen.getByTestId("conversations-count")).toHaveTextContent("0");
    expect(console.error).not.toHaveBeenCalled();
  });

  it("should log error when saving state fails", async () => {
    // Mock localStorage.setItem to throw
    const setItemSpy = jest.spyOn(Storage.prototype, "setItem");
    setItemSpy.mockImplementation(() => {
      throw new Error("Storage quota exceeded");
    });

    render(
      <ChatProvider>
        <TestComponent />
      </ChatProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("hydrated")).toHaveTextContent("hydrated");
    });

    // Should log error when trying to save state
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        "Failed to save chat state:",
        expect.any(Error)
      );
    });
  });

  it("should throw error when useChat is used outside provider", () => {
    // Temporarily suppress error boundary errors for this test
    const originalError = console.error;
    console.error = jest.fn();

    function ComponentWithoutProvider() {
      try {
        useChat();
        return <div>Should not render</div>;
      } catch (error) {
        return <div data-testid="error">{(error as Error).message}</div>;
      }
    }

    render(<ComponentWithoutProvider />);

    expect(screen.getByTestId("error")).toHaveTextContent(
      "useChat must be used within a ChatProvider"
    );

    console.error = originalError;
  });
});
