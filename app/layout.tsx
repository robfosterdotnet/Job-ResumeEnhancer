import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/settings/providers";

export const metadata: Metadata = {
  title: "JobReady",
  description: "Your AI-powered command center for landing your dream job. Resume analysis, company research, interview prep, and more.",
};

// Inline script to prevent theme flash
const themeScript = `
(function() {
  try {
    var theme = localStorage.getItem('job-resume-enhancer-theme') || 'system';
    var accent = localStorage.getItem('job-resume-enhancer-accent') || 'coral';
    var density = localStorage.getItem('job-resume-enhancer-density') || 'comfortable';
    var fontSize = localStorage.getItem('job-resume-enhancer-font-size') || 'medium';
    var animations = localStorage.getItem('job-resume-enhancer-animations');

    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.add('light');
    }

    if (accent && accent !== 'coral') {
      document.documentElement.setAttribute('data-accent', accent);
    }

    document.documentElement.setAttribute('data-density', density);
    document.documentElement.setAttribute('data-font-size', fontSize);

    if (animations !== null) {
      document.documentElement.setAttribute('data-animations', animations);
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
