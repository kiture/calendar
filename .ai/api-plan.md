# REST API Plan

This document outlines the REST API design for the Group Calendar AI application based on the provided database schema, PRD, and tech stack.

## 1. Resources

The main resources identified for this API are:

- **Auth:** Handles user authentication. (Related to `users` table for credentials).
- **Users:** Represents user accounts (primarily managed by Admins). Maps to the `users` table.
- **Roles:** Represents user roles. Maps to the `roles` table (likely read-only via API for context).
- **Groups:** Represents user groups. Maps to the `groups` table.
- **Group Memberships:** Represents the relationship between users and groups. Maps to the `group_memberships` table.
- **Events:** Represents calendar events within groups. Maps to the `events` table.
- **Event Attendance:** Represents user participation in events. Maps to the `event_attendance` table.
- **AI Suggestions:** Represents interactions with the AI for event suggestions. (Does not map directly to a persistent table, interacts with external AI service).

## 2. Endpoints

---

### Auth Resource

- **POST /auth/login**
  - **Description:** Authenticates a user and returns a JWT along with additional user information.
  - **Request Body:**
    ```json
    {
      "email": "user@example.com",
      "password": "userpassword"
    }
    ```
  - **Response Body (Success):**
    ```json
    {
      "accessToken": "xxxxxxxx.yyyyyyy.zzzzzzz",
      "user": {
        "user_id": "user-uuid",
        "email": "user@example.com",
        "login": "userlogin",
        "first_name": "User",
        "last_name": "Example",
        "role_id": "role-uuid"
      }
    }
    ```
  - **Success Code:** 200 OK
  - **Error Codes:** 400 Bad Request (Invalid input), 401 Unauthorized (Invalid credentials)

---

### Users Resource (Admin Only)

- **POST /admin/users**

  - **Description:** Creates a new user (Admin only). Password handling mechanism (e.g., sending activation link) is TBD by application logic.
  - **Request Body:**
    ```json
    {
      "email": "newuser@example.com",
      "login": "newuserlogin",
      "password": "initialTemporaryPassword", // Or handle activation differently
      "first_name": "New",
      "last_name": "User",
      "role_id": "uuid-for-standard-role"
    }
    ```
  - **Response Body (Success):**
    ```json
    {
      "user_id": "generated-uuid",
      "email": "newuser@example.com",
      "login": "newuserlogin",
      "first_name": "New",
      "last_name": "User",
      "role_id": "uuid-for-standard-role",
      "created_at": "timestamp",
      "updated_at": "timestamp"
      // DO NOT return password_hash
    }
    ```
  - **Success Code:** 201 Created
  - **Error Codes:** 400 Bad Request (Validation errors, duplicate email), 401 Unauthorized, 403 Forbidden (Not an Admin)

- **GET /admin/users**

  - **Description:** Retrieves a list of all users (Admin only). Supports pagination.
  - **Query Parameters:**
    - `limit` (integer, default: 20): Number of users per page.
    - `offset` (integer, default: 0): Number of users to skip.
  - **Response Body (Success):**
    ```json
    {
      "users": [
        {
          "user_id": "uuid",
          "email": "user@example.com",
          "login": "userlogin",
          "first_name": "FName",
          "last_name": "LName",
          "role_id": "role-uuid",
          "created_at": "timestamp",
          "updated_at": "timestamp"
        }
        // ... more users
      ],
      "total_count": 150 // Example total count for pagination
    }
    ```
  - **Success Code:** 200 OK
  - **Error Codes:** 401 Unauthorized, 403 Forbidden (Not an Admin)

- **GET /admin/users/{userId}**

  - **Description:** Retrieves details for a specific user (Admin only).
  - **Response Body (Success):** (Similar structure to POST response, without password hash)
  - **Success Code:** 200 OK
  - **Error Codes:** 401 Unauthorized, 403 Forbidden, 404 Not Found

- **PUT /admin/users/{userId}**

  - **Description:** Updates details for a specific user (Admin only). Can update email, login, names, role. Password update should likely be a separate flow.
  - **Request Body:** (Subset of fields from POST, e.g.)
    ```json
    {
      "email": "updated@example.com",
      "login": "updatedlogin",
      "first_name": "Updated",
      "last_name": "Name",
      "role_id": "new-role-uuid"
    }
    ```
  - **Response Body (Success):** (Updated user object, similar structure to POST response)
  - **Success Code:** 200 OK
  - **Error Codes:** 400 Bad Request (Validation errors), 401 Unauthorized, 403 Forbidden, 404 Not Found

