(function attachQuizData(root, factory) {
  const quizModules = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = quizModules;
  }

  root.EFF_QUIZ_MODULES = quizModules;
})(typeof globalThis !== "undefined" ? globalThis : this, function buildQuizData() {
  return [
    {
      id: "module-0",
      title: "Module 0: Introduction to Artificial Intelligence",
      questions: [
        {
          id: "m0-q1",
          question: "What does AI stand for?",
          options: ["Automatic Internet", "Artificial Intelligence", "Advanced Instruction", "Automated Interface"],
          answer: "Artificial Intelligence"
        },
        {
          id: "m0-q2",
          question: "What technology powers tools like ChatGPT?",
          options: ["Search engines", "Social media algorithms", "Large Language Models (LLMs)", "Spreadsheet software"],
          answer: "Large Language Models (LLMs)"
        },
        {
          id: "m0-q3",
          question: "What is a prompt in AI tools?",
          options: ["A payment receipt", "An instruction you give the AI", "A phone setting", "A design template"],
          answer: "An instruction you give the AI"
        },
        {
          id: "m0-q4",
          question: "What mostly determines the quality of an AI output?",
          options: ["The quality of your instructions", "The colour of your phone", "The time of day", "The number of apps installed"],
          answer: "The quality of your instructions"
        },
        {
          id: "m0-q5",
          question: "Which statement best matches the handbook's opportunity message?",
          options: ["AI will replace every job immediately", "Only programmers can use AI", "People who learn AI can do more work faster", "AI is only useful for entertainment"],
          answer: "People who learn AI can do more work faster"
        }
      ]
    },
    {
      id: "module-1",
      title: "Module 1: ChatGPT & Advanced Prompting",
      questions: [
        {
          id: "m1-q1",
          question: "What does the R in RCTFOE stand for?",
          options: ["Result", "Role", "Reason", "Request"],
          answer: "Role"
        },
        {
          id: "m1-q2",
          question: "What is iterative refinement?",
          options: ["Improving the result through follow-up messages", "Using only one perfect prompt", "Deleting old chats", "Changing your internet browser"],
          answer: "Improving the result through follow-up messages"
        },
        {
          id: "m1-q3",
          question: "Which prompt is stronger?",
          options: ["Tell me about money", "You are a Nigerian financial advisor. Give me a 5-step monthly budget plan", "Money", "Write something"],
          answer: "You are a Nigerian financial advisor. Give me a 5-step monthly budget plan"
        },
        {
          id: "m1-q4",
          question: "What does the C in RCTFOE represent?",
          options: ["Colour", "Context", "Copy", "Command"],
          answer: "Context"
        },
        {
          id: "m1-q5",
          question: "Why should students build a personal prompt library?",
          options: ["To save and reuse effective prompts", "To replace their email account", "To make ChatGPT offline", "To avoid practicing"],
          answer: "To save and reuse effective prompts"
        }
      ]
    },
    {
      id: "module-2",
      title: "Module 2: AI Tools for Graphic Design",
      questions: [
        {
          id: "m2-q1",
          question: "Which AI design tool is recommended as the best free starting point for beginners?",
          options: ["Adobe Photoshop", "Midjourney", "Canva AI", "Figma"],
          answer: "Canva AI"
        },
        {
          id: "m2-q2",
          question: "What Canva feature removes the background from a photo automatically?",
          options: ["Magic Write", "Text to Image", "Background Remover", "Magic Resize"],
          answer: "Background Remover"
        },
        {
          id: "m2-q3",
          question: "In the image prompt formula, which element describes how the image is lit?",
          options: ["Style/Mood", "Technical Quality", "Lighting", "Setting/Background"],
          answer: "Lighting"
        },
        {
          id: "m2-q4",
          question: "What is required to generate an image with AI tools like Midjourney or DALL-E?",
          options: ["A detailed text description", "A printer", "A spreadsheet formula", "A video file only"],
          answer: "A detailed text description"
        },
        {
          id: "m2-q5",
          question: "Which Canva step lets students save a finished design for sharing?",
          options: ["Download", "Browse", "Resize only", "Close browser"],
          answer: "Download"
        }
      ]
    },
    {
      id: "module-3",
      title: "Module 3: Photo Editing & Image Enhancement",
      questions: [
        {
          id: "m3-q1",
          question: "Which tool is used for instant background removal in the handbook?",
          options: ["Remove.bg", "Buffer", "Glide", "Otter.ai"],
          answer: "Remove.bg"
        },
        {
          id: "m3-q2",
          question: "What file type does Remove.bg commonly provide for transparent backgrounds?",
          options: ["PNG", "MP3", "XLSX", "TXT"],
          answer: "PNG"
        },
        {
          id: "m3-q3",
          question: "Which app is recommended for enhancing blurry or old photos?",
          options: ["Remini", "Zapier", "Framer", "Formula Bot"],
          answer: "Remini"
        },
        {
          id: "m3-q4",
          question: "What does Adobe Firefly Generative Fill help you do?",
          options: ["Replace selected parts of an image with AI-generated content", "Schedule Instagram posts", "Write Excel formulas", "Record meeting notes"],
          answer: "Replace selected parts of an image with AI-generated content"
        },
        {
          id: "m3-q5",
          question: "Which tool in this module removes unwanted objects from a photo?",
          options: ["Cleanup.pictures", "NotebookLM", "D-ID", "InVideo AI"],
          answer: "Cleanup.pictures"
        }
      ]
    },
    {
      id: "module-4",
      title: "Module 4: AI Video & Movie Creation",
      questions: [
        {
          id: "m4-q1",
          question: "Which tool is described as the best free video editor with auto captions?",
          options: ["CapCut AI", "Looka", "Formula Bot", "NotebookLM"],
          answer: "CapCut AI"
        },
        {
          id: "m4-q2",
          question: "What does CapCut Auto Captions do?",
          options: ["Transcribes spoken words and places timed subtitles", "Creates spreadsheets", "Builds mobile apps", "Writes invoices"],
          answer: "Transcribes spoken words and places timed subtitles"
        },
        {
          id: "m4-q3",
          question: "Which tool can create a full YouTube video from a topic or script?",
          options: ["InVideo AI", "Remove.bg", "Formula Bot", "Glide"],
          answer: "InVideo AI"
        },
        {
          id: "m4-q4",
          question: "What does HeyGen help users create?",
          options: ["Videos with AI avatar presenters", "Excel charts only", "Transparent PNGs", "Website domains"],
          answer: "Videos with AI avatar presenters"
        },
        {
          id: "m4-q5",
          question: "Which niche is mentioned as an income opportunity in this module?",
          options: ["Faceless YouTube", "Manual typing only", "Offline filing", "Hardware repairs only"],
          answer: "Faceless YouTube"
        }
      ]
    },
    {
      id: "module-5",
      title: "Module 5: Cartoon & Animation Creation",
      questions: [
        {
          id: "m5-q1",
          question: "Which tool makes any photo talk with AI speech and facial animation?",
          options: ["D-ID", "Perplexity", "Formula Bot", "Buffer"],
          answer: "D-ID"
        },
        {
          id: "m5-q2",
          question: "What type of image works best for D-ID according to the lesson?",
          options: ["A clear front-facing portrait", "A blurry group photo", "A spreadsheet screenshot", "A blank white page"],
          answer: "A clear front-facing portrait"
        },
        {
          id: "m5-q3",
          question: "Why do commas and full stops matter in a D-ID script?",
          options: ["They affect the voice delivery", "They change the file size only", "They remove the background", "They publish the video"],
          answer: "They affect the voice delivery"
        },
        {
          id: "m5-q4",
          question: "Which tool turns flat photos into 3D parallax animations?",
          options: ["Leiapix", "Otter.ai", "Durable AI", "Canva Sheets"],
          answer: "Leiapix"
        },
        {
          id: "m5-q5",
          question: "What is a key benefit of AI animation tools for beginners?",
          options: ["No drawing skills are needed", "They require a film studio", "They only work with code", "They replace all class practice"],
          answer: "No drawing skills are needed"
        }
      ]
    },
    {
      id: "module-6",
      title: "Module 6: Website Development with AI",
      questions: [
        {
          id: "m6-q1",
          question: "Which AI website builder is highlighted for designer-quality sites from text descriptions?",
          options: ["Framer AI", "Remini", "D-ID", "Otter.ai"],
          answer: "Framer AI"
        },
        {
          id: "m6-q2",
          question: "What should a strong website prompt include?",
          options: ["Clear details about sections, style, business, and contact needs", "Only the word website", "Only a colour name", "Only a phone number"],
          answer: "Clear details about sections, style, business, and contact needs"
        },
        {
          id: "m6-q3",
          question: "Which tool is used in the handbook exercise to generate a business website quickly?",
          options: ["Durable AI", "Formula Bot", "Remove.bg", "Buffer"],
          answer: "Durable AI"
        },
        {
          id: "m6-q4",
          question: "What can students do after Framer AI generates a website?",
          options: ["Customise content and publish it", "Only print it", "Convert it to audio", "Delete all sections immediately"],
          answer: "Customise content and publish it"
        },
        {
          id: "m6-q5",
          question: "According to the pricing guide, what can a one-page landing page be sold for?",
          options: ["₦30,000 - ₦80,000", "₦500 only", "Free always", "₦1,000,000 minimum"],
          answer: "₦30,000 - ₦80,000"
        }
      ]
    },
    {
      id: "module-7",
      title: "Module 7: Excel & Spreadsheet Automation with AI",
      questions: [
        {
          id: "m7-q1",
          question: "What can ChatGPT help you write for Excel or Google Sheets?",
          options: ["Formulas from plain English descriptions", "Only video captions", "Only portraits", "Only music files"],
          answer: "Formulas from plain English descriptions"
        },
        {
          id: "m7-q2",
          question: "Which tool converts plain English into spreadsheet formulas?",
          options: ["Formula Bot", "D-ID", "Runway ML", "Canva Text to Image"],
          answer: "Formula Bot"
        },
        {
          id: "m7-q3",
          question: "What should you describe when asking ChatGPT for a spreadsheet formula?",
          options: ["Your columns and exactly what you want to calculate", "Your favourite colour only", "Your phone model only", "Your WhatsApp group name only"],
          answer: "Your columns and exactly what you want to calculate"
        },
        {
          id: "m7-q4",
          question: "Which formula task is listed as practice in the handbook?",
          options: ["Total all values where status says Paid", "Generate an AI avatar", "Remove image backgrounds", "Create a talking photo"],
          answer: "Total all values where status says Paid"
        },
        {
          id: "m7-q5",
          question: "What does conditional formatting help students do in the exercise?",
          options: ["Colour cells based on conditions like Paid or Unpaid", "Record audio", "Publish a website", "Create a logo only"],
          answer: "Colour cells based on conditions like Paid or Unpaid"
        }
      ]
    },
    {
      id: "module-8",
      title: "Module 8: Content & Advertisement Creation with AI",
      questions: [
        {
          id: "m8-q1",
          question: "What does AIDA stand for?",
          options: ["Attention, Interest, Desire, Action", "Audio, Image, Design, App", "Ask, Import, Download, Archive", "Account, Internet, Data, Automation"],
          answer: "Attention, Interest, Desire, Action"
        },
        {
          id: "m8-q2",
          question: "What is the purpose of the hook in the 3-part viral post formula?",
          options: ["Stop the scroll and grab attention", "Hide the message", "Close the browser", "Calculate VAT"],
          answer: "Stop the scroll and grab attention"
        },
        {
          id: "m8-q3",
          question: "What should the CTA tell readers?",
          options: ["Exactly what action to take next", "Nothing at all", "Only the date", "Only the author's age"],
          answer: "Exactly what action to take next"
        },
        {
          id: "m8-q4",
          question: "Which audience does the handbook's viral post prompt target?",
          options: ["Nigerian audiences", "Only astronauts", "Only offline banks", "Only toddlers"],
          answer: "Nigerian audiences"
        },
        {
          id: "m8-q5",
          question: "What is one task in the 30-day content calendar exercise?",
          options: ["Copy the calendar into Google Sheets", "Remove a photo background only", "Create a spreadsheet password", "Record a 3D animation only"],
          answer: "Copy the calendar into Google Sheets"
        }
      ]
    },
    {
      id: "module-9",
      title: "Module 9: Social Media Content Generation with AI",
      questions: [
        {
          id: "m9-q1",
          question: "What is the secret to social media growth according to this module?",
          options: ["Consistency", "Posting once a year", "Never using captions", "Ignoring the audience"],
          answer: "Consistency"
        },
        {
          id: "m9-q2",
          question: "What are content pillars used for?",
          options: ["Organising content around different audience needs", "Changing phone brightness", "Exporting PNG files only", "Making spreadsheets private"],
          answer: "Organising content around different audience needs"
        },
        {
          id: "m9-q3",
          question: "Which post format does the module say gets high reach on Instagram?",
          options: ["Carousels", "Blank posts", "Invoices", "Raw spreadsheets"],
          answer: "Carousels"
        },
        {
          id: "m9-q4",
          question: "Which tool is recommended for scheduling social posts?",
          options: ["Buffer", "Remove.bg", "Formula Bot", "D-ID"],
          answer: "Buffer"
        },
        {
          id: "m9-q5",
          question: "What should hashtag research include?",
          options: ["A mix of large, medium, and small hashtags", "Only one random hashtag", "No hashtags", "Only personal names"],
          answer: "A mix of large, medium, and small hashtags"
        }
      ]
    },
    {
      id: "module-10",
      title: "Module 10: Business & Productivity Tools with AI",
      questions: [
        {
          id: "m10-q1",
          question: "What is Notion described as in the handbook?",
          options: ["A digital notebook, task manager, and knowledge base", "A video-only editor", "A background remover", "A bank app"],
          answer: "A digital notebook, task manager, and knowledge base"
        },
        {
          id: "m10-q2",
          question: "How do you access Notion AI inside a page according to the lesson?",
          options: ["Press the spacebar and choose AI", "Shake the phone", "Print the page", "Close the browser"],
          answer: "Press the spacebar and choose AI"
        },
        {
          id: "m10-q3",
          question: "What does Otter.ai help users do?",
          options: ["Record, transcribe, and summarise speech", "Generate Excel VAT formulas only", "Remove backgrounds only", "Build restaurants"],
          answer: "Record, transcribe, and summarise speech"
        },
        {
          id: "m10-q4",
          question: "What can Zapier automations connect?",
          options: ["Different apps and repeated workflows", "Only camera filters", "Only offline notebooks", "Only phone chargers"],
          answer: "Different apps and repeated workflows"
        },
        {
          id: "m10-q5",
          question: "What benefit does the module associate with productivity AI tools?",
          options: ["Saving hours every day", "Making work slower", "Stopping all learning", "Deleting class notes"],
          answer: "Saving hours every day"
        }
      ]
    },
    {
      id: "module-11",
      title: "Module 11: Data Analysis & Research with AI",
      questions: [
        {
          id: "m11-q1",
          question: "Which tool is described as a smarter search engine with citations?",
          options: ["Perplexity AI", "CapCut AI", "Remini", "Looka"],
          answer: "Perplexity AI"
        },
        {
          id: "m11-q2",
          question: "What type of research question is better for Perplexity?",
          options: ["A specific question with clear details", "A vague phrase like 'business'", "A blank message", "An unrelated emoji"],
          answer: "A specific question with clear details"
        },
        {
          id: "m11-q3",
          question: "What does NotebookLM use as its answer source?",
          options: ["The documents and sources you upload", "Only random social posts", "Only images from Canva", "Only your phone contacts"],
          answer: "The documents and sources you upload"
        },
        {
          id: "m11-q4",
          question: "What can NotebookLM create for study?",
          options: ["Practice questions based on uploaded material", "Physical textbooks", "Bank transfers", "Video captions only"],
          answer: "Practice questions based on uploaded material"
        },
        {
          id: "m11-q5",
          question: "What should students do after Perplexity gives an answer?",
          options: ["Ask follow-up questions to go deeper", "Close the result immediately", "Ignore citations", "Delete all sources"],
          answer: "Ask follow-up questions to go deeper"
        }
      ]
    },
    {
      id: "module-12",
      title: "Module 12: AI for Students & Everyday Use",
      questions: [
        {
          id: "m12-q1",
          question: "What is the AI study technique taught in this module?",
          options: ["Summarisation plus practice questions", "Guessing without notes", "Copying without review", "Only watching videos"],
          answer: "Summarisation plus practice questions"
        },
        {
          id: "m12-q2",
          question: "How much text does the handbook suggest copying at a time for study?",
          options: ["500-2000 words", "One word only", "One million words at once", "No text at all"],
          answer: "500-2000 words"
        },
        {
          id: "m12-q3",
          question: "What should a student do after ChatGPT creates practice questions?",
          options: ["Try answering without looking at the material", "Delete the questions", "Post random answers", "Skip the topic"],
          answer: "Try answering without looking at the material"
        },
        {
          id: "m12-q4",
          question: "What should AI help improve in a CV?",
          options: ["Achievements, ATS fit, and professional language", "The user's height", "Only the font colour", "The phone battery"],
          answer: "Achievements, ATS fit, and professional language"
        },
        {
          id: "m12-q5",
          question: "What is one job-seeker task in this module?",
          options: ["Practice interview questions and improve answers", "Generate a talking photo only", "Schedule Instagram posts only", "Build a restaurant menu only"],
          answer: "Practice interview questions and improve answers"
        }
      ]
    },
    {
      id: "module-13",
      title: "Module 13: Mobile App Creation with AI",
      questions: [
        {
          id: "m13-q1",
          question: "Which no-code tool is used to build mobile apps from Google Sheets?",
          options: ["Glide", "Perplexity", "Remove.bg", "Otter.ai"],
          answer: "Glide"
        },
        {
          id: "m13-q2",
          question: "What should students prepare before creating a Glide app?",
          options: ["A Google Sheet with app data", "A video studio", "A printed poster", "A bank loan only"],
          answer: "A Google Sheet with app data"
        },
        {
          id: "m13-q3",
          question: "Which layout options are mentioned in the Glide lesson?",
          options: ["List, Cards, or Tiles", "Only circles", "Only audio tracks", "Only spreadsheet cells"],
          answer: "List, Cards, or Tiles"
        },
        {
          id: "m13-q4",
          question: "Which feature can be added to a Glide app?",
          options: ["Order form or booking form", "AI voice cloning only", "Photo restoration only", "Spreadsheet deletion only"],
          answer: "Order form or booking form"
        },
        {
          id: "m13-q5",
          question: "How can students test and share the app on a phone?",
          options: ["Scan the QR code or share the live link", "Print the formula", "Download an MP3", "Use only paper notes"],
          answer: "Scan the QR code or share the live link"
        }
      ]
    },
    {
      id: "module-14",
      title: "Module 14: Making Money with AI Tools",
      questions: [
        {
          id: "m14-q1",
          question: "What is the recommended number of services to offer when starting out?",
          options: ["As many as possible", "Two or three", "Just ONE - focus is critical", "It does not matter"],
          answer: "Just ONE - focus is critical"
        },
        {
          id: "m14-q2",
          question: "Why should first clients get an introductory rate?",
          options: ["To earn testimonials and reviews that attract future clients", "Because AI work has no value", "Because clients never pay", "Because you must work free forever"],
          answer: "To earn testimonials and reviews that attract future clients"
        },
        {
          id: "m14-q3",
          question: "How many potential clients does the handbook ask students to identify?",
          options: ["10", "1", "1000", "0"],
          answer: "10"
        },
        {
          id: "m14-q4",
          question: "What is a retainer deal in freelancing?",
          options: ["A monthly payment for ongoing services", "A one-time free sample", "A deleted portfolio", "A design colour"],
          answer: "A monthly payment for ongoing services"
        },
        {
          id: "m14-q5",
          question: "Which is the cheapest and most effective source of new clients?",
          options: ["Referrals from happy existing clients", "Random directory listings", "Ignoring old clients", "Posting no samples"],
          answer: "Referrals from happy existing clients"
        }
      ]
    }
  ];
});
