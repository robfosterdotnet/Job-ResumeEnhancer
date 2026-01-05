import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { PipelineCard } from "@/components/dashboard/pipeline-card"
import { DndContext } from "@dnd-kit/core"

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))

// Wrapper component for DnD context
const DndWrapper = ({ children }: { children: React.ReactNode }) => (
  <DndContext>{children}</DndContext>
)

describe("PipelineCard", () => {
  const defaultProps = {
    id: 1,
    title: "Software Engineer",
    company: "Acme Corp",
    fitScore: 85,
    status: "applied",
  }

  it("renders job title", () => {
    render(
      <DndWrapper>
        <PipelineCard {...defaultProps} />
      </DndWrapper>
    )
    expect(screen.getByText("Software Engineer")).toBeInTheDocument()
  })

  it("renders company name", () => {
    render(
      <DndWrapper>
        <PipelineCard {...defaultProps} />
      </DndWrapper>
    )
    expect(screen.getByText("Acme Corp")).toBeInTheDocument()
  })

  it("renders fit score badge when provided", () => {
    render(
      <DndWrapper>
        <PipelineCard {...defaultProps} />
      </DndWrapper>
    )
    expect(screen.getByText("85% fit")).toBeInTheDocument()
  })

  it("does not render fit score badge when null", () => {
    render(
      <DndWrapper>
        <PipelineCard {...defaultProps} fitScore={null} />
      </DndWrapper>
    )
    expect(screen.queryByText(/fit$/)).not.toBeInTheDocument()
  })

  it("does not render company when null", () => {
    render(
      <DndWrapper>
        <PipelineCard {...defaultProps} company={null} />
      </DndWrapper>
    )
    expect(screen.queryByText("Acme Corp")).not.toBeInTheDocument()
  })

  it("renders fit score badge for high scores (80+)", () => {
    render(
      <DndWrapper>
        <PipelineCard {...defaultProps} fitScore={85} />
      </DndWrapper>
    )
    const badge = screen.getByText("85% fit")
    // Badge should have success-related classes (bg-success)
    expect(badge).toHaveClass("bg-success")
  })

  it("renders fit score badge for medium scores (60-79)", () => {
    render(
      <DndWrapper>
        <PipelineCard {...defaultProps} fitScore={65} />
      </DndWrapper>
    )
    const badge = screen.getByText("65% fit")
    // Badge should have warning-related classes (bg-warning)
    expect(badge).toHaveClass("bg-warning")
  })

  it("renders fit score badge for low scores (<60)", () => {
    render(
      <DndWrapper>
        <PipelineCard {...defaultProps} fitScore={45} />
      </DndWrapper>
    )
    const badge = screen.getByText("45% fit")
    // Badge should have destructive-related classes (bg-destructive)
    expect(badge).toHaveClass("bg-destructive")
  })

  it("links to job detail page", () => {
    render(
      <DndWrapper>
        <PipelineCard {...defaultProps} />
      </DndWrapper>
    )
    const link = screen.getByRole("link")
    expect(link).toHaveAttribute("href", "/jobs/1")
  })

  it("applies dragging styles when isDragging is true", () => {
    const { container } = render(
      <DndWrapper>
        <PipelineCard {...defaultProps} isDragging={true} />
      </DndWrapper>
    )
    expect(container.querySelector(".opacity-50")).toBeInTheDocument()
  })
})
