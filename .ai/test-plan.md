# Plan Testów - AI Group Calendar

## 1. Wprowadzenie i cele testowania

Celem testowania jest zapewnienie wysokiej jakości aplikacji AI Group Calendar, ze szczególnym uwzględnieniem:

- Poprawności działania funkcjonalności kalendarza grupowego
- Bezpieczeństwa systemu autoryzacji i autentykacji
- Integracji z API OpenRouter dla funkcji AI
- Responsywności i użyteczności interfejsu użytkownika

## 2. Zakres testów

### Frontend

- Komponenty React (widoki, formularze, overlaye)
- Integracja z Redux i zarządzanie stanem
- Routing i nawigacja
- Obsługa błędów i komunikaty dla użytkownika
- Responsywność UI (DaisyUI/Tailwind)

### Backend

- Endpointy REST API
- Autoryzacja i autentykacja
- Integracja z bazą danych PostgreSQL
- Integracja z OpenRouter API
- Obsługa błędów i walidacja danych

## 3. Typy testów

### Testy jednostkowe

- Frontend: komponenty React, selektory Redux, thunki
- Backend: kontrolery, middleware, serwisy

### Testy integracyjne

- Przepływ danych między frontendem a backendem
- Integracja z OpenRouter API
- Operacje na bazie danych

### Testy E2E

- Przepływy użytkownika (rejestracja, logowanie, zarządzanie grupami)
- Operacje na kalendarzu
- Interakcje z sugestiami AI

### Testy wydajnościowe

- Czas odpowiedzi API
- Wydajność zapytań do bazy danych
- Optymalizacja ładowania frontendu

## 4. Scenariusze testowe

### Autoryzacja

1. Rejestracja nowego użytkownika
2. Logowanie użytkownika
3. Odzyskiwanie hasła
4. Walidacja tokenów JWT

### Zarządzanie grupami

1. Tworzenie nowej grupy
2. Dołączanie do grupy
3. Zarządzanie członkami grupy
4. Usuwanie grupy

### Kalendarz

1. Wyświetlanie wydarzeń grupowych
2. Dodawanie nowego wydarzenia
3. Edycja wydarzenia
4. Usuwanie wydarzenia
5. Filtrowanie i sortowanie wydarzeń

### Integracja AI

1. Generowanie sugestii AI
2. Obsługa różnych modeli językowych
3. Walidacja odpowiedzi AI

## 5. Środowisko testowe

### Środowisko deweloperskie

- Node.js v18+
- PostgreSQL 15+
- React 18
- TypeScript 5
- Express.js

### Narzędzia testowe

- Vitest dla testów jednostkowych i integracyjnych
- React Testing Library dla testów komponentów
- Playwright dla testów E2E
- k6 dla testów wydajnościowych
- Postman dla testów API

## 6. Harmonogram testów

1. Testy jednostkowe - wykonywane przy każdym commicie
2. Testy integracyjne - wykonywane przy każdym PR
3. Testy E2E - wykonywane przed każdym releasem
4. Testy wydajnościowe - wykonywane raz w tygodniu

## 7. Kryteria akceptacji

### Pokrycie kodu

- Frontend: minimum 80% pokrycia
- Backend: minimum 85% pokrycia

### Wydajność

- Czas odpowiedzi API < 200ms
- Czas ładowania strony < 2s
- Time to Interactive < 3s

### Jakość kodu

- Brak błędów ESLint
- Zgodność z TypeScript
- Prawidłowa obsługa błędów
- Pokrycie testami Vitest
- Raporty z testów Playwright

## 8. Role i odpowiedzialności

### Developer

- Pisanie testów jednostkowych
- Code review
- Naprawianie błędów

### QA Engineer

- Projektowanie przypadków testowych
- Wykonywanie testów manualnych
- Automatyzacja testów

### DevOps

- Konfiguracja środowisk testowych
- Monitoring wydajności
- CI/CD pipeline

## 9. Procedury raportowania błędów

### Format zgłoszenia

1. Tytuł błędu
2. Środowisko
3. Kroki reprodukcji
4. Oczekiwane zachowanie
5. Aktualne zachowanie
6. Logi/screenshoty

### Priorytetyzacja

- P0: Błąd krytyczny - natychmiastowa reakcja
- P1: Wysoki priorytet - fix w ciągu 24h
- P2: Średni priorytet - fix w następnym sprincie
- P3: Niski priorytet - do zaplanowania

### Śledzenie błędów

- Używanie GitHub Issues
- Labelowanie według priorytetu i komponentu
- Przypisywanie do milestone'ów

## 10. Raportowanie i metryki

### Raporty testów

- Pokrycie testami
- Liczba znalezionych/naprawionych błędów
- Metryki wydajności
- Status testów automatycznych

### Częstotliwość raportowania

- Codzienne raporty z testów automatycznych
- Tygodniowe podsumowanie testów
- Raport przed każdym releasem
