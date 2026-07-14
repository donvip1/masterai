const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "marketing-video");
const workDir = "/tmp/eff-registration-video";
const ffmpeg = "/tmp/eff-video-tools/node_modules/@ffmpeg-installer/darwin-x64/ffmpeg";
const font = "/System/Library/Fonts/Supplemental/Arial.ttf";
const width = 1280;
const height = 720;
const fps = 30;

const voiceover = [
  "Welcome to Everything for Free Academy.",
  "In this video, I will show you how to register for the Batch Two AI training program.",
  "First, open the academy website. On the home page, tap the Apply Now or Register button.",
  "The registration form will open on a separate page. Start with your personal information. Enter your full name, gender, phone number, WhatsApp number, email address, state, country, and occupation.",
  "Next, answer the About You section. Select whether you have used AI before, and choose how you heard about the training.",
  "Now move to the course selection section. Pick the AI skills you want to learn. You can choose up to three courses for ten thousand naira. If you select more than three, the price will increase automatically, and you will see the updated amount on the screen.",
  "After that, select the devices you will use for class, such as Android phone, iPhone, laptop, desktop, or tablet.",
  "Next, choose your preferred class session and confirm that you can attend classes regularly.",
  "In the payment section, pay the displayed amount to the Opay account shown on the screen. If you have already paid, select that option and upload your payment screenshot.",
  "Finally, write what you hope to achieve after the training, accept the agreement, and submit your registration.",
  "Once submitted, you will receive your student ID and further instructions by email or WhatsApp.",
  "Paid students will also receive the WhatsApp class group link.",
  "Welcome to Everything for Free Academy."
].join(" ");

const slides = [
  {
    duration: 9,
    title: "Everything for Free Academy",
    eyebrow: "Batch 2 Registration",
    body: "A 30-day practical AI training program for students, creators, business owners, and professionals.",
    bullets: ["Live Google Meet", "WhatsApp Community", "Starts from N10,000"],
    mockup: "hero"
  },
  {
    duration: 10,
    title: "Step 1: Open the website",
    body: "Visit the academy link and tap the Apply Now button.",
    bullets: ["Landing page", "Course overview", "Registration CTA"],
    mockup: "landing"
  },
  {
    duration: 11,
    title: "Step 2: Fill personal information",
    body: "Enter your correct contact details so the academy can reach you after review.",
    bullets: ["Full name", "Phone and WhatsApp", "Email, state, country, occupation"],
    mockup: "personal"
  },
  {
    duration: 14,
    title: "Step 3: Choose your courses",
    body: "Pick the AI skills you want to learn. Your fee updates immediately as you select courses.",
    bullets: ["1-3 courses: N10,000", "4 courses: N15,000", "Each extra course: +N3,000"],
    mockup: "courses"
  },
  {
    duration: 10,
    title: "Step 4: Select device and class time",
    body: "Tell us the devices you can use and the class session that works for you.",
    bullets: ["Android, iPhone, laptop, tablet", "Morning, evening, or night", "Confirm regular attendance"],
    mockup: "schedule"
  },
  {
    duration: 14,
    title: "Step 5: Pay and upload proof",
    body: "Pay the exact selected fee and upload your transfer screenshot before submitting.",
    bullets: ["Bank: Opay", "Account: 8166563757", "Holder: Phiip Awazie"],
    mockup: "payment"
  },
  {
    duration: 11,
    title: "Step 6: Submit registration",
    body: "Accept the agreement, submit the form, and check your email for your student ID.",
    bullets: ["Registration received", "Student ID generated", "Paid students get class group link"],
    mockup: "success"
  },
  {
    duration: 13,
    title: "Register today",
    body: "Everything for Free Academy helps you learn, create, automate, and earn with practical AI tools.",
    bullets: ["Apply online", "Upload payment proof", "Join the next batch"],
    mockup: "cta"
  }
];

function run(command, args, label) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });

  if (result.status !== 0) {
    throw new Error(`${label} failed:\n${result.stdout}\n${result.stderr}`);
  }

  return result;
}

function resetDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function textFile(name, text) {
  const file = path.join(workDir, `${name}.txt`);
  fs.writeFileSync(file, text, "utf8");
  return file;
}

