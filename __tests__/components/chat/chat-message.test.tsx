import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { ChatMessage } from "@/components/chat/chat-message"

describe("ChatMessage", () => {
  it("renders user message content", () => {
    render(<ChatMessage role="user" content="Hello, how can you help?" />)
    expect(screen.getByText("Hello, how can you help?")).toBeInTheDocument()
  })

  it("renders assistant message content", () => {
    render(<ChatMessage role="assistant" content="I can help you with your resume." />)
    expect(screen.getByText("I can help you with your resume.")).toBeInTheDocument()
  })

  it("applies different styling for user messages", () => {
    const { container } = render(<ChatMessage role="user" content="Test" />)
    const messageDiv = container.querySelector("[class*='flex-row-reverse']")
    expect(messageDiv).toBeInTheDocument()
  })

  it("applies different styling for assistant messages", () => {
    const { container } = render(<ChatMessage role="assistant" content="Test" />)
    const messageDiv = container.querySelector("[class*='flex-row']")
    expect(messageDiv).toBeInTheDocument()
  })

  it("renders timestamp when provided", () => {
    const timestamp = new Date("2024-01-15T10:30:00")
    render(<ChatMessage role="user" content="Test" timestamp={timestamp} />)
    // Check for the time format (hh:mm)
    expect(screen.getByText(/10:30/)).toBeInTheDocument()
  })

  it("does not render timestamp when not provided", () => {
    const { container } = render(<ChatMessage role="user" content="Test" />)
    const timeElements = container.querySelectorAll("p.text-xs")
    expect(timeElements.length).toBe(0)
  })
})
