export const quizCatalog = [
  { id: "module-0", dayRange: "Day 1", title: "Introduction to Artificial Intelligence" },
  { id: "module-1", dayRange: "Days 2-3", title: "ChatGPT & Advanced Prompting" },
  { id: "module-2", dayRange: "Days 4-5", title: "AI Tools for Graphic Design" },
  { id: "module-3", dayRange: "Days 6-7", title: "Photo Editing & Image Enhancement" },
  { id: "module-4", dayRange: "Days 8-9", title: "AI Video & Movie Creation" },
  { id: "module-5", dayRange: "Days 10-11", title: "Cartoon & Animation Creation" },
  { id: "module-6", dayRange: "Days 12-13", title: "Website Development with AI" },
  { id: "module-7", dayRange: "Days 14-15", title: "Excel & Spreadsheet Automation with AI" },
  { id: "module-8", dayRange: "Days 16-17", title: "Content & Advertisement Creation with AI" },
  { id: "module-9", dayRange: "Days 18-19", title: "Social Media Content Generation with AI" },
  { id: "module-10", dayRange: "Days 20-21", title: "Business & Productivity Tools with AI" },
  { id: "module-11", dayRange: "Days 22-23", title: "Data Analysis & Research with AI" },
  { id: "module-12", dayRange: "Days 24-25", title: "AI for Students & Everyday Use" },
  { id: "module-13", dayRange: "Days 26-27", title: "Mobile App Creation with AI" },
  { id: "module-14", dayRange: "Days 28-30", title: "Making Money with AI Tools" }
];

export function findQuizCatalogModule(moduleId) {
  return quizCatalog.find((module) => module.id === moduleId) || null;
}
