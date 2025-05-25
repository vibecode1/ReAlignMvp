# ReAlign MVP - Remaining Work & Refinements Plan

**Version:** 1.0
**Date:** May 22, 2025

**Objective:** This document outlines key areas for refinement, clarification, and potential fixes based on the initial audit of the ReAlign MVP project. These items are suggested to enhance functionality, align more closely with all specifications, and improve security and user experience.

---

## Phase 1: Core Functionality Enhancements & Clarifications

### 1.1. Push Notification Strategy & Firebase Integration

* **Item:** Clarify the definitive push notification strategy. The project includes a `firebase-messaging-sw.js` and backend setup for device token registration (`notificationController.ts`, `client/src/lib/notifications.ts`), but the exact interplay (especially if FCM is the chosen provider for the generic push notifications) needs to be seamless.
* **Action:**
    * Confirm if Firebase Cloud Messaging (FCM) is the sole provider for browser push notifications.
    * If so, ensure `firebase-messaging-sw.js` is correctly configured with actual Firebase project credentials (currently placeholders) and that the device tokens obtained are FCM tokens.
    * Ensure `notificationService.ts` is prepared to use these tokens with an FCM SDK or appropriate API calls for sending push notifications as per "ReAlign MVP – Notification Rules.docx".
    * Remove any redundant or conflicting notification setup if a single strategy is chosen.
* **Files/Docs:** `client/public/firebase-messaging-sw.js`, `server/services/notificationService.ts`, `server/controllers/notificationController.ts`, "ReAlign MVP – Notification Rules.docx", "ReAlign MVP - Build Instructions.docx" (Phase 12).

### 1.2. Negotiator's Post-Upload File Visibility Toggle

* **Item:** Implement the functionality for negotiators to change the visibility of *any* uploaded file (private/shared) *after* the initial upload. This is specified in "ReAlign MVP - Build Instructions.docx" (Phase 10).
* **Action:**
    * **Backend:** Create a new API endpoint, e.g., `PATCH /api/v1/uploads/:uploadId/visibility`.
        * Request Body: `{ "visibility": "private" | "shared" }`
        * This endpoint should be negotiator-only.
        * Update the `visibility` field in the `uploads` table for the given `uploadId`.
        * Reference: `server/routes.ts`, `server/controllers/uploadController.ts`, `server/storage.ts`.
    * **Frontend:** In `TransactionView.tsx`, add UI controls (e.g., a toggle or dropdown menu item next to each file visible to the negotiator) to call this new API endpoint.
* **Files/Docs:** `server/controllers/uploadController.ts`, `server/routes.ts`, `client/src/pages/TransactionView.tsx`, "ReAlign MVP - Build Instructions.docx".

### 1.3. SMS Opt-In Mechanism

* **Item:** Ensure the SMS opt-in preference, mentioned as a toggle in "ReAlign MVP – User Onboarding Flow.docx" (New Transaction screen), is captured, stored, and utilized by the notification service.
* **Action:**
    * **Database:** Confirm if an `sms_opt_in` (boolean) field exists in the `users` table or `transaction_participants` table. If not, add it to `shared/schema.ts` and create a migration.
    * **Backend:**
        * When creating/inviting users in `transactionController.ts` (during `POST /transactions`), ensure the opt-in status from the request body is saved to the database.
        * `notificationService.ts` must query this opt-in status before attempting to send SMS notifications.
    * **Frontend:** The "SMS opt-in toggle" in `NewTransaction.tsx` should correctly pass this value to the backend.
* **Files/Docs:** `shared/schema.ts`, `server/controllers/transactionController.ts`, `server/services/notificationService.ts`, `client/src/pages/NewTransaction.tsx`, "ReAlign MVP – User Onboarding Flow.docx".

### 1.4. Enhanced "Retry" for UploadWidget

* **Item:** Improve the "Retry" mechanism in the `UploadWidget.tsx` as per "ReAlign MVP - Component Spec.docx" and "ReAlign MVP - Figma Wireframe Spec.docx", which specify a 'Retry' button for failed uploads.
* **Action:**
    * In `UploadWidget.tsx`, when an upload fails (e.g., network error, server error response from `handleUpload`), maintain the state of the failed file (name, type).
    * Display a clear "Retry" button next to the error message for that specific file.
    * Clicking "Retry" should re-initiate the `handleUpload` process for that same file without requiring the user to re-select it.
    * The current implementation clears the file or requires re-selection after an error.
* **Files/Docs:** `client/src/components/transactions/UploadWidget.tsx`, `client/src/components/ui/image-upload.tsx` (if retry logic is shared or delegated), "ReAlign MVP - Component Spec.docx", "ReAlign MVP - Figma Wireframe Spec.docx".

---

## Phase 2: Data Integrity and User Experience Refinements

### 2.1. Comprehensive "Last Activity At" Calculation

