# REST API Plan

This document outlines the REST API design for the Group Calendar AI application based on the provided database schema, PRD, and tech stack.

## 1. Base Path

All endpoints are prefixed with `/api`. For example:
- Authentication endpoints start with `/api/auth`
- Admin endpoints start with `/api/admin`
- Group endpoints start with `/api/groups`
- Event endpoints start with `/api/events`
- AI endpoints start with `/api/ai`

## 2. Resources

The main resources in the current implementation are:

- **Auth:** Handles user authentication. (Related to `users` table for credentials).
- **Users:** Represents user accounts (primarily managed by Admins). Maps to the `users` table.
- **Roles:** Represents user roles. Maps to the `roles` table (read-only via API).
- **Groups:** Represents user groups. Maps to the `groups` table.
- **Events:** Represents calendar events within groups. Maps to the `events` table.
- **Event Attendance:** Represents user participation in events. Maps to the `event_attendance` table.
- **AI Suggestions:** Represents interactions with the AI for event suggestions using OpenRouter integration.

## 3. Endpoints

### Auth Resource

- **POST /api/auth/login**
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

### Admin Resource

#### Roles

- **GET /api/admin/roles**
  - **Description:** Lists all available roles (Admin only).
  - **Response Body (Success):**
    ```json
    [
      {
        "role_id": "uuid",
        "role_name": "admin"
      },
      {
        "role_id": "uuid",
        "role_name": "standard"
      }
    ]
    ```
  - **Success Code:** 200 OK
  - **Error Codes:** 401 Unauthorized, 403 Forbidden

#### Users

- **GET /api/admin/users**
  - **Description:** Lists all users with pagination (Admin only).
  - **Query Parameters:**
    - `limit` (integer, default: 20)
    - `offset` (integer, default: 0)
  - **Response Body (Success):**
    ```json
    {
      "users": [
        {
          "user_id": "uuid",
          "email": "user@example.com",
          "login": "userlogin",
          "first_name": "First",
          "last_name": "Last",
          "role_id": "role-uuid",
          "created_at": "timestamp",
          "updated_at": "timestamp"
        }
      ],
      "total_count": 150
    }
    ```
  - **Success Code:** 200 OK
  - **Error Codes:** 401 Unauthorized, 403 Forbidden

- **GET /api/admin/users/{userId}**
  - **Description:** Gets details of a specific user (Admin only).
  - **Response Body:** Single user object as in list response
  - **Success Code:** 200 OK
  - **Error Codes:** 401 Unauthorized, 403 Forbidden, 404 Not Found

#### Groups

- **GET /api/admin/groups**
  - **Description:** Lists all groups (Admin only).
  - **Response Body (Success):**
    ```json
    [
      {
        "group_id": "uuid",
        "group_name": "Group Name",
        "created_at": "timestamp",
        "updated_at": "timestamp"
      }
    ]
    ```
  - **Success Code:** 200 OK
  - **Error Codes:** 401 Unauthorized, 403 Forbidden

- **GET /api/admin/groups/{groupId}**
  - **Description:** Gets details of a specific group (Admin only).
  - **Response Body:** Single group object as in list response
  - **Success Code:** 200 OK
  - **Error Codes:** 401 Unauthorized, 403 Forbidden, 404 Not Found

### Groups Resource

- **GET /api/groups**
  - **Description:** Lists groups the authenticated user is a member of.
  - **Response Body (Success):**
    ```json
    [
      {
        "group_id": "uuid",
        "group_name": "Group Name",
        "created_at": "timestamp",
        "updated_at": "timestamp"
      }
    ]
    ```
  - **Success Code:** 200 OK
  - **Error Codes:** 401 Unauthorized

- **POST /api/groups/{groupId}/events**
  - **Description:** Creates a new event in a group.
  - **Request Body:**
    ```json
    {
      "title": "Event Title",
      "start_time": "iso8601-timestamp",
      "end_time": "iso8601-timestamp",
      "place": "Location",
      "description": "Description",
      "is_ai_suggestion": false
    }
    ```
  - **Response Body:** Created event object
  - **Success Code:** 201 Created
  - **Error Codes:** 400 Bad Request, 401 Unauthorized, 403 Forbidden

