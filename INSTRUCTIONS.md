# ImpactHub — Teacher / Evaluator Deployment Guide

This guide walks a tech teacher or judge through running ImpactHub locally end-to-end.

## 1. Extract and install

```bash
cd backend
npm install

cd ../frontend
npm install
```

## 2. Configure environment variables

`backend/.env` and `frontend/.env` are already included with working evaluation
credentials (MongoDB Atlas cluster, ImgBB key, and SMTP creds). If you'd like to
point at your own database instead, edit `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>/<database>
JWT_SECRET=use-a-long-random-secret
IMGBB_API_KEY=your-imgbb-key
SMTP_USER=your-smtp-email
SMTP_PASS=your-smtp-password-or-app-password
CLIENT_URL=http://localhost:5173
```

`IMGBB_API_KEY`, `SMTP_USER`, and `SMTP_PASS` are only needed for image uploads
and outgoing email — the rest of the platform works locally without them.

## 3. Prepare a clean database

With the backend folder open, run:

```bash
npm run seed
```

This **wipes every automated/mock project** (and their tasks, applications, and
comments) so the database starts clean, and creates the default administrator
account **only if it doesn't already exist**:

```
Email:    admin@impacthub.com
Password: Admin@12345
```

It is safe to re-run at any point — it never touches projects created by real
project managers through the app UI.

## 4. Run the platform

Terminal 1 (backend, port 5000):
```bash
cd backend
npm run dev
```

Terminal 2 (frontend, port 5173):
```bash
cd frontend
npm run dev
```

Open `http://localhost:5173/` — this is the **Login** screen. The app boots
straight to Login/Dashboard; there is no separate marketing landing page.

## 5. Suggested evaluation flow

1. **Log in as admin** (`admin@impacthub.com` / `Admin@12345`) — view Users and
   Projects management, approve/reject pending projects, delete rogue accounts.
2. **Register a Project Manager** account, create a project (pending admin
   approval), then approve it from the admin account.
3. **Register a Student** account, pick skills from the hybrid skills selector
   on Register, upload and crop a profile photo, then go to **Discover** and
   apply to the project you created.
4. Back in the Project Manager account, open the project and **Approve** the
   student's application from the *Volunteer Applications* panel — note the
   applicant's contact details are visible only to that project's manager (and
   admin), never intercepted by other managers.
5. As the approved student, the **Task Board** and **Discussion forum** unlock;
   before approval they were shown blurred/locked.
6. Check the **Leaderboard**, the **Notification bell** (instant mark-all-read
   on open, closes on outside click), and the **Profile page** (Edit Profile
   toggle, avatar crop modal, collapsible password accordion — an incorrect
   current password shows a toast and never logs you out).
7. Visit **About / Privacy / Terms** from the footer — each has an animated
   "← Back to Dashboard" button.

## Troubleshooting

- **Discovery only shows a few projects**: fixed — discovery now returns up to
  100 projects per page instead of the old 12-project cap.
- **Wrong password on Profile logs me out**: fixed — an incorrect current
  password now returns a form error, not a session-ending one.
- **Ports in use**: backend defaults to `5000`, frontend (Vite) to `5173`.
  Change `PORT` in `backend/.env` or pass `--port` to `vite` if needed.
