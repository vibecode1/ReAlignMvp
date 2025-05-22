**Build Instruction Prompt: New Negotiator Registration with 30-Day Free Trial**

**Objective:** Implement functionality to allow new users to register as "Negotiators" on the ReAlign platform. Upon registration, these negotiators will have full access to negotiator functionalities for a 30-day trial period. No credit card is required for this initial registration and trial.

**General AI Guidance:**

* This is a **new feature** that expands upon the existing MVP specifications. You will need to add new components, API endpoints, and database schema modifications.  
* Refer to the overall project structure and technology stack defined in `docs/ReAlign MVP – Technical Architecture Overview.docx`.  
* Adhere to coding standards, ESLint/Prettier configurations, and UI guidelines from `docs/ReAlign MVP – Brand Kit.docx` and `docs/ReAlign MVP - Figma Wireframe Spec.docx` where applicable for new UI elements.  
* Use Replit Secrets for any new configuration variables if necessary.

---

**Phase A: Backend Implementation**

**Primary Documents for Backend Context:**

* `docs/ReAlign MVP - Database Schema.docx`  
* `docs/ReAlign MVP - API Routes.docx`  
* `docs/ReAlign MVP – Technical Architecture Overview.docx`  
* `docs/ReAlign MVP – Security & Privacy Plan.docx`  
* `Supplementary Information for ReAlign MVP AI Coding Agent.docx` (for Zod schemas)

**Tasks:**

1. **Modify Database Schema (`users` table):**

   * Reference `docs/ReAlign MVP - Database Schema.docx` (users table section).  
   * Add a new nullable timestamp field to the `users` table: `trial_ends_at TIMESTAMPTZ NULL`.  
   * Generate a new Drizzle ORM migration for this schema change and provide instructions on how to apply it.  
2. **Create New API Endpoint: Negotiator Registration**

   * Following the patterns in `docs/ReAlign MVP - API Routes.docx`, define a new public endpoint: `POST /api/v1/auth/register-negotiator`.  
   * **Request Body:**  
     * `name: string` (required)  
     * `email: string` (required, must be a valid email format)  
     * `password: string` (required, define reasonable minimum length/complexity, e.g., 8 characters)  
   * **Validation:** Use Zod (as per `Supplementary Information` and existing auth routes ) to validate the request body. Create a new Zod schema, e.g., `NegotiatorRegistrationSchema`.  
   * **Logic:**  
     * Check if a user with the provided email already exists in the `users` table. If so, return a 400 or 409 error (e.g., "Email already in use").  
     * Use Supabase Auth server-side client (`@supabase/supabase-js`) to create a new authenticated user with the provided email and password.  
     * If Supabase user creation is successful, insert a new record into your `users` table:  
       * `id`: Use the ID from the newly created Supabase Auth user.  
       * `name`: From request body.  
       * `email`: From request body.  
       * `role`: Set to `'negotiator'`.  
       * `trial_ends_at`: Calculate current datetime \+ 30 days. Store this value.  
       * `phone`: Can be null initially.

**Response (201 Created):** Return user information (excluding password) and a JWT token, similar to the `/auth/login` response. Example:  
 JSON  
{  
  "user": {  
    "id": "uuid",  
    "email": "new\_negotiator@example.com",  
    "role": "negotiator",  
    "name": "New Negotiator Name",  
    "trial\_ends\_at": "iso\_timestamp\_30\_days\_later"  
  },  
  "token": "jwt\_token\_string"  
}

*   
  * Implement standardized error responses as per `API Routes.docx`.  
3. **Update Authentication/Access Control Logic (Backend Middleware):**

   * Modify existing JWT authentication middleware (or create a new one specifically for negotiators if appropriate) used to protect routes accessible by negotiators.  
   * After successfully verifying a JWT for a user with the 'negotiator' role, this middleware must also check the `trial_ends_at` field from the `users` table for that user.  
   * If `trial_ends_at` is present and is in the past (current time \> `trial_ends_at`), the user's trial has expired.  
     * For MVP, deny access: return a `403 Forbidden` error with a specific error code/message (e.g., `{ "error": { "code": "TRIAL_EXPIRED", "message": "Your 30-day trial has expired. Please contact support to continue service." } }`).  
     * This check should apply to all negotiator-specific data modification and access endpoints beyond basic login/registration.

---

**Phase B: Frontend Implementation**

**Primary Documents for Frontend Context:**

* `docs/ReAlign MVP - Figma Wireframe Spec.docx` (for general UI style, though no specific wireframe exists for this new flow)  
* `docs/ReAlign MVP - Component Specification.docx` (for using existing `shadcn/ui` components)  
* `docs/ReAlign MVP – Brand Kit.docx`  
* `docs/ReAlign MVP – Technical Architecture Overview.docx` (Frontend Architecture)  
* `Supplementary Information for ReAlign MVP AI Coding Agent.docx` (for Zod schemas and UI text snippets)

**Tasks:**

1. **Create New Negotiator Registration Screen/Page:**

   * Design a new page/route (e.g., `/register-negotiator`).  
   * The page should include a form with fields for:  
     * Full Name  
     * Email Address  
     * Password  
     * Password Confirmation (client-side check)  
   * Style the form using TailwindCSS and `shadcn/ui` components (e.g., `Input`, `Button`, `Card` from `TransactionView.tsx` scaffold) consistent with the `Brand Kit` and `Figma Wireframe Spec`.  
   * Include brief informational text: "Register as a Negotiator for a 30-day full access trial. No credit card required."  
   * Provide a link to the existing Negotiator Login page for users who already have accounts.  
2. **Implement Client-Side Logic:**

   * Use React state to manage form inputs.  
   * Implement client-side validation using Zod (e.g., for email format, password length, password confirmation match) based on the `NegotiatorRegistrationSchema` (or a frontend equivalent). Display validation errors clearly to the user.  
   * On form submission:  
     * Call the new `POST /api/v1/auth/register-negotiator` backend endpoint with the form data.  
     * Handle successful registration:  
       * Store the received JWT and user data (including `trial_ends_at`) in your React Context/global state for session management.  
       * Redirect the user to the Negotiator Dashboard (as per `User Onboarding Flow.md` ).  
     * Handle errors from the API (e.g., email already exists, validation errors, server errors) and display user-friendly messages.  
   * Implement loading states for the "Register" button during API call.  
3. **(Optional, for enhanced UX) Display Trial Information:**

   * Consider where to subtly display trial information to the logged-in negotiator (e.g., in a user profile dropdown or a small banner). For MVP, simply having the backend enforce the trial is sufficient, but if time permits, a UI indicator would be good.  
   * Example message: "Your free trial ends on \[date\]." (format `trial_ends_at` for display).

---

**Testing Considerations (refer to `docs/ReAlign MVP - QA Test Plan.docx` for general approach):**

* Verify new negotiator registration with valid data.  
* Test registration with an already existing email.  
* Test registration with invalid data (e.g., weak password, invalid email format) to check client-side and server-side validation.  
* Log in as a newly registered negotiator and confirm access to negotiator functionalities.  
* Manually adjust a user's `trial_ends_at` in the database to a past date and verify that access is denied as expected with the correct error message.  
* Verify that the JWT token received upon registration works for accessing protected negotiator routes.

---

This prompt outlines the necessary backend and frontend changes, refers to relevant existing documentation for context and patterns, and introduces new elements required for the negotiator registration and trial feature

