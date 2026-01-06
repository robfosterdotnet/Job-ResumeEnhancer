import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { LinkedInProfileInput } from "@/components/linkedin/linkedin-profile-input"

describe("LinkedInProfileInput", () => {
  const mockOnSubmit = vi.fn()

  beforeEach(() => {
    mockOnSubmit.mockClear()
  })

  it("should render input fields", () => {
    render(<LinkedInProfileInput onSubmit={mockOnSubmit} />)

    expect(screen.getByLabelText(/profile content/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/target role/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/target industry/i)).toBeInTheDocument()
  })

  it("should render the analyze button", () => {
    render(<LinkedInProfileInput onSubmit={mockOnSubmit} />)

    expect(screen.getByRole("button", { name: /analyze profile/i })).toBeInTheDocument()
  })

  it("should disable analyze button when profile content is empty", () => {
    render(<LinkedInProfileInput onSubmit={mockOnSubmit} />)

    const button = screen.getByRole("button", { name: /analyze profile/i })
    expect(button).toBeDisabled()
  })

  it("should enable analyze button when profile content is entered", () => {
    render(<LinkedInProfileInput onSubmit={mockOnSubmit} />)

    const textarea = screen.getByLabelText(/profile content/i)
    fireEvent.change(textarea, { target: { value: "John Doe\nSoftware Engineer" } })

    const button = screen.getByRole("button", { name: /analyze profile/i })
    expect(button).not.toBeDisabled()
  })

  it("should call onSubmit with correct data", () => {
    render(<LinkedInProfileInput onSubmit={mockOnSubmit} />)

    const textarea = screen.getByLabelText(/profile content/i)
    const roleInput = screen.getByLabelText(/target role/i)
    const industryInput = screen.getByLabelText(/target industry/i)

    fireEvent.change(textarea, { target: { value: "John Doe\nSoftware Engineer" } })
    fireEvent.change(roleInput, { target: { value: "Senior Developer" } })
    fireEvent.change(industryInput, { target: { value: "Technology" } })

    const button = screen.getByRole("button", { name: /analyze profile/i })
    fireEvent.click(button)

    expect(mockOnSubmit).toHaveBeenCalledWith({
      profileContent: "John Doe\nSoftware Engineer",
      targetRole: "Senior Developer",
      targetIndustry: "Technology",
    })
  })

  it("should show loading state when isLoading is true", () => {
    render(<LinkedInProfileInput onSubmit={mockOnSubmit} isLoading={true} />)

    expect(screen.getByRole("button", { name: /analyzing/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /analyzing/i })).toBeDisabled()
  })

  it("should show paste from clipboard button", () => {
    render(<LinkedInProfileInput onSubmit={mockOnSubmit} />)

    expect(screen.getByRole("button", { name: /paste from clipboard/i })).toBeInTheDocument()
  })

  it("should display word count when content is entered", () => {
    render(<LinkedInProfileInput onSubmit={mockOnSubmit} />)

    const textarea = screen.getByLabelText(/profile content/i)
    fireEvent.change(textarea, { target: { value: "one two three four five" } })

    expect(screen.getByText(/5 words/i)).toBeInTheDocument()
  })

  it("should render instructions on how to copy profile", () => {
    render(<LinkedInProfileInput onSubmit={mockOnSubmit} />)

    expect(screen.getByText(/how to copy your profile/i)).toBeInTheDocument()
    expect(screen.getByText(/go to your linkedin profile page/i)).toBeInTheDocument()
  })

  it("should accept initial target role value", () => {
    render(
      <LinkedInProfileInput
        onSubmit={mockOnSubmit}
        initialTargetRole="Software Engineer"
      />
    )

    const roleInput = screen.getByLabelText(/target role/i)
    expect(roleInput).toHaveValue("Software Engineer")
  })

  it("should accept initial target industry value", () => {
    render(
      <LinkedInProfileInput
        onSubmit={mockOnSubmit}
        initialTargetIndustry="Technology"
      />
    )

    const industryInput = screen.getByLabelText(/target industry/i)
    expect(industryInput).toHaveValue("Technology")
  })
})
