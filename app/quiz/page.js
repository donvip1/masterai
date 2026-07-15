import QuizClient from "../../components/QuizClient";
import { SiteFooter, SiteHeader } from "../../components/SiteChrome";

export const metadata = {
  title: "Module Quiz",
  description: "Take objective module quizzes for Everything for Free Academy.",
  alternates: { canonical: "/quiz" },
  robots: { index: false, follow: false }
};

export default function QuizPage() {
  return (
    <>
      <SiteHeader />
      <main id="top">
        <section className="quiz-section section-band standalone-page" id="quiz">
          <div className="section-heading">
            <p className="eyebrow">Student Module Assessment</p>
            <h1>Your current module quiz and performance.</h1>
            <p>Only signed-in students can access quizzes. Student details are loaded from the academy database, each module follows the required correction and cooldown schedule, and every saved attempt generates a downloadable module progress report.</p>
          </div>

          <QuizClient />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
