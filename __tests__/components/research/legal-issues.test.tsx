import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { LegalIssues } from "@/components/research/legal-issues"

describe("LegalIssues", () => {
  const mockIssues = [
    {
      id: 1,
      title: "Patent infringement lawsuit",
      description: "Lawsuit filed regarding AI technology patents",
      caseType: "Patent",
      status: "ongoing" as const,
      filingDate: new Date("2023-06-15"),
    },
    {
      id: 2,
      title: "Data privacy complaint",
      description: "Consumer complaint regarding data handling",
      caseType: "Privacy",
      status: "settled" as const,
      filingDate: new Date("2022-03-10"),
    },
  ]

  it("renders issue count", () => {
    render(<LegalIssues issues={mockIssues} />)
    expect(screen.getByText("Legal & Regulatory Issues")).toBeInTheDocument()
  })

  it("shows active issues count when there are active issues", () => {
    render(<LegalIssues issues={mockIssues} />)
    expect(screen.getByText("1 Active")).toBeInTheDocument()
  })

  it("displays no known legal issues message when empty", () => {
    render(<LegalIssues issues={[]} />)
    expect(screen.getByText("No Known Legal Issues")).toBeInTheDocument()
  })

  it("renders issue titles", () => {
    render(<LegalIssues issues={mockIssues} />)
    expect(screen.getByText("Patent infringement lawsuit")).toBeInTheDocument()
    expect(screen.getByText("Data privacy complaint")).toBeInTheDocument()
  })

  it("renders issue status badges", () => {
    render(<LegalIssues issues={mockIssues} />)
    expect(screen.getByText("Ongoing")).toBeInTheDocument()
    expect(screen.getByText("Settled")).toBeInTheDocument()
  })

  it("renders case type badges", () => {
    render(<LegalIssues issues={mockIssues} />)
    expect(screen.getByText("Patent")).toBeInTheDocument()
    expect(screen.getByText("Privacy")).toBeInTheDocument()
  })

  it("shows no active issues when all are resolved", () => {
    const resolvedIssues = [
      { ...mockIssues[0], status: "settled" as const },
      { ...mockIssues[1], status: "dismissed" as const },
    ]
    render(<LegalIssues issues={resolvedIssues} />)
    expect(screen.getByText("No Active Issues")).toBeInTheDocument()
  })
})
