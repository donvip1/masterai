import "./globals.css";
import { AppRuntime } from "../components/AppRuntime";
import { academyData } from "../lib/academyData";

export const metadata = {
  metadataBase: new URL(`https://${academyData.academy.domain}`),
  title: {
    default: `${academyData.academy.name} | ${academyData.academy.programName}`,
    template: `%s | ${academyData.academy.name}`
  },
  description: "Everything for Free Academy offers practical AI tools training with live classes, quizzes, dashboard progress, and a mobile-ready learning app path.",
  keywords: ["AI tools training", "AI academy Nigeria", "ChatGPT course", "Canva AI training", "Everything for Free Academy"],
  authors: [{ name: "Everything for Free Academy" }],
  creator: "Everything for Free Academy",
  publisher: "Everything for Free Academy",
  alternates: {
    canonical: "/"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  },
  applicationName: academyData.academy.name,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/app-icon.svg", type: "image/svg+xml" },
      { url: "/app-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/app-icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ]
  },
  appleWebApp: {
    capable: true,
    title: "EFF Academy",
    statusBarStyle: "default"
  },
  openGraph: {
    title: academyData.academy.name,
    description: "Practical AI tools training with dashboard progress and app-ready learning.",
    url: `https://${academyData.academy.domain}`,
    siteName: academyData.academy.name,
    type: "website",
    locale: "en_NG",
    images: [{ url: "/app-icon-512.png", width: 512, height: 512, alt: "EFF Academy logo" }]
  },
  twitter: {
    card: "summary_large_image",
    title: academyData.academy.name,
    description: "Practical AI tools training with live classes, quizzes, and student progress.",
    images: ["/app-icon-512.png"]
  },
  formatDetection: {
    telephone: true,
    email: true,
    address: false
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#16256b"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <AppRuntime />
      </body>
    </html>
  );
}
