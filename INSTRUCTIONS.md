# ImpactHub deployment guide

## 1. Extract and install

Extract the submitted workspace, then open two terminals:

```powershell
cd backend
npm install

cd ..\frontend
npm install
```

## 2. Configure the backend

Create or update `backend/.env` using the credentials supplied for evaluation:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>/<database>
JWT_SECRET=use-a-long-random-secret
IMGBB_API_KEY=your-imgbb-key
SMTP_USER=your-smtp-email
SMTP_PASS=your-smtp-password-or-app-password
CLIENT_URL=http://localhost:5173
```

`IMGBB_API_KEY`, `SMTP_USER`, and `SMTP_PASS` are required only for image-upload and email delivery features. The application can otherwise be reviewed locally without sending email.

## 3. Seed the evaluation data

With the backend terminal open, run:

```powershell
npm run seed
```

This creates the default administrator (if it does not already exist) and inserts 15 active, geo-tagged community campaigns. Existing unrelated database data is preserved.

- Email: `admin@impacthub.com`
- Password: `Admin@12345`

## 4. Run both applications

Terminal 1:

```powershell
cd backend
npm run dev
```

Terminal 2:

```powershell
cd frontend
npm run dev
```

Open the Vite URL printed in Terminal 2 (normally `http://localhost:5173`). The backend listens on `http://localhost:5000` by default.

## Production check

Before submission, build the frontend with `cd frontend; npm run build`. Confirm that the production deployment sets `VITE_API_URL` to the public backend URL when frontend and API are hosted on separate origins.
