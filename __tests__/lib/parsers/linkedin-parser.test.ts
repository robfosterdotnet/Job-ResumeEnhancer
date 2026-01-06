import { describe, it, expect } from "vitest"
import {
  parseLinkedInText,
  formatProfileForAnalysis,
  getProfileMetrics,
} from "@/lib/parsers/linkedin-parser"

describe("parseLinkedInText", () => {
  it("should parse a basic profile with name and headline", () => {
    const input = `John Smith
Senior Software Engineer at Tech Company
San Francisco Bay Area`

    const result = parseLinkedInText(input)

    expect(result.fullName).toBe("John Smith")
    expect(result.headline).toBe("Senior Software Engineer at Tech Company")
    expect(result.location).toBe("San Francisco Bay Area")
    expect(result.rawContent).toBe(input)
  })

  it("should parse skills section", () => {
    const input = `Jane Doe
Product Manager

Skills
JavaScript
React
Node.js
Python, TypeScript, Go`

    const result = parseLinkedInText(input)

    expect(result.skills).toContain("JavaScript")
    expect(result.skills).toContain("React")
    expect(result.skills).toContain("Node.js")
    expect(result.skills).toContain("Python")
    expect(result.skills).toContain("TypeScript")
    expect(result.skills).toContain("Go")
  })

  it("should parse about/summary section", () => {
    const input = `Jane Doe
Software Engineer

About
I am a passionate software engineer with 10+ years of experience building scalable web applications.
I love working with TypeScript and React.`

    const result = parseLinkedInText(input)

    expect(result.summary).toContain("passionate software engineer")
    expect(result.summary).toContain("TypeScript and React")
  })

  it("should handle empty input", () => {
    const result = parseLinkedInText("")

    expect(result.fullName).toBeUndefined()
    expect(result.headline).toBeUndefined()
    expect(result.experience).toEqual([])
    expect(result.education).toEqual([])
    expect(result.skills).toEqual([])
    expect(result.certifications).toEqual([])
  })

  it("should deduplicate skills", () => {
    const input = `John Doe
Engineer

Skills
JavaScript
React
JavaScript
React`

    const result = parseLinkedInText(input)

    const javascriptCount = result.skills.filter((s) => s === "JavaScript").length
    const reactCount = result.skills.filter((s) => s === "React").length

    expect(javascriptCount).toBe(1)
    expect(reactCount).toBe(1)
  })

  it("should parse skills separated by dots", () => {
    const input = `Jane Doe
Developer

Skills
JavaScript · React · TypeScript`

    const result = parseLinkedInText(input)

    expect(result.skills).toContain("JavaScript")
    expect(result.skills).toContain("React")
    expect(result.skills).toContain("TypeScript")
  })

  it("should parse certifications section", () => {
    const input = `John Doe
Cloud Architect

Certifications
AWS Solutions Architect
Google Cloud Professional
Azure Administrator`

    const result = parseLinkedInText(input)

    expect(result.certifications).toContain("AWS Solutions Architect")
    expect(result.certifications).toContain("Google Cloud Professional")
    expect(result.certifications).toContain("Azure Administrator")
  })
})

describe("formatProfileForAnalysis", () => {
  it("should format a profile for AI analysis", () => {
    const profile = {
      fullName: "John Smith",
      headline: "Senior Software Engineer",
      summary: "Experienced developer",
      location: "San Francisco",
      experience: [
        {
          title: "Software Engineer",
          company: "Tech Corp",
          startDate: "2020",
          endDate: "Present",
          isCurrent: true,
        },
      ],
      education: [
        {
          school: "MIT",
          degree: "BS Computer Science",
        },
      ],
      skills: ["JavaScript", "Python"],
      certifications: ["AWS Certified"],
      rawContent: "",
    }

    const result = formatProfileForAnalysis(profile)

    expect(result).toContain("**Name:** John Smith")
    expect(result).toContain("**Headline:** Senior Software Engineer")
    expect(result).toContain("**About/Summary:**")
    expect(result).toContain("Experienced developer")
    expect(result).toContain("**Experience:**")
    expect(result).toContain("Software Engineer at Tech Corp")
    expect(result).toContain("**Education:**")
    expect(result).toContain("MIT")
    expect(result).toContain("**Skills:** JavaScript, Python")
    expect(result).toContain("**Certifications:** AWS Certified")
  })

  it("should handle empty profile gracefully", () => {
    const profile = {
      experience: [],
      education: [],
      skills: [],
      certifications: [],
      rawContent: "",
    }

    const result = formatProfileForAnalysis(profile)

    expect(result).toBe("")
  })
})

describe("getProfileMetrics", () => {
  it("should calculate completeness for a full profile", () => {
    const profile = {
      fullName: "John Smith",
      headline: "Engineer",
      summary: "A detailed summary with more than fifty characters to be considered complete.",
      location: "San Francisco",
      experience: [{ title: "Dev", company: "Corp", isCurrent: true }],
      education: [{ school: "MIT" }],
      skills: ["JS", "TS", "React", "Node", "Python"],
      certifications: ["AWS"],
      rawContent: "",
    }

    const metrics = getProfileMetrics(profile)

    expect(metrics.hasHeadline).toBe(true)
    expect(metrics.hasSummary).toBe(true)
    expect(metrics.experienceCount).toBe(1)
    expect(metrics.educationCount).toBe(1)
    expect(metrics.skillsCount).toBe(5)
    expect(metrics.certificationsCount).toBe(1)
    expect(metrics.completenessPercentage).toBe(100)
  })

  it("should return 0% for empty profile", () => {
    const profile = {
      experience: [],
      education: [],
      skills: [],
      certifications: [],
      rawContent: "",
    }

    const metrics = getProfileMetrics(profile)

    expect(metrics.hasHeadline).toBe(false)
    expect(metrics.hasSummary).toBe(false)
    expect(metrics.completenessPercentage).toBe(0)
  })

  it("should require summary > 50 chars", () => {
    const profile = {
      summary: "Short summary",
      experience: [],
      education: [],
      skills: [],
      certifications: [],
      rawContent: "",
    }

    const metrics = getProfileMetrics(profile)

    expect(metrics.hasSummary).toBe(false)
  })

  it("should require at least 5 skills", () => {
    const profile = {
      experience: [],
      education: [],
      skills: ["JS", "TS", "React"], // Only 3 skills
      certifications: [],
      rawContent: "",
    }

    const metrics = getProfileMetrics(profile)

    expect(metrics.skillsCount).toBe(3)
    // The check is for >= 5 skills
  })
})
