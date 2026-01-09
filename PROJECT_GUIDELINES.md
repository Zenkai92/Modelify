# Modelify - Project Structure & Guidelines

This document serves as the reference for the project structure and development guidelines. It should be consulted for every modification to ensure consistency and security.

## 🚨 CRITICAL SECURITY GUIDELINES

### 1. Role Verification (Admin & Permissions)
*   **RULE**: **NEVER** rely solely on the frontend state, local storage, or even the standard JWT metadata `role` for critical authorization decisions.
*   **IMPLEMENTATION**:
    *   **Frontend**: Use the enriched user object from `AuthContext` (which fetches the real role from the `Users` table) for UI logic (hiding buttons/menus).
    *   **Backend**: For any administrative or sensitive endpoint, you **MUST** query the `Users` table using the authenticated user's ID to verify their current role in the database.
    *   **Reason**: The JWT token might be stale (issued before a role change), and frontend state is mutable by the user. The database is the single source of truth.

### 2. Database Security
*   **RLS (Row Level Security)**: Ensure Supabase RLS policies are configured to reflect the logic:
    *   `Users` table: readable by owner (and admins).
    *   `Projects` table: readable/writable by owner (and admins).
*   **Validation**: Backend must validate all inputs (Pydantic schemas) before insertion.

## � Development Principles

### 1. Architecture & Data Flow
*   **RULE**: The Frontend **MUST NEVER** communicate directly with the Database.
*   **Implementation**:
    *   All data operations (CRUD) must go through the **Backend API** (FastAPI).
    *   The Frontend uses the Supabase client **ONLY** for Authentication (Auth) and Storage (if strictly necessary), but **NEVER** for direct table access (`supabase.from('table').select...` is FORBIDDEN in frontend code).
    *   **Reason**: This ensures business logic, validation, and security rules are centralized and enforced in the backend.

## �🛠 Tech Stack & Configuration

### Environment Variables
*   **Backend** (`backend/.env`):
    *   `SUPABASE_URL`: URL of the Supabase instance.
    *   `SUPABASE_KEY`: Service role key (or anon key depending on usage, prefer service role for admin tasks).
    *   `FRONTEND_URL`: URL of the frontend (e.g., `http://localhost:3000`) for CORS configuration.
*   **Frontend** (`frontend/.env`):
    *   `VITE_SUPABASE_URL`: URL of the Supabase instance.
    *   `VITE_SUPABASE_ANON_KEY`: Public anonymous key.
    *   `VITE_API_URL`: URL of the backend API (e.g., `http://localhost:8000`).

### Infrastructure
*   **Docker**: The project uses `docker-compose.yml` to orchestrate services.
    *   `backend`: Runs on port 8000.
    *   `frontend`: Runs on port 3000 (mapped to 80 inside container via Nginx).

## 📂 Project Structure

### Backend (`/backend`)
*   **Framework**: FastAPI (Python)
*   **Key Files**:
    *   `main.py`: Application entry point, CORS configuration, Router registration.
    *   `app/database.py`: Supabase client initialization.
    *   `app/dependencies.py`: Authentication dependencies (e.g., `get_current_user` verifying the Bearer token).
    *   `app/routers/`: Contains API route definitions.
        *   `users.py`: User management. Enforces 'particulier' role on public registration.
        *   `projects.py`: Project requests. Handles file uploads to Supabase Storage.
    *   `app/schemas/`: Pydantic models for request/response validation.
*   **File Storage**:
    *   Bucket: `project-images`
    *   Path Structure: `{projectId}/{timestamp}_{sanitized_filename}`
    *   Validation: Checks MIME types (images, pdf, zip).

### Frontend (`/frontend`)
*   **Framework**: React (Vite)
*   **Styling**: Bootstrap 5 + Custom CSS per component.
*   **Testing**: Vitest + React Testing Library.
*   **Key Files**:
    *   `src/App.jsx`: Main application component and Routing definitions.
    *   `src/lib/supabase.js`: Supabase client configuration.
    *   `src/contexts/AuthContext.jsx`:
        *   Manages authentication state.
        *   **Crucial**: Contains logic to `enrichUserWithProfile` which fetches the real role from the DB to override/augment the session user.
    *   `src/components/`:
        *   `Navbar.jsx`: Navigation, includes role-based menu visibility.
        *   `ProtectedRoute.jsx`: Wrapper for routes requiring authentication.
    *   `src/pages/`:
        *   `admin/`: Admin-specific pages.
        *   `Login.jsx`, `Register.jsx`: Auth pages.

## 📝 Coding Standards

*   **Language**:
    *   Backend: Python (Type hints recommended).
    *   Frontend: JSX / JavaScript.
*   **API Communication**:
    *   Use `fetch` or a wrapper in the frontend.
    *   Backend endpoints should return standard JSON responses.
*   **Error Handling**:
    *   Backend: Raise `HTTPException` with clear status codes.
    *   Frontend: Display user-friendly error messages (e.g., in forms).