- **DELETE /admin/users/{userId}**
  - **Description:** Deletes a specific user (Admin only). Database handles cascading deletes/set null based on schema.
  - **Response Body (Success):** None
  - **Success Code:** 204 No Content
  - **Error Codes:** 401 Unauthorized, 403 Forbidden, 404 Not Found

---

### Groups Resource

- **POST /admin/groups**

  - **Description:** Creates a new group (Admin only).
  - **Request Body:**
    ```json
    {
      "group_name": "New Planning Group"
    }
    ```
  - **Response Body (Success):**
    ```json
    {
      "group_id": "generated-uuid",
      "group_name": "New Planning Group",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
    ```
  - **Success Code:** 201 Created
  - **Error Codes:** 400 Bad Request, 401 Unauthorized, 403 Forbidden

- **GET /groups**

  - **Description:** Retrieves a list of groups the authenticated user is a member of. Filtered by RLS. Supports pagination.
  - **Query Parameters:**
    - `limit` (integer, default: 20)
    - `offset` (integer, default: 0)
  - **Response Body (Success):**
    ```json
    {
      "groups": [
        {
          "group_id": "uuid",
          "group_name": "My Group 1",
          "created_at": "timestamp",
          "updated_at": "timestamp"
        }
        // ... more groups
      ],
      "total_count": 5 // Example total count for pagination
    }
    ```
  - **Success Code:** 200 OK
  - **Error Codes:** 401 Unauthorized

- **GET /admin/groups**

  - **Description:** Retrieves a list of all groups (Admin only). Supports pagination.
  - **Query Parameters:**
    - `limit` (integer, default: 20)
    - `offset` (integer, default: 0)
  - **Response Body (Success):** (Similar to `GET /groups` but with all groups)
  - **Success Code:** 200 OK
  - **Error Codes:** 401 Unauthorized, 403 Forbidden

- **GET /admin/groups/{groupId}**

  - **Description:** Retrieves details for a specific group (Admin only).
  - **Response Body (Success):** (Single group object structure)
  - **Success Code:** 200 OK
  - **Error Codes:** 401 Unauthorized, 403 Forbidden, 404 Not Found

- **PUT /admin/groups/{groupId}**

  - **Description:** Updates details for a specific group (Admin only).
  - **Request Body:**
    ```json
    {
      "group_name": "Updated Group Name"
    }
    ```
  - **Response Body (Success):** (Updated group object structure)
  - **Success Code:** 200 OK
  - **Error Codes:** 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found

- **DELETE /admin/groups/{groupId}**
  - **Description:** Deletes a specific group (Admin only). Database handles cascading deletes.
  - **Response Body (Success):** None
  - **Success Code:** 204 No Content
  - **Error Codes:** 401 Unauthorized, 403 Forbidden, 404 Not Found

---

### Group Memberships Resource (Admin Only)

- **POST /admin/groups/{groupId}/members**

  - **Description:** Adds a user to a specific group (Admin only).
  - **Request Body:**
    ```json
    {
      "user_id": "uuid-of-user-to-add"
    }
    ```
  - **Response Body (Success):**
    ```json
    {
      "user_id": "uuid-of-user-to-add",
      "group_id": "uuid-of-group",
      "joined_at": "timestamp"
    }
    ```
  - **Success Code:** 201 Created
  - **Error Codes:** 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found (Group or User), 409 Conflict (User already member)

- **DELETE /admin/groups/{groupId}/members/{userId}**

  - **Description:** Removes a user from a specific group (Admin only).
  - **Response Body (Success):** None
  - **Success Code:** 204 No Content
  - **Error Codes:** 401 Unauthorized, 403 Forbidden, 404 Not Found (Group, User, or Membership)

- **GET /admin/groups/{groupId}/members**
  - **Description:** Lists members of a specific group (Admin only). Supports pagination.
  - **Query Parameters:**
    - `limit` (integer, default: 20)
    - `offset` (integer, default: 0)
  - **Response Body (Success):**
    ```json
    {
      "members": [
        {
          "user_id": "uuid",
          "email": "member1@example.com",
          "login": "member1",
          "first_name": "Member",
          "last_name": "One",
          "joined_at": "timestamp"
        }
        // ... other members
      ],
      "total_count": 10
    }
    ```
  - **Success Code:** 200 OK
  - **Error Codes:** 401 Unauthorized, 403 Forbidden, 404 Not Found (Group)

---

### Events Resource

