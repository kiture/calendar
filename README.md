# AI Group Calendar

Aplikacja do zarządzania kalendarzem grupowym z integracją AI, umożliwiająca efektywne planowanie i organizację wydarzeń grupowych.

## Technologie

### Backend

- Node.js v18+
- Express.js
- PostgreSQL 15+
- OpenRouter SDK

### Frontend

- React 18
- Redux Toolkit
- TypeScript 5
- TailwindCSS
- DaisyUI

### Testowanie

- Vitest + React Testing Library (testy jednostkowe i integracyjne)
- Playwright (testy E2E)

## Wymagania systemowe

- Node.js v18 lub nowszy
- PostgreSQL 15 lub nowszy
- npm lub yarn

## Instalacja

1. Sklonuj repozytorium:

```bash
git clone https://github.com/twoja-organizacja/calendar.git
cd calendar
```

2. Zainstaluj zależności:

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. Skonfiguruj zmienne środowiskowe:

```bash
cp .env.example .env
# Uzupełnij .env odpowiednimi wartościami
```

4. Uruchom migracje bazy danych:

```bash
cd backend
npm run migrate
```

## Uruchamianie

### Development

1. Backend:

```bash
cd backend
npm run dev
```

2. Frontend:

```bash
cd frontend
npm run dev
```

### Produkcja

1. Backend:

```bash
cd backend
npm run build
npm start
```

2. Frontend:

```bash
cd frontend
npm run build
npm run preview
```

## Testowanie

### Testy jednostkowe i integracyjne

# Frontend

cd frontend
npm run test

````

### Testy E2E

```bash
npm run test:e2e
````

## Dokumentacja

- [Plan testów](./.ai/test-plan.md)
- [Stos technologiczny](./.ai/tech-stack.md)

## Licencja

MIT

## Project Description

AI Group Calendar is a web application designed to facilitate coordination and synchronization of events within defined user groups. The application allows for creating, viewing, editing, and deleting group events. A key feature is the integration with artificial intelligence (AI) to provide users with suggestions for interesting events in their area based on defined criteria.

## Subprojects

### Frontend

The frontend of the AI Group Calendar is built using React, TailwindCSS, and Redux. It provides the user interface for interacting with the calendar and managing events. For more details on the frontend setup and technologies, refer to the [frontend README](./frontend/README.md).

### Backend

The backend of the AI Group Calendar is developed using Express.js and PostgreSQL. It handles the server-side logic, database interactions, and AI integration for event suggestions. For more details on the backend setup and technologies, refer to the [backend README](./backend/README.md).

## Project Status

The project is currently in the MVP stage, focusing on delivering the core functionalities as outlined in the PRD.
