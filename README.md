# AI Group Calendar

## Project Description
AI Group Calendar is a web application designed to facilitate coordination and synchronization of events within defined user groups. The application allows for creating, viewing, editing, and deleting group events. A key feature is the integration with artificial intelligence (AI) to provide users with suggestions for interesting events in their area based on defined criteria.

## Tech Stack
- **Database**: PostgreSQL
- **Backend**: Express.js
- **Frontend**: React, TailwindCSS, Redux
- **AI Integration**: Google Gemini API

## Getting Started Locally
To set up the project locally, follow these steps:

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   ```

2. **Navigate to the project directory**:
   ```bash
   cd <project-directory>
   ```

3. **Install backend dependencies**:
   ```bash
   cd backend
   npm install
   ```

4. **Install frontend dependencies**:
   ```bash
   cd ../frontend
   npm install
   ```

5. **Run the backend server**:
   ```bash
   npm start
   ```

6. **Run the frontend application**:
   ```bash
   npm run dev
   ```

## Available Scripts
### Backend
- `npm start`: Starts the backend server using ts-node.
- `npm run build`: Compiles TypeScript to JavaScript.
- `npm run serve`: Serves the compiled JavaScript.

### Frontend
- `npm run dev`: Starts the development server using Vite.
- `npm run build`: Builds the application for production.
- `npm run lint`: Runs ESLint to check for linting errors.
- `npm run preview`: Previews the production build.

## Project Scope
The MVP includes the following features:
- User and group management by an administrator.
- Authentication and authorization with role distinction.
- Calendar views (daily, weekly, monthly) for group events.
- Event management (create, view, edit, delete) within groups.
- AI-driven event suggestions based on user-defined criteria.

## Project Status
The project is currently in the MVP stage, focusing on delivering the core functionalities as outlined in the PRD.
