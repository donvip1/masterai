# EFF Master AI Tools Academy

Simple Vercel-ready website for Batch 2 of the EFF Master AI Tools Academy.

The site is split into three public pages:

- `index.html` - landing page with course overview and CTA buttons.
- `register.html` - student registration form.
- `quiz.html` - module quiz/test submission page.

## Local preview

```bash
npm run dev
```

Open `http://localhost:3000`.

## Connect registrations and quizzes to Google Sheets and email

1. Create a new Google Sheet for the academy.
2. Open `Extensions -> Apps Script`.
3. Paste the full contents of `google-apps-script/Code.gs`.
4. Confirm `NOTIFICATION_EMAIL` is `viplearn4free@gmail.com`, or change it if you want responses sent elsewhere.
5. Save the script, then run `setupSheet` once and approve the permissions for Sheets, Gmail, and Drive.
6. Click `Deploy -> New deployment`.
7. Select `Web app`.
8. Set `Execute as` to `Me`.
9. Set access to `Anyone`.
10. Deploy and copy the Web App URL.
11. In Vercel, add an environment variable named `GOOGLE_SCRIPT_URL` with that Web App URL.
12. Redeploy the Vercel project.

After this:

- Registrations are written to the `Registrations` sheet.
- Payment screenshots are stored in a Google Drive folder with the Drive link saved in the Sheet.
- Module quiz/test submissions are written to the `Quiz Submissions` sheet.
- Admin emails are sent to `viplearn4free@gmail.com`.
- Students receive registration and quiz confirmation emails.
- The paid-students WhatsApp group link is shown and emailed only after a student selects `I have paid and uploaded proof` and uploads payment proof.

## Vercel deployment

Import this folder into Vercel as a project. No build command is required. The site uses:

- `index.html`, `styles.css`, and `script.js` for the frontend.
- `register.html` for the registration form page.
- `quiz.html` for the module quiz page.
- `api/register.js` as the Vercel serverless function.
- `api/quiz.js` as the quiz scoring and submission function.
- `quiz-data.js` as the shared objective quiz bank for Modules 0-14.
- `google-apps-script/Code.gs` for the Google Sheet and Gmail automation.

## Notes

The current form matches the requested registration sections:

- Personal Information
- About You
- Learning Interests
- Learning Device
- Class Preference
- Commitment
- Payment
- Expectations
- Agreement

The quiz section includes one objective test for each handbook module. Each module currently has 5 questions, which keeps every test below the requested 10-question limit.
