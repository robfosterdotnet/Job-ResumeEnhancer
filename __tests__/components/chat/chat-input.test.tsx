import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ChatInput } from "@/components/chat/chat-input"

describe("ChatInput", () => {
  it("renders the textarea", () => {
    render(<ChatInput onSend={vi.fn()} />)
    expect(screen.getByPlaceholderText(/Ask a question/)).toBeInTheDocument()
  })

  it("renders the send button", () => {
    render(<ChatInput onSend={vi.fn()} />)
    expect(screen.getByRole("button")).toBeInTheDocument()
  })

  it("calls onSend with message when send button is clicked", () => {
    const onSend = vi.fn()
    render(<ChatInput onSend={onSend} />)

    const textarea = screen.getByPlaceholderText(/Ask a question/)
    fireEvent.change(textarea, { target: { value: "Test message" } })
    fireEvent.click(screen.getByRole("button"))

    expect(onSend).toHaveBeenCalledWith("Test message")
  })

  it("clears input after sending", () => {
    const onSend = vi.fn()
    render(<ChatInput onSend={onSend} />)

    const textarea = screen.getByPlaceholderText(/Ask a question/) as HTMLTextAreaElement
    fireEvent.change(textarea, { target: { value: "Test message" } })
    fireEvent.click(screen.getByRole("button"))

    expect(textarea.value).toBe("")
  })

  it("disables send button when input is empty", () => {
    render(<ChatInput onSend={vi.fn()} />)
    expect(screen.getByRole("button")).toBeDisabled()
  })

  it("enables send button when input has text", () => {
    render(<ChatInput onSend={vi.fn()} />)

    const textarea = screen.getByPlaceholderText(/Ask a question/)
    fireEvent.change(textarea, { target: { value: "Test" } })

    expect(screen.getByRole("button")).not.toBeDisabled()
  })

  it("renders suggestions when provided", () => {
    const suggestions = ["Suggestion 1", "Suggestion 2"]
    render(<ChatInput onSend={vi.fn()} suggestions={suggestions} />)

    expect(screen.getByText("Suggestion 1")).toBeInTheDocument()
    expect(screen.getByText("Suggestion 2")).toBeInTheDocument()
  })

  it("calls onSend when suggestion is clicked", () => {
    const onSend = vi.fn()
    const suggestions = ["Test suggestion"]
    render(<ChatInput onSend={onSend} suggestions={suggestions} />)

    fireEvent.click(screen.getByText("Test suggestion"))

    expect(onSend).toHaveBeenCalledWith("Test suggestion")
  })

  it("shows loading state when isLoading is true", () => {
    render(<ChatInput onSend={vi.fn()} isLoading={true} />)

    expect(screen.getByPlaceholderText(/Ask a question/)).toBeDisabled()
  })

  it("calls onSend on Enter key press", () => {
    const onSend = vi.fn()
    render(<ChatInput onSend={onSend} />)

    const textarea = screen.getByPlaceholderText(/Ask a question/)
    fireEvent.change(textarea, { target: { value: "Test" } })
    fireEvent.keyDown(textarea, { key: "Enter", code: "Enter" })

    expect(onSend).toHaveBeenCalledWith("Test")
  })

  it("does not call onSend on Shift+Enter", () => {
    const onSend = vi.fn()
    render(<ChatInput onSend={onSend} />)

    const textarea = screen.getByPlaceholderText(/Ask a question/)
    fireEvent.change(textarea, { target: { value: "Test" } })
    fireEvent.keyDown(textarea, { key: "Enter", code: "Enter", shiftKey: true })

    expect(onSend).not.toHaveBeenCalled()
  })
})