- **GET /api/groups/{groupId}/events**
  - **Description:** Lists events in a group.
  - **Response Body:** Array of event objects
  - **Success Code:** 200 OK
  - **Error Codes:** 401 Unauthorized, 403 Forbidden

### Events Resource

- **GET /api/events/{eventId}**
  - **Description:** Gets details of a specific event.
  - **Response Body (Success):**
    ```json
    {
      "event_id": "uuid",
      "group_id": "uuid",
      "creator_user_id": "uuid",
      "title": "Event Title",
      "start_time": "iso8601-timestamp",
      "end_time": "iso8601-timestamp",
      "place": "Location",
      "description": "Description",
      "is_ai_suggestion": false,
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
    ```
  - **Success Code:** 200 OK
  - **Error Codes:** 401 Unauthorized, 403 Forbidden, 404 Not Found

- **PUT /api/events/{eventId}**
  - **Description:** Updates an event.
  - **Request Body:** Partial event object (fields to update)
  - **Response Body:** Updated event object
  - **Success Code:** 200 OK
  - **Error Codes:** 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found

- **DELETE /api/events/{eventId}**
  - **Description:** Deletes an event.
  - **Response Body:**
    ```json
    {
      "event_id": "deleted-event-uuid"
    }
    ```
  - **Success Code:** 200 OK
  - **Error Codes:** 401 Unauthorized, 403 Forbidden, 404 Not Found

- **POST /api/events/{eventId}/attendance**
  - **Description:** Marks user as attending an event.
  - **Response Body (Success):**
    ```json
    {
      "user_id": "uuid",
      "event_id": "uuid",
      "joined_at": "timestamp"
    }
    ```
  - **Success Code:** 201 Created (or 200 if already attending)
  - **Error Codes:** 401 Unauthorized, 403 Forbidden, 404 Not Found

- **DELETE /api/events/{eventId}/attendance**
  - **Description:** Removes user's attendance from an event.
  - **Response Body (Success):**
    ```json
    {
      "event_id": "uuid",
      "user_id": "uuid"
    }
    ```
  - **Success Code:** 200 OK
  - **Error Codes:** 401 Unauthorized, 403 Forbidden, 404 Not Found

- **GET /api/events/{eventId}/attendees**
  - **Description:** Lists attendees of an event.
  - **Response Body (Success):**
    ```json
    [
      {
        "user_id": "uuid",
        "login": "userlogin",
        "first_name": "First",
        "last_name": "Last",
        "joined_at": "timestamp",
        "event_id": "uuid"
      }
    ]
    ```
  - **Success Code:** 200 OK
  - **Error Codes:** 401 Unauthorized, 403 Forbidden, 404 Not Found

### AI Resource

- **GET /api/ai/event-suggestions**
  - **Description:** Gets event suggestions from OpenRouter AI.
  - **Query Parameters:**
    - `startDate` (iso8601-date, required)
    - `endDate` (iso8601-date, required)
    - `location` (string, required)
    - `type` (string, optional)
  - **Response Body (Success):**
    ```json
    [
      {
        "title": "Suggested Event",
        "description": "Event Description",
        "startTime": "iso8601-timestamp",
        "endTime": "iso8601-timestamp",
        "location": "Event Location",
        "type": "event-type"
      }
    ]
    ```
  - **Success Code:** 200 OK
  - **Error Codes:** 400 Bad Request, 401 Unauthorized, 500 Internal Server Error

## 4. Security Implementation

### Authentication
- JWT-based authentication
- Token provided in Authorization header: `Bearer <token>`
- All protected endpoints require valid JWT

### Authorization
- **Row Level Security (RLS):**
  - Implemented at database level
  - User context set via `SET LOCAL "myapp.user_id"` for each request
  - Ensures users can only access their authorized data

### Transaction Handling
- All database operations use proper transaction management
- COMMIT/ROLLBACK handling for data consistency
- Client connection properly released after operations

### Input Validation
- Request validation using express-validator
- Type checking and sanitization
- Custom validation rules for specific endpoints