- **POST /groups/{groupId}/events**

  - **Description:** Creates a new event within a specific group. User must be a member. `creator_user_id` is set to authenticated user.
  - **Request Body:**
    ```json
    {
      "title": "Team Meeting",
      "start_time": "iso8601-timestamp", // e.g., "2023-10-27T10:00:00Z"
      "place": "Conference Room A", // Optional
      "description": "Discuss project progress", // Optional
      "is_ai_suggestion": false // Optional, defaults to false
    }
    ```
  - **Response Body (Success):**
    ```json
    {
      "event_id": "generated-uuid",
      "group_id": "uuid-from-path",
      "creator_user_id": "authenticated-user-uuid",
      "title": "Team Meeting",
      "start_time": "iso8601-timestamp",
      "place": "Conference Room A",
      "description": "Discuss project progress",
      "is_ai_suggestion": false,
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
    ```
  - **Success Code:** 201 Created
  - **Error Codes:** 400 Bad Request, 401 Unauthorized, 403 Forbidden (Not member of group), 404 Not Found (Group)

- **GET /groups/{groupId}/events**

  - **Description:** Retrieves events for a specific group the user is a member of. Supports date range filtering and pagination.
  - **Query Parameters:**
    - `startDate` (iso8601-date, optional): Filter events starting on or after this date.
    - `endDate` (iso8601-date, optional): Filter events starting on or before this date.
    - `limit` (integer, default: 50)
    - `offset` (integer, default: 0)
  - **Response Body (Success):**
    ```json
    {
      "events": [
        {
          "event_id": "uuid",
          "group_id": "uuid-from-path",
          "creator_user_id": "creator-uuid",
          "title": "Event Title",
          "start_time": "iso8601-timestamp",
          "place": "Location",
          "description": "Details",
          "is_ai_suggestion": false,
          "created_at": "timestamp",
          "updated_at": "timestamp"
        }
        // ... more events
      ],
      "total_count": 25
    }
    ```
  - **Success Code:** 200 OK
  - **Error Codes:** 400 Bad Request (Invalid date format), 401 Unauthorized, 403 Forbidden (Not member of group), 404 Not Found (Group)

