import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { ReadinessScore } from "@/components/dashboard/readiness-score"

describe("ReadinessScore", () => {
  const defaultCategories = [
    { category: "Behavioral", score: 75 },
    { category: "Technical", score: 60 },
    { category: "Situational", score: 80 },
  ]

  it("renders section title", () => {
    render(
      <ReadinessScore
        overallScore={72}
        categories={defaultCategories}
        totalSessions={5}
      />
    )
    expect(screen.getByText("Interview Readiness")).toBeInTheDocument()
  })

  it("renders overall score", () => {
    render(
      <ReadinessScore
        overallScore={72}
        categories={defaultCategories}
        totalSessions={5}
      />
    )
    expect(screen.getByText("72")).toBeInTheDocument()
    expect(screen.getByText("/100")).toBeInTheDocument()
  })

  it("renders session count", () => {
    render(
      <ReadinessScore
        overallScore={72}
        categories={defaultCategories}
        totalSessions={5}
      />
    )
    expect(screen.getByText(/Based on 5 practice sessions/)).toBeInTheDocument()
  })

  it("renders singular session text for 1 session", () => {
    render(
      <ReadinessScore
        overallScore={72}
        categories={defaultCategories}
        totalSessions={1}
      />
    )
    expect(screen.getByText(/Based on 1 practice session$/)).toBeInTheDocument()
  })

  it("renders category breakdown", () => {
    render(
      <ReadinessScore
        overallScore={72}
        categories={defaultCategories}
        totalSessions={5}
      />
    )
    expect(screen.getByText("Behavioral")).toBeInTheDocument()
    expect(screen.getByText("Technical")).toBeInTheDocument()
    expect(screen.getByText("Situational")).toBeInTheDocument()
  })

  it("renders category scores", () => {
    render(
      <ReadinessScore
        overallScore={72}
        categories={defaultCategories}
        totalSessions={5}
      />
    )
    expect(screen.getByText("75%")).toBeInTheDocument()
    expect(screen.getByText("60%")).toBeInTheDocument()
    expect(screen.getByText("80%")).toBeInTheDocument()
  })

  it("shows empty state when no sessions", () => {
    render(
      <ReadinessScore
        overallScore={0}
        categories={[]}
        totalSessions={0}
      />
    )
    expect(screen.getByText(/Complete a mock interview/)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Start Practice/i })).toBeInTheDocument()
  })

  it("applies green color for high scores (80+)", () => {
    render(
      <ReadinessScore
        overallScore={85}
        categories={defaultCategories}
        totalSessions={5}
      />
    )
    const scoreElement = screen.getByText("85")
    expect(scoreElement).toHaveClass("text-green-600")
  })

  it("applies yellow color for medium scores (60-79)", () => {
    render(
      <ReadinessScore
        overallScore={65}
        categories={defaultCategories}
        totalSessions={5}
      />
    )
    const scoreElement = screen.getByText("65")
    expect(scoreElement).toHaveClass("text-yellow-600")
  })

  it("applies red color for low scores (<60)", () => {
    render(
      <ReadinessScore
        overallScore={45}
        categories={defaultCategories}
        totalSessions={5}
      />
    )
    const scoreElement = screen.getByText("45")
    expect(scoreElement).toHaveClass("text-red-600")
  })

  it("shows practice button for weakest category", () => {
    render(
      <ReadinessScore
        overallScore={72}
        categories={defaultCategories}
        weakestCategory="Technical"
        totalSessions={5}
      />
    )
    expect(screen.getByRole("link", { name: /Practice Technical Questions/i })).toBeInTheDocument()
  })
})
