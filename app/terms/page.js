import { SiteFooter, SiteHeader } from "../../components/SiteChrome";
import { academyData } from "../../lib/academyData";

export const metadata = { title: "Terms of Learning", description: "Everything for Free Academy student participation terms.", alternates: { canonical: "/terms" } };

export default function TermsPage() {
  return <><SiteHeader /><main className="legal-page section-band"><article><p className="eyebrow">Terms of Learning</p><h1>Fair participation and responsible AI use</h1><p>Last updated: July 2026</p><h2>Student access</h2><p>Student IDs, assignment records, meeting links, course materials, and reports are for the registered student. Students must not impersonate another learner or share private access details.</p><h2>Original work</h2><p>AI may assist with planning, research, drafting, design, and revision, but students remain responsible for checking facts, respecting copyright, protecting personal information, and explaining their own work.</p><h2>Class conduct</h2><p>Harassment, disruption, fraud, plagiarism, unsafe content, or misuse of another person&apos;s information may result in warnings or account suspension.</p><h2>Services and availability</h2><p>Class schedules and tools may change. Free third-party AI tools can introduce limits or policy changes outside the academy&apos;s control.</p><h2>Contact</h2><p>Questions should be sent to <a href={`mailto:${academyData.academy.contact.email}`}>{academyData.academy.contact.email}</a>.</p></article></main><SiteFooter /></>;
}
