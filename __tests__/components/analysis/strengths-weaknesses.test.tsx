import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { StrengthsWeaknesses } from "@/components/analysis/strengths-weaknesses"

describe("StrengthsWeaknesses", () => {
  const mockStrengths = [
    { area: "Strong JavaScript skills", description: "5+ years of experience with modern JavaScript" },
    { area: "Team leadership", description: "Led teams of 5-10 developers" },
  ]

  const mockWeaknesses = [
    {
      area: "Limited cloud experience",
      description: "No AWS certifications",
      suggestion: "Consider getting AWS Solutions Architect certification"
    },
    {
      area: "No management experience",
      description: "Has not managed direct reports",
      suggestion: "Look for opportunities to mentor junior developers"
    },
  ]

  it("renders strengths count correctly", () => {
    render(<StrengthsWeaknesses strengths={mockStrengths} weaknesses={[]} />)
    expect(screen.getByText(/Strengths \(2\)/)).toBeInTheDocument()
  })

  it("renders weaknesses count correctly", () => {
    render(<StrengthsWeaknesses strengths={[]} weaknesses={mockWeaknesses} />)
    expect(screen.getByText(/Areas for Improvement \(2\)/)).toBeInTheDocument()
  })

  it("displays strength points and explanations", () => {
    render(<StrengthsWeaknesses strengths={mockStrengths} weaknesses={[]} />)
    expect(screen.getByText("Strong JavaScript skills")).toBeInTheDocument()
    expect(screen.getByText("5+ years of experience with modern JavaScript")).toBeInTheDocument()
  })

  it("displays weakness points with suggestions", () => {
    render(<StrengthsWeaknesses strengths={[]} weaknesses={mockWeaknesses} />)
    expect(screen.getByText("Limited cloud experience")).toBeInTheDocument()
    expect(screen.getByText(/Consider getting AWS Solutions Architect certification/)).toBeInTheDocument()
  })

  it("shows empty message when no strengths", () => {
    render(<StrengthsWeaknesses strengths={[]} weaknesses={mockWeaknesses} />)
    expect(screen.getByText("No strengths identified yet.")).toBeInTheDocument()
  })

  it("shows empty message when no weaknesses", () => {
    render(<StrengthsWeaknesses strengths={mockStrengths} weaknesses={[]} />)
    expect(screen.getByText("No weaknesses identified yet.")).toBeInTheDocument()
  })
})
