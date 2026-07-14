const TEMPLATE_URL = "/module-task-completion-template.jpeg";
const REPORT_WIDTH = 1280;
const REPORT_HEIGHT = 853;

export const reportMotivations = [
  "Great work! Keep learning.",
  "You are improving every day.",
  "Small progress leads to big success.",
  "Consistency beats talent.",
  "One module completed. Keep going!"
];

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The module report template could not be loaded."));
    image.src = source;
  });
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }

      reject(new Error("The module report image could not be generated."));
    }, "image/png");
  });
}

function roundedRect(context, x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, height / 2);

  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
}

function setFont(context, size, weight = 500) {
  context.font = `${weight} ${size}px Arial, sans-serif`;
}

function fitText(context, text, maxWidth, startSize, minSize, weight = 600) {
  let size = startSize;

  while (size > minSize) {
    setFont(context, size, weight);

    if (context.measureText(text).width <= maxWidth) {
      break;
    }

    size -= 0.5;
  }

  return size;
}

function drawWrappedText(context, text, options) {
  const {
    x,
    y,
    maxWidth,
    lineHeight,
    maxLines,
    fontSize,
    minFontSize = fontSize,
    weight = 600,
    color = "#172033"
  } = options;
  let size = fontSize;
  let lines = [];

  while (size >= minFontSize) {
    setFont(context, size, weight);
    const words = String(text || "").split(/\s+/).filter(Boolean);
    lines = [];
    let line = "";

    words.forEach((word) => {
      const candidate = line ? `${line} ${word}` : word;

      if (!line || context.measureText(candidate).width <= maxWidth) {
        line = candidate;
      } else {
        lines.push(line);
        line = word;
      }
    });

    if (line) {
      lines.push(line);
    }

    if (lines.length <= maxLines || size === minFontSize) {
      break;
    }

    size -= 0.5;
  }

  context.fillStyle = color;
  setFont(context, size, weight);

  lines.slice(0, maxLines).forEach((line, index) => {
    context.fillText(line, x, y + index * lineHeight);
  });
}

function drawCheck(context, x, y, color, radius = 11) {
  context.fillStyle = color;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = "#ffffff";
  context.lineWidth = 3;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();
  context.moveTo(x - radius * 0.45, y);
  context.lineTo(x - radius * 0.08, y + radius * 0.35);
  context.lineTo(x + radius * 0.52, y - radius * 0.42);
  context.stroke();
}

function drawIncorrect(context, x, y, color, radius = 11) {
  context.fillStyle = color;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = "#ffffff";
  context.lineWidth = 2.8;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(x - radius * 0.36, y - radius * 0.36);
  context.lineTo(x + radius * 0.36, y + radius * 0.36);
  context.moveTo(x + radius * 0.36, y - radius * 0.36);
  context.lineTo(x - radius * 0.36, y + radius * 0.36);
  context.stroke();
}

