import type { NextConfig } from "next";

/**
 * Security Headers Configuration
 *
 * These headers protect against common OWASP vulnerabilities:
 * - A05:2021 Security Misconfiguration
 *
 * @see https://owasp.org/Top10/A05_2021-Security_Misconfiguration/
 * @see https://nextjs.org/docs/advanced-features/security-headers
 */
const securityHeaders = [
  // Prevent MIME type sniffing
  // @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  // Prevent clickjacking attacks
  // @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  // Legacy XSS protection for older browsers
  // Note: Modern browsers use CSP instead, but this helps with older browsers
  // @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-XSS-Protection
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  // Control referrer information sent with requests
  // @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  // Restrict browser features/APIs
  // Note: microphone=(self) is required for voice input in Mock Interview feature
  // @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(self), geolocation=(), browsing-topics=()",
  },
  // Content Security Policy
  // Note: 'unsafe-inline' is required for:
  // - Next.js inline scripts for hydration
  // - Theme initialization script in app/layout.tsx
  // - Inline styles from Tailwind CSS
  // TODO: Consider implementing nonce-based CSP for stricter security
  // @see https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self' https://api.search.brave.com",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
