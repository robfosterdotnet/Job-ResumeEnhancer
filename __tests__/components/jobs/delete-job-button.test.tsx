import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { DeleteJobButton } from "@/components/jobs/delete-job-button"

// Mock next/navigation
const mockPush = vi.fn()
const mockRefresh = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}))

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe("DeleteJobButton", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  it("renders delete button with text by default", () => {
    render(<DeleteJobButton jobId={1} jobTitle="Software Engineer" />)
    expect(screen.getByRole("button", { name: /Delete/i })).toBeInTheDocument()
  })

  it("renders icon-only button when showText is false", () => {
    render(<DeleteJobButton jobId={1} jobTitle="Software Engineer" showText={false} />)
    const button = screen.getByRole("button")
    expect(button).toBeInTheDocument()
    expect(screen.queryByText("Delete")).not.toBeInTheDocument()
  })

  it("opens confirmation dialog when clicked", () => {
    render(<DeleteJobButton jobId={1} jobTitle="Software Engineer" />)

    const deleteButton = screen.getByRole("button", { name: /Delete/i })
    fireEvent.click(deleteButton)

    expect(screen.getByText("Delete Job Application")).toBeInTheDocument()
    expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument()
    expect(screen.getByText(/Software Engineer/)).toBeInTheDocument()
  })

  it("shows cancel button in dialog", () => {
    render(<DeleteJobButton jobId={1} jobTitle="Software Engineer" />)

    fireEvent.click(screen.getByRole("button", { name: /Delete/i }))

    expect(screen.getByRole("button", { name: /Cancel/i })).toBeInTheDocument()
  })

  it("closes dialog when cancel is clicked", () => {
    render(<DeleteJobButton jobId={1} jobTitle="Software Engineer" />)

    fireEvent.click(screen.getByRole("button", { name: /Delete/i }))
    expect(screen.getByText("Delete Job Application")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }))

    // Dialog should be closed
    expect(screen.queryByText("Delete Job Application")).not.toBeInTheDocument()
  })

  it("calls DELETE API when confirmed", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    })

    render(<DeleteJobButton jobId={42} jobTitle="Software Engineer" />)

    fireEvent.click(screen.getByRole("button", { name: /Delete/i }))

    // Click the delete button in the dialog (not the trigger)
    const confirmButton = screen.getAllByRole("button", { name: /Delete/i })[1]
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/jobs/42", {
        method: "DELETE",
      })
    })
  })

  it("redirects to /jobs after successful deletion", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    })

    render(<DeleteJobButton jobId={1} jobTitle="Software Engineer" />)

    fireEvent.click(screen.getByRole("button", { name: /Delete/i }))
    const confirmButton = screen.getAllByRole("button", { name: /Delete/i })[1]
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/jobs")
      expect(mockRefresh).toHaveBeenCalled()
    })
  })

  it("calls onDeleted callback instead of redirecting when provided", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    })

    const onDeleted = vi.fn()
    render(<DeleteJobButton jobId={1} jobTitle="Software Engineer" onDeleted={onDeleted} />)

    fireEvent.click(screen.getByRole("button", { name: /Delete/i }))
    const confirmButton = screen.getAllByRole("button", { name: /Delete/i })[1]
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(onDeleted).toHaveBeenCalled()
      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  it("shows loading state during deletion", async () => {
    mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves

    render(<DeleteJobButton jobId={1} jobTitle="Software Engineer" />)

    fireEvent.click(screen.getByRole("button", { name: /Delete/i }))
    const confirmButton = screen.getAllByRole("button", { name: /Delete/i })[1]
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(screen.getByText(/Deleting.../)).toBeInTheDocument()
    })
  })

  it("does not redirect on failed deletion", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    render(<DeleteJobButton jobId={1} jobTitle="Software Engineer" />)

    fireEvent.click(screen.getByRole("button", { name: /Delete/i }))
    const confirmButton = screen.getAllByRole("button", { name: /Delete/i })[1]
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled()
    })

    // Should not redirect
    expect(mockPush).not.toHaveBeenCalled()
  })
})
