# ImpactHub — Frontend

React 18 + Vite + Tailwind CSS frontend for the ImpactHub platform, wired to the Express/MongoDB backend in `../backend`.

## Stack
- React Router v6, Axios (JWT interceptor)
- Tailwind CSS with dark mode (`class` strategy)
- Recharts (Admin analytics: pie/bar)
- @dnd-kit (drag-and-drop Kanban board)
- react-leaflet + Leaflet (project geo map)
- socket.io-client (real-time notifications)
- lucide-react (icons), react-hot-toast (toasts), date-fns

## Setup
```bash
cd frontend
npm install
cp .env.example .env   # edit if your backend runs on a different port
npm run dev
```
App runs at http://localhost:5173 and proxies `/api` + `/socket.io` to `http://localhost:5000` (see `vite.config.js`).

## Structure
- `src/api/client.js` — Axios instance + one export per backend resource (Auth, Project, Application, Task, Comment, Notification, Admin, Dashboard, SkillMatch, User) — every function maps 1:1 to a real backend route.
- `src/context/` — Auth, Theme (dark/light), Socket providers
- `src/components/` — Layout/sidebar, Kanban board, project map, cards, notification bell
- `src/pages/` — Login, Register, Discover (search/filter/sort/map), Project Detail (apply, kanban, comments, reviews, applications), role dashboards (Student/Manager/Admin), Manager Projects (create/manage), Admin Users/Projects, Leaderboard, Profile

## Notes on backend field names
The backend response shapes weren't fully visible from routes alone (only route files + models/controllers list were inspected structurally). API calls use defensive fallbacks like:
```js
res.data?.data?.projects || res.data?.data || []
```
so the UI works whether your controllers respond as `{ data: { projects: [...] } }` or `{ data: [...] }`. If your actual field names differ (e.g. `volunteersRequired` vs `requiredVolunteers`, `text` vs `content` for comments), do a quick find-and-replace — the components already check both common variants for the fields called out in the spec (title, description, category, location, dates, requiredVolunteers, skillsRequired).
