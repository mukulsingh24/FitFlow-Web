## FitFlow – AI‑Powered Fitness Companion

FitFlow is a personal fitness companion web app that combines trackers, analytics and AI to help users stay on top of their health goals. The project contains a full frontend and backend that you built from scratch:

- Modern, animated UI with glassmorphism and gradients
- Firebase authentication (email/password + Google) with email verification
- Fitness tools (BMI, calories, water, food logging)

---

## 1. What This Project Includes

- Complete authentication flow (register, login, forgot password, verification)
- User dashboard that summarizes goals and quick actions
- Multiple fitness utilities (BMI calculator, food tracker, water tracker, etc.)
- AI integrations (FitBro chat and smart food analysis)
- Profile management and basic admin mode
- Production‑ready backend
---

## 2. Core Features

### 2.1 Authentication & Onboarding
- Email/password registration and login using Firebase Auth
- Google sign‑in option
- Email verification screen and redirect logic
- Forgot password flow using password‑reset emails

### 2.2 Dashboard
- Personalized dashboard for logged‑in users
- Shows greetings, quick stats, and entry points into trackers
- Uses persisted theme and profile data from local storage

### 2.3 BMI & Body Metrics
- Dedicated BMI calculator page
- Users can enter height and weight to calculate BMI
- Displays BMI category feedback and simple guidance

### 2.4 Food Tracker (AI Image Nutrition)
- Upload a food image and send it to the backend
- Backend uses Fit Vision models to:
	- Recognize the dish
	- Estimate calories and macros
	- Return a clean JSON response with nutritional info and tips
- Frontend shows a structured card with name, calories, macros and suggestions

### 2.5 Form Checker / Smart Assistant
- A page where users submit form inputs (e.g. habits or plans)
- Backend sends the prompt to Fit to analyze and return suggestions
- Designed as a flexible “smart checker” that can be extended to other use cases

### 2.6 Water / Hydration Tracker
- Simple UI to log water intake across the day
- Visual progress towards daily target
- Works alongside other health metrics for a complete view

### 2.7 Steps / Motivation Page
- Landing/steps page that explains the app’s benefits in stages
- Uses animations and cards to show “step‑by‑step” how FitFlow helps users

### 2.8 Profile & Theme
- Profile page to save name, basic details and preferences
- Uses local storage to persist user data per browser
- Light/dark theme toggle with smooth UI transitions

### 2.9 Admin Mode (Local)
- Simple admin flag stored in local storage
- Allows you to log in as an “admin” without a real Firebase account
- Useful for showcasing the app without creating extra users

### 2.10 FitBro AI Chat (Backend)
- Chat endpoint that uses Fit and a custom system prompt
- Behaves like a motivating fitness buddy (“FitBro”) with:
	- Workout advice
	- Nutrition tips
	- Encouraging, casual tone

---

## 3. Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4
- **Backend**: Node.js, Express
- **Auth & Data**: Firebase Auth (client‑side)
- **Other**: dotenv, JWT (for future expansion), CORS

---

## 4. Main Screens & Flows

- **Auth Screens**
	- `/auth/register` – user registration with validation
	- `/auth/login` – login with email/password or Google
	- `/auth/forgot` – send reset password email
	- `/auth/verification` – check verification state and redirect

- **Core App Pages**
	- `/dashboard` – central hub, quick entry into features
	- `/bmi` & legacy `pages/bmi` – BMI calculator
	- `/foodtracker` & legacy `pages/foodtracker` – AI food analysis
	- `pages/calorie` – calorie‑focused utilities (legacy route)
	- `pages/tracker` – additional tracker/summary (legacy route)
	- `/profile` & legacy `pages/profile` – profile and preferences
	- `pages/home` – marketing/landing style home
	- `/steps` & `/water` – motivational and hydration tools

- **Backend API**
	- `POST /api/chat` – FitBro AI chat
	- `POST /api/food/analyze` – food image nutrition analysis
	- `POST /api/form` – form checker / text analysis

---

## 5. How It Works (High Level)

1. Frontend handles all UI, routing and user interaction in Next.js.
2. Firebase secures user auth and email flows.
3. Backend (Express) exposes AI endpoints (`/api/chat`, `/api/food`, `/api/form`).
4. Backend calls Fit models with carefully designed prompts and returns structured JSON.
5. Frontend renders the AI responses into rich cards, charts and helper text.

---

## 6. Future Scope & Improvements

You can extend FitFlow in many directions:

- **Deeper Analytics** – long‑term charts and AI summaries for trends
- **Workout Planner** – AI‑generated routines, schedules and reminders
- **Nutrition Planning** – meal plans, grocery lists, macro‑based suggestions
- **Social & Gamification** – leaderboards, streaks, badges and challenges
- **Integrations** – sync with wearables (Google Fit, Apple Health, etc.)
- **Smarter AI Controls** – in‑app AI on/off toggle, rate‑limits, caching and quotas

---