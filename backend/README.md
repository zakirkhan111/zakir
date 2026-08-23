# ImpactHub Backend — Saylani Community Impact Platform

Production-ready REST API for the ImpactHub hackathon project (Node.js + Express + MongoDB).

## Setup

1. `cd backend && npm install`
2. Copy `.env.example` to `.env` and fill in real values (MongoDB URI, JWT secret, Cloudinary, SMTP).
3. `npm run seed` (optional) — creates the initial admin account from `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
4. `npm run dev` — starts the API with nodemon on `PORT` (default 5000).

## Architecture

MVC structure: `config/`, `models/`, `controllers/`, `routes/`, `middleware/`, `utils/`.

- **Auth**: JWT (httpOnly cookie + Bearer header support), bcrypt password hashing, role-based route guards (`student`, `project_manager`, `admin`).
- **File uploads**: Multer memory storage + ImgBB for profile pictures, project images, and completion evidence.
- **Real-time**: Socket.IO — per-user rooms (`user:<id>`) for notifications, per-project rooms (`project:<id>`) for live comments.
- **Email**: Nodemailer with styled HTML templates for welcome emails, application decisions, task assignments, and an auto-rendered certificate of appreciation.
- **Impact Score**: `Volunteers × Tasks Completed × Completion% `, recalculated automatically whenever tasks change status (see `utils/impactScore.js`, wired through `taskController` → `projectController.recalculateProjectImpactScore`).
- **Volunteer Points**: awarded automatically on join (+10), task completion (+20), project completion (+100) etc. — see `POINTS` in `utils/impactScore.js`.
- **AI Skill-Matching**: `controllers/skillMatchController.js` — normalized skill comparison producing a match score, matched/missing skills, and ranked project/candidate recommendations. Swappable later for a real embeddings model without changing the API contract.

## Key API Routes (all prefixed `/api/v1`)

| Area | Routes |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `POST /auth/forgot-password`, `PATCH /auth/reset-password/:token` |
| Users | `PATCH /users/profile`, `GET /users/leaderboard/contributors` |
| Projects | `GET/POST /projects`, `GET/PATCH/DELETE /projects/:id`, `GET /projects/manager/mine`, `GET /projects/student/joined`, `POST /projects/:id/reviews` |
| Applications | `POST /applications`, `GET /applications/mine`, `GET /applications/project/:projectId`, `PATCH /applications/:id/decision` |
| Tasks | `POST /tasks`, `GET /tasks/project/:projectId` (Kanban board), `PATCH /tasks/:id/status`, `GET /tasks/mine` |
| Comments | `POST /comments`, `GET /comments/project/:projectId`, `DELETE /comments/:id` |
| Notifications | `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all` |
| Admin | `GET /admin/users`, `PATCH /admin/users/:id/suspend`, `GET /admin/projects`, `PATCH /admin/projects/:id/approve`, `GET /admin/stats`, `GET /admin/reports`, `POST /admin/projects/:id/issue-certificates` |
| Dashboard | `GET /dashboard/student`, `GET /dashboard/manager`, `GET /dashboard/admin`, `GET /dashboard/leaderboard/impact` |
| Skill Match | `GET /skill-match/project/:projectId`, `GET /skill-match/recommended-projects`, `GET /skill-match/project/:projectId/candidates` |

## Security

Helmet, CORS (credentialed, `CLIENT_URL` origin), `express-mongo-sanitize`, `xss-clean`, global + auth-specific rate limiting, bcrypt (cost 12), JWT with password-change invalidation, role guards on every protected route, Mongoose schema validation on every model.

## Notes for the Phase 2 (frontend) team

- All list endpoints support `?search=&category=&location=&status=&sort=newest|oldest|most-volunteers|nearest-deadline&page=&limit=`.
- Auth token can be sent as `Authorization: Bearer <token>` or is auto-set as an httpOnly cookie (`jwt`) on login/register.
- Socket.IO client should connect with `auth: { userId }` and can `emit('joinProjectRoom', projectId)` to receive live `comment:new` / `comment:deleted` events, and listens globally for `notification:new`.