* **Item:** Enhance the `lastActivityAt` field for transactions to be more comprehensive than just the latest message or creation date.
* **Action:**
    * **Backend:** In `server/storage.ts` or `server/controllers/transactionController.ts`, when fetching transactions, modify the logic for calculating `lastActivityAt`.
    * Consider querying the latest timestamp from multiple related tables for a given transaction:
        * `messages.created_at`
        * `uploads.created_at`
        * `document_requests.updated_at` (or `created_at`)
        * `transaction_participants.updated_at`
        * `transactions.updated_at` (for phase changes, etc.)
    * The most recent of these timestamps would be the true `lastActivityAt`. This might require additional queries or more complex SQL.
* **Files/Docs:** `server/controllers/transactionController.ts`, `server/storage.ts`, "ReAlign MVP - API Routes.docx" (for `GET /transactions` response).

### 2.2. Message Mentions and Targeted Notifications

* **Item:** Implement backend parsing for "@mentions" in messages and trigger targeted notifications as per "ReAlign MVP – Notification Rules.docx".
* **Action:**
    * **Backend:**
        * In `messageController.ts` (`POST /transactions/:id/messages`):
            * After saving a message, parse `message.text` for patterns like "@User Name".
            * If mentions are found, identify the `user_id` of the mentioned users (this might require a lookup against the `users` table or `transaction_participants` based on names within the current transaction).
            * Trigger targeted notifications (Email, Push) specifically to the mentioned users via `notificationService.ts`.
        * The `notificationService.ts` may need a new method or an adaptation to handle "mention" type notifications.
    * **Frontend:** While the PRD says "plain text @User Name for MVP", no UI autocomplete is needed, but the display of mentions in `MessageThread.tsx` could potentially highlight these mentions if desired (post-MVP enhancement).
* **Files/Docs:** `server/controllers/messageController.ts`, `server/services/notificationService.ts`, "ReAlign MVP – Notification Rules.docx" (Section 6).

### 2.3. Secure File Downloads with Signed URLs

* **Item:** Enhance file download security by using expiring signed URLs instead of direct public URLs, as implied by "ReAlign MVP – Security & Privacy Plan.docx" ("Download Access: Signed URLs expire after 5 minutes").
* **Action:**
    * **Backend:**
        * Modify `server/controllers/uploadController.ts` (`GET /uploads/:transactionId`). Instead of returning the direct `file_url` from the database (which is a public Supabase URL), for each upload, generate a short-lived signed URL using `supabase.storage.from('uploads').createSignedUrl(filePath, expiresIn)`.
        * The `filePath` would need to be reconstructed or stored appropriately (it seems `uploadData.path` from Supabase upload is not directly stored, only `publicUrl.publicUrl`). It might be better to store the Supabase path alongside the public URL or derive it.
        * Alternatively, create a new dedicated backend endpoint (e.g., `GET /api/v1/uploads/:uploadId/download-link`) that returns a signed URL for a specific file. This would be called by the frontend when a user clicks a "Download" button.
    * **Frontend:** Update components displaying file links (`TransactionView.tsx`, `PartyTransactionView.tsx`) to either use the signed URLs directly from the listing endpoint or call the new dedicated endpoint to fetch a signed URL before initiating a download.
* **Files/Docs:** `server/controllers/uploadController.ts`, `server/storage.ts` (for `generateUploadSignedUrl` which can be adapted for downloads), `client/src/pages/TransactionView.tsx`, `client/src/pages/PartyTransactionView.tsx`, "ReAlign MVP – Security & Privacy Plan.docx".

---

## Phase 3: Advanced Features & Polish

### 3.1. WebSocket Real-Time In-App Updates (Clarification & Potential Implementation)

* **Item:** Clarify the scope of WebSocket usage for MVP. The Notification Rules doc states "no real-time push updates to the feed itself in MVP; updates visible on load/refresh", yet a WebSocket server is set up (`server/routes.ts`) and client-side connection logic exists (`client/src/lib/notifications.ts`).
* **Action:**
    * **Decision:** Determine if any real-time in-app updates (e.g., new messages appearing without manual refresh) are desired for MVP.
    * **If Yes (Implementation Scope):**
        * **Backend:** Enhance the WebSocket server in `server/routes.ts` to handle specific events (e.g., new message, document status change). This would involve broadcasting messages to relevant connected clients (scoped by transaction and user).
        * The controllers (`messageController.ts`, `documentController.ts`, etc.) would need to emit events to the WebSocket server upon successful data modification.
        * **Frontend:** Enhance `client/src/lib/notifications.ts` `setupWebSocketHandler` to process these specific events and update the UI accordingly (e.g., by refetching data via `queryClient.invalidateQueries` or directly updating local state).
    * **If No (Current Scope):** The existing WebSocket setup might be primarily for future use or very basic connection status checks. Ensure it doesn't introduce instability or unnecessary overhead if not actively used for real-time data. The `NotificationSettings.tsx` component checks for WebSocket connection; its purpose should be clear.
* **Files/Docs:** `server/routes.ts`, `client/src/lib/notifications.ts`, relevant frontend components that would consume real-time data.