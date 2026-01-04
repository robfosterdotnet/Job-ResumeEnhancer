import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { FitScoreGauge } from "@/components/analysis/fit-score-gauge"

describe("FitScoreGauge", () => {
  it("renders the score correctly", () => {
    render(<FitScoreGauge score={75} />)
    expect(screen.getByText("75%")).toBeInTheDocument()
  })

  it("renders the label when showLabel is true", () => {
    render(<FitScoreGauge score={75} showLabel={true} />)
    expect(screen.getByText("Fit Score")).toBeInTheDocument()
  })

  it("hides the label when showLabel is false", () => {
    render(<FitScoreGauge score={75} showLabel={false} />)
    expect(screen.queryByText("Fit Score")).not.toBeInTheDocument()
  })

  it("clamps score to 0 when negative", () => {
    render(<FitScoreGauge score={-10} />)
    expect(screen.getByText("0%")).toBeInTheDocument()
  })

  it("clamps score to 100 when exceeding max", () => {
    render(<FitScoreGauge score={150} />)
    expect(screen.getByText("100%")).toBeInTheDocument()
  })

  it("applies correct size classes for different sizes", () => {
    const { rerender } = render(<FitScoreGauge score={50} size="sm" />)
    let container = screen.getByText("50%").closest("div")?.parentElement
    expect(container).toHaveClass("w-24", "h-24")

    rerender(<FitScoreGauge score={50} size="md" />)
    container = screen.getByText("50%").closest("div")?.parentElement
    expect(container).toHaveClass("w-32", "h-32")

    rerender(<FitScoreGauge score={50} size="lg" />)
    container = screen.getByText("50%").closest("div")?.parentElement
    expect(container).toHaveClass("w-48", "h-48")
  })
})
