import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { Suggestions } from "@/components/dashboard/suggestions"

describe("Suggestions", () => {
  const mockSuggestions = [
    {
      id: "analyze-1",
      priority: "high" as const,
      type: "action" as const,
      title: "Analyze resume for Software Engineer",
      description: "Get your fit score and interview prep questions.",
      actionUrl: "/jobs/1",
      jobApplicationId: 1,
    },
    {
      id: "apply-2",
      priority: "high" as const,
      type: "action" as const,
      title: "Strong fit! Apply to Product Manager",
      description: "Your fit score is 85%",
      actionUrl: "/jobs/2",
      jobApplicationId: 2,
    },
    {
      id: "followup-3",
      priority: "medium" as const,
      type: "reminder" as const,
      title: "Follow up with Acme Corp",
      description: "Applied 10 days ago",
      actionUrl: "/jobs/3",
      jobApplicationId: 3,
    },
  ]

  it("renders section title", () => {
    render(<Suggestions suggestions={mockSuggestions} />)
    expect(screen.getByText("Suggested Next Steps")).toBeInTheDocument()
  })

  it("renders all suggestions", () => {
    render(<Suggestions suggestions={mockSuggestions} />)
    expect(screen.getByText("Analyze resume for Software Engineer")).toBeInTheDocument()
    expect(screen.getByText("Strong fit! Apply to Product Manager")).toBeInTheDocument()
    expect(screen.getByText("Follow up with Acme Corp")).toBeInTheDocument()
  })

  it("renders suggestion descriptions", () => {
    render(<Suggestions suggestions={mockSuggestions} />)
    expect(screen.getByText("Get your fit score and interview prep questions.")).toBeInTheDocument()
    expect(screen.getByText("Your fit score is 85%")).toBeInTheDocument()
    expect(screen.getByText("Applied 10 days ago")).toBeInTheDocument()
  })

  it("renders empty state when no suggestions", () => {
    render(<Suggestions suggestions={[]} />)
    expect(screen.getByText(/all caught up/i)).toBeInTheDocument()
  })

  it("renders links for suggestions with actionUrl", () => {
    render(<Suggestions suggestions={mockSuggestions} />)
    const links = screen.getAllByRole("link")
    expect(links.length).toBe(3)
    expect(links[0]).toHaveAttribute("href", "/jobs/1")
    expect(links[1]).toHaveAttribute("href", "/jobs/2")
    expect(links[2]).toHaveAttribute("href", "/jobs/3")
  })

  it("renders suggestion without link when no actionUrl", () => {
    const suggestionWithoutUrl = [
      {
        id: "tip-1",
        priority: "low" as const,
        type: "tip" as const,
        title: "Learn TypeScript",
        description: "This skill appears in 5 of your target jobs.",
      },
    ]
    render(<Suggestions suggestions={suggestionWithoutUrl} />)
    expect(screen.getByText("Learn TypeScript")).toBeInTheDocument()
    expect(screen.queryByRole("link")).not.toBeInTheDocument()
  })

  it("applies correct styling for high priority", () => {
    const highPriority = [mockSuggestions[0]]
    const { container } = render(<Suggestions suggestions={highPriority} />)
    expect(container.querySelector(".bg-red-50")).toBeInTheDocument()
  })

  it("applies correct styling for medium priority", () => {
    const mediumPriority = [mockSuggestions[2]]
    const { container } = render(<Suggestions suggestions={mediumPriority} />)
    expect(container.querySelector(".bg-yellow-50")).toBeInTheDocument()
  })
})
