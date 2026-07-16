import { SiteFooter, SiteHeader } from "../../components/SiteChrome";
import { academyData } from "../../lib/academyData";

export const metadata = { title: "Payment and Refund Policy", description: "Everything for Free Academy payment and refund policy.", alternates: { canonical: "/refunds" } };

export default function RefundsPage() {
  return <><SiteHeader /><main className="legal-page section-band"><article><p className="eyebrow">Payments and Refunds</p><h1>Clear payment review and support</h1><p>Last updated: July 2026</p><h2>Payment confirmation</h2><p>Payments are confirmed after the academy reviews the transfer and any submitted proof. Students should keep their transfer receipt until the dashboard shows confirmation.</p><h2>Incorrect or duplicate payments</h2><p>Contact the academy immediately with the payer name, amount, date, and transaction reference. Verified duplicate or incorrect payments will be reviewed individually.</p><h2>Refund requests</h2><p>Refund eligibility depends on payment verification, class access already provided, downloaded materials, completed assessments, and the reason for the request. A request does not guarantee approval.</p><h2>Contact</h2><p>Send payment questions to <a href={`mailto:${academyData.academy.contact.email}`}>{academyData.academy.contact.email}</a> or use the academy WhatsApp contact.</p></article></main><SiteFooter /></>;
}