function drawText(filters, key, text, x, y, size, color = "0xFFFFFF", options = {}) {
  const file = textFile(key, text);
  const lineSpacing = options.lineSpacing ?? Math.round(size * 0.32);
  const border = options.border ? `:borderw=${options.border}:bordercolor=${options.borderColor || "0x000000"}` : "";
  const box = options.box ? `:box=1:boxcolor=${options.boxColor}:boxborderw=${options.boxBorder || 12}` : "";
  filters.push(
    `drawtext=fontfile=${font}:textfile=${file}:x=${x}:y=${y}:fontsize=${size}:fontcolor=${color}:line_spacing=${lineSpacing}${border}${box}`
  );
}

function drawBox(filters, x, y, w, h, color, thickness = "fill") {
  filters.push(`drawbox=x=${x}:y=${y}:w=${w}:h=${h}:color=${color}:t=${thickness}`);
}

function addBaseLayout(filters, slide, index) {
  drawBox(filters, 0, 0, width, height, "0x16256B", "fill");
  drawBox(filters, 0, 0, width, 90, "0x0F9488@0.72", "fill");
  drawBox(filters, 76, 54, 86, 86, "0xF59E0B", "fill");
  drawText(filters, `brand-${index}`, "EFF", 96, 83, 28, "0x111827");
  drawText(filters, `brand-name-${index}`, "Everything for Free Academy", 184, 53, 30, "0xFFFFFF");
  drawText(filters, `brand-tag-${index}`, "Learn - Create - Automate - Earn", 185, 91, 18, "0xD9F8F2");

  if (slide.eyebrow) {
    drawText(filters, `eyebrow-${index}`, slide.eyebrow.toUpperCase(), 78, 178, 22, "0xF59E0B");
  }

  drawText(filters, `title-${index}`, slide.title, 78, slide.eyebrow ? 218 : 190, 52, "0xFFFFFF", {
    lineSpacing: 16,
    border: 2,
    borderColor: "0x0B1026"
  });
  drawText(filters, `body-${index}`, slide.body, 82, 346, 28, "0xDCE7F7", { lineSpacing: 12 });

  slide.bullets.forEach((bullet, bulletIndex) => {
    const y = 448 + bulletIndex * 52;
    drawBox(filters, 86, y + 6, 18, 18, "0xF59E0B", "fill");
    drawText(filters, `bullet-${index}-${bulletIndex}`, bullet, 122, y, 26, "0xFFFFFF");
  });
}

function addHeroMockup(filters, index) {
  drawBox(filters, 790, 162, 388, 430, "0xFFFFFF@0.10", "fill");
  drawBox(filters, 826, 208, 316, 120, "0xF59E0B", "fill");
  drawText(filters, `hero-ai-${index}`, "AI", 930, 226, 64, "0x111827");
  ["Prompting", "Design", "Video", "Web & Apps", "Productivity", "Income"].forEach((item, i) => {
    const x = 826 + (i % 2) * 160;
    const y = 360 + Math.floor(i / 2) * 62;
    drawBox(filters, x, y, 140, 42, "0xFFFFFF@0.16", "fill");
    drawText(filters, `hero-card-${index}-${i}`, item, x + 12, y + 11, 18, "0xFFFFFF");
  });
}

function addLandingMockup(filters, index) {
  drawBox(filters, 780, 150, 410, 460, "0xF8FAFC", "fill");
  drawBox(filters, 810, 184, 350, 54, "0x16256B", "fill");
  drawText(filters, `landing-nav-${index}`, "EFF Academy", 832, 202, 20, "0xFFFFFF");
  drawBox(filters, 832, 292, 280, 58, "0xF59E0B", "fill");
  drawText(filters, `landing-button-${index}`, "Apply Now", 900, 306, 28, "0x111827");
  drawBox(filters, 840, 395, 130, 86, "0xEAF2FF", "fill");
  drawBox(filters, 990, 395, 130, 86, "0xEAFBF7", "fill");
  drawText(filters, `landing-tap-${index}`, "Tap here", 872, 526, 26, "0x16256B");
}

