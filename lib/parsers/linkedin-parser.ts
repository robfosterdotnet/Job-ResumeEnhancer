/**
 * LinkedIn Profile Parser
 *
 * Parses LinkedIn profile content that users copy/paste from their profile page.
 * Since LinkedIn blocks automated scraping, users manually copy their profile content.
 */

export interface LinkedInExperience {
  title: string
  company: string
  location?: string
  startDate?: string
  endDate?: string
  description?: string
  isCurrent: boolean
}

export interface LinkedInEducation {
  school: string
  degree?: string
  field?: string
  startYear?: number
  endYear?: number
}

export interface LinkedInProfile {
  fullName?: string
  headline?: string
  summary?: string
  location?: string
  experience: LinkedInExperience[]
  education: LinkedInEducation[]
  skills: string[]
  certifications: string[]
  rawContent: string
}

/**
 * Parse LinkedIn profile from pasted text
 * Users will copy from their LinkedIn profile page
 */
export function parseLinkedInText(text: string): LinkedInProfile {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)

  const profile: LinkedInProfile = {
    experience: [],
    education: [],
    skills: [],
    certifications: [],
    rawContent: text,
  }

  let currentSection = ""
  let currentExperience: Partial<LinkedInExperience> | null = null
  let currentEducation: Partial<LinkedInEducation> | null = null
  let summaryLines: string[] = []

  // Common section markers in LinkedIn copy/paste
  const sectionMarkers: Record<string, string> = {
    experience: "experience",
    education: "education",
    skills: "skills",
    about: "about",
    summary: "summary",
    licenses: "licenses",
    certifications: "certifications",
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lowerLine = line.toLowerCase()

    // Detect section headers
    let foundSection = false
    for (const [key, marker] of Object.entries(sectionMarkers)) {
      if (lowerLine === marker || lowerLine.startsWith(marker + " ")) {
        // Save any pending experience/education
        if (currentExperience?.title && currentExperience?.company) {
          profile.experience.push({
            title: currentExperience.title,
            company: currentExperience.company,
            location: currentExperience.location,
            startDate: currentExperience.startDate,
            endDate: currentExperience.endDate,
            description: currentExperience.description,
            isCurrent: currentExperience.isCurrent ?? false,
          })
        }
        if (currentEducation?.school) {
          profile.education.push({
            school: currentEducation.school,
            degree: currentEducation.degree,
            field: currentEducation.field,
            startYear: currentEducation.startYear,
            endYear: currentEducation.endYear,
          })
        }
        currentExperience = null
        currentEducation = null

        // Handle about/summary section
        if (currentSection === "about" || currentSection === "summary") {
          profile.summary = summaryLines.join(" ").trim()
          summaryLines = []
        }

        currentSection = key
        foundSection = true
        break
      }
    }
    if (foundSection) continue

    // First few non-section lines are likely name, headline, location
    if (!currentSection && i < 5) {
      if (!profile.fullName && line.length > 2 && line.length < 80) {
        // Likely the name - usually first substantial line
        profile.fullName = line
        continue
      }
      if (profile.fullName && !profile.headline && line.length > 5 && line.length < 200) {
        // Headline usually comes after name
        profile.headline = line
        continue
      }
      if (profile.headline && !profile.location && line.length < 100) {
        // Location might include city, state, country
        if (
          lowerLine.includes(",") ||
          lowerLine.includes("area") ||
          lowerLine.includes("united") ||
          lowerLine.includes("state")
        ) {
          profile.location = line
          continue
        }
      }
    }

    // Process based on current section
    switch (currentSection) {
      case "about":
      case "summary":
        summaryLines.push(line)
        break

      case "experience":
        // Experience parsing - look for patterns like "Title at Company"
        // or "Title" followed by "Company" on next line
        if (!currentExperience) {
          currentExperience = { title: line, isCurrent: false }
        } else if (!currentExperience.company) {
          // Check if this line looks like a company name
          if (line.length < 100 && !line.includes("·")) {
            currentExperience.company = line
          }
        } else if (!currentExperience.startDate && line.includes("-")) {
          // Date range pattern: "Jan 2020 - Present" or "2020 - 2023"
          const dateMatch = line.match(
            /(\w+\s+\d{4}|\d{4})\s*[-–]\s*(\w+\s+\d{4}|\d{4}|[Pp]resent)/
          )
          if (dateMatch) {
            currentExperience.startDate = dateMatch[1]
            currentExperience.endDate = dateMatch[2]
            currentExperience.isCurrent =
              dateMatch[2].toLowerCase() === "present"
          }
        } else if (line.length > 50) {
          // Longer lines are likely descriptions
          currentExperience.description =
            (currentExperience.description || "") + line + " "
        } else if (line.length < 50 && !currentExperience.location) {
          // Short lines might be location
          currentExperience.location = line
        }
        break

      case "education":
        if (!currentEducation) {
          currentEducation = { school: line }
        } else if (!currentEducation.degree) {
          // Look for degree patterns
          const degreePatterns = [
            "bachelor",
            "master",
            "ph.d",
            "phd",
            "mba",
            "b.s.",
            "b.a.",
            "m.s.",
            "m.a.",
            "associate",
            "diploma",
            "certificate",
          ]
          if (degreePatterns.some((p) => lowerLine.includes(p))) {
            currentEducation.degree = line
          } else if (line.length < 100) {
            currentEducation.field = line
          }
        } else {
          // Look for years
          const yearMatch = line.match(/(\d{4})\s*[-–]?\s*(\d{4})?/)
          if (yearMatch) {
            currentEducation.startYear = parseInt(yearMatch[1])
            if (yearMatch[2]) {
              currentEducation.endYear = parseInt(yearMatch[2])
            }
          }
        }
        break

      case "skills":
        // Skills are often listed one per line or comma-separated
        if (line.includes(",")) {
          const skills = line.split(",").map((s) => s.trim()).filter(Boolean)
          profile.skills.push(...skills)
        } else if (line.includes("·")) {
          // LinkedIn sometimes uses · as separator
          const skills = line.split("·").map((s) => s.trim()).filter(Boolean)
          profile.skills.push(...skills)
        } else if (line.length < 50 && !lowerLine.includes("show all")) {
          // Individual skill
          profile.skills.push(line)
        }
        break

      case "licenses":
      case "certifications":
        if (line.length < 100 && !lowerLine.includes("show")) {
          profile.certifications.push(line)
        }
        break
    }

    // Check if we should save current experience/education (new entry starting)
    if (currentSection === "experience" && currentExperience?.company) {
      // If we see what looks like a new title (short line, no dates)
      const nextLine = lines[i + 1]?.toLowerCase() || ""
      if (
        line.length < 60 &&
        !line.includes("-") &&
        !line.includes("·") &&
        nextLine &&
        !nextLine.includes("-") &&
        i > 0
      ) {
        // Might be starting a new experience entry
        if (
          currentExperience.title &&
          currentExperience.company &&
          currentExperience.title !== line
        ) {
          profile.experience.push({
            title: currentExperience.title,
            company: currentExperience.company,
            location: currentExperience.location,
            startDate: currentExperience.startDate,
            endDate: currentExperience.endDate,
            description: currentExperience.description?.trim(),
            isCurrent: currentExperience.isCurrent ?? false,
          })
          currentExperience = { title: line, isCurrent: false }
        }
      }
    }
  }

  // Save any remaining summary
  if (summaryLines.length > 0) {
    profile.summary = summaryLines.join(" ").trim()
  }

  // Save any remaining experience/education
  if (currentExperience?.title && currentExperience?.company) {
    profile.experience.push({
      title: currentExperience.title,
      company: currentExperience.company,
      location: currentExperience.location,
      startDate: currentExperience.startDate,
      endDate: currentExperience.endDate,
      description: currentExperience.description?.trim(),
      isCurrent: currentExperience.isCurrent ?? false,
    })
  }
  if (currentEducation?.school) {
    profile.education.push({
      school: currentEducation.school,
      degree: currentEducation.degree,
      field: currentEducation.field,
      startYear: currentEducation.startYear,
      endYear: currentEducation.endYear,
    })
  }

  // Deduplicate skills
  profile.skills = [...new Set(profile.skills)]

  return profile
}

