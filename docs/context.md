# App Blueprint: Balance Studio

## 1. Project Breakdown

**App Name:** Balance Studio  
**Platform:** Web (responsive for desktop and mobile)  

**Vision & Goals:**  
Balance Studio is a modern web platform for a Pilates studio that streamlines client onboarding, class booking, and studio management. The app aims to provide an elegant digital experience that mirrors the studio's premium physical service, with intuitive navigation, secure authentication, and specialized booking flows for different Pilates modalities (Mat and Reformer). The staff portal offers efficient session management while maintaining client privacy.

**Primary Use Case:**  
New clients discover the studio online, sign up for an account, select a training plan, and book classes according to their skill level and plan limitations. Returning clients manage their subscriptions and bookings. Staff members oversee schedules and client attendance.

**Authentication Requirements:**  
- Email/password authentication via Supabase Auth  
- Role-based access control (client vs staff)  
- Session persistence with JWT  
- Password-protected staff portal (additional auth layer)  

## 2. Tech Stack Overview

**Frontend Framework:**  
- React 18 with Next.js 14 (App Router)  
- TypeScript for type safety  

**UI Components:**  
- Tailwind CSS for utility-first styling  
- ShadCN for accessible, customizable UI components  
- React Icons for scalable vector icons  

**Backend Services:**  
- Supabase for:  
  - PostgreSQL database (classes, users, bookings)  
  - Authentication (email/password)  
  - Real-time subscriptions (booking updates)  
  - Storage (studio photos)  

**Payment Processing:**  
- Stripe integration via Stripe.js  

**Deployment:**  
- Vercel for Next.js optimized hosting  
- Automatic CI/CD from main branch  

## 3. Core Features

**Client-Facing Features:**  
1. **Responsive Navigation Bar**  
   - Studio logo + name (left-aligned)  
   - "Services" dropdown (Mat Pilates, Reformer Pilates)  
   - "Who are we" dropdown (Community, Terms)  
   - "Staff" button (password-protected)  
   - User greeting + profile indicator when logged in  

2. **Authentication Flow**  
   - Sign-up with email/password (Supabase Auth)  
   - Email confirmation (optional)  
   - Password reset functionality  

3. **Plan Selection System**  
   - Two distinct flows (Mat/Reformer)  
   - 3-tier pricing (4/8/12 sessions monthly)  
   - Visual progress tracker (plan > instructor > payment)  
   - Order summary with Stripe/cash options  

4. **Intelligent Booking Calendar**  
   - Month/week views with available slots  
   - Level filtering (beginner/intermediate/advanced)  
   - Plan-based session limits (disables overbooking)  
   - Real-time availability via Supabase subscriptions  

**Staff Features:**  
1. **Password-Protected Portal**  
   - Additional auth layer beyond standard login  
   - Master calendar view of all sessions  
   - Attendee lists (name + surname only)  
   - Session modification tools (reschedule/cancel)  

## 4. User Flow

**New Client Journey:**  
1. Lands on homepage → "See Plans" dropdown  
2. Selects Mat/Reformer → views modality page  
3. Clicks "See Plans" → Plan Selection page  
4. Chooses plan tier → selects instructor → payment  
5. Redirected to booking page with active plan  
6. Filters by level → books available sessions  
7. Receives confirmation (email + UI)  

**Returning Client Flow:**  
1. Logs in → sees personalized greeting  
2. Homepage shows current plan status  
3. Navigates directly to booking if plan active  
4. Receives renewal prompt when plan expires  

**Staff Flow:**  
1. Clicks "Staff" button in nav  
2. Enters studio password (separate from user auth)  
3. Views master calendar with color-coded sessions  
4. Clicks session → sees attendee list  
5. Makes adjustments → changes propagate in real-time  

## 5. Design & UI/UX Guidelines

**Visual Identity:**  
- Primary color: Deep Teal (#2D5D7C)  
- Secondary: Soft Peach (#F5C7A9)  
- Accent: Vibrant Coral (#E57F84)  
- Font: 'Inter' (sans-serif) with 'Playfair Display' (headings)  

**Key UI Patterns:**  
1. **Progress Tracker** (Plan Selection):  
   - Left sidebar with 3-step vertical progress  
   - Active step highlighted with coral accent  
   - Checkmark icons for completed steps  

2. **Booking Calendar:**  
   - Day cells show:  
     - AM/PM dividers  
     - Available slots (green border)  
     - Booked slots (grayed out)  
   - Skill level pills (color-coded)  

3. **Mobile Adaptations:**  
   - Collapsible navigation menu  
   - Stacked layout for progress tracker  
   - Full-screen calendar views  
   - Larger tap targets (48px min)  

**Accessibility Standards:**  
- WCAG 2.1 AA compliance  
- Prefers-reduced-motion support  
- Keyboard navigable interface  
- ARIA labels for interactive elements  

## 6. Technical Implementation

**Supabase Schema:**  
```sql
-- Clients table
create table clients (
  id uuid references auth.users primary key,
  first_name text not null,
  last_name text not null,
  current_plan_id uuid references plans,
  plan_expires_at timestamptz
);

-- Plans table
create table plans (
  id uuid primary key default uuid_generate_v4(),
  name text not null, -- "Mat 8-session"
  type text not null, -- "mat" or "reformer"
  session_count integer not null,
  price numeric not null
);

-- Bookings table
create table bookings (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients not null,
  session_id uuid references sessions not null,
  booked_at timestamptz not null default now(),
  status text not null default 'confirmed' -- or 'cancelled'
);

-- Sessions table
create table sessions (
  id uuid primary key default uuid_generate_v4(),
  instructor_id uuid references staff not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  level text not null, -- 'beginner'/'intermediate'/'advanced'
  max_capacity integer not null,
  current_attendees integer not null default 0
);
```

**Key Components:**  
1. `AuthProvider` (Next.js middleware):  
   - Wraps app in Supabase session context  
   - Handles route protection (staff vs client)  

2. `PlanStepper`:  
   - Multi-step form with ShadCN Form  
   - Persists state between steps with URL params  

3. `LiveCalendar`:  
   - Uses react-big-calendar with custom views  
   - Subscribes to Supabase real-time channel  
   - Implements custom event styling  

4. `StaffGate`:  
   - Password check against hashed value in env  
   - Timeout after 3 failed attempts  

**Performance Optimizations:**  
- Dynamic imports for booking calendar  
- Supabase queries with row-level security  
- Static generation for marketing pages  
- Image optimization with Next.js Image  

## 7. Development Setup

**Requirements:**  
- Node.js 18+  
- PNPM (recommended)  
- Supabase account  
- Stripe developer account  

**Setup Instructions:**  
1. Clone repository  
2. Install dependencies:  
   ```bash
   pnpm install
   ```
3. Create `.env.local` with:  
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-key
   STRIPE_PUBLISHABLE_KEY=your-stripe-key
   STAFF_PORTAL_PASSWORD_HASH=bcrypt-hash
   ```
4. Run development server:  
   ```bash
   pnpm dev
   ```

**Supabase Initialization:**  
1. Enable Email/Password auth  
2. Set up row-level security policies  
3. Configure storage bucket for studio images  
4. Create database triggers for:  
   - Plan expiration checks  
   - Booking availability updates  

**Vercel Deployment:**  
1. Connect Git repository  
2. Add same environment variables  
3. Enable automatic deployments  
4. Set up production Stripe keys  

This blueprint provides complete implementation guidance using only the specified tech stack while addressing all functional requirements for the Pilates studio web application.