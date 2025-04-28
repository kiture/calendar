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

- **Biblioteka/SDK:** `openrouter` (Oficjalne SDK OpenRouter)
  - _Uzasadnienie:_ Umożliwia integrację z wieloma modelami językowymi (np. GPT-4, Llama 2) poprzez zunifikowane API OpenRouter. Zapewnia elastyczne zarządzanie kluczami API, obsługę różnych endpointów oraz automatyczne dokonywanie failover między modelami.
    **Komunikacja:** Biblioteka będzie wykorzystywana po stronie backendu. Frontend wysyła żądania do backendu, który następnie przekazuje je do OpenRouter API i zwraca odpowiedzi do frontendu.

## Testowanie

- **Testy Jednostkowe i Integracyjne:**

  - **Framework:** Vitest
    - _Uzasadnienie:_ Natywna integracja z Vite, szybsze wykonanie testów, lepsza obsługa modułów ESM.
  - **Biblioteka Testowania Komponentów:** React Testing Library
    - _Uzasadnienie:_ Standardowa biblioteka do testowania komponentów React, skupiona na testowaniu zachowania z perspektywy użytkownika.

- **Testy E2E:**

  - **Framework:** Playwright
    - _Uzasadnienie:_ Nowoczesne narzędzie do testów E2E, oferujące lepszą niezawodność, wbudowane możliwości debugowania i wsparcie dla wielu silników przeglądarek.

- **Testy Wydajnościowe:**
  - **Narzędzie:** k6
    - _Uzasadnienie:_ Wydajne narzędzie do testów obciążeniowych, z możliwością skryptowania w JavaScript.

---

Ten dokument definiuje kluczowe technologie, które mają zostać wykorzystane podczas generowania lub inicjalizacji struktury projektu aplikacji.
