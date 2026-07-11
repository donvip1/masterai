# EFF Master AI Tools Academy

Simple Vercel-ready registration website for Batch 2 of the EFF Master AI Tools Academy.

## Local preview

```bash
npm run dev
```

Open `http://localhost:3000`.

## Connect registration to Google Sheets and email

1. Create a new Google Sheet for student registrations.
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

After this, every site submission will be written to the Google Sheet, an admin email will be sent to `viplearn4free@gmail.com`, the student will receive a registration confirmation email, and uploaded payment screenshots will be stored in a Google Drive folder with the file link saved in the Sheet.

## Vercel deployment

Import this folder into Vercel as a project. No build command is required. The site uses:

- `index.html`, `styles.css`, and `script.js` for the frontend.
- `api/register.js` as the Vercel serverless function.
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
