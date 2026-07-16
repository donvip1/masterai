import { SiteFooter, SiteHeader } from "../../components/SiteChrome";
import { academyData } from "../../lib/academyData";

export const metadata = { title: "Privacy Policy", description: "How Everything for Free Academy handles student information.", alternates: { canonical: "/privacy" } };

export default function PrivacyPage() {
  return <><SiteHeader /><main className="legal-page section-band"><article><p className="eyebrow">Privacy Policy</p><h1>How we handle student information</h1><p>Last updated: July 2026</p><h2>Information we collect</h2><p>Registration details, contact information, learning preferences, payment proof, quiz results, attendance, assignment submissions, and account activity are collected only to operate the academy.</p><h2>How information is used</h2><p>We use student information for registration review, teaching, progress tracking, communication, payments, assignments, reports, certificates, safety, and support.</p><h2>Storage and access</h2><p>Records are stored in restricted Google Sheets, Drive folders, and the academy website services. Only authorized academy administration should access private student records.</p><h2>Student choices</h2><p>Students may request a copy, correction, suspension, or deletion of their registration information. Some academic or payment records may need to be retained for legitimate operational or legal purposes.</p><h2>Contact</h2><p>Send privacy and deletion requests to <a href={`mailto:${academyData.academy.contact.email}`}>{academyData.academy.contact.email}</a>.</p></article></main><SiteFooter /></>;
}
