# Everything for Free Academy

Next.js website and student-app foundation for `effacademy.xyz`.

EFF means **Everything for Free Academy**. The current program is the AI Tools Academy: registration, class schedule, quizzes, student dashboard progress, and a future-ready mobile app path.

## Structure

- `app/` - Next.js App Router pages.
- `components/` - reusable React UI and client-side flows.
- `lib/academyData.js` - shared academy data for class days, announcements, modules, and future backend providers.
- `pages/api/` - Next API wrappers for the existing low-cost backend.
- `lib/server/` - registration, Student ID lookup, and quiz API handlers that forward to Google Apps Script.
- `public/manifest.webmanifest`, `public/service-worker.js`, `public/app-icon.svg` - PWA install/offline foundation.
- `google-apps-script/` - Google Sheets, Drive, email automation, and protected admin data actions.
- `quiz-data.js` - objective quiz bank used by the quiz API and React quiz page.
- `public/module-task-completion-template.jpeg` - master artwork used for automatic module reports.

## Local preview

```bash
npm run dev
```

Open `http://localhost:3000`.

## Production domain

Use `effacademy.xyz` as the public domain in Vercel or your hosting provider.

The app metadata already uses:

- Site name: `Everything for Free Academy`
- Domain: `effacademy.xyz`
- Short name: `EFF Academy`

## Mobile app path

The site is now built with React through Next.js, which gives a cleaner path to Android and iOS later.

Current path:

- Next.js web app and PWA now.
- Visitors who have not installed the PWA receive a device-aware install prompt. Chromium browsers use the native install dialog, while iPhone and iPad visitors receive Add to Home Screen instructions.
- The service worker keeps the public app shell and visited pages available when the network is unavailable. API requests and private student records are never cached.
- Student ID sessions are remembered locally on the signed-in device.
- Signed-in students receive a timed Google Meet button on Mondays, Wednesdays, and Fridays. It opens 10 minutes before the 10 AM, 4 PM, and 8 PM Lagos sessions and remains available during class.
- The student dashboard turns verified quiz activity into XP levels, learning streaks, progress milestones, achievement badges, and on-device milestone celebrations.
- Google Apps Script remains the no-cost backend for registration, student lookup, quiz progress, cooldowns, performance records, announcements, and admin controls.
- Supabase is reserved in `lib/academyData.js` for later, but it is not active and costs nothing now.
- Future Android/iOS can use Expo or React Native and reuse the same data model, route ideas, API payloads, and student-progress logic.

When the academy starts making enough money, Supabase can still be added for stronger identity management, cloud progress sync, payments, and certificates. The current protected admin dashboard uses the existing Google Sheets backend.

## Admin control room

Open `/admin` to access the restricted academy control room. The only permitted email is hardcoded on the server as `viplearn4free@gmail.com`; the password is never hardcoded or sent to the browser bundle.

The admin dashboard provides:

- live database totals and the full registration list;
- student search and CSV export;
- registration approval and payment confirmation;
- student warnings by dashboard notice and email;
- suspension, restoration, and permanent registration deletion;
- payment proof links and direct email/WhatsApp contact;
- announcement publishing, editing, hiding, and deletion;
- announcements shared automatically with the homepage and signed-in student dashboards.

Add these private environment variables in Vercel:

```text
ADMIN_PASSWORD=<a strong private password>
ADMIN_SESSION_SECRET=<at least 32 random characters>
ADMIN_API_KEY=<a separate random key shared only with Apps Script>
```

Use `.env.example` as the local configuration template. Never commit the real values.

Admin sessions use a signed, HTTP-only, SameSite cookie and expire after eight hours. Admin database requests are authorized twice: first by the signed Next.js session, then by the private `ADMIN_API_KEY` sent server-to-server to Google Apps Script.

## SEO

The public website includes canonical URLs, search-engine directives, `robots.txt`, `sitemap.xml`, Open Graph and social metadata, and structured Organization/Course data. Private student, quiz, offline, API, and admin routes are excluded from indexing.

## Connect registration to its Google Sheet

1. Use your existing registration Google Sheet, or create a new one.
2. Open `Extensions -> Apps Script`.
3. Paste the full contents of `google-apps-script/Code.gs` and `google-apps-script/AdminCode.gs` into separate files in the same Apps Script project.
4. Confirm `NOTIFICATION_EMAIL` is `viplearn4free@gmail.com`, or change it if you want responses sent elsewhere.
5. Paste the registration Sheet ID into `SPREADSHEET_ID`.
6. Open Apps Script Project Settings, add the script property `ADMIN_API_KEY`, and give it the exact same private value used by Vercel.
7. Save the script, then run `setupAdminData` once and approve the permissions for Sheets, Gmail, and Drive.
8. Click `Deploy -> New deployment`.
9. Select `Web app`.
10. Set `Execute as` to `Me`.
11. Set access to `Anyone`.
12. Deploy and copy the Web App URL ending in `/exec`.
13. In Vercel, add `GOOGLE_REGISTRATION_SCRIPT_URL` with that Web App URL.

