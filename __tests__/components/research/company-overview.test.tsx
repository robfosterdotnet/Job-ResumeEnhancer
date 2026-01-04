import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { CompanyOverview } from "@/components/research/company-overview"

describe("CompanyOverview", () => {
  const mockCompany = {
    name: "Anthropic",
    website: "https://anthropic.com",
    industry: "AI/ML",
    description: "AI safety company",
    headquarters: "San Francisco, CA",
    employeeCount: 500,
    foundedYear: 2021,
    isPublic: false,
    stockSymbol: null,
  }

  it("renders company name", () => {
    render(<CompanyOverview company={mockCompany} />)
    expect(screen.getByText("Anthropic")).toBeInTheDocument()
  })

  it("renders industry badge", () => {
    render(<CompanyOverview company={mockCompany} />)
    expect(screen.getByText("AI/ML")).toBeInTheDocument()
  })

  it("renders headquarters", () => {
    render(<CompanyOverview company={mockCompany} />)
    expect(screen.getByText("Headquarters")).toBeInTheDocument()
    expect(screen.getByText("San Francisco, CA")).toBeInTheDocument()
  })

  it("renders employee count as number", () => {
    render(<CompanyOverview company={mockCompany} />)
    expect(screen.getByText("500")).toBeInTheDocument()
  })

  it("renders employee count as string", () => {
    const companyWithStringCount = { ...mockCompany, employeeCount: "1,000+" }
    render(<CompanyOverview company={companyWithStringCount} />)
    expect(screen.getByText("1,000+")).toBeInTheDocument()
  })

  it("renders founded year", () => {
    render(<CompanyOverview company={mockCompany} />)
    expect(screen.getByText("Founded")).toBeInTheDocument()
    expect(screen.getByText("2021")).toBeInTheDocument()
  })

  it("renders website link", () => {
    render(<CompanyOverview company={mockCompany} />)
    const websiteLink = screen.getByText("anthropic.com")
    expect(websiteLink).toBeInTheDocument()
    expect(websiteLink.closest("a")).toHaveAttribute("href", "https://anthropic.com")
  })

  it("renders stock symbol for public company", () => {
    const publicCompany = { ...mockCompany, isPublic: true, stockSymbol: "ANTH" }
    render(<CompanyOverview company={publicCompany} />)
    expect(screen.getByText("ANTH")).toBeInTheDocument()
  })

  it("renders research summary when provided", () => {
    const research = { researchSummary: "Leading AI safety research company" }
    render(<CompanyOverview company={mockCompany} research={research} />)
    expect(screen.getByText("Leading AI safety research company")).toBeInTheDocument()
  })
})
