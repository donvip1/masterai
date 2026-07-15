import Link from "next/link";
import { ConnectionStatus, InstallAppButton } from "../components/AppRuntime";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";
import ManagedAnnouncements from "../components/ManagedAnnouncements";
import { academyData } from "../lib/academyData";

const tools = [
  ["01", "Prompting", "ChatGPT, Claude, Gemini"],
  ["02", "Design", "Canva AI, Firefly, Remove.bg"],
  ["03", "Video", "CapCut, InVideo, D-ID"],
  ["04", "Web & Apps", "Framer, Bolt, Glide"],
  ["05", "Productivity", "Notion AI, Otter, Zapier"],
  ["06", "Income", "Portfolio, pricing, client pitch"]
];

const courseCards = [
  ["01", "ChatGPT & Prompting", "Learn the interface, write strong prompts, and build a personal prompt library."],
  ["02", "Design & Content", "Use Canva AI, image prompts, ad writing, content calendars, and social media systems."],
  ["03", "Video & Animation", "Create short videos, captions, talking photos, animations, and portfolio-ready samples."],
  ["04", "Websites & Apps", "Publish websites, create simple web apps, and build no-code mobile apps from Sheets."],
  ["05", "Productivity & Research", "Use Notion AI, Otter.ai, Perplexity, NotebookLM, Excel AI, and automation workflows."],
  ["06", "Freelancing & Income", "Create a portfolio, write client pitches, price services, and prepare to earn with AI skills."]
];

const roadmap = [
  ["Days 1-5", "Foundation", "Understand AI, open ChatGPT, learn prompting, and create your first AI outputs.", "Deliverable: prompt library"],
  ["Days 6-14", "Create", "Build designs, edit photos, create videos, publish a website, and launch a simple app.", "Deliverable: 5+ samples"],
  ["Days 15-23", "Automate", "Use spreadsheets, Notion, Otter, research tools, content calendars, and workflow automation.", "Deliverable: work system"],
  ["Days 24-30", "Earn", "Package your skills, prepare your portfolio, write a client pitch, and present your final project.", "Deliverable: income plan"]
];

const lessonSystem = [
  ["15 min", "Opening", "Review previous work and answer student questions."],
  ["30 min", "Teach", "Explain the concept with simple examples."],
  ["30 min", "Live Demo", "Instructor performs the task slowly on screen."],
  ["45 min", "Practice", "Students complete the task on their own device."],
  ["20 min", "Review", "Students share work and receive corrections."],
  ["10 min", "Close", "Homework, next class preview, and WhatsApp follow-up."]
];

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "EducationalOrganization",
      "@id": "https://effacademy.xyz/#organization",
      name: "Everything for Free Academy",
      url: "https://effacademy.xyz",
      email: "viplearn4free@gmail.com",
      telephone: "+2349012545656",
      sameAs: ["https://wa.link/gv9hre"]
    },
    {
      "@type": "Course",
      "@id": "https://effacademy.xyz/#course",
      name: "AI Tools Academy",
      description: "A practical 30-day AI tools training program covering prompting, design, video, websites, productivity, and freelancing.",
      provider: { "@id": "https://effacademy.xyz/#organization" },
      educationalLevel: "Beginner to intermediate",
      courseMode: "Online",
      timeRequired: "P30D",
      hasCourseInstance: {
        "@type": "CourseInstance",
        courseMode: "Online",
        courseWorkload: "PT2H",
        instructor: { "@type": "Person", name: "EFF Academy Instructor" }
      }
    }
  ]
};