function addPersonalMockup(filters, index) {
  drawBox(filters, 752, 130, 458, 500, "0xFFFFFF", "fill");
  drawText(filters, `personal-title-${index}`, "Personal Information", 790, 162, 30, "0x16256B");
  ["Full Name", "Phone Number", "WhatsApp Number", "Email Address", "State", "Occupation"].forEach((label, i) => {
    const x = 790 + (i % 2) * 190;
    const y = 230 + Math.floor(i / 2) * 96;
    drawText(filters, `personal-label-${index}-${i}`, label, x, y, 17, "0x5F6B7D");
    drawBox(filters, x, y + 28, 166, 42, "0xF5F7FB", "fill");
  });
}

function addCoursesMockup(filters, index) {
  drawBox(filters, 740, 126, 320, 500, "0xFFFFFF", "fill");
  drawText(filters, `course-title-${index}`, "Choose Courses", 776, 160, 28, "0x16256B");
  ["ChatGPT", "Canva AI", "Website Design", "Prompt Engineering"].forEach((label, i) => {
    const y = 232 + i * 68;
    drawBox(filters, 780, y, 32, 32, i < 3 ? "0x2563EB" : "0xE5E7EB", "fill");
    drawText(filters, `course-check-${index}-${i}`, i < 3 ? "✓" : "", 786, y - 3, 30, "0xFFFFFF");
    drawText(filters, `course-label-${index}-${i}`, label, 830, y + 2, 22, "0x172033");
  });
  drawBox(filters, 1082, 198, 160, 280, "0xFFF8EB", "fill");
  drawText(filters, `course-fee-label-${index}`, "Selected Fee", 1102, 230, 18, "0x9A5A00");
  drawText(filters, `course-fee-${index}`, "N10,000", 1100, 270, 34, "0x111827");
  drawText(filters, `course-fee-note-${index}`, "1-3 courses", 1102, 330, 20, "0x5F6B7D");
}

function addScheduleMockup(filters, index) {
  drawBox(filters, 760, 150, 430, 455, "0xFFFFFF", "fill");
  drawText(filters, `schedule-title-${index}`, "Devices + Session", 800, 185, 30, "0x16256B");
  ["Android Phone", "Laptop", "Tablet"].forEach((label, i) => {
    const y = 255 + i * 58;
    drawBox(filters, 800, y, 28, 28, "0x2563EB", "fill");
    drawText(filters, `schedule-device-${index}-${i}`, label, 846, y, 22, "0x172033");
  });
  drawBox(filters, 800, 460, 112, 48, "0xEAF2FF", "fill");
  drawBox(filters, 930, 460, 112, 48, "0xEAFBF7", "fill");
  drawBox(filters, 1060, 460, 90, 48, "0xFFF8EB", "fill");
  drawText(filters, `schedule-morning-${index}`, "10 AM", 824, 473, 21, "0x16256B");
  drawText(filters, `schedule-evening-${index}`, "4 PM", 963, 473, 21, "0x0F9488");
  drawText(filters, `schedule-night-${index}`, "8 PM", 1084, 473, 21, "0x9A5A00");
}

function addPaymentMockup(filters, index) {
  drawBox(filters, 726, 130, 492, 500, "0xFFFFFF", "fill");
  drawText(filters, `payment-title-${index}`, "Payment Details", 770, 164, 30, "0x16256B");
  [["Bank", "Opay"], ["Account", "8166563757"], ["Holder", "Phiip Awazie"]].forEach((row, i) => {
    const y = 238 + i * 76;
    drawBox(filters, 774, y, 380, 56, "0xF0F6FF", "fill");
    drawText(filters, `payment-label-${index}-${i}`, row[0], 794, y + 10, 17, "0x5F6B7D");
    drawText(filters, `payment-value-${index}-${i}`, row[1], 914, y + 9, 24, "0x16256B");
  });
  drawBox(filters, 776, 500, 378, 76, "0xFFF8EB", "fill");
  drawText(filters, `payment-upload-${index}`, "Upload payment screenshot", 812, 524, 24, "0x111827");
}

function addSuccessMockup(filters, index) {
  drawBox(filters, 758, 162, 430, 400, "0xFFFFFF", "fill");
  drawBox(filters, 820, 220, 80, 80, "0x18A957", "fill");
  drawText(filters, `success-check-${index}`, "✓", 843, 224, 58, "0xFFFFFF");
  drawText(filters, `success-title-${index}`, "Registration received", 820, 336, 30, "0x16256B");
  drawText(filters, `success-id-${index}`, "Student ID: EFF-AI-2026-001", 820, 388, 23, "0x172033");
  drawBox(filters, 820, 456, 300, 58, "0xEAFBF7", "fill");
  drawText(filters, `success-group-${index}`, "WhatsApp class link", 858, 472, 23, "0x0F9488");
}

