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
    type: "website"
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
