import Link from "next/link";
import { academyData } from "../../lib/academyData";

export const metadata = {
  title: "Offline",
  description: "Offline page for Everything for Free Academy.",
  robots: { index: false, follow: false }
};

export default function OfflinePage() {
  return (
    <main className="offline-page section-band">
      <section className="offline-panel">
        <Link className="brand" href="/" aria-label={`${academyData.academy.name} home`}>
          <span className="brand-mark">EFF</span>
          <span>{academyData.academy.name}</span>
        </Link>
        <p className="eyebrow">Offline Mode</p>
        <h1>You are offline.</h1>
        <p>
          Previously opened academy pages and dashboard progress may still be available on this device. Reconnect to submit registrations, upload payment proof, or send quiz results.
        </p>
        <div className="hero-actions">
          <Link className="button primary" href="/dashboard">Open Dashboard</Link>
          <Link className="button ghost-button" href="/">Go Home</Link>
        </div>
      </section>
    </main>
  );
}