- **GET /events/{eventId}**

  - **Description:** Retrieves details for a specific event. User must be a member of the event's group.
  - **Response Body (Success):** (Single event object structure as in list response)
  - **Success Code:** 200 OK
  - **Error Codes:** 401 Unauthorized, 403 Forbidden (Not member of event's group), 404 Not Found

- **PUT /events/{eventId}**

  - **Description:** Updates details for a specific event. User must be a member of the event's group (implements the "any member can edit" rule via RLS).
  - **Request Body:** (Subset of fields from POST)
    ```json
    {
      "title": "Updated Meeting Title",
      "start_time": "new-iso8601-timestamp",
      "place": "New Location",
      "description": "Updated agenda"
    }
    ```
  - **Response Body (Success):** (Updated event object structure)
  - **Success Code:** 200 OK
  - **Error Codes:** 400 Bad Request, 401 Unauthorized, 403 Forbidden (Not member of event's group), 404 Not Found

- **DELETE /events/{eventId}**
  - **Description:** Deletes a specific event. User must be a member of the event's group (implements the "any member can delete" rule via RLS).
  - **Response Body (Success):** None
  - **Success Code:** 204 No Content
  - **Error Codes:** 401 Unauthorized, 403 Forbidden (Not member of event's group), 404 Not Found

---

### Event Attendance Resource

- **POST /events/{eventId}/attendance**

  - **Description:** Marks the authenticated user as attending a specific event. User must be a member of the event's group.
  - **Request Body:** None
  - **Response Body (Success):**
    ```json
    {
      "user_id": "authenticated-user-uuid",
      "event_id": "uuid-from-path",
      "joined_at": "timestamp"
    }
    ```
  - **Success Code:** 201 Created (or 200 OK if already attending)
  - **Error Codes:** 401 Unauthorized, 403 Forbidden (Not member of event's group), 404 Not Found (Event), 409 Conflict (Already attending)

- **DELETE /events/{eventId}/attendance**

  - **Description:** Removes the authenticated user's attendance from a specific event.
  - **Request Body:** None
  - **Response Body (Success):** None
  - **Success Code:** 204 No Content
  - **Error Codes:** 401 Unauthorized, 403 Forbidden (Not member of event's group), 404 Not Found (Event or not attending)

- **GET /events/{eventId}/attendees**
  - **Description:** Retrieves a list of users attending a specific event. User must be a member of the event's group. Supports pagination.
  - **Query Parameters:**
    - `limit` (integer, default: 20)
    - `offset` (integer, default: 0)
  - **Response Body (Success):**
    ```json
    {
      "attendees": [
        {
          "user_id": "attendee1-uuid",
          "login": "attendee1",
          "first_name": "Attendee",
          "last_name": "One",
          "joined_at": "timestamp" // When they joined this specific event
        }
        // ... more attendees
      ],
      "total_count": 12
    }
    ```
  - **Success Code:** 200 OK
  - **Error Codes:** 401 Unauthorized, 403 Forbidden (Not member of event's group), 404 Not Found (Event)

---

### AI Suggestions Resource

- **GET /ai/event-suggestions**
  - **Description:** Fetches event suggestions from the external AI service based on user criteria. Backend handles communication with OpenRouter API.
  - **Query Parameters:**
    - `startDate` (iso8601-date): Required start date for search range.
    - `endDate` (iso8601-date): Required end date for search range.
    - `location` (string): Required location context (e.g., "Warsaw, Poland").
    - `type` (string, optional): Type of event (e.g., "concert", "theater").
  - **Response Body (Success):** (Structure depends heavily on AI response format)
    ```json
    {
      "suggestions": [
        {
          "title": "AI Suggested Event",
          "date": "iso8601-date", // Or start/end times if available
          "location": "Suggested Venue",
          "description": "Brief description from AI",
          "source_id": "optional-id-from-ai" // Optional, for potential tracking
          // ... other relevant fields provided by AI
        }
        // ... more suggestions
      ]
    }
    ```
  - **Success Code:** 200 OK
  - **Error Codes:** 400 Bad Request (Missing required params, invalid format), 401 Unauthorized, 500 Internal Server Error (AI service error), 503 Service Unavailable (AI service timeout/unavailable)

## 3. Uwierzytelnianie i autoryzacja

- **Authentication:** JWT (JSON Web Tokens) will be used.
  - The `POST /auth/login` endpoint validates credentials and issues a signed JWT containing user information (e.g., `user_id`, `role_name` or `role_id`) and an expiration time.
  - Clients must send the JWT in the `Authorization: Bearer <token>` header for all protected endpoints.
  - A middleware on the Express.js backend will verify the JWT signature and expiration on incoming requests to protected routes.
- **Authorization:** Implemented via a combination of:
  - **Role-Based Access Control (RBAC):** Middleware checks the role claim within the validated JWT. Endpoints prefixed with `/admin/` require the 'admin' role.
  - **Row-Level Security (RLS) in PostgreSQL:** As defined in the database schema, RLS policies restrict data access based on the user's ID and group memberships. The backend MUST securely set the PostgreSQL session context (e.g., `SET LOCAL myapp.user_id = '...'; SET LOCAL myapp.role_name = '...'`) for each request using the validated `user_id` and `role` from the JWT, allowing RLS policies (using `current_user_id()` and `current_user_role()` helper functions) to function correctly. Admins bypass most RLS checks based on their role.

## 4. Walidacja i logika biznesowa

- **Input Validation:** All incoming request data (query parameters, path parameters, request bodies) must be validated on the backend (Express.js) using a library like `express-validator`. Validation rules include:
  - Required fields (based on `NOT NULL` in DB schema).
  - Data types (string, integer, boolean, valid UUID, valid TIMESTAMPTZ/ISO8601 format).
  - String lengths (based on `VARCHAR(n)` limits).
  - Email format.
  - Uniqueness constraints (e.g., `users.email`) checked against the database before insertion/update.
- **Logika Biznesowa:**
  - **User/Group Management:** Restricted to Admin users via RBAC on `/admin/*` endpoints.
  - **Event Creation:** `creator_user_id` is automatically set to the authenticated user's ID. `is_ai_suggestion` flag handled based on input/endpoint used. Handled by `POST /groups/{groupId}/events`.
  - **Event Access/Modification:** RLS enforces that users can only interact (view, update, delete, attend) with events belonging to groups they are members of. The "any member can edit/delete" rule is directly implemented via the RLS policy on the `events` table for UPDATE/DELETE.
  - **Attendance:** `POST /events/{eventId}/attendance` and `DELETE /events/{eventId}/attendance` endpoints manage the `event_attendance` table records for the authenticated user. RLS ensures users only manage their own attendance within accessible events.
  - **AI Suggestions:** `GET /ai/event-suggestions` encapsulates the logic of querying the OpenRouter API using provided parameters. `POST /groups/{groupId}/events` handles the creation of an event based on a chosen AI suggestion, setting the `is_ai_suggestion` flag.
  - **Cascading Deletes:** Database `ON DELETE` actions handle cascading logic automatically when users or groups are deleted.
