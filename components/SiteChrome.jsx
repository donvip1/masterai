import Link from "next/link";
import { academyData } from "../lib/academyData";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label={`${academyData.academy.name} home`}>
        <span className="brand-mark">EFF</span>
        <span>{academyData.academy.name}</span>
      </Link>
      <nav className="nav-links" aria-label="Main navigation">
        <Link href="/#announcements">Announcements</Link>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/#course">Course</Link>
        <Link href="/#approach">Class Mode</Link>
        <Link href="/quiz">Quiz</Link>
        <Link href="/register">Register</Link>
        <Link href="/#contact">Contact</Link>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>{academyData.academy.name}</p>
      <nav className="footer-links" aria-label="Policies">
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/refunds">Refunds</Link>
      </nav>
      <p>{academyData.academy.domain}</p>
    </footer>
  );
}