function drawEncouragementIcon(context, color) {
  context.fillStyle = "#fff7ed";
  context.beginPath();
  context.arc(1072, 319, 66, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = color;
  context.lineWidth = 8;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();
  context.moveTo(1028, 351);
  context.lineTo(1054, 326);
  context.lineTo(1077, 341);
  context.lineTo(1114, 294);
  context.stroke();

  context.beginPath();
  context.moveTo(1093, 294);
  context.lineTo(1114, 294);
  context.lineTo(1114, 315);
  context.stroke();

  context.fillStyle = color;
  context.textAlign = "center";
  setFont(context, 18, 800);
  context.fillText("KEEP GOING", 1072, 410);
  context.textAlign = "left";
}

function formatCompletionDate(value) {
  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function moduleNumber(moduleId) {
  const match = String(moduleId || "").match(/(\d+)/);
  return match ? match[1] : "0";
}

function reportFileName(studentId, moduleId) {
  const safeStudentId = String(studentId || "Student")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .slice(0, 50);

  return `${safeStudentId}_Module${moduleNumber(moduleId)}_Report.png`;
}

function drawQuestionRows(context, questionBreakdown, palette) {
  const rows = Array.isArray(questionBreakdown) ? questionBreakdown.slice(0, 5) : [];
  const startY = 493;
  const rowHeight = 37;

  context.fillStyle = "#ffffff";
  context.fillRect(510, 489, 698, 195);

  for (let index = 0; index < 5; index += 1) {
    const question = rows[index];
    const rowY = startY + index * rowHeight;

    roundedRect(context, 516, rowY, 684, 34, 6);
    context.fillStyle = "#ffffff";
    context.fill();
    context.strokeStyle = "#e6e8ec";
    context.lineWidth = 1;
    context.stroke();

    context.fillStyle = "#5c2ca3";
    context.beginPath();
    context.arc(536, rowY + 17, 11, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = "#ffffff";
    context.textAlign = "center";
    context.textBaseline = "middle";
    setFont(context, 14, 800);
    context.fillText(String(index + 1), 536, rowY + 17);
    context.textAlign = "left";

    if (!question) {
      continue;
    }

    const title = String(question.question || `Question ${index + 1}`);
    const titleSize = fitText(context, title, 505, 16, 11, 500);
    context.fillStyle = "#31343b";
    setFont(context, titleSize, 500);
    context.fillText(title, 570, rowY + 18);

    const correct = Boolean(question.correct);
    const statusColor = correct ? palette.success : palette.warning;
    const statusText = correct ? "Correct" : "Incorrect";
    context.fillStyle = statusColor;
    context.textAlign = "right";
    setFont(context, 15, 700);
    context.fillText(statusText, 1157, rowY + 18);
    context.textAlign = "left";

    if (correct) {
      drawCheck(context, 1177, rowY + 17, statusColor, 10);
    } else {
      drawIncorrect(context, 1177, rowY + 17, statusColor, 10);
    }
  }

  context.textBaseline = "alphabetic";
}

export async function createModuleReport(reportData) {
  const template = await loadImage(TEMPLATE_URL);
  const canvas = document.createElement("canvas");
  canvas.width = REPORT_WIDTH;
  canvas.height = REPORT_HEIGHT;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("This browser cannot generate the module report.");
  }

  const passed = Boolean(reportData.passed);
  const palette = {
    accent: passed ? "#65ad17" : "#d97706",
    success: "#65ad17",
    warning: "#dc6b19",
    ink: "#172033",
    muted: "#555b66"
  };
  const motivation = reportData.motivation || reportMotivations[
    Math.floor(Math.random() * reportMotivations.length)
  ];

  context.drawImage(template, 0, 0, REPORT_WIDTH, REPORT_HEIGHT);

  context.fillStyle = "#ffffff";
  context.fillRect(145, 238, 300, 40);
  context.fillRect(145, 322, 300, 67);
  context.fillRect(145, 416, 300, 43);
  context.fillRect(145, 500, 300, 35);
  context.fillRect(515, 250, 200, 180);
  context.fillRect(748, 290, 190, 125);
  context.fillRect(995, 445, 195, 37);

  context.fillStyle = "#f8f5ff";
  context.fillRect(125, 584, 310, 72);

  context.fillStyle = palette.accent;
  setFont(context, 24, 700);
  context.fillText(String(reportData.studentId || ""), 156, 264);

  drawWrappedText(context, reportData.moduleName || reportData.moduleId, {
    x: 156,
    y: 345,
    maxWidth: 276,
    lineHeight: 22,
    maxLines: 3,
    fontSize: 19,
    minFontSize: 14,
    weight: 650,
    color: palette.ink
  });

  context.fillStyle = palette.ink;
  setFont(context, 19, 650);
  context.fillText(reportData.taskType || "Module Quiz", 156, 447);
  context.fillText(formatCompletionDate(reportData.completionDate), 156, 523);

  drawWrappedText(context, motivation, {
    x: 132,
    y: 610,
    maxWidth: 286,
    lineHeight: 24,
    maxLines: 2,
    fontSize: 18,
    minFontSize: 15,
    weight: 500,
    color: "#30343b"
  });

  context.strokeStyle = "#e5e7eb";
  context.lineWidth = 9;
  context.beginPath();
  context.arc(612, 342, 76, 0, Math.PI * 2);
  context.stroke();

  const progress = Math.max(0, Math.min(100, Number(reportData.percentage || 0)));
  context.strokeStyle = palette.accent;
  context.lineCap = "round";
  context.beginPath();
  context.arc(
    612,
    342,
    76,
    -Math.PI / 2,
    -Math.PI / 2 + Math.PI * 2 * (progress / 100)
  );
  context.stroke();
  context.lineCap = "butt";

  context.fillStyle = palette.accent;
  context.textAlign = "center";
  setFont(context, 43, 800);
  context.fillText(`${progress}%`, 612, 354);
  context.fillStyle = palette.muted;
  setFont(context, 16, 600);
  context.fillText("SCORE", 612, 386);
  context.textAlign = "left";

  context.fillStyle = palette.muted;
  setFont(context, 17, 500);
  context.fillText("SCORE", 758, 312);
  context.fillStyle = palette.accent;
  setFont(context, 44, 800);
  context.fillText(`${reportData.score} / ${reportData.totalQuestions}`, 758, 362);

  const resultText = passed ? "PASSED" : "NEEDS IMPROVEMENT";
  const resultSize = fitText(context, resultText, 165, 24, 17, 800);
  context.fillStyle = palette.accent;
  setFont(context, resultSize, 800);
  context.fillText(resultText, 758, 399);

  if (passed) {
    drawCheck(context, 884, 391, palette.success, 13);
  } else {
    context.fillStyle = "#ffffff";
    context.fillRect(946, 226, 244, 205);
    drawEncouragementIcon(context, palette.warning);
  }

  context.fillStyle = palette.muted;
  context.textAlign = "right";
  setFont(context, 16, 500);
  context.fillText(`TOTAL QUESTIONS: ${reportData.totalQuestions}`, 1187, 473);
  context.textAlign = "left";

  drawQuestionRows(context, reportData.questionBreakdown, palette);

  const blob = await canvasToBlob(canvas);
  const fileName = reportFileName(reportData.studentId, reportData.moduleId);
  const file = new File([blob], fileName, { type: "image/png" });

  return {
    blob,
    file,
    fileName,
    motivation,
    width: REPORT_WIDTH,
    height: REPORT_HEIGHT
  };
}

export function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("The report image could not be prepared for storage."));
    reader.readAsDataURL(blob);
  });
}

export function createWhatsAppMessage(report, downloadUrl = "") {
  const lines = [
    "🎉 Module Task Completed",
    "",
    `Student ID: ${report.studentId}`,
    `Module: ${report.moduleName}`,
    `Score: ${report.score}/${report.totalQuestions} (${report.percentage}%)`,
    "",
    report.passed
      ? "Excellent work! Keep mastering AI Tools 🚀"
      : "Keep improving. Your next correction will move you forward."
  ];

  if (downloadUrl) {
    lines.push("", `Download report: ${downloadUrl}`);
  }

  return lines.join("\n");
}
