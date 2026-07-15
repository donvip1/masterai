import RegistrationForm from "../../components/RegistrationForm";
import { SiteFooter, SiteHeader } from "../../components/SiteChrome";
import { academyData } from "../../lib/academyData";

export const metadata = {
  title: "Register",
  description: "Register for the Everything for Free Academy AI tools training program.",
  alternates: { canonical: "/register" }
};

export default function RegisterPage() {
  return (
    <>
      <SiteHeader />
      <main id="top">
        <section className="registration section-band standalone-page" id="register">
          <div className="section-heading">
            <p className="eyebrow">Student Registration Form</p>
            <h1>Apply for Batch 2.</h1>
            <p>
              Complete every section carefully. After submitting, your registration will be reviewed and you will receive payment and onboarding instructions by WhatsApp or email.
            </p>
          </div>

          <div className="registration-notice" aria-label="Class schedule notice">
            <span>Class Days</span>
            <strong>Classes hold on {academyData.academy.classDays.join(", ")}.</strong>
            <p>{academyData.academy.arrangedDaysNote}</p>
          </div>

          <RegistrationForm />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
