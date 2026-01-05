import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { ActivityFeed } from "@/components/dashboard/activity-feed"

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe("ActivityFeed", () => {
  const mockActivities = [
    {
      id: 1,
      activityType: "job_created",
      title: "Added Software Engineer at Acme Corp",
      description: "New job application",
      createdAt: new Date().toISOString(),
      jobApplication: {
        id: 1,
        title: "Software Engineer",
        company: "Acme Corp",
      },
    },
    {
      id: 2,
      activityType: "analysis_completed",
      title: "Resume analysis complete",
      description: "Fit score: 85%",
      createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      jobApplication: {
        id: 1,
        title: "Software Engineer",
        company: "Acme Corp",
      },
    },
  ]

  beforeEach(() => {
    mockFetch.mockReset()
  })

  it("renders section title", () => {
    render(<ActivityFeed initialActivities={mockActivities} initialHasMore={false} />)
    expect(screen.getByText("Activity")).toBeInTheDocument()
  })

  it("renders all activities", () => {
    render(<ActivityFeed initialActivities={mockActivities} initialHasMore={false} />)
    expect(screen.getByText("Added Software Engineer at Acme Corp")).toBeInTheDocument()
    expect(screen.getByText("Resume analysis complete")).toBeInTheDocument()
  })

  it("renders activity descriptions", () => {
    render(<ActivityFeed initialActivities={mockActivities} initialHasMore={false} />)
    expect(screen.getByText("New job application")).toBeInTheDocument()
    expect(screen.getByText("Fit score: 85%")).toBeInTheDocument()
  })

  it("groups activities by date", () => {
    render(<ActivityFeed initialActivities={mockActivities} initialHasMore={false} />)
    expect(screen.getByText("Today")).toBeInTheDocument()
    expect(screen.getByText("Yesterday")).toBeInTheDocument()
  })

  it("renders empty state when no activities", () => {
    render(<ActivityFeed initialActivities={[]} initialHasMore={false} />)
    expect(screen.getByText(/activity feed will appear here/i)).toBeInTheDocument()
  })

  it("shows Load More button when hasMore is true", () => {
    render(<ActivityFeed initialActivities={mockActivities} initialHasMore={true} />)
    expect(screen.getByRole("button", { name: /Load More/i })).toBeInTheDocument()
  })

  it("hides Load More button when hasMore is false", () => {
    render(<ActivityFeed initialActivities={mockActivities} initialHasMore={false} />)
    expect(screen.queryByRole("button", { name: /Load More/i })).not.toBeInTheDocument()
  })

  it("calls API when Load More is clicked", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        activities: [
          {
            id: 3,
            activityType: "resume_uploaded",
            title: "Resume uploaded",
            createdAt: new Date(Date.now() - 172800000).toISOString(),
          },
        ],
        pagination: { hasMore: false },
      }),
    })

    render(<ActivityFeed initialActivities={mockActivities} initialHasMore={true} />)

    const loadMoreButton = screen.getByRole("button", { name: /Load More/i })
    fireEvent.click(loadMoreButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/dashboard/activity?offset=2&limit=10"
      )
    })
  })

  it("shows loading state when loading more", async () => {
    mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves

    render(<ActivityFeed initialActivities={mockActivities} initialHasMore={true} />)

    const loadMoreButton = screen.getByRole("button", { name: /Load More/i })
    fireEvent.click(loadMoreButton)

    await waitFor(() => {
      expect(screen.getByText(/Loading.../i)).toBeInTheDocument()
    })
  })

  it("has refresh button", () => {
    render(<ActivityFeed initialActivities={mockActivities} initialHasMore={false} />)
    const buttons = screen.getAllByRole("button")
    expect(buttons.length).toBeGreaterThan(0)
  })

  it("calls refresh API when refresh button is clicked", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        activities: mockActivities,
        pagination: { hasMore: false },
      }),
    })

    render(<ActivityFeed initialActivities={mockActivities} initialHasMore={false} />)

    // Find the refresh button (first button)
    const refreshButton = screen.getAllByRole("button")[0]
    fireEvent.click(refreshButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/dashboard/activity?limit=20")
    })
  })
})