/**
 * Format profile sections for AI analysis
 */
export function formatProfileForAnalysis(profile: LinkedInProfile): string {
  let formatted = ""

  if (profile.fullName) {
    formatted += `**Name:** ${profile.fullName}\n\n`
  }

  if (profile.headline) {
    formatted += `**Headline:** ${profile.headline}\n\n`
  }

  if (profile.location) {
    formatted += `**Location:** ${profile.location}\n\n`
  }

  if (profile.summary) {
    formatted += `**About/Summary:**\n${profile.summary}\n\n`
  }

  if (profile.experience.length > 0) {
    formatted += `**Experience:**\n`
    profile.experience.forEach((exp) => {
      formatted += `- ${exp.title} at ${exp.company}`
      if (exp.startDate) {
        formatted += ` (${exp.startDate} - ${exp.endDate || "Present"})`
      }
      if (exp.location) {
        formatted += ` | ${exp.location}`
      }
      formatted += "\n"
      if (exp.description) {
        formatted += `  ${exp.description}\n`
      }
    })
    formatted += "\n"
  }

  if (profile.education.length > 0) {
    formatted += `**Education:**\n`
    profile.education.forEach((edu) => {
      formatted += `- ${edu.school}`
      if (edu.degree) {
        formatted += `, ${edu.degree}`
      }
      if (edu.field) {
        formatted += ` in ${edu.field}`
      }
      if (edu.startYear || edu.endYear) {
        formatted += ` (${edu.startYear || "?"} - ${edu.endYear || "?"})`
      }
      formatted += "\n"
    })
    formatted += "\n"
  }

  if (profile.skills.length > 0) {
    formatted += `**Skills:** ${profile.skills.join(", ")}\n\n`
  }

  if (profile.certifications.length > 0) {
    formatted += `**Certifications:** ${profile.certifications.join(", ")}\n\n`
  }

  return formatted
}

/**
 * Extract key metrics from a profile for quick display
 */
export function getProfileMetrics(profile: LinkedInProfile): {
  hasHeadline: boolean
  hasSummary: boolean
  experienceCount: number
  educationCount: number
  skillsCount: number
  certificationsCount: number
  completenessPercentage: number
} {
  const checks = [
    !!profile.fullName,
    !!profile.headline,
    !!profile.summary && profile.summary.length > 50,
    profile.experience.length > 0,
    profile.education.length > 0,
    profile.skills.length >= 5,
    profile.certifications.length > 0,
    !!profile.location,
  ]

  const completenessPercentage = Math.round(
    (checks.filter(Boolean).length / checks.length) * 100
  )

  return {
    hasHeadline: !!profile.headline,
    hasSummary: !!profile.summary && profile.summary.length > 50,
    experienceCount: profile.experience.length,
    educationCount: profile.education.length,
    skillsCount: profile.skills.length,
    certificationsCount: profile.certifications.length,
    completenessPercentage,
  }
}
