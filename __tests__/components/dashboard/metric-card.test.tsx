import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { MetricCard } from "@/components/dashboard/metric-card"
import { Briefcase } from "lucide-react"

describe("MetricCard", () => {
  it("renders title and value", () => {
    render(<MetricCard title="Total Jobs" value={42} icon={Briefcase} />)
    expect(screen.getByText("Total Jobs")).toBeInTheDocument()
    expect(screen.getByText("42")).toBeInTheDocument()
  })

  it("renders string value", () => {
    render(<MetricCard title="Status" value="Active" icon={Briefcase} />)
    expect(screen.getByText("Active")).toBeInTheDocument()
  })

  it("renders positive trend with green color and up arrow", () => {
    render(<MetricCard title="Jobs" value={10} icon={Briefcase} trend={5} />)
    expect(screen.getByText("+5")).toBeInTheDocument()
    const trendContainer = screen.getByText("+5").closest("div")
    expect(trendContainer).toHaveClass("text-green-600")
  })

  it("renders negative trend with red color and down arrow", () => {
    render(<MetricCard title="Jobs" value={10} icon={Briefcase} trend={-3} />)
    expect(screen.getByText("-3")).toBeInTheDocument()
    const trendContainer = screen.getByText("-3").closest("div")
    expect(trendContainer).toHaveClass("text-red-600")
  })

  it("renders zero trend with muted color", () => {
    render(<MetricCard title="Jobs" value={10} icon={Briefcase} trend={0} />)
    expect(screen.getByText("0")).toBeInTheDocument()
    const trendContainer = screen.getByText("0").closest("div")
    expect(trendContainer).toHaveClass("text-muted-foreground")
  })

  it("renders trend label when provided", () => {
    render(
      <MetricCard title="Jobs" value={10} icon={Briefcase} trend={5} trendLabel="this week" />
    )
    expect(screen.getByText("+5 this week")).toBeInTheDocument()
  })

  it("does not render trend section when trend is undefined", () => {
    const { container } = render(<MetricCard title="Jobs" value={10} icon={Briefcase} />)
    const trendElements = container.querySelectorAll(".text-xs")
    expect(trendElements.length).toBe(0)
  })

  it("applies custom className", () => {
    const { container } = render(
      <MetricCard title="Jobs" value={10} icon={Briefcase} className="custom-class" />
    )
    expect(container.querySelector(".custom-class")).toBeInTheDocument()
  })
})
