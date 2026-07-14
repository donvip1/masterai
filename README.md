# Everything for Free Academy

Next.js website and student-app foundation for `effacademy.xyz`.

EFF means **Everything for Free Academy**. The current program is the AI Tools Academy: registration, class schedule, quizzes, student dashboard progress, and a future-ready mobile app path.

## Structure

- `app/` - Next.js App Router pages.
- `components/` - reusable React UI and client-side flows.
- `lib/academyData.js` - shared academy data for class days, announcements, modules, and future backend providers.
- `pages/api/` - Next API wrappers for the existing low-cost backend.
- `api/` - current registration and quiz handlers that forward to Google Apps Script.
- `public/manifest.webmanifest`, `public/service-worker.js`, `public/app-icon.svg` - PWA install/offline foundation.
- `google-apps-script/` - Google Sheets, Drive, and email automation.
- `quiz-data.js` - objective quiz bank used by the quiz API and React quiz page.

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
- Local dashboard progress through `localStorage` now.
- Google Apps Script remains the no-cost backend for registration and quiz submission now.
- Supabase is reserved in `lib/academyData.js` for later, but it is not active and costs nothing now.
- Future Android/iOS can use Expo or React Native and reuse the same data model, route ideas, API payloads, and student-progress logic.

When the academy starts making enough money, Supabase can be added for student login, cloud progress sync, payments, certificates, announcements, and admin dashboard features.

## Connect registration to its Google Sheet

1. Use your existing registration Google Sheet, or create a new one.
2. Open `Extensions -> Apps Script`.
3. Paste the full contents of `google-apps-script/Code.gs`.
4. Confirm `NOTIFICATION_EMAIL` is `viplearn4free@gmail.com`, or change it if you want responses sent elsewhere.
5. Paste the registration Sheet ID into `SPREADSHEET_ID`.
6. Save the script, then run `setupSheet` once and approve the permissions for Sheets, Gmail, and Drive.
7. Click `Deploy -> New deployment`.
8. Select `Web app`.
9. Set `Execute as` to `Me`.
10. Set access to `Anyone`.
11. Deploy and copy the Web App URL ending in `/exec`.
12. In Vercel, add `GOOGLE_REGISTRATION_SCRIPT_URL` with that Web App URL.

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

## Checks

```bash
npm run check
npm run build
```

The build verifies the Next.js app. The check script validates the core CommonJS scripts and Apps Script syntax.
