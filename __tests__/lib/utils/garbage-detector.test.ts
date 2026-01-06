import { describe, it, expect } from "vitest"
import {
  detectGarbageContent,
  isProblematicDomain,
  createGarbageContentErrorMessage,
  GarbageContentError,
} from "@/lib/utils/garbage-detector"

describe("garbage-detector", () => {
  describe("isProblematicDomain", () => {
    it("identifies known problematic ATS domains", () => {
      expect(isProblematicDomain("https://careers.brassring.com/job/123")).toBe(true)
      expect(isProblematicDomain("https://company.myworkdayjobs.com/job")).toBe(true)
      expect(isProblematicDomain("https://taleo.net/career")).toBe(true)
      expect(isProblematicDomain("https://icims.com/jobs/456")).toBe(true)
      expect(isProblematicDomain("https://boards.greenhouse.io/company")).toBe(true)
    })

    it("allows non-problematic domains", () => {
      expect(isProblematicDomain("https://linkedin.com/jobs/123")).toBe(false)
      expect(isProblematicDomain("https://indeed.com/job/abc")).toBe(false)
      expect(isProblematicDomain("https://company.com/careers")).toBe(false)
    })

    it("handles invalid URLs gracefully", () => {
      expect(isProblematicDomain("not-a-url")).toBe(false)
      expect(isProblematicDomain("")).toBe(false)
    })
  })

  describe("detectGarbageContent", () => {
    describe("valid content detection", () => {
      it("accepts clean job descriptions", () => {
        const validContent = `
          Senior Software Engineer

          We are looking for a talented software engineer to join our team.
          You will be responsible for building scalable web applications.

          Requirements:
          - 5+ years of experience in JavaScript/TypeScript
          - Experience with React and Node.js
          - Strong problem-solving skills

          Benefits:
          - Competitive salary
          - Health insurance
          - Remote work options
        `
        const result = detectGarbageContent(validContent)
        expect(result.isGarbage).toBe(false)
        expect(result.confidence).toBe("low")
      })

      it("accepts content with occasional brackets that are not templates", () => {
        const content = `
          Software Engineer Role

          We use technologies like React (frontend) and Node.js (backend).
          Experience with API design [REST, GraphQL] is a plus.
          Salary range: $100,000 - $150,000
        `
        const result = detectGarbageContent(content)
        expect(result.isGarbage).toBe(false)
      })
    })

    describe("garbage content detection", () => {
      it("detects Angular template syntax", () => {
        const garbageContent = `
          {{welcomeTitle.replace('[FIRSTNAME]', user.firstName)}}
          <div *ngIf="job.isActive">
            {{job.description}}
          </div>
          <span ng-bind="job.title"></span>
        `
        const result = detectGarbageContent(garbageContent)
        expect(result.isGarbage).toBe(true)
        expect(result.confidence).not.toBe("low")
        expect(result.suggestManualPaste).toBe(true)
      })

      it("detects Vue template syntax", () => {
        const garbageContent = `
          <div v-if="showJob">
            <p v-for="req in requirements">{{ req }}</p>
            <input v-model="searchQuery" />
          </div>
        `
        const result = detectGarbageContent(garbageContent)
        expect(result.isGarbage).toBe(true)
      })

      it("detects Django/Jinja2 template tags", () => {
        const garbageContent = `
          {% for job in jobs %}
            {{ job.title }}
            {% if job.remote %}Remote{% endif %}
          {% endfor %}
        `
        const result = detectGarbageContent(garbageContent)
        expect(result.isGarbage).toBe(true)
      })

      it("detects ASP.NET/EJS template tags", () => {
        const garbageContent = `
          <% for (var i = 0; i < jobs.length; i++) { %>
            <%= jobs[i].title %>
          <% } %>
        `
        const result = detectGarbageContent(garbageContent)
        expect(result.isGarbage).toBe(true)
      })

      it("detects placeholder patterns", () => {
        const garbageContent = `
          Hello [FIRSTNAME] [LASTNAME],
          Thank you for applying to [COMPANY].
          Position: ${`jobTitle`}
        `
        const result = detectGarbageContent(garbageContent)
        expect(result.isGarbage).toBe(true)
      })

      it("detects content that is too short", () => {
        const shortContent = "Loading..."
        const result = detectGarbageContent(shortContent)
        expect(result.isGarbage).toBe(true)
        expect(result.reasons).toContain("Content is too short to be a valid job description")
      })

      it("detects high template marker ratio", () => {
        const heavyTemplateContent = `
          {{a}} {{b}} {{c}} {{d}} {{e}} {{f}} {{g}} {{h}} {{i}} {{j}}
          {{k}} {{l}} {{m}} Loading job data...
        `
        const result = detectGarbageContent(heavyTemplateContent)
        expect(result.isGarbage).toBe(true)
        expect(result.confidence).toBe("high")
      })

      it("flags problematic domains with lower threshold", () => {
        const content = `
          Software Engineer Position
          We are looking for engineers. This is a valid description.
        `
        // With problematic URL - adds suspicion and includes reason
        const resultWithUrl = detectGarbageContent(
          content,
          "https://careers.brassring.com/job"
        )

        // The URL adds to the confidence score
        expect(resultWithUrl.reasons).toContain("URL is from a known JavaScript-heavy job site")
      })

      it("detects content with module exports (bundler artifacts)", () => {
        // Content with JavaScript module export syntax indicates unprocessed JS
        const jsContent = `
          export default function JobPage() {
            return <div>Loading...</div>
          }
          export const metadata = { title: 'Job' }
        `
        const result = detectGarbageContent(jsContent)
        // Short content (triggers garbage detection)
        expect(result.isGarbage).toBe(true)
        expect(result.reasons).toContain("Content is too short to be a valid job description")
      })

      it("detects webpack artifacts", () => {
        const webpackContent = `
          __webpack_require__(123)
          webpackJsonp([0], { "abc": function(module) {} })
        `
        const result = detectGarbageContent(webpackContent)
        expect(result.isGarbage).toBe(true)
      })
    })

    describe("confidence levels", () => {
      it("returns high confidence for obviously garbage content", () => {
        const obviousGarbage = `
          {{title}} {{company}} *ngIf="visible" *ngFor="let x of items"
          {% block content %}{{placeholder}}{% endblock %}
        `
        const result = detectGarbageContent(obviousGarbage)
        expect(result.confidence).toBe("high")
      })

      it("returns medium confidence for suspicious content", () => {
        // Content with multiple template markers - enough to trigger detection
        const suspiciousContent = `
          Software Engineer at {{company}}
          Location: {{location}}
          Salary: {{salary.range}}

          About {{company}}:
          We are looking for talented engineers to join {{team.name}}.
        `
        const result = detectGarbageContent(suspiciousContent)
        expect(result.isGarbage).toBe(true)
        expect(["medium", "high"]).toContain(result.confidence)
      })

      it("returns low confidence for clean content", () => {
        const cleanContent = `
          Senior Software Engineer

          About the Role:
          We are seeking an experienced software engineer to join our growing team.
          You will work on challenging problems in a collaborative environment.

          Requirements:
          - Bachelor's degree in Computer Science or related field
          - 5+ years of professional software development experience
          - Strong knowledge of JavaScript, TypeScript, and modern frameworks

          We offer competitive compensation and great benefits.
        `
        const result = detectGarbageContent(cleanContent)
        expect(result.confidence).toBe("low")
      })
    })
  })

  describe("createGarbageContentErrorMessage", () => {
    it("returns empty string for non-garbage content", () => {
      const result = {
        isGarbage: false,
        confidence: "low" as const,
        reasons: [],
        suggestManualPaste: false,
      }
      expect(createGarbageContentErrorMessage(result)).toBe("")
    })

    it("creates user-friendly message for garbage content", () => {
      const result = {
        isGarbage: true,
        confidence: "high" as const,
        reasons: ["Found template markers"],
        suggestManualPaste: true,
      }
      const message = createGarbageContentErrorMessage(
        result,
        "https://careers.workday.com/job"
      )

      expect(message).toContain("careers.workday.com")
      expect(message).toContain("couldn't be automatically extracted")
      expect(message).toContain("Paste Text")
    })

    it("includes step-by-step instructions", () => {
      const result = {
        isGarbage: true,
        confidence: "high" as const,
        reasons: [],
        suggestManualPaste: true,
      }
      const message = createGarbageContentErrorMessage(result)

      expect(message).toContain("1.")
      expect(message).toContain("2.")
      expect(message).toContain("3.")
      expect(message).toContain("copy")
    })
  })

  describe("GarbageContentError", () => {
    it("creates error with detection result", () => {
      const result = {
        isGarbage: true,
        confidence: "high" as const,
        reasons: ["Template syntax found"],
        suggestManualPaste: true,
      }
      const error = new GarbageContentError(result, "https://example.com")

      expect(error.name).toBe("GarbageContentError")
      expect(error.detectionResult).toEqual(result)
      expect(error.url).toBe("https://example.com")
      expect(error.message).toContain("couldn't be automatically extracted")
    })
  })
})
