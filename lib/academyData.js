export const academyData = {
  version: "2026.07.16-student-engagement",
  storageKey: "eff_academy_student_app_v1",
  sessionKey: "eff_academy_student_session_v1",
  recentStudentIdKey: "eff_academy_recent_student_id",
  academy: {
    shortName: "EFF Academy",
    name: "Everything for Free Academy",
    programName: "AI Tools Academy",
    domain: "effacademy.xyz",
    duration: "30 Days",
    mode: "Google Meet + WhatsApp",
    classDays: ["Monday", "Wednesday", "Friday"],
    arrangedDaysNote: "Other days can be arranged individually for students who need a custom class schedule.",
    liveClasses: {
      meetingUrl: "https://meet.google.com/tqj-awgq-iin",
      timeZone: "Africa/Lagos",
      joinLeadMinutes: 10,
      sessionDurationMinutes: 120,
      sessions: [
        { id: "morning", label: "Morning Class", hour: 10 },
        { id: "evening", label: "Evening Class", hour: 16 },
        { id: "night", label: "Night Class", hour: 20 }
      ]
    },
    contact: {
      whatsapp: "https://wa.link/gv9hre",
      phone: "+2349012545656",
      email: "viplearn4free@gmail.com",
      social: "@don4val"
    }
  },
  backend: {
    activeProvider: "googleAppsScript",
    providers: {
      localStorage: {
        label: "Local device storage",
        status: "active",
        purpose: "Remembers the signed-in Student ID session on the student's device."
      },
      googleAppsScript: {
        label: "Google Apps Script",
        status: "active",
        registrationEndpoint: "/api/register",
        quizEndpoint: "/api/quiz",
        reportEndpoint: "/api/module-report",
        purpose: "Registration, Student ID lookup, quiz scoring, progress rules, module reports, Sheets, Drive, and email automation."
      },
      supabase: {
        label: "Supabase",
        status: "reserved",
        envKeys: ["SUPABASE_URL", "SUPABASE_ANON_KEY"],
        futureTables: [
          "students",
          "enrollments",
          "lesson_progress",
          "module_reports",
          "announcements",
          "payments",
          "certificates"
        ],
        purpose: "Future login, cloud sync, certificates, payment history, admin dashboard, and native app accounts."
      }
    }
  },
  announcements: [
    {
      id: "class-days",
      label: "Class Days",
      title: "Regular classes hold on Mondays, Wednesdays, and Fridays.",
      detail: "Students who need other days can request an individual arrangement."
    },
    {
      id: "batch-two",
      label: "Registration",
      title: "Batch 2 registration is open.",
      detail: "New students should complete the registration form and watch for WhatsApp or email onboarding."
    },
    {
      id: "dashboard-progress",
      label: "Student App",
      title: "Dashboard progress follows each Student ID.",
      detail: "Quiz results and module performance are loaded from the academy records after sign-in."
    }
  ],
  modules: [
    {
      id: "module-00",
      dayRange: "Day 1",
      title: "Orientation and AI Basics",
      summary: "Understand the academy flow, class rules, and what AI tools can do for work and business.",
      task: "Set up your learning device and join the academy support channel."
    },
    {
      id: "module-01",
      dayRange: "Days 2-3",
      title: "ChatGPT and Prompting",
      summary: "Learn strong prompts, roles, examples, correction prompts, and reusable prompt templates.",
      task: "Create a personal prompt library with at least 10 useful prompts."
    },
    {
      id: "module-02",
      dayRange: "Days 4-6",
      title: "Content Writing and Social Media",
      summary: "Generate captions, content calendars, ads, product descriptions, and campaign ideas.",
      task: "Build a 7-day content calendar for a real brand or personal project."
    },
    {
      id: "module-03",
      dayRange: "Days 7-9",
      title: "Canva AI and Graphic Design",
      summary: "Create clean posters, flyers, thumbnails, brand kits, and simple marketing graphics.",
      task: "Design three social posts and one flyer."
    },
    {
      id: "module-04",
      dayRange: "Days 10-12",
      title: "Image Editing and AI Visuals",
      summary: "Use image prompts, background removal, object cleanup, enhancement, and product mockups.",
      task: "Create a before-and-after image editing sample."
    },
    {
      id: "module-05",
      dayRange: "Days 13-15",
      title: "Video Editing and Animation",
      summary: "Create short videos, captions, talking photos, voiceovers, and portfolio-ready clips.",
      task: "Produce one short promo video."
    },
    {
      id: "module-06",
      dayRange: "Days 16-18",
      title: "Websites and No-Code Apps",
      summary: "Build simple websites, web apps, forms, and app-style experiences from structured data.",
      task: "Publish a simple one-page website or app prototype."
    },
    {
      id: "module-07",
      dayRange: "Days 19-21",
      title: "Research, Notes, and Study Tools",
      summary: "Use Perplexity, NotebookLM, Otter, summaries, study questions, and source-based research.",
      task: "Summarize one document and generate practice questions."
    },
    {
      id: "module-08",
      dayRange: "Days 22-24",
      title: "Productivity and Automation",
      summary: "Use Notion, Sheets, Excel AI, Zapier-style workflows, templates, and repeated task systems.",
      task: "Create one reusable workflow for school, business, or client work."
    },
    {
      id: "module-09",
      dayRange: "Days 25-27",
      title: "Freelancing and Client Work",
      summary: "Package services, prepare prices, write proposals, and build a client-ready portfolio.",
      task: "Create a service offer and client pitch."
    },
    {
      id: "module-10",
      dayRange: "Days 28-30",
      title: "Final Project and Certificate Path",
      summary: "Complete a final portfolio project, review progress, and prepare for certificate approval.",
      task: "Submit final project evidence for review."
    }
  ]
};
