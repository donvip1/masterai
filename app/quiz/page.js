import QuizClient from "../../components/QuizClient";
import { SiteFooter, SiteHeader } from "../../components/SiteChrome";

export const metadata = {
  title: "Module Quiz",
  description: "Take objective module quizzes for Everything for Free Academy."
};

export default function QuizPage() {
  return (
    <>
      <SiteHeader />
      <main id="top">
        <section className="quiz-section section-band standalone-page" id="quiz">
          <div className="section-heading">
            <p className="eyebrow">Module Quiz / Test</p>
            <h1>Objective tests for each handbook module.</h1>
            <p>Students can submit module quiz results directly to the academy Google Sheet after each class.</p>
          </div>

          <QuizClient />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
