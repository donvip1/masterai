const fs = require("fs");
const path = require("path");

const sourcePath = path.resolve(__dirname, "../google-apps-script/Code.gs");
const source = fs.readFileSync(sourcePath, "utf8");

new Function(source);
console.log("Google Apps Script syntax check passed.");
