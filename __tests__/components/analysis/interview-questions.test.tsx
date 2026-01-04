import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { InterviewQuestions } from "@/components/analysis/interview-questions"

describe("InterviewQuestions", () => {
  const mockQuestions = [
    {
      id: 1,
      question: "Tell me about yourself",
      category: "behavioral",
      suggestedAnswer: "I am a software engineer with 5 years of experience...",
      difficulty: "easy" as const,
    },
    {
      id: 2,
      question: "Explain how you would design a scalable system",
      category: "technical",
      suggestedAnswer: "I would start by identifying the requirements...",
      difficulty: "hard" as const,
    },
    {
      id: 3,
      question: "Describe a conflict with a coworker",
      category: "situational",
      suggestedAnswer: "In my previous role, I had a disagreement with...",
      difficulty: "medium" as const,
    },
  ]

  it("renders the total question count", () => {
    render(<InterviewQuestions questions={mockQuestions} />)
    expect(screen.getByText(/Interview Preparation \(3 Questions\)/)).toBeInTheDocument()
  })

  it("displays all questions when 'All' tab is active", () => {
    render(<InterviewQuestions questions={mockQuestions} />)
    expect(screen.getByText("Tell me about yourself")).toBeInTheDocument()
    expect(screen.getByText("Explain how you would design a scalable system")).toBeInTheDocument()
    expect(screen.getByText("Describe a conflict with a coworker")).toBeInTheDocument()
  })

  it("filters questions by category when a tab is clicked", () => {
    render(<InterviewQuestions questions={mockQuestions} />)

    // Click on technical tab
    const technicalTab = screen.getByRole("tab", { name: /technical/i })
    fireEvent.click(technicalTab)

    // Should only show technical question
    expect(screen.getByText("Explain how you would design a scalable system")).toBeInTheDocument()
    expect(screen.queryByText("Tell me about yourself")).not.toBeInTheDocument()
  })

  it("shows empty message when no questions available", () => {
    render(<InterviewQuestions questions={[]} />)
    expect(screen.getByText(/No questions in this category yet/)).toBeInTheDocument()
  })

  it("expands a question to show the suggested answer when clicked", () => {
    render(<InterviewQuestions questions={mockQuestions} />)

    const answer = "I am a software engineer with 5 years of experience..."

    // Click on question to expand
    fireEvent.click(screen.getByText("Tell me about yourself"))

    // After clicking, the answer should be in the document
    expect(screen.getByText(answer)).toBeInTheDocument()
  })

  it("shows all answers when 'Show All Answers' button is clicked", () => {
    render(<InterviewQuestions questions={mockQuestions} />)

    // Click show all answers button
    fireEvent.click(screen.getByRole("button", { name: /Show All Answers/i }))

    // All answers should be in the document
    expect(screen.getByText(/I am a software engineer/)).toBeInTheDocument()
    expect(screen.getByText(/I would start by identifying/)).toBeInTheDocument()
    expect(screen.getByText(/In my previous role/)).toBeInTheDocument()
  })

  it("handles null category gracefully", () => {
    const questionsWithNullCategory = [
      {
        id: 1,
        question: "Test question",
        category: null,
        suggestedAnswer: "Test answer",
        difficulty: "easy" as const,
      },
    ]

    render(<InterviewQuestions questions={questionsWithNullCategory} />)
    expect(screen.getByText("general")).toBeInTheDocument()
  })

  it("handles null difficulty gracefully", () => {
    const questionsWithNullDifficulty = [
      {
        id: 1,
        question: "Test question",
        category: "behavioral",
        suggestedAnswer: "Test answer",
        difficulty: null,
      },
    ]

    render(<InterviewQuestions questions={questionsWithNullDifficulty} />)
    expect(screen.getByText("Test question")).toBeInTheDocument()
    // Difficulty badge should not be present
    expect(screen.queryByText("easy")).not.toBeInTheDocument()
    expect(screen.queryByText("medium")).not.toBeInTheDocument()
    expect(screen.queryByText("hard")).not.toBeInTheDocument()
  })
})
