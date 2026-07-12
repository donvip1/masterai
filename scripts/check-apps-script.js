const fs = require("fs");
const path = require("path");

const sourcePaths = [
  path.resolve(__dirname, "../google-apps-script/Code.gs"),
  path.resolve(__dirname, "../google-apps-script/QuizCode.gs")
];

sourcePaths.forEach((sourcePath) => {
  const source = fs.readFileSync(sourcePath, "utf8");

  new Function(source);
});

console.log("Google Apps Script syntax checks passed.");