export default function HomePage() {
  const { academy } = academyData;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <SiteHeader />
      <main id="top">
        <section className="hero section-band">
          <div className="hero-copy">
            <p className="eyebrow">Batch 2 registration is open</p>
            <h1>{academy.name}</h1>
            <p className="hero-lede">
              A practical AI tools academy for students, business owners, creators, and professionals who want to learn by building real work.
            </p>
            <div className="hero-actions">
              <Link className="button primary" href="/register">Apply Now</Link>
              <Link className="button secondary" href="/dashboard">Open Student Dashboard</Link>
              <Link className="button secondary" href="/#course">View Course</Link>
              <Link className="button secondary" href="/quiz">Take Module Quiz</Link>
            </div>
            <dl className="hero-facts" aria-label="Course summary">
              <div>
                <dt>Domain</dt>
                <dd>{academy.domain}</dd>
              </div>
              <div>
                <dt>Duration</dt>
                <dd>{academy.duration}</dd>
              </div>
              <div>
                <dt>Mode</dt>
                <dd>{academy.mode}</dd>
              </div>
              <div>
                <dt>Class Days</dt>
                <dd>Mon, Wed & Fri</dd>
              </div>
            </dl>
          </div>
          <div className="hero-media ai-stack" aria-label="AI tools students will learn">
            <div className="stack-header">
              <span>EFF Academy Stack</span>
              <strong>20+ practical tools</strong>
            </div>
            <div className="stack-core">
              <span>AI</span>
              <strong>Learn · Create · Automate · Earn</strong>
            </div>
            <div className="stack-grid">
              {tools.map(([number, title, detail]) => (
                <article key={number}>
                  <span>{number}</span>
                  <h3>{title}</h3>
                  <p>{detail}</p>
                </article>
              ))}
            </div>
            <div className="stack-footer">
              <span>30 days</span>
              <span>Live practice</span>
              <span>Portfolio tasks</span>
            </div>
          </div>
        </section>

        <section className="announcements section-band" id="announcements">
          <div className="section-heading narrow">
            <p className="eyebrow">Important Updates</p>
            <h2>Announcements and class days.</h2>
            <p>Check this space for academy notices, registration updates, payment reminders, class changes, and other important information.</p>
          </div>
          <div className="announcement-board" aria-label="Academy announcements and class schedule">
            <ManagedAnnouncements className="announcement-board-list" />
            <article className="class-days-card">
              <span>Class Days</span>
              <h3>Classes hold on Mondays, Wednesdays, and Fridays.</h3>
              <p>{academy.arrangedDaysNote}</p>
              <div className="class-day-list" aria-label="Regular class days">
                {academy.classDays.map((day) => <strong key={day}>{day}</strong>)}
              </div>
            </article>
          </div>
        </section>

        <section className="intro section-band light" id="course">
          <div className="section-heading">
            <p className="eyebrow">What students will learn</p>
            <h2>Build practical AI skills from day one.</h2>
            <p>The academy follows a hands-on structure: simple explanations, live demonstrations, immediate practice, portfolio tasks, and review.</p>
          </div>
          <div className="module-grid" aria-label="Course modules">
            {courseCards.map(([number, title, detail]) => (
              <article key={number}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="roadmap section-band">
          <div className="section-heading narrow">
            <p className="eyebrow">Learning path</p>
            <h2>From beginner to paid professional over 30 days.</h2>
          </div>
          <div className="roadmap-board" aria-label="30-day learning roadmap">
            {roadmap.map(([range, title, detail, deliverable]) => (
              <article key={range}>
                <span className="roadmap-step">{range}</span>
                <h3>{title}</h3>
                <p>{detail}</p>
                <strong>{deliverable}</strong>
              </article>
            ))}
          </div>
        </section>

        <section className="app-preview section-band light" id="student-app">
          <div className="section-heading">
            <p className="eyebrow">Student App Foundation</p>
            <h2>The academy now has a mobile-ready dashboard path.</h2>
            <p>Students can track lessons, class days, announcements, payment status, and offline progress from a dashboard that can later become the Android and iOS app.</p>
          </div>
          <div className="app-preview-layout">
            <div className="phone-preview" aria-label="Student app dashboard preview">
              <div className="phone-topbar">
                <span>EFF</span>
                <ConnectionStatus />
              </div>
              <div className="phone-screen">
                <div>
                  <span>Next Class</span>
                  <strong>Wednesday</strong>
                  <p>Live practice + assignment review</p>
                </div>
                <div>
                  <span>Progress</span>
                  <strong>0%</strong>
                  <p>Loaded from the student&apos;s quiz record</p>
                </div>
                <div>
                  <span>Backend</span>
                  <strong>Google Sheets sync</strong>
                  <p>Student ID login and progress are active</p>
                </div>
              </div>
            </div>
            <div className="app-feature-grid" aria-label="Student app features">
              <article>
                <span>01</span>
                <h3>Student ID access</h3>
                <p>Registered students open their dashboard with the Student ID issued after registration.</p>
              </article>
              <article>
                <span>02</span>
                <h3>Database-backed progress</h3>
                <p>The dashboard loads module results, quiz performance, and cooldown access from Google Sheets.</p>
              </article>
              <article>
                <span>03</span>
                <h3>Future backend room</h3>
                <p>The app data includes a reserved Supabase/Firebase-style sync layer for login, payments, certificates, and cloud progress.</p>
              </article>
              <article>
                <span>04</span>
                <h3>Mobile app path</h3>
                <p>This Next.js structure can later be paired with Expo or React Native using the same data and API model.</p>
              </article>
            </div>
          </div>
          <div className="centered-action">
            <Link className="button primary" href="/dashboard">Open Dashboard Preview</Link>
            <InstallAppButton />
          </div>
        </section>

        <section className="approach section-band light" id="approach">
          <div className="section-heading">
            <p className="eyebrow">Class mode</p>
            <h2>Every class is built around practice.</h2>
            <p>Students do not only watch. Classes include live demonstration, student practice, class review, homework, and WhatsApp evidence.</p>
          </div>
          <div className="approach-layout">
            <div className="lesson-system" aria-label="Daily lesson plan structure">
              {lessonSystem.map(([time, title, detail]) => (
                <article key={title}>
                  <span>{time}</span>
                  <h3>{title}</h3>
                  <p>{detail}</p>
                </article>
              ))}
            </div>
            <div className="checklist-panel">
              <h3>Program format</h3>
              <ul>
                <li>Live Google Meet sessions</li>
                <li>WhatsApp community support</li>
                <li>Hands-on assignments after every module</li>
                <li>Portfolio work students can show clients</li>
                <li>Certificate pathway after completion</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="cta-section section-band">
          <div className="cta-panel">
            <div>
              <p className="eyebrow">Ready to continue?</p>
              <h2>Apply for the academy or submit a module test.</h2>
              <p>New students should start with registration. Existing students can use the quiz page after completing each module.</p>
            </div>
            <div className="cta-actions">
              <Link className="button primary" href="/register">Open Registration Form</Link>
              <Link className="button secondary light-button" href="/dashboard">Open Student Dashboard</Link>
              <Link className="button secondary light-button" href="/quiz">Open Module Quiz</Link>
            </div>
          </div>
        </section>

        <section className="contact-section section-band light" id="contact">
          <div className="section-heading narrow">
            <p className="eyebrow">Need Help?</p>
            <h2>Contact {academy.name}.</h2>
            <p>Use any of these channels for registration questions, payment confirmation, or class enquiries.</p>
          </div>
          <div className="contact-grid" aria-label="Academy contact information">
            <a href={academy.contact.whatsapp} target="_blank" rel="noreferrer">
              <span>WhatsApp</span>
              <strong>Message for enquiries</strong>
            </a>
            <a href={`tel:${academy.contact.phone}`}>
              <span>Call</span>
              <strong>{academy.contact.phone}</strong>
            </a>
            <a href={`mailto:${academy.contact.email}`}>
              <span>Email</span>
              <strong>{academy.contact.email}</strong>
            </a>
            <div>
              <span>X</span>
              <strong>{academy.contact.social}</strong>
            </div>
            <div>
              <span>Website</span>
              <strong>{academy.domain}</strong>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
