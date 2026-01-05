import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { SkillGapChart } from "@/components/dashboard/skill-gap-chart"

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe("SkillGapChart", () => {
  const mockSkillGaps = [
    { id: 1, skill: "TypeScript", occurrenceCount: 8, percentage: 80, isLearned: false },
    { id: 2, skill: "React", occurrenceCount: 7, percentage: 70, isLearned: false },
    { id: 3, skill: "Python", occurrenceCount: 5, percentage: 50, isLearned: true },
  ]

  beforeEach(() => {
    mockFetch.mockReset()
  })

  it("renders section title", () => {
    render(<SkillGapChart initialSkillGaps={mockSkillGaps} totalJobs={10} />)
    expect(screen.getByText("Skills to Develop")).toBeInTheDocument()
  })

  it("renders unlearned skills", () => {
    render(<SkillGapChart initialSkillGaps={mockSkillGaps} totalJobs={10} />)
    expect(screen.getByText("TypeScript")).toBeInTheDocument()
    expect(screen.getByText("React")).toBeInTheDocument()
  })

  it("renders learned skills in separate section", () => {
    render(<SkillGapChart initialSkillGaps={mockSkillGaps} totalJobs={10} />)
    expect(screen.getByText("Python")).toBeInTheDocument()
    expect(screen.getByText(/Learned \(1\)/)).toBeInTheDocument()
  })

  it("renders job percentages for skills", () => {
    render(<SkillGapChart initialSkillGaps={mockSkillGaps} totalJobs={10} />)
    expect(screen.getByText("80% of jobs")).toBeInTheDocument()
    expect(screen.getByText("70% of jobs")).toBeInTheDocument()
  })

  it("renders total jobs description", () => {
    render(<SkillGapChart initialSkillGaps={mockSkillGaps} totalJobs={10} />)
    expect(screen.getByText(/Skills appearing in 10 jobs/)).toBeInTheDocument()
  })

  it("renders singular job text when totalJobs is 1", () => {
    render(<SkillGapChart initialSkillGaps={mockSkillGaps} totalJobs={1} />)
    expect(screen.getByText(/Skills appearing in 1 job$/)).toBeInTheDocument()
  })

  it("renders empty state when no skill gaps", () => {
    render(<SkillGapChart initialSkillGaps={[]} totalJobs={0} />)
    expect(screen.getByText(/Complete resume analyses/)).toBeInTheDocument()
  })

  it("has learned button for unlearned skills", () => {
    render(<SkillGapChart initialSkillGaps={mockSkillGaps} totalJobs={10} />)
    const learnedButtons = screen.getAllByRole("button", { name: /Learned/i })
    // 2 unlearned skills each have a "Learned" button
    expect(learnedButtons.length).toBeGreaterThanOrEqual(2)
  })

  it("calls API when marking skill as learned", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ skillGap: { ...mockSkillGaps[0], isLearned: true } }),
    })

    render(<SkillGapChart initialSkillGaps={mockSkillGaps} totalJobs={10} />)

    // Click the first "Learned" button (for TypeScript)
    const learnedButtons = screen.getAllByRole("button", { name: /Learned/i })
    fireEvent.click(learnedButtons[0])

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/dashboard/skill-gaps/1",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ isLearned: true }),
        })
      )
    })
  })

  it("calls API when unmarking skill as learned", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ skillGap: { ...mockSkillGaps[2], isLearned: false } }),
    })

    render(<SkillGapChart initialSkillGaps={mockSkillGaps} totalJobs={10} />)

    // Click the Python button (learned skill)
    const pythonButton = screen.getByRole("button", { name: /Python/i })
    fireEvent.click(pythonButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/dashboard/skill-gaps/3",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ isLearned: false }),
        })
      )
    })
  })

  it("shows only top 5 unlearned skills", () => {
    const manySkills = [
      { id: 1, skill: "Skill1", occurrenceCount: 10, percentage: 100, isLearned: false },
      { id: 2, skill: "Skill2", occurrenceCount: 9, percentage: 90, isLearned: false },
      { id: 3, skill: "Skill3", occurrenceCount: 8, percentage: 80, isLearned: false },
      { id: 4, skill: "Skill4", occurrenceCount: 7, percentage: 70, isLearned: false },
      { id: 5, skill: "Skill5", occurrenceCount: 6, percentage: 60, isLearned: false },
      { id: 6, skill: "Skill6", occurrenceCount: 5, percentage: 50, isLearned: false },
      { id: 7, skill: "Skill7", occurrenceCount: 4, percentage: 40, isLearned: false },
    ]

    render(<SkillGapChart initialSkillGaps={manySkills} totalJobs={10} />)

    expect(screen.getByText("Skill1")).toBeInTheDocument()
    expect(screen.getByText("Skill5")).toBeInTheDocument()
    // Skill6 and Skill7 should not be visible (beyond top 5)
    expect(screen.queryByText("Skill6")).not.toBeInTheDocument()
    expect(screen.queryByText("Skill7")).not.toBeInTheDocument()
  })
})
