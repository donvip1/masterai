import DashboardClient from "../../components/DashboardClient";
import { SiteFooter, SiteHeader } from "../../components/SiteChrome";

export const metadata = {
  title: "Student Dashboard",
  description: "Student dashboard for class days, announcements, lesson progress, quiz history, and future app sync."
};

export default function DashboardPage() {
  return (
    <>
      <SiteHeader />
      <main id="top">
        <DashboardClient />
      </main>
      <SiteFooter />
    </>
  );
}
