import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Job Resume Enhancer",
  description: "Analyze your resume against job postings and research companies to land your dream job",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
