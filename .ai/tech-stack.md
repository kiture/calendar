# Konfiguracja Stosu Technologicznego Projektu

Na podstawie decyzji projektowych, wybrany został następujący stos technologiczny dla aplikacji Kalendarz Grupowy AI (MVP):

## Baza Danych

- **System:** PostgreSQL
  - _Uzasadnienie:_ Dojrzała, wydajna, skalowalna relacyjna baza danych, odpowiednia do przechowywania struktury danych aplikacji (użytkownicy, grupy, wydarzenia, relacje).

## Backend

- **Framework:** Express.js
  - _Uzasadnienie:_ Elastyczny i popularny framework Node.js do budowy dedykowanego API backendowego, oddzielonego od logiki frontendu. Umożliwia pełną kontrolę nad strukturą i działaniem serwera.

## Frontend

- **Biblioteka UI:** React
  - _Uzasadnienie:_ Popularna, komponentowa biblioteka do budowy interfejsów użytkownika, stanowiąca podstawę Next.js.
- **Styling:** TailwindCSS
  - _Uzasadnienie:_ Utility-first CSS framework pozwalający na szybkie stylowanie komponentów bezpośrednio w kodzie HTML/JSX.
- **Zarządzanie Stanem:** Redux (z Redux Toolkit)
  - _Uzasadnienie:_ Biblioteka do zarządzania globalnym stanem aplikacji, wybrana do obsługi złożoności stanu aplikacji.

## Integracja AI

- **Biblioteka/SDK:** `@google/generative-ai` (Oficjalne SDK Google dla Gemini API)
  - _Uzasadnienie:_ Umożliwia bezpośrednią i ustrukturyzowaną komunikację z modelami językowymi Google Gemini w celu realizacji funkcji sugerowania wydarzeń. Zapewnia obsługę autentykacji i formatowania zapytań specyficznych dla API Google.
    **Komunikacja:** Wykorzystanie biblioteki bedzie odbywac sie po stronie backendu, front bedzie robil odpytanie do backendu, ktory to wysle zapytanie poprzez SDK do AI.

---

Ten dokument definiuje kluczowe technologie, które mają zostać wykorzystane podczas generowania lub inicjalizacji struktury projektu aplikacji.