function addCtaMockup(filters, index) {
  drawBox(filters, 742, 158, 448, 410, "0xFFFFFF@0.12", "fill");
  drawText(filters, `cta-big-${index}`, "30 DAYS", 816, 216, 68, "0xF59E0B");
  drawText(filters, `cta-mid-${index}`, "Live training + practice", 814, 318, 34, "0xFFFFFF");
  drawText(filters, `cta-contact-${index}`, "WhatsApp: https://wa.link/gv9hre\nCall: +234 901 254 5656", 814, 404, 24, "0xDCE7F7", { lineSpacing: 14 });
}

function addMockup(filters, slide, index) {
  if (slide.mockup === "hero") addHeroMockup(filters, index);
  if (slide.mockup === "landing") addLandingMockup(filters, index);
  if (slide.mockup === "personal") addPersonalMockup(filters, index);
  if (slide.mockup === "courses") addCoursesMockup(filters, index);
  if (slide.mockup === "schedule") addScheduleMockup(filters, index);
  if (slide.mockup === "payment") addPaymentMockup(filters, index);
  if (slide.mockup === "success") addSuccessMockup(filters, index);
  if (slide.mockup === "cta") addCtaMockup(filters, index);
}

function makeScene(slide, index) {
  const filters = [];
  const number = String(index + 1).padStart(2, "0");
  const out = path.join(workDir, `scene-${number}.mp4`);

  addBaseLayout(filters, slide, index);
  addMockup(filters, slide, index);
  filters.push(`fade=t=in:st=0:d=0.35`);
  filters.push(`fade=t=out:st=${Math.max(0.1, slide.duration - 0.35)}:d=0.35`);

  run(ffmpeg, [
    "-y",
    "-f", "lavfi",
    "-i", `color=c=0x16256B:s=${width}x${height}:r=${fps}:d=${slide.duration}`,
    "-vf", filters.join(","),
    "-t", String(slide.duration),
    "-c:v", "libx264",
    "-preset", "medium",
    "-crf", "18",
    "-pix_fmt", "yuv420p",
    out
  ], `Render scene ${number}`);

  return out;
}

function main() {
  if (!fs.existsSync(ffmpeg)) {
    throw new Error(`ffmpeg not found at ${ffmpeg}. Run: npm install --prefix /tmp/eff-video-tools @ffmpeg-installer/ffmpeg`);
  }

  fs.mkdirSync(outDir, { recursive: true });
  resetDir(workDir);

  const scriptPath = path.join(outDir, "registration-voiceover-script.txt");
  fs.writeFileSync(scriptPath, `${voiceover}\n`, "utf8");

  const voicePath = path.join(workDir, "voiceover.aiff");
  run("say", ["-r", "168", "-o", voicePath, voiceover], "Voice-over generation");

  const scenes = slides.map(makeScene);
  const concatPath = path.join(workDir, "concat.txt");
  fs.writeFileSync(concatPath, scenes.map((scene) => `file '${scene}'`).join("\n"), "utf8");

  const silentVideo = path.join(workDir, "registration-walkthrough-silent.mp4");
  run(ffmpeg, [
    "-y",
    "-f", "concat",
    "-safe", "0",
    "-i", concatPath,
    "-c", "copy",
    silentVideo
  ], "Video concatenation");

  const output = path.join(outDir, "registration-walkthrough.mp4");
  run(ffmpeg, [
    "-y",
    "-i", silentVideo,
    "-i", voicePath,
    "-map", "0:v:0",
    "-map", "1:a:0",
    "-c:v", "copy",
    "-c:a", "aac",
    "-b:a", "160k",
    "-af", "volume=1.2,apad",
    "-shortest",
    "-movflags", "+faststart",
    output
  ], "Final MP4 export");

  const stats = fs.statSync(output);
  console.log(`Created ${output}`);
  console.log(`Size ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Voice-over script ${scriptPath}`);
}

main();