The registration script also provides Student ID lookup for dashboard login. Whenever `Code.gs` changes, create a new Apps Script deployment version and keep the Vercel environment variable pointed at the `/exec` URL.

For compatibility, the registration endpoint can still use the older `GOOGLE_SCRIPT_URL`, but `GOOGLE_REGISTRATION_SCRIPT_URL` is preferred now.

## Connect module quizzes to a separate Google Sheet

1. Create a separate Google Sheet for module exams/quizzes.
2. Open `Extensions -> Apps Script`.
3. Paste the full contents of `google-apps-script/QuizCode.gs`.
4. Confirm `NOTIFICATION_EMAIL` is `viplearn4free@gmail.com`, or change it if you want quiz notices sent elsewhere.
5. Paste the module quiz Sheet ID into `SPREADSHEET_ID`.
6. Save the script, then run `setupSheet` once and approve the permissions for Sheets and Gmail.
7. Click `Deploy -> New deployment`.
8. Select `Web app`.
9. Set `Execute as` to `Me`.
10. Set access to `Anyone`.
11. Deploy and copy the Web App URL ending in `/exec`.
12. In Vercel, add `GOOGLE_QUIZ_SCRIPT_URL` with that Web App URL.
13. Redeploy after adding or changing environment variables.

The quiz script now:

- verifies Student IDs against the registration Sheet;
- loads student details from the database instead of asking for them again;
- allows only the next module in sequence;
- opens corrections 30 minutes after a failed attempt;
- opens the next module 48 hours after a passed attempt;
- resets to module 0 after all modules are passed;
- stores quiz cycles and the next available attempt time.
- returns all-time activity dates, pass totals, best scores, and perfect-score totals for the student engagement system.

After replacing `QuizCode.gs`, run `setupSheet` once so the `Cycle` and `Next Attempt At` columns are added, then create a new Web App deployment version.

## Connect automatic module reports

Module reports use a separate Apps Script deployment so the existing registration and quiz endpoints remain unchanged.

1. Create a third Apps Script project. It can be opened from the quiz Google Sheet.
2. Paste the full contents of `google-apps-script/ReportCode.gs`.
3. Confirm the quiz and registration spreadsheet IDs in `REPORT_CONFIG`.
4. Save the script, then run `setupReportSheet` once.
5. Approve the requested Sheets, Drive, and email permissions.
6. Deploy it as a Web App with `Execute as: Me` and access set to `Anyone`.
7. Copy its Web App URL ending in `/exec`.
8. Add `GOOGLE_REPORT_SCRIPT_URL` in Vercel with that URL.
9. Redeploy the Next.js project.

After a saved quiz attempt, the browser renders the supplied template as a high-quality PNG. The report service then:

- verifies the report values against the latest saved quiz row;
- creates PNG and PDF copies;
- stores them in `Mastering AI Tools/Student Reports/Module N`;
- appends completion metadata to the `Module Reports` Sheet;
- emails both files to the student's registered email address;
- returns Drive download and WhatsApp sharing links.

The `WhatsApp Share URL` column is the instructor's current sharing control until a separate authenticated instructor dashboard is added.

If the report deployment is temporarily unavailable, the saved quiz is not affected and the student can still download the locally generated PNG.

### Recover reports for older submissions

Students who submitted quizzes before module reports were enabled can sign in and open the Quiz page. The **Previous Submission Recovery** section:

- loads their historical quiz attempts directly from the quiz Sheet;
- identifies attempts that do not yet have a generated report;
- provides **Generate Report** for one attempt;
- provides **Generate All Missing** for a complete backfill;
- reuses existing reports instead of creating duplicate Drive files or emails;
- never requires the student to retake a module.

After adding this recovery update, replace `ReportCode.gs` in the separate report Apps Script project and create a new Web App deployment version. The `GOOGLE_REPORT_SCRIPT_URL` can remain the same when the existing deployment is updated to the new version.

## Checks

```bash
npm run check
npm run build
```

The build verifies the Next.js app. The check script validates the core CommonJS scripts and Apps Script syntax.
