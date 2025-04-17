# API Endpoint Implementation Plan

Ten dokument zawiera plany wdrożenia dla endpointów REST API aplikacji Kalendarz Grupowy AI.

## Zasób: Auth

### Endpoint: `POST /auth/login`

#### 1. Przegląd punktu końcowego

Uwierzytelnia użytkownika na podstawie adresu e-mail i hasła. W przypadku powodzenia zwraca token JWT do wykorzystania w kolejnych żądaniach oraz podstawowe informacje o zalogowanym użytkowniku.

#### 2. Szczegóły żądania

- **Metoda HTTP:** `POST`
- **Struktura URL:** `/auth/login`
- **Parametry:** Brak parametrów ścieżki/zapytania.
- **Request Body:** Wymagany obiekt JSON zgodny z `LoginCommand`.
  ```json
  {
    "email": "user@example.com", // string, format email, wymagane
    "password": "userpassword" // string, wymagane
  }
  ```

#### 3. Wykorzystywane typy

- `LoginCommand` (`@shared/types/LoginCommand.ts`): Definiuje strukturę ciała żądania.
- `LoginResponseDto` (`@shared/types/LoginResponseDto.ts`): Definiuje strukturę odpowiedzi sukcesu.
- `UserDto` (`@shared/types/UserDto.ts`): Definiuje strukturę obiektu `user` w odpowiedzi (część `LoginResponseDto`).

#### 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (200 OK):** Obiekt JSON zgodny z `LoginResponseDto`.
  ```json
  {
    "accessToken": "xxxxxxxx.yyyyyyy.zzzzzzz", // string (JWT)
    "user": {
      // Obiekt zgodny z UserDto
      "user_id": "user-uuid",
      "email": "user@example.com",
      "login": "userlogin",
      "first_name": "User",
      "last_name": "Example",
      "role_id": "role-uuid"
      // ... inne pola z UserDto (bez password_hash)
    }
  }
  ```
- **Odpowiedzi błędów:**
  - `400 Bad Request`: Błędy walidacji (np. brakujący email/hasło, niepoprawny format email). Odpowiedź powinna zawierać szczegóły błędów walidacji.
  - `401 Unauthorized`: Niepoprawny email lub hasło, użytkownik nie znaleziony.
  - `500 Internal Server Error`: Wewnętrzne błędy serwera (np. błąd bazy danych, błąd generowania JWT).

#### 5. Przepływ danych

1.  Odebranie żądania `POST /auth/login`.
2.  Middleware: Walidacja ciała żądania (`email`, `password`) przy użyciu `express-validator`. Jeśli błędy, zwróć `400`.
3.  Wywołanie metody `login` w `AuthService` przekazując `LoginCommand`.
4.  `AuthService`:
    a. Wyszukanie użytkownika w tabeli `users` po `email`.
    b. Jeśli użytkownik nie istnieje, rzuć błąd (np. `UnauthorizedError`).
    c. Porównanie podanego hasła z `password_hash` użytkownika przy użyciu `bcrypt.compare`.
    d. Jeśli hasło nie pasuje, rzuć błąd (np. `UnauthorizedError`).
    e. Wygenerowanie tokena JWT (używając `jsonwebtoken`) z payloadem zawierającym `user_id` i `role_id` (lub `role_name`). Użyj sekretu z `process.env.JWT_SECRET`. Ustaw czas wygaśnięcia (`expiresIn`) zgodnie z wymaganiami (np. `process.env.JWT_EXPIRES_IN`).
    f. Pobranie danych użytkownika (jako `UserDto`) do zwrócenia w odpowiedzi.
    g. Zwrócenie obiektu `{ accessToken, user }` (zgodnego z `LoginResponseDto`).
5.  Kontroler: Otrzymanie wyniku z `AuthService`.
6.  Wysłanie odpowiedzi `200 OK` z ciałem `LoginResponseDto`.
7.  Middleware: Obsługa błędów (jeśli wystąpiły w `AuthService` lub gdzie indziej) - mapowanie błędów na odpowiednie statusy HTTP (np. `UnauthorizedError` -> `401`, inne błędy -> `500`).

#### 6. Względy bezpieczeństwa

- **Uwierzytelnianie:** Endpoint służy do uwierzytelniania.
- **Autoryzacja:** Nie dotyczy (endpoint publiczny).
- **Walidacja danych:** Kluczowa walidacja `email` i `password` po stronie serwera.
- **Rate Limiting:** Zastosować `express-rate-limit` w celu ochrony przed atakami brute-force. Konfiguracja limitów powinna być dostosowana do oczekiwanego ruchu i ryzyka.
- **Hasła:** Nigdy nie logować ani nie zwracać haseł w czystej postaci. Porównywanie hashy za pomocą `bcrypt.compare`.
- **JWT:** Używać silnego, losowego sekretu przechowywanego w zmiennych środowiskowych (`.env`). Token powinien mieć rozsądny czas wygaśnięcia.
- **HTTPS:** Wymuszenie użycia HTTPS na środowisku produkcyjnym.

#### 7. Obsługa błędów

- Zaimplementować globalny middleware do obsługi błędów (zgodnie z `backend-node-express.mdc`).
- Middleware powinien logować błędy (bez wrażliwych danych).
- Mapować specyficzne błędy rzucane przez serwis (np. błąd walidacji, błąd autoryzacji) na odpowiednie kody statusu HTTP (`400`, `401`).
- Domyślnie zwracać `500 Internal Server Error` dla nieobsługiwanych błędów.
- Odpowiedzi błędów `4xx` powinny zawierać czytelny komunikat dla klienta. Odpowiedzi `500` nie powinny ujawniać szczegółów implementacji.

#### 8. Rozważania dotyczące wydajności

- Zapytanie do bazy danych o użytkownika po emailu powinno być szybkie (wymagany indeks na kolumnie `email` - zapewniony przez `UNIQUE`).
- Operacja `bcrypt.compare` jest celowo kosztowna obliczeniowo - może stać się wąskim gardłem przy bardzo dużym obciążeniu (rozważyć horyzontalne skalowanie instancji backendu).
- Generowanie JWT jest stosunkowo szybkie.

#### 9. Etapy wdrożenia

1.  Utworzenie pliku trasy dla autoryzacji (np. `backend/src/routes/auth.routes.ts`).
2.  Zdefiniowanie trasy `POST /auth/login` w routerze Express.
3.  Implementacja middleware walidacji dla `email` i `password` przy użyciu `express-validator`.
4.  Utworzenie `AuthService` (np. `backend/src/services/auth.service.ts`).
5.  Implementacja logiki metody `login` w `AuthService`, w tym:
    - Interakcja z repozytorium/modelem użytkownika (do pobrania użytkownika po emailu).
    - Użycie `bcrypt.compare`.
    - Generowanie JWT przy użyciu `jsonwebtoken` i sekretu z `.env`.
    - Formatowanie odpowiedzi jako `LoginResponseDto`.
6.  Utworzenie kontrolera (lub logiki w trasie) wywołującego `AuthService.login`.
7.  Implementacja obsługi błędów specyficznych dla logowania (np. rzucanie `UnauthorizedError`).
8.  Dodanie middleware `express-rate-limit` do trasy.
9.  Dodanie testów jednostkowych dla `AuthService`.
10. Dodanie testów integracyjnych dla endpointu `POST /auth/login`.
11. Skonfigurowanie zmiennych środowiskowych (`JWT_SECRET`, `JWT_EXPIRES_IN`).

---

## Zasób: Users (Admin Only)

### Endpoint: `POST /admin/users`

#### 1. Przegląd punktu końcowego

Tworzy nowego użytkownika w systemie. Dostępne tylko dla administratorów.

#### 2. Szczegóły żądania

- **Metoda HTTP:** `POST`
- **Struktura URL:** `/admin/users`
- **Parametry:** Brak.
- **Request Body:** Wymagany obiekt JSON zgodny z `CreateUserCommand`.
  ```json
  {
    "email": "newuser@example.com", // string, format email, wymagane, unikalne
    "login": "newuserlogin", // string, wymagane
    "password": "initialTemporaryPassword", // string, wymagane, min. długość?
    "first_name": "New", // string, opcjonalne
    "last_name": "User", // string, opcjonalne
    "role_id": "uuid-for-standard-role" // string, format UUID, wymagane, musi istnieć w tabeli roles
  }
  ```

#### 3. Wykorzystywane typy

- `CreateUserCommand` (`@shared/types/CreateUserCommand.ts`): Definiuje strukturę ciała żądania.
- `UserDto` (`@shared/types/UserDto.ts`): Definiuje strukturę odpowiedzi sukcesu.

#### 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (201 Created):** Obiekt JSON zgodny z `UserDto`, reprezentujący nowo utworzonego użytkownika (bez `password_hash`).
- **Odpowiedzi błędów:**
  - `400 Bad Request`: Błędy walidacji (brakujące/niepoprawne pola, email już istnieje, `role_id` nie istnieje).
  - `401 Unauthorized`: Brak lub niepoprawny token JWT.
  - `403 Forbidden`: Użytkownik nie jest administratorem.
  - `500 Internal Server Error`: Błąd bazy danych, błąd haszowania hasła.

#### 5. Przepływ danych

1.  Odebranie żądania `POST /admin/users`.
2.  Middleware: Weryfikacja tokena JWT i sprawdzenie roli 'admin'. Jeśli nie admin, zwróć `403`.
3.  Middleware: Walidacja ciała żądania (`CreateUserCommand`) przy użyciu `express-validator`. Sprawdzenie formatów, wymaganych pól. Jeśli błędy, zwróć `400`.
4.  Wywołanie metody `createUser` w `UserService` przekazując `CreateUserCommand`.
5.  `UserService`:
    a. Sprawdzenie, czy użytkownik o podanym `email` już istnieje. Jeśli tak, rzuć błąd (np. `ConflictError` lub `ValidationError`).
    b. Sprawdzenie, czy rola o podanym `role_id` istnieje w tabeli `roles`. Jeśli nie, rzuć błąd (np. `ValidationError` lub `NotFoundError`).
    c. Zhaszowanie podanego hasła przy użyciu `bcrypt.hash`.
    d. Zapisanie nowego użytkownika w tabeli `users` z zhaszowanym hasłem i pozostałymi danymi.
    e. Pobranie danych nowo utworzonego użytkownika (bez hasha) w formacie `UserDto`.
    f. Zwrócenie `UserDto`.
6.  Kontroler: Otrzymanie `UserDto` z `UserService`.
7.  Wysłanie odpowiedzi `201 Created` z ciałem `UserDto`.
8.  Middleware: Obsługa błędów (mapowanie na `400`, `401`, `403`, `404`, `409`, `500`).

#### 6. Względy bezpieczeństwa

- **Autoryzacja:** Kluczowe jest middleware sprawdzające rolę 'admin' przed wykonaniem jakiejkolwiek logiki.
- **Walidacja:** Rygorystyczna walidacja wszystkich pól wejściowych. Szczególnie ważne jest sprawdzenie unikalności emaila i istnienia `role_id` przed zapisem do bazy.
- **Hasła:** Haszowanie hasła przy użyciu `bcrypt` przed zapisem. Nigdy nie przechowywać ani nie logować haseł w czystej postaci. Rozważyć wymagania co do złożoności hasła.
- **Mass Assignment:** Użycie `CreateUserCommand` zapobiega przypisaniu nieoczekiwanych pól.

#### 7. Obsługa błędów

- Globalny middleware do obsługi błędów.
- Specyficzne błędy:
  - Błąd walidacji `express-validator` -> `400`.
  - Email już istnieje -> `409 Conflict` (lub `400` z odpowiednim komunikatem).
  - `role_id` nie istnieje -> `400` (lub `404` jeśli traktujemy to jako brak zasobu).
  - Brak JWT / niepoprawny JWT -> `401`.
  - Brak uprawnień admina -> `403`.
  - Błędy bazy danych, błędy `bcrypt` -> `500`.

#### 8. Rozważania dotyczące wydajności

- Sprawdzenie istnienia emaila i `role_id` wymaga zapytań do bazy (powinny być szybkie z indeksami).
- Operacja `bcrypt.hash` jest kosztowna obliczeniowo.
- Operacja zapisu do bazy danych jest standardowa.

#### 9. Etapy wdrożenia

1.  Utworzenie pliku trasy dla użytkowników (np. `backend/src/routes/user.routes.ts` lub `admin.routes.ts`).
2.  Zdefiniowanie trasy `POST /admin/users` w routerze Express.
3.  Implementacja middleware autoryzacji sprawdzającego rolę 'admin'.
4.  Implementacja middleware walidacji dla `CreateUserCommand`.
5.  Utworzenie `UserService` (np. `backend/src/services/user.service.ts`).
6.  Implementacja metody `createUser` w `UserService`, w tym:
    - Interakcja z repozytorium/modelem użytkownika i ról.
    - Sprawdzenie unikalności emaila i istnienia roli.
    - Użycie `bcrypt.hash`.
    - Zapis nowego użytkownika.
    - Formatowanie odpowiedzi jako `UserDto`.
7.  Utworzenie kontrolera wywołującego `UserService.createUser`.
8.  Implementacja obsługi specyficznych błędów (np. rzucanie `ConflictError`, `ValidationError`).
9.  Dodanie testów jednostkowych dla `UserService.createUser`.
10. Dodanie testów integracyjnych dla endpointu `POST /admin/users`.

---

### Endpoint: `GET /admin/users`

#### 1. Przegląd punktu końcowego

Pobiera listę wszystkich użytkowników w systemie. Obsługuje paginację. Dostępne tylko dla administratorów.

#### 2. Szczegóły żądania

- **Metoda HTTP:** `GET`
- **Struktura URL:** `/admin/users`
- **Parametry:**
  - Opcjonalne parametry zapytania:
    - `limit`: (integer, domyślnie 20) - liczba użytkowników na stronę.
    - `offset`: (integer, domyślnie 0) - liczba użytkowników do pominięcia.
- **Request Body:** Brak.

#### 3. Wykorzystywane typy

- `ListUsersResponseDto` (`@shared/types/ListUsersResponseDto.ts`): Definiuje strukturę odpowiedzi.
- `UserDto` (`@shared/types/UserDto.ts`): Definiuje strukturę elementów listy `users`.

#### 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (200 OK):** Obiekt JSON zgodny z `ListUsersResponseDto`.
  ```json
  {
    "users": [
      // Tablica obiektów UserDto
      {
        "user_id": "uuid",
        "email": "user@example.com"
        // ... inne pola UserDto
      }
    ],
    "total_count": 150 // Całkowita liczba użytkowników (do paginacji)
  }
  ```
- **Odpowiedzi błędów:**
  - `400 Bad Request`: Niepoprawny format `limit` lub `offset`.
  - `401 Unauthorized`: Brak lub niepoprawny token JWT.
  - `403 Forbidden`: Użytkownik nie jest administratorem.
  - `500 Internal Server Error`: Błąd bazy danych.

#### 5. Przepływ danych

1.  Odebranie żądania `GET /admin/users`.
2.  Middleware: Weryfikacja tokena JWT i sprawdzenie roli 'admin'. Jeśli nie admin, zwróć `403`.
3.  Middleware: Walidacja parametrów zapytania `limit`, `offset`. Jeśli błędy, zwróć `400`. Ustalenie domyślnych wartości jeśli nie podano.
4.  Wywołanie metody `listUsers` w `UserService` przekazując `limit` i `offset`.
5.  `UserService`:
    a. Wykonanie dwóch zapytań do bazy danych (filtrowanych przez RLS):
    _ Pobranie listy użytkowników z `LIMIT`/`OFFSET`.
    _ Pobranie całkowitej liczby użytkowników dostępnych dla użytkownika (`COUNT`).
    b. Zwrócenie obiektu `{ users, total_count }`.
6.  Kontroler: Otrzymanie wyniku z `UserService`.
7.  Wysłanie odpowiedzi `200 OK` z ciałem `ListUsersResponseDto`.
8.  Middleware: Obsługa błędów (`400`, `401`, `403`, `500`).

#### 6. Względy bezpieczeństwa

- **Autoryzacja:** Kluczowe jest middleware sprawdzające rolę 'admin'.
- **Walidacja:** Walidacja parametrów `limit` i `offset` zapobiega potencjalnym problemom z zapytaniami do bazy danych.
- **Wyciek Danych:** Upewnić się, że zwracane są tylko dane z `UserDto` (bez `password_hash`).

#### 7. Obsługa błędów

- Globalny middleware.
- Specyficzne błędy: `400`, `401`, `403`, `500`.

#### 8. Rozważania dotyczące wydajności

- Zapytanie o listę użytkowników z `LIMIT`/`OFFSET` może być wolne przy dużej liczbie użytkowników bez odpowiednich indeksów. Paginacja jest kluczowa.
- Zapytanie `COUNT` może być wolne na bardzo dużych tabelach. Rozważyć alternatywne strategie szacowania całkowitej liczby, jeśli stanie się problemem.

#### 9. Etapy wdrożenia

1.  Zdefiniowanie trasy `GET /admin/users` w routerze Express.
2.  Dodanie middleware autoryzacji admina.
3.  Implementacja middleware walidacji dla `limit` i `offset`.
4.  Implementacja metody `listUsers` w `UserService`, w tym:
    - Interakcja z repozytorium/modelem użytkownika (zapytania z `LIMIT`/`OFFSET` i `COUNT`).
    - Formatowanie odpowiedzi jako `ListUsersResponseDto`.
5.  Aktualizacja kontrolera, aby wywoływał `UserService.listUsers`.
6.  Dodanie testów jednostkowych dla `UserService.listUsers`.
7.  Dodanie testów integracyjnych dla endpointu `GET /admin/users` (z różnymi parametrami paginacji).

---

### Endpoint: `GET /admin/users/{userId}`

#### 1. Przegląd punktu końcowego

Pobiera szczegółowe informacje o konkretnym użytkowniku na podstawie jego ID. Dostępne tylko dla administratorów.

#### 2. Szczegóły żądania

- **Metoda HTTP:** `GET`
- **Struktura URL:** `/admin/users/{userId}`
- **Parametry:**
  - Wymagany parametr ścieżki: `userId` (string, format UUID).
- **Request Body:** Brak.

#### 3. Wykorzystywane typy

- `UserDto` (`@shared/types/UserDto.ts`): Definiuje strukturę odpowiedzi.

#### 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (200 OK):** Obiekt JSON zgodny z `UserDto`, reprezentujący znalezionego użytkownika.
- **Odpowiedzi błędów:**
  - `400 Bad Request`: Niepoprawny format `userId`.
  - `401 Unauthorized`: Brak lub niepoprawny token JWT.
  - `403 Forbidden`: Użytkownik nie jest administratorem.
  - `404 Not Found`: Użytkownik o podanym `userId` nie istnieje.
  - `500 Internal Server Error`: Błąd bazy danych.

#### 5. Przepływ danych

1.  Odebranie żądania `GET /admin/users/{userId}`.
2.  Middleware: Weryfikacja tokena JWT i sprawdzenie roli 'admin'. Jeśli nie admin, zwróć `403`.
3.  Middleware: Walidacja parametru ścieżki `userId` (`isUUID`). Jeśli błąd, zwróć `400`.
4.  Wywołanie metody `getUserById` w `UserService` przekazując `userId`.
5.  `UserService`:
    a. Wyszukanie użytkownika w tabeli `users` po `user_id`.
    b. Jeśli użytkownik nie istnieje, zwróć `null` (lub rzuć `NotFoundError`).
    c. Jeśli istnieje, sformatuj wynik jako `UserDto` (bez `password_hash`).
    d. Zwróć `UserDto` (lub `null`).
6.  Kontroler: Otrzymanie wyniku z `UserService`. Jeśli `null`, zwróć `404 Not Found`.
7.  Wysłanie odpowiedzi `200 OK` z ciałem `UserDto`.
8.  Middleware: Obsługa błędów (`400`, `401`, `403`, `404`, `500`).

#### 6. Względy bezpieczeństwa

- **Autoryzacja:** Middleware sprawdzające rolę 'admin'.
- **Walidacja:** Walidacja formatu `userId`.
- **Wyciek Danych:** Zwracać tylko `UserDto`.

#### 7. Obsługa błędów

- Globalny middleware.
- Specyficzne błędy:
  - Błąd walidacji `userId` -> `400`.
  - Brak JWT / niepoprawny JWT -> `401`.
  - Brak uprawnień admina -> `403`.
  - Użytkownik nie znaleziony -> `404`.
  - Błędy bazy danych -> `500`.

#### 8. Rozważania dotyczące wydajności

- Zapytanie o użytkownika po `user_id` (klucz główny) jest bardzo szybkie.

#### 9. Etapy wdrożenia

1.  Zdefiniowanie trasy `GET /admin/users/{userId}` w routerze Express.
2.  Dodanie middleware autoryzacji admina.
3.  Implementacja middleware walidacji dla `userId`.
4.  Implementacja metody `getUserById` w `UserService`.
5.  Aktualizacja kontrolera, aby wywoływał `UserService.getUserById` i obsługiwał przypadek `null` (404).
6.  Dodanie testów jednostkowych i integracyjnych.

---

### Endpoint: `PUT /admin/users/{userId}`

#### 1. Przegląd punktu końcowego

Aktualizuje dane istniejącego użytkownika. Pozwala na częściowe aktualizacje. Dostępne tylko dla administratorów.

#### 2. Szczegóły żądania

- **Metoda HTTP:** `PUT`
- **Struktura URL:** `/admin/users/{userId}`
- **Parametry:**
  - Wymagany parametr ścieżki: `userId` (string, format UUID).
- **Request Body:** Wymagany obiekt JSON zgodny z `UpdateUserCommand` (wszystkie pola opcjonalne).
  ```json
  {
    "email": "updated@example.com", // string, format email, unikalne
    "login": "updatedlogin", // string
    "first_name": "Updated", // string
    "last_name": "Name", // string
    "role_id": "new-role-uuid" // string, format UUID, musi istnieć
  }
  ```

#### 3. Wykorzystywane typy

- `UpdateUserCommand` (`@shared/types/UpdateUserCommand.ts`)
- `UserDto` (`@shared/types/UserDto.ts`)

#### 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (200 OK):** Obiekt JSON zgodny z `UserDto` (zaktualizowany użytkownik).
- **Odpowiedzi błędów:** `400`, `401`, `403`, `404`, `500`.

#### 5. Przepływ danych

1.  Odebranie żądania.
2.  Middleware: Weryfikacja JWT i roli 'admin'.
3.  Middleware: Walidacja `userId` i ciała żądania (`UpdateUserCommand`).
4.  Wywołanie `UserService.updateUser`.
5.  `UserService`: Sprawdzenie istnienia użytkownika. Jeśli nie, zwróć `null`. Zaktualizuj dane. Pobierz i zwróć zaktualizowanego `UserDto`.
6.  Kontroler: Obsługa `null` (404). Zwrócenie `200 OK`.
7.  Middleware: Obsługa błędów.

#### 6. Względy bezpieczeństwa

- **Autoryzacja:** Middleware sprawdzające rolę 'admin'.
- **Walidacja:** `userId`, pól w ciele. Sprawdzenie unikalności emaila i istnienia `role_id` przed aktualizacją.
- **Mass Assignment:** Użycie `UpdateUserCommand` i jawne mapowanie pól do aktualizacji w serwisie zapobiega przypadkowemu nadpisaniu niechcianych pól. Nie aktualizować hasła tym endpointem.

#### 7. Obsługa błędów

- Globalny middleware.
- Specyficzne błędy: `400`, `401`, `403`, `404`, `500`.

#### 8. Rozważania dotyczące wydajności

- Wymaga odczytu użytkownika, potencjalnie odczytu emaila/roli, a następnie zapisu. Operacje na indeksowanych kolumnach powinny być szybkie.

#### 9. Etapy wdrożenia

1.  Zdefiniowanie trasy `PUT /admin/users/{userId}`.
2.  Dodanie middleware autoryzacji admina.
3.  Implementacja middleware walidacji dla `userId` i ciała żądania (`UpdateUserCommand`).
4.  Implementacja metody `updateUser` w `UserService`.
    - Sprawdzenie istnienia użytkownika.
    - Warunkowe sprawdzenie unikalności emaila i istnienia `role_id`.
    - Aktualizacja danych w bazie.
    - Pobranie i zwrócenie zaktualizowanego `UserDto`.
5.  Aktualizacja kontrolera, aby wywoływał `UserService.updateUser` i obsługiwał przypadki błędów (404, 409, 400).
6.  Dodanie testów jednostkowych dla `UserService.updateUser`.
7.  Dodanie testów integracyjnych dla endpointu `PUT /admin/users/{userId}` (sukces, 404, błędy walidacji).

---

### Endpoint: `DELETE /admin/users/{userId}`

#### 1. Przegląd punktu końcowego

Usuwa użytkownika o podanym ID. Dostępne tylko dla administratorów.

#### 2. Szczegóły żądania

- **Metoda HTTP:** `DELETE`
- **Struktura URL:** `/admin/users/{userId}`
- **Parametry:**
  - Wymagany parametr ścieżki: `userId` (string, format UUID).
- **Request Body:** Brak.

#### 3. Wykorzystywane typy

- Brak specyficznych DTO/Command Modeli dla tego endpointu.

#### 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (204 No Content):** Brak ciała.
- **Odpowiedzi błędów:** `400`, `401`, `403`, `404`, `500`.

#### 5. Przepływ danych

1.  Odebranie żądania.
2.  Middleware: Weryfikacja JWT i roli 'admin'.
3.  Middleware: Walidacja `userId`.
4.  Wywołanie `UserService.deleteUser`.
5.  `UserService`: Wykonanie `DELETE` w bazie. Sprawdzenie, czy operacja usunęła rekord. Zwrócenie `true`/`false`.
6.  Kontroler: Jeśli `false`, zwróć `404`. W przeciwnym razie `204`.
7.  Middleware: Obsługa błędów.

#### 6. Względy bezpieczeństwa

- **Autoryzacja:** Middleware admina.
- **Walidacja:** `userId`.
- **Konsekwencje:** Usunięcie użytkownika może mieć skutki kaskadowe (`ON DELETE CASCADE` w `group_memberships`, `event_attendance`; `ON DELETE SET NULL` w `events.creator_user_id`). Należy być świadomym tych zależności.

#### 7. Obsługa błędów

- Globalny middleware.
- Specyficzne błędy: `400`, `401`, `403`, `404`, `500`.

#### 8. Rozważania dotyczące wydajności

- Operacja `DELETE` na kluczu głównym jest szybka. Wydajność może zależeć od złożoności operacji kaskadowych zdefiniowanych w bazie danych.

#### 9. Etapy wdrożenia

1.  Zdefiniowanie trasy `DELETE /admin/users/{userId}`.
2.  Dodanie middleware autoryzacji admina.
3.  Implementacja middleware walidacji dla `userId`.
4.  Implementacja metody `deleteUser` w `UserService`.
    - Wykonanie operacji `DELETE` w bazie.
    - Zwrócenie `true`/`false` w zależności od wyniku.
5.  Aktualizacja kontrolera, aby wywoływał `UserService.deleteUser` i zwracał `204` lub `404`.
6.  Dodanie testów jednostkowych dla `UserService.deleteUser`.
7.  Dodanie testów integracyjnych dla endpointu `DELETE /admin/users/{userId}` (sukces 204, 404).

---

## Zasób: Groups

### Endpoint: `POST /admin/groups`

#### 1. Przegląd punktu końcowego

Tworzy nową grupę w systemie. Dostępne tylko dla administratorów.

#### 2. Szczegóły żądania

- **Metoda HTTP:** `POST`
- **Struktura URL:** `/admin/groups`
- **Parametry:** Brak.
- **Request Body:** Wymagany obiekt JSON zgodny z `CreateGroupCommand`.
  ```json
  {
    "group_name": "New Planning Group" // string, wymagane
  }
  ```

#### 3. Wykorzystywane typy

- `CreateGroupCommand` (`@shared/types/CreateGroupCommand.ts`): Definiuje strukturę ciała żądania.
- `GroupDto` (`@shared/types/GroupDto.ts`): Definiuje strukturę odpowiedzi sukcesu.

#### 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (201 Created):** Obiekt JSON zgodny z `GroupDto`, reprezentujący nowo utworzoną grupę.
- **Odpowiedzi błędów:**
  - `400 Bad Request`: Błędy walidacji (np. brakujący `group_name`).
  - `401 Unauthorized`: Brak lub niepoprawny token JWT.
  - `403 Forbidden`: Użytkownik nie jest administratorem.
  - `500 Internal Server Error`: Błąd bazy danych.

#### 5. Przepływ danych

1.  Odebranie żądania `POST /admin/groups`.
2.  Middleware: Weryfikacja tokena JWT i sprawdzenie roli 'admin'. Jeśli nie admin, zwróć `403`.
3.  Middleware: Walidacja ciała żądania (`group_name`) przy użyciu `express-validator`. Jeśli błędy, zwróć `400`.
4.  Wywołanie metody `createGroup` w `GroupService` przekazując `CreateGroupCommand`.
5.  `GroupService`:
    a. Zapisanie nowej grupy w tabeli `groups`.
    b. Pobranie danych nowo utworzonej grupy jako `GroupDto`.
    c. Zwrócenie `GroupDto`.
6.  Kontroler: Otrzymanie `GroupDto` z `GroupService`.
7.  Wysłanie odpowiedzi `201 Created` z ciałem `GroupDto`.
8.  Middleware: Obsługa błędów (`400`, `401`, `403`, `500`).

#### 6. Względy bezpieczeństwa

- **Autoryzacja:** Middleware sprawdzające rolę 'admin'.
- **Walidacja:** Walidacja `group_name`.

#### 7. Obsługa błędów

- Globalny middleware.
- Specyficzne błędy: `400`, `401`, `403`, `500`.

#### 8. Rozważania dotyczące wydajności

- Standardowa operacja zapisu do bazy danych.

#### 9. Etapy wdrożenia

1.  Utworzenie pliku trasy dla grup (np. `backend/src/routes/group.routes.ts` lub dodanie do `admin.routes.ts`).
2.  Zdefiniowanie trasy `POST /admin/groups`.
3.  Dodanie middleware autoryzacji admina.
4.  Implementacja middleware walidacji dla `CreateGroupCommand`.
5.  Utworzenie `GroupService` (np. `backend/src/services/group.service.ts`).
6.  Implementacja metody `createGroup` w `GroupService`.
7.  Utworzenie kontrolera wywołującego `GroupService.createGroup`.
8.  Dodanie testów jednostkowych dla `GroupService.createGroup`.
9.  Dodanie testów integracyjnych dla endpointu `POST /admin/groups`.

---

### Endpoint: `GET /groups`

#### 1. Przegląd punktu końcowego

Pobiera listę grup, do których należy aktualnie uwierzytelniony użytkownik. Wykorzystuje RLS do filtrowania. Obsługuje paginację.

#### 2. Szczegóły żądania

- **Metoda HTTP:** `GET`
- **Struktura URL:** `/groups`
- **Parametry:**
  - Opcjonalne parametry zapytania:
    - `limit`: (integer, domyślnie 20).
    - `offset`: (integer, domyślnie 0).
- **Request Body:** Brak.

#### 3. Wykorzystywane typy

- `ListGroupsResponseDto` (`@shared/types/ListGroupsResponseDto.ts`): Definiuje strukturę odpowiedzi.
- `GroupDto` (`@shared/types/GroupDto.ts`): Definiuje strukturę elementów listy `groups`.

#### 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (200 OK):** Obiekt JSON zgodny z `ListGroupsResponseDto`.
- **Odpowiedzi błędów:** `400`, `401`, `500`.

#### 5. Przepływ danych

1.  Odebranie żądania `GET /groups`.
2.  Middleware: Weryfikacja tokena JWT. Jeśli błąd, zwróć `401`.
3.  Middleware: Pobranie `user_id` z JWT.
4.  Middleware: Walidacja parametrów `limit`, `offset`. Jeśli błędy, zwróć `400`.
5.  Middleware: **Ustawienie kontekstu RLS** (`user_id`).
6.  Wywołanie `GroupService.listUserGroups` z parametrami.
7.  `GroupService`:
    a. Wykonanie zapytań do bazy danych (filtrowanych przez RLS).
    b. Zwrócenie `{ groups, total_count }`.
8.  Kontroler: Zwrócenie `200 OK`.
9.  Middleware: Obsługa błędów.

#### 6. Względy bezpieczeństwa

- **Autoryzacja:** Wymagany poprawny token JWT. Dostęp do danych kontrolowany przez RLS w bazie danych.
- **Kontekst RLS:** Kluczowy.
- **Walidacja:** `limit`, `offset`.

#### 7. Obsługa błędów

- Globalny middleware.
- Specyficzne błędy: `400`, `401`, `500`.

#### 8. Rozważania dotyczące wydajności

- Wydajność zależy od implementacji RLS i liczby grup/członkostw użytkownika. Zapytania `COUNT` mogą być kosztowne.
- Indeksy na `group_memberships(user_id, group_id)` są kluczowe.

#### 9. Etapy wdrożenia

1.  Zdefiniowanie trasy `GET /groups`.
2.  Dodanie middleware weryfikacji JWT.
3.  Implementacja middleware walidacji dla `limit` i `offset`.
4.  Implementacja middleware do ustawiania kontekstu RLS.
5.  Implementacja metody `listUserGroups` w `GroupService`.
6.  Aktualizacja kontrolera.
7.  Dodanie testów jednostkowych i integracyjnych.

---

### Endpoint: `GET /admin/groups`

#### 1. Przegląd punktu końcowego

Pobiera listę wszystkich grup w systemie. Dostępne tylko dla administratorów.

#### 2. Szczegóły żądania

- **Metoda HTTP:** `GET`
- **Struktura URL:** `/admin/groups`
- **Parametry:** Opcjonalna paginacja (`limit`, `offset`).
- **Request Body:** Brak.

#### 3. Wykorzystywane typy

- `ListGroupsResponseDto` (`@shared/types/ListGroupsResponseDto.ts`)
- `GroupDto` (`@shared/types/GroupDto.ts`)

#### 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (200 OK):** Obiekt JSON zgodny z `ListGroupsResponseDto`.
- **Odpowiedzi błędów:** `400`, `401`, `403`, `500`.

#### 5. Przepływ danych

1.  Odebranie żądania `GET /admin/groups`.
2.  Middleware: Weryfikacja JWT i roli 'admin'. Jeśli błąd, zwróć `401`/`403`.
3.  Middleware: Walidacja `limit`, `offset`. Jeśli błąd, zwróć `400`.
4.  Wywołanie metody `listAllGroups` w `GroupService`.
5.  `GroupService`:
    a. Wykonanie zapytań o listę grup (bez filtrowania RLS użytkownika, ale polityka admina powinna zezwalać) i `COUNT`.
    b. Zwrócenie `{ groups, total_count }`.
6.  Kontroler: Otrzymanie wyniku.
7.  Wysłanie odpowiedzi `200 OK`.
8.  Middleware: Obsługa błędów.

#### 6. Względy bezpieczeństwa

- **Autoryzacja:** Middleware sprawdzające rolę 'admin'.
- **Walidacja:** Walidacja `limit`, `offset`.

#### 7. Obsługa błędów

- Globalny middleware.
- Specyficzne błędy: `400`, `401`, `403`, `500`.

#### 8. Rozważania dotyczące wydajności

- Podobne jak dla `GET /admin/users` - paginacja i `COUNT`.

#### 9. Etapy wdrożenia

1.  Zdefiniowanie trasy `GET /admin/groups`.
2.  Dodanie middleware autoryzacji admina.
3.  Implementacja middleware walidacji paginacji.
4.  Implementacja metody `listAllGroups` w `GroupService`.
5.  Aktualizacja kontrolera.
6.  Dodanie testów jednostkowych i integracyjnych.

---

### Endpoint: `GET /admin/groups/{groupId}`

#### 1. Przegląd punktu końcowego

Pobiera szczegóły konkretnej grupy. Dostępne tylko dla administratorów.

#### 2. Szczegóły żądania

- **Metoda HTTP:** `GET`
- **Struktura URL:** `/admin/groups/{groupId}`
- **Parametry:** Wymagany `groupId` (UUID).
- **Request Body:** Brak.

#### 3. Wykorzystywane typy

- `GroupDto` (`@shared/types/GroupDto.ts`)

#### 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (200 OK):** Obiekt JSON zgodny z `GroupDto`.
- **Odpowiedzi błędów:** `400`, `401`, `403`, `404`, `500`.

#### 5. Przepływ danych

1.  Odebranie żądania.
2.  Middleware: Weryfikacja JWT i roli 'admin'.
3.  Middleware: Walidacja `groupId`.
4.  Wywołanie `GroupService.getGroupById`.
5.  `GroupService`: Pobranie grupy z bazy. Zwrócenie `GroupDto` lub `null`.
6.  Kontroler: Jeśli `null`, zwróć `404`. W przeciwnym razie zwróć `200 OK`.
7.  Middleware: Obsługa błędów.

#### 6. Względy bezpieczeństwa

- **Autoryzacja:** Middleware admina.
- **Walidacja:** Walidacja formatu `groupId`.

#### 7. Obsługa błędów

- Globalny middleware.
- Specyficzne błędy: `400`, `401`, `403`, `404`, `500`.

#### 8. Rozważania dotyczące wydajności

- Szybkie zapytanie po kluczu głównym.

#### 9. Etapy wdrożenia

1.  Zdefiniowanie trasy `GET /admin/groups/{groupId}`.
2.  Dodanie middleware autoryzacji admina i walidacji `groupId`.
3.  Implementacja metody `getGroupById` w `GroupService`.
4.  Aktualizacja kontrolera (obsługa 404).
5.  Dodanie testów jednostkowych i integracyjnych.

---

### Endpoint: `PUT /admin/groups/{groupId}`

#### 1. Przegląd punktu końcowego

Aktualizuje nazwę grupy. Dostępne tylko dla administratorów.

#### 2. Szczegóły żądania

- **Metoda HTTP:** `PUT`
- **Struktura URL:** `/admin/groups/{groupId}`
- **Parametry:** Wymagany `groupId` (UUID).
- **Request Body:** Wymagany obiekt JSON zgodny z `UpdateGroupCommand`.
  ```json
  {
    "group_name": "Updated Group Name" // string, wymagane
  }
  ```

#### 3. Wykorzystywane typy

- `UpdateGroupCommand` (`@shared/types/UpdateGroupCommand.ts`)
- `GroupDto` (`@shared/types/GroupDto.ts`)

#### 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (200 OK):** Obiekt JSON zgodny z `GroupDto` (zaktualizowana grupa).
- **Odpowiedzi błędów:** `400`, `401`, `403`, `404`, `500`.

#### 5. Przepływ danych

1.  Odebranie żądania.
2.  Middleware: Weryfikacja JWT i roli 'admin'.
3.  Middleware: Walidacja `groupId` i ciała żądania (`group_name`).
4.  Wywołanie `GroupService.updateGroup`.
5.  `GroupService`: Sprawdzenie istnienia grupy. Jeśli nie, zwróć `null`. Zaktualizuj nazwę. Pobierz i zwróć zaktualizowany `GroupDto`.
6.  Kontroler: Obsługa `null` (404). Zwrócenie `200 OK`.
7.  Middleware: Obsługa błędów.

#### 6. Względy bezpieczeństwa

- **Autoryzacja:** Middleware admina.
- **Walidacja:** `groupId`, `group_name`.

#### 7. Obsługa błędów

- Globalny middleware.
- Specyficzne błędy: `400`, `401`, `403`, `404`, `500`.

#### 8. Rozważania dotyczące wydajności

- Odczyt i zapis - standardowa wydajność.

#### 9. Etapy wdrożenia

1.  Zdefiniowanie trasy `PUT /admin/groups/{groupId}`.
2.  Dodanie middleware autoryzacji i walidacji.
3.  Implementacja metody `updateGroup` w `GroupService`.
4.  Aktualizacja kontrolera (obsługa 404).
5.  Dodanie testów jednostkowych i integracyjnych.

---

### Endpoint: `DELETE /admin/groups/{groupId}`

#### 1. Przegląd punktu końcowego

Usuwa grupę i jej powiązania (kaskadowo). Dostępne tylko dla administratorów.

#### 2. Szczegóły żądania

- **Metoda HTTP:** `DELETE`
- **Struktura URL:** `/admin/groups/{groupId}`
- **Parametry:** Wymagany `groupId` (UUID).
- **Request Body:** Brak.

#### 3. Wykorzystywane typy

- Brak.

#### 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (204 No Content):** Brak ciała.
- **Odpowiedzi błędów:** `400`, `401`, `403`, `404`, `500`.

#### 5. Przepływ danych

1.  Odebranie żądania.
2.  Middleware: Weryfikacja JWT i roli 'admin'.
3.  Middleware: Walidacja `groupId`.
4.  Wywołanie `GroupService.deleteGroup`.
5.  `GroupService`: Wykonanie `DELETE` w bazie. Sprawdzenie, czy operacja usunęła rekord. Zwrócenie `true`/`false`.
6.  Kontroler: Jeśli `false`, zwróć `404`. W przeciwnym razie `204`.
7.  Middleware: Obsługa błędów.

#### 6. Względy bezpieczeństwa

- **Autoryzacja:** Middleware admina.
- **Walidacja:** `groupId`.
- **Konsekwencje:** Usunięcie grupy spowoduje kaskadowe usunięcie wydarzeń i członkostw (`ON DELETE CASCADE`).

#### 7. Obsługa błędów

- Globalny middleware.
- Specyficzne błędy: `400`, `401`, `403`, `404`, `500`.

#### 8. Rozważania dotyczące wydajności

- Wydajność zależy od liczby powiązanych rekordów usuwanych kaskadowo.

#### 9. Etapy wdrożenia

1.  Zdefiniowanie trasy `DELETE /admin/groups/{groupId}`.
2.  Dodanie middleware autoryzacji i walidacji.
3.  Implementacja metody `deleteGroup` w `GroupService`.
4.  Aktualizacja kontrolera (obsługa 404).
5.  Dodanie testów jednostkowych i integracyjnych.

---

## Zasób: Group Memberships (Admin Only)

### Endpoint: `POST /admin/groups/{groupId}/members`

#### 1. Przegląd punktu końcowego

Dodaje użytkownika do grupy. Dostępne tylko dla administratorów.

#### 2. Szczegóły żądania

- **Metoda HTTP:** `POST`
- **Struktura URL:** `/admin/groups/{groupId}/members`
- **Parametry:** Wymagany `groupId` (UUID).
- **Request Body:** Wymagany obiekt JSON zgodny z `AddGroupMemberCommand`.
  ```json
  {
    "user_id": "uuid-of-user-to-add" // string, UUID, wymagane
  }
  ```

#### 3. Wykorzystywane typy

- `AddGroupMemberCommand` (`@shared/types/AddGroupMemberCommand.ts`)
- `GroupMembershipDto` (`@shared/types/GroupMembershipDto.ts`)

#### 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (201 Created):** Obiekt JSON zgodny z `GroupMembershipDto`.
- **Odpowiedzi błędów:** `400`, `401`, `403`, `404` (grupa lub użytkownik nie istnieje), `409` (użytkownik już jest członkiem), `500`.

#### 5. Przepływ danych

1.  Odebranie żądania.
2.  Middleware: Weryfikacja JWT i roli 'admin'.
3.  Middleware: Walidacja `groupId` (parametr ścieżki) i `user_id` (ciało żądania).
4.  Wywołanie `GroupMembershipService.addMember`.
5.  `GroupMembershipService`:
    a. Sprawdzenie istnienia grupy (`groupId`) i użytkownika (`user_id`). Jeśli brak, rzuć `NotFoundError` (404).
    b. Sprawdzenie, czy członkostwo (`groupId`, `user_id`) już istnieje. Jeśli tak, rzuć `ConflictError` (409).
    c. Utworzenie nowego rekordu w `group_memberships`.
    d. Pobranie i zwrócenie `GroupMembershipDto`.
6.  Kontroler: Zwrócenie `201 Created`.
7.  Middleware: Obsługa błędów.

#### 6. Względy bezpieczeństwa

- **Autoryzacja:** Middleware admina.
- **Walidacja:** `groupId`, `user_id`. Sprawdzenie istnienia zasobów i braku konfliktu.

#### 7. Obsługa błędów

- Globalny middleware.
- Specyficzne błędy: `400`, `401`, `403`, `404`, `409`, `500`.

#### 8. Rozważania dotyczące wydajności

- Wymaga sprawdzenia istnienia grupy, użytkownika i członkostwa, a następnie zapisu. Standardowa wydajność.

#### 9. Etapy wdrożenia

1.  Zdefiniowanie trasy `POST /admin/groups/{groupId}/members`.
2.  Dodanie middleware autoryzacji i walidacji.
3.  Utworzenie `GroupMembershipService`.
4.  Implementacja metody `addMember` w `GroupMembershipService` (z obsługą 403, 404, 409).
5.  Aktualizacja kontrolera (obsługa 201).
6.  Dodanie testów jednostkowych i integracyjnych (różne scenariusze błędów).

---

### Endpoint: `DELETE /admin/groups/{groupId}/members/{userId}`

#### 1. Przegląd punktu końcowego

Usuwa użytkownika z grupy. Dostępne tylko dla administratorów.

#### 2. Szczegóły żądania

- **Metoda HTTP:** `DELETE`
- **Struktura URL:** `/admin/groups/{groupId}/members/{userId}`
- **Parametry:** Wymagane `groupId` (UUID), `userId` (UUID).
- **Request Body:** Brak.

#### 3. Wykorzystywane typy

- Brak.

#### 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (204 No Content):** Brak ciała.
- **Odpowiedzi błędów:** `400`, `401`, `403` (brak dostępu RLS), `404` (wydarzenie lub uczestnictwo nie istnieje), `500`.

#### 5. Przepływ danych

1.  Odebranie żądania.
2.  Middleware: Weryfikacja JWT i roli 'admin'.
3.  Middleware: Walidacja `groupId` i `userId`.
4.  Middleware: **Ustawienie kontekstu RLS** (`user_id`).
5.  Wywołanie `GroupMembershipService.removeMember`.
6.  `GroupMembershipService`: Wykonanie `DELETE` na `group_memberships` używając `groupId` i `userId`. Polityka RLS powinna zezwolić na usunięcie tylko swojego rekordu. Sprawdzenie, czy rekord został usunięty. Zwrócenie `true`/`false`.
7.  Kontroler: Jeśli `false`, zwróć `404`. W przeciwnym razie `204`.
8.  Middleware: Obsługa błędów.

#### 6. Względy bezpieczeństwa

- **Autoryzacja:** Middleware admina.
- **Walidacja:** `groupId`, `userId`.

#### 7. Obsługa błędów

- Globalny middleware.
- Specyficzne błędy: `400`, `401`, `403`, `404`, `500`.

#### 8. Rozważania dotyczące wydajności

- Szybka operacja `DELETE` na złożonym kluczu głównym.

#### 9. Etapy wdrożenia

1.  Zdefiniowanie trasy `DELETE /admin/groups/{groupId}/members/{userId}`.
2.  Dodanie middleware autoryzacji i walidacji.
3.  Implementacja metody `removeMember` w `GroupMembershipService`.
4.  Aktualizacja kontrolera (obsługa 404).
5.  Dodanie testów jednostkowych i integracyjnych.

---

### Endpoint: `GET /admin/groups/{groupId}/members`

#### 1. Przegląd punktu końcowego

Listuje członków konkretnej grupy. Dostępne tylko dla administratorów.

#### 2. Szczegóły żądania

- **Metoda HTTP:** `GET`
- **Struktura URL:** `/admin/groups/{groupId}/members`
- **Parametry:** Wymagany `groupId` (UUID). Opcjonalna paginacja (`limit`, `offset`).
- **Request Body:** Brak.

#### 3. Wykorzystywane typy

- `ListGroupMembersResponseDto` (`@shared/types/ListGroupMembersResponseDto.ts`)
- `GroupMemberDetailsDto` (`@shared/types/GroupMemberDetailsDto.ts`)

#### 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (200 OK):** Obiekt JSON zgodny z `ListGroupMembersResponseDto`.
- **Odpowiedzi błędów:** `400`, `401`, `403`, `404` (grupa nie istnieje), `500`.

#### 5. Przepływ danych

1.  Odebranie żądania.
2.  Middleware: Weryfikacja JWT i roli 'admin'.
3.  Middleware: Walidacja `groupId`, `limit`, `offset`.
4.  Middleware: **Ustawienie kontekstu RLS** (`user_id`).
5.  Wywołanie `GroupMembershipService.listMembers`.
6.  `GroupMembershipService`:
    a. Sprawdzenie, czy użytkownik ma dostęp do wydarzenia (`groupId`) przez RLS (polityka SELECT na `group_memberships`). Jeśli RLS odrzuci, zwróć błąd (np. 403 lub 404).
    b. Wykonanie zapytań:
    _ Pobranie listy członków (`JOIN` `group_memberships` z `users` dla `groupId`, z `LIMIT`/`OFFSET`), wybierając potrzebne pola dla `GroupMemberDetailsDto`.
    _ Pobranie całkowitej liczby członków dla `groupId` (`COUNT`).
    c. Zwrócenie `{ members, total_count }`.
7.  Kontroler: Zwrócenie `200 OK`.
8.  Middleware: Obsługa błędów.

#### 6. Względy bezpieczeństwa

- **Autoryzacja:** JWT. RLS kontroluje dostęp do listy uczestników.
- **Walidacja:** `groupId`, `limit`, `offset`.
- **Wyciek Danych:** Zwracać tylko dane z `GroupMemberDetailsDto`.

#### 7. Obsługa błędów

- Globalny middleware.
- Specyficzne błędy: `400`, `401`, `403`, `404`, `500`.

#### 8. Rozważania dotyczące wydajności

- Wymaga `JOIN` i paginacji/`COUNT`. Indeksy na `group_memberships(group_id)` i `users(user_id)` są ważne.

#### 9. Etapy wdrożenia

1.  Zdefiniowanie trasy `GET /admin/groups/{groupId}/members`.
2.  Dodanie middleware JWT, walidacji i RLS.
3.  Implementacja metody `listMembers` w `GroupMembershipService`.
4.  Aktualizacja kontrolera.
5.  Dodanie testów jednostkowych i integracyjnych.

---

## Zasób: Events

### Endpoint: `POST /groups/{groupId}/events`

#### 1. Przegląd punktu końcowego

Tworzy nowe wydarzenie w ramach określonej grupy. Dostępne dla członków grupy.

#### 2. Szczegóły żądania

- **Metoda HTTP:** `POST`
- **Struktura URL:** `/groups/{groupId}/events`
- **Parametry:** Wymagany `groupId` (UUID).
- **Request Body:** Wymagany obiekt JSON zgodny z `CreateEventCommand`.
  ```json
  {
    "title": "Team Meeting", // string, wymagane
    "start_time": "iso8601-timestamp", // string, ISO8601, wymagane
    "place": "Conference Room A", // string, opcjonalne
    "description": "Discuss project progress", // string, opcjonalne
    "is_ai_suggestion": false // boolean, opcjonalne, domyślnie false
  }
  ```

#### 3. Wykorzystywane typy

- `CreateEventCommand` (`@shared/types/CreateEventCommand.ts`)
- `EventDto` (`@shared/types/EventDto.ts`)

#### 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (201 Created):** Obiekt JSON zgodny z `EventDto` (nowe wydarzenie).
- **Odpowiedzi błędów:** `400`, `401`, `403` (użytkownik nie jest członkiem grupy), `404` (grupa nie istnieje), `500`.

#### 5. Przepływ danych

1.  Odebranie żądania.
2.  Middleware: Weryfikacja JWT. Jeśli błąd, zwróć `401`.
3.  Middleware: Pobranie `user_id` z JWT.
4.  Middleware: Walidacja `groupId` (parametr) i ciała żądania (`CreateEventCommand`). Jeśli błąd, zwróć `400`.
5.  Middleware: **Ustawienie kontekstu RLS** (`user_id`).
6.  Wywołanie `EventService.createEvent` przekazując `groupId`, `CreateEventCommand` i `user_id` (jako `creator_user_id`).
7.  `EventService`:
    a. **Sprawdzenie uprawnień:** Zweryfikowanie, czy użytkownik (`user_id`) jest członkiem grupy (`groupId`). Można to zrobić osobnym zapytaniem LUB polegać na polityce RLS `WITH CHECK` podczas INSERT-u (preferowane, jeśli polityka jest odpowiednia). Jeśli brak uprawnień (np. RLS zwróci błąd), rzuć `ForbiddenError` (403).
    b. Sprawdzenie, czy grupa (`groupId`) istnieje (jeśli nie sprawdza tego RLS). Jeśli nie, rzuć `NotFoundError` (404).
    c. Zapisanie nowego wydarzenia w tabeli `events`, ustawiając `group_id`, `creator_user_id` i pozostałe dane.
    d. Pobranie i zwrócenie `EventDto`.
8.  Kontroler: Zwrócenie `201 Created`.
9.  Middleware: Obsługa błędów (`400`, `401`, `403`, `404`, `500`).

#### 6. Względy bezpieczeństwa

- **Autoryzacja:** Wymagany JWT. Dostęp kontrolowany przez sprawdzenie członkostwa w grupie (logika serwisu lub RLS).
- **Walidacja:** `groupId`, `title`, `start_time`, pozostałe pola.
- **Kontekst RLS:** Krytyczne dla poprawnego działania polityk.
- **creator_user_id:** Musi być ustawiony na ID uwierzytelnionego użytkownika, nie może być manipulowany przez klienta.

#### 7. Obsługa błędów

- Globalny middleware.
- Specyficzne błędy: `400`, `401`, `403`, `404`, `500`.

#### 8. Rozważania dotyczące wydajności

- Sprawdzenie członkostwa (jeśli robione jawnie) wymaga zapytania. Zapis wydarzenia jest standardowy.

#### 9. Etapy wdrożenia

1.  Zdefiniowanie trasy `POST /groups/{groupId}/events`.
2.  Dodanie middleware weryfikacji JWT.
3.  Dodanie middleware walidacji (`groupId`, `CreateEventCommand`).
4.  Dodanie middleware ustawiania kontekstu RLS.
5.  Utworzenie `EventService`.
6.  Implementacja metody `createEvent` w `EventService` (z obsługą sprawdzenia uprawnień/RLS i ustawieniem `creator_user_id`).
7.  Aktualizacja kontrolera.
8.  Dodanie testów jednostkowych i integracyjnych.

---

### Endpoint: `GET /groups/{groupId}/events`

#### 1. Przegląd punktu końcowego

Pobiera listę wydarzeń dla danej grupy. Dostępne dla członków grupy. Obsługuje filtrowanie po dacie i paginację.

#### 2. Szczegóły żądania

- **Metoda HTTP:** `GET`
- **Struktura URL:** `/groups/{groupId}/events`
- **Parametry:**
  - Wymagany `groupId` (UUID).
  - Opcjonalne: `startDate` (ISO8601), `endDate` (ISO8601), `limit` (int), `offset` (int).
- **Request Body:** Brak.

#### 3. Wykorzystywane typy

- `ListEventsResponseDto` (`@shared/types/ListEventsResponseDto.ts`)
- `EventDto` (`@shared/types/EventDto.ts`)

#### 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (200 OK):** Obiekt JSON zgodny z `ListEventsResponseDto`.
- **Odpowiedzi błędów:** `400` (złe daty/paginacja), `401`, `500`.

#### 5. Przepływ danych

1.  Odebranie żądania.
2.  Middleware: Weryfikacja JWT.
3.  Middleware: Pobranie `user_id` z JWT.
4.  Middleware: Walidacja parametrów `limit`, `offset`. Jeśli błędy, zwróć `400`.
5.  Middleware: **Ustawienie kontekstu RLS** (`user_id`).
6.  Wywołanie `EventService.listGroupEvents` z parametrami.
7.  `EventService`:
    a. Sprawdzenie istnienia grupy (`groupId`). Można pominąć, jeśli RLS to obsłuży.
    b. Sprawdzenie członkostwa użytkownika w grupie (jawnie lub poleganie na RLS).
    c. Wykonanie zapytań o listę wydarzeń (filtrowaną przez `groupId`, daty i RLS, z `LIMIT`/`OFFSET`) i `COUNT`.
    d. Zwrócenie `{ events, total_count }`.
8.  Kontroler: Zwrócenie `200 OK`.
9.  Middleware: Obsługa błędów.

#### 6. Względy bezpieczeństwa

- **Autoryzacja:** JWT. RLS lub jawne sprawdzenie członkostwa.
- **Walidacja:** `groupId`, parametry filtrów i paginacji.
- **Kontekst RLS:** Kluczowy.

#### 7. Obsługa błędów

- Globalny middleware.
- Specyficzne błędy: `400`, `401`, `500`.

#### 8. Rozważania dotyczące wydajności

- Filtrowanie po dacie (`start_time`) wymaga indeksu. Paginacja i `COUNT`.

#### 9. Etapy wdrożenia

1.  Zdefiniowanie trasy `GET /groups/{groupId}/events`.
2.  Dodanie middleware JWT, walidacji i RLS.
3.  Implementacja metody `listGroupEvents` w `EventService` (z filtrowaniem i paginacją).
4.  Aktualizacja kontrolera.
5.  Dodanie testów jednostkowych i integracyjnych.

---

### Endpoint: `GET /events/{eventId}`

#### 1. Przegląd punktu końcowego

Pobiera szczegóły konkretnego wydarzenia. Dostępne dla członków grupy, do której należy wydarzenie.

#### 2. Szczegóły żądania

- **Metoda HTTP:** `GET`
- **Struktura URL:** `/events/{eventId}`
- **Parametry:** Wymagany `eventId` (UUID).
- **Request Body:** Brak.

#### 3. Wykorzystywane typy

- `EventDto` (`@shared/types/EventDto.ts`)

#### 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (200 OK):** Obiekt JSON zgodny z `EventDto`.
- **Odpowiedzi błędów:** `400`, `401`, `403` (nie członek grupy wydarzenia), `404` (wydarzenie nie istnieje lub brak dostępu RLS), `500`.

#### 5. Przepływ danych

1.  Odebranie żądania.
2.  Middleware: Weryfikacja JWT.
3.  Middleware: Pobranie `user_id` z JWT.
4.  Middleware: Walidacja `eventId`.
5.  Middleware: **Ustawienie kontekstu RLS** (`user_id`).
6.  Wywołanie `EventService.getEventById`.
7.  `EventService`: Pobranie wydarzenia z bazy (RLS automatycznie odfiltruje, jeśli brak dostępu). Zwrócenie `EventDto` lub `null`.
8.  Kontroler: Jeśli `null`, zwróć `404`. W przeciwnym razie zwróć `200 OK`.
9.  Middleware: Obsługa błędów.

#### 6. Względy bezpieczeństwa

- **Autoryzacja:** JWT. RLS jest kluczowy do kontroli dostępu.
- **Walidacja:** `eventId`.

#### 7. Obsługa błędów

- Globalny middleware.
- Specyficzne błędy: `400`, `401`, `403`, `404`, `500`.

#### 8. Rozważania dotyczące wydajności

- Szybkie zapytanie po kluczu głównym.

#### 9. Etapy wdrożenia

1.  Zdefiniowanie trasy `GET /events/{eventId}`.
2.  Dodanie middleware JWT, walidacji i RLS.
3.  Implementacja metody `getEventById` w `EventService`.
4.  Aktualizacja kontrolera (obsługa 404).
5.  Dodanie testów jednostkowych i integracyjnych.

---

### Endpoint: `PUT /events/{eventId}`

#### 1. Przegląd punktu końcowego

Aktualizuje wydarzenie. Dostępne dla członków grupy (zgodnie z polityką RLS - "any member can edit").

#### 2. Szczegóły żądania

- **Metoda HTTP:** `PUT`
- **Struktura URL:** `/events/{eventId}`
- **Parametry:** Wymagany `eventId` (UUID).
- **Request Body:** Obiekt JSON zgodny z `UpdateEventCommand` (pola opcjonalne).
  ```json
  {
    "title": "Updated Event Title", // string, wymagane
    "start_time": "updated-iso8601-timestamp", // string, ISO8601, wymagane
    "place": "Updated Conference Room", // string, opcjonalne
    "description": "Updated event description", // string, opcjonalne
    "is_ai_suggestion": true // boolean, opcjonalne, domyślnie true
  }
  ```

#### 3. Wykorzystywane typy

- `UpdateEventCommand` (`@shared/types/UpdateEventCommand.ts`)
- `EventDto` (`@shared/types/EventDto.ts`)

#### 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (200 OK):** Obiekt JSON zgodny z `EventDto` (zaktualizowane wydarzenie).
- **Odpowiedzi błędów:** `400`, `401`, `403` (brak dostępu RLS), `404` (wydarzenie nie istnieje), `500`.

#### 5. Przepływ danych

1.  Odebranie żądania.
2.  Middleware: Weryfikacja JWT.
3.  Middleware: Pobranie `user_id` z JWT.
4.  Middleware: Walidacja `eventId` i ciała żądania.
5.  Middleware: **Ustawienie kontekstu RLS** (`user_id`).
6.  Wywołanie `EventService.updateEvent`.
7.  `EventService`: Sprawdzenie istnienia wydarzenia. Jeśli nie, zwróć `null`. Zaktualizuj dane. Pobierz i zwróć zaktualizowane `EventDto`.
8.  Kontroler: Obsługa `null` (404). Zwrócenie `200 OK`.
9.  Middleware: Obsługa błędów.

#### 6. Względy bezpieczeństwa

- **Autoryzacja:** JWT. RLS `WITH CHECK` jest kluczowy.
- **Walidacja:** `eventId`, pól w ciele.
- **Ryzyko:** Polityka RLS zezwalająca każdemu członkowi na edycję jest ryzykowna.

#### 7. Obsługa błędów

- Globalny middleware.
- Specyficzne błędy: `400`, `401`, `403`, `404`, `500`.

#### 8. Rozważania dotyczące wydajności

- Odczyt i zapis - standardowa wydajność.

#### 9. Etapy wdrożenia

1.  Zdefiniowanie trasy `PUT /events/{eventId}`.
2.  Dodanie middleware JWT, walidacji i RLS.
3.  Implementacja metody `updateEvent` w `EventService`.
4.  Aktualizacja kontrolera (obsługa 404).
5.  Dodanie testów jednostkowych i integracyjnych (weryfikacja RLS).

---

### Endpoint: `DELETE /events/{eventId}`

#### 1. Przegląd punktu końcowego

Usuwa wydarzenie. Dostępne dla członków grupy (zgodnie z polityką RLS - "any member can delete").

#### 2. Szczegóły żądania

- **Metoda HTTP:** `DELETE`
- **Struktura URL:** `/events/{eventId}`
- **Parametry:** Wymagany `eventId` (UUID).
- **Request Body:** Brak.

#### 3. Wykorzystywane typy

- Brak.

#### 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (204 No Content):** Brak ciała.
- **Odpowiedzi błędów:** `400`, `401`, `403`, `404`, `500`.

#### 5. Przepływ danych

1.  Odebranie żądania.
2.  Middleware: Weryfikacja JWT.
3.  Middleware: Pobranie `user_id` z JWT.
4.  Middleware: Walidacja `eventId`.
5.  Middleware: **Ustawienie kontekstu RLS** (`user_id`).
6.  Wywołanie `EventService.deleteEvent`.
7.  `EventService`: Wykonanie `DELETE` w bazie. Sprawdzenie, czy rekord został usunięty. Zwrócenie `true`/`false`.
8.  Kontroler: Jeśli `false`, zwróć `404`. W przeciwnym razie `204`.
9.  Middleware: Obsługa błędów.

#### 6. Względy bezpieczeństwa

- **Autoryzacja:** JWT. RLS jest kluczowy.
- **Walidacja:** `eventId`.
- **Konsekwencje:** Usunięcie wydarzenia spowoduje kaskadowe usunięcie uczestnictwa (`ON DELETE CASCADE`).

#### 7. Obsługa błędów

- Globalny middleware.
- Specyficzne błędy: `400`, `401`, `403`, `404`, `500`.

#### 8. Rozważania dotyczące wydajności

- Operacja `DELETE` na kluczu głównym jest szybka. Wydajność może zależeć od `ON DELETE CASCADE` w bazie danych.

#### 9. Etapy wdrożenia

1.  Zdefiniowanie trasy `DELETE /events/{eventId}`.
2.  Dodanie middleware JWT, walidacji i RLS.
3.  Implementacja metody `deleteEvent` w `EventService`.
4.  Aktualizacja kontrolera (obsługa 404).
5.  Dodanie testów jednostkowych i integracyjnych (weryfikacja RLS).

---

## Zasób: Event Attendance

### Endpoint: `POST /events/{eventId}/attendance`

#### 1. Przegląd punktu końcowego

Zapisuje użytkownika na wydarzenie. Dostępne dla członków grupy wydarzenia.

#### 2. Szczegóły żądania

- **Metoda HTTP:** `POST`
- **Struktura URL:** `/events/{eventId}/attendance`
- **Parametry:** Wymagany `eventId` (UUID).
- **Request Body:** Brak.

#### 3. Wykorzystywane typy

- `EventAttendanceDto` (`@shared/types/EventAttendanceDto.ts`)

#### 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (201 Created / 200 OK):** Obiekt JSON zgodny z `EventAttendanceDto`.
- **Odpowiedzi błędów:** `400`, `401`, `403`, `404` (wydarzenie), `409` (już zapisany), `500`.

#### 5. Przepływ danych

1.  Odebranie żądania.
2.  Middleware: Weryfikacja JWT.
3.  Middleware: Pobranie `user_id` z JWT.
4.  Middleware: Walidacja `eventId`.
5.  Middleware: **Ustawienie kontekstu RLS** (`user_id`).
6.  Wywołanie `EventAttendanceService.joinEvent`.
7.  `EventAttendanceService`:
    a. Sprawdzenie, czy wydarzenie (`eventId`) istnieje i czy użytkownik ma do niego dostęp (przez RLS lub jawne sprawdzenie członkostwa w grupie wydarzenia). Jeśli nie, rzuć `NotFoundError` (404).
    b. Sprawdzenie, czy użytkownik (`user_id`) już jest zapisany na to wydarzenie (`eventId`). Jeśli tak, zwróć istniejący rekord (kod 200 OK).
    c. Utworzenie nowego rekordu w `event_attendance`.
    d. Pobranie i zwrócenie `EventAttendanceDto`.
8.  Kontroler: Zwrócenie `201` lub `200`.
9.  Middleware: Obsługa błędów.

#### 6. Względy bezpieczeństwa

- **Autoryzacja:** JWT. RLS lub jawne sprawdzenie członkostwa w grupie wydarzenia.
- **Walidacja:** `eventId`.
- **Idempotentność:** Ponowne wywołanie przez tego samego użytkownika powinno zwrócić sukces (200 OK) bez tworzenia duplikatu.

#### 7. Obsługa błędów

- Globalny middleware.
- Specyficzne błędy: `400`, `401`, `403`, `404`, `409`, `500`.

#### 8. Rozważania dotyczące wydajności

- Wymaga sprawdzenia istnienia wydarzenia/dostępu, sprawdzenia istniejącego zapisu, a następnie zapisu. Standardowa wydajność.

#### 9. Etapy wdrożenia

1.  Zdefiniowanie trasy `POST /events/{eventId}/attendance`.
2.  Dodanie middleware JWT, walidacji i RLS.
3.  Utworzenie `EventAttendanceService`.
4.  Implementacja metody `joinEvent` w `EventAttendanceService`.
5.  Aktualizacja kontrolera.
6.  Dodanie testów jednostkowych i integracyjnych (różne scenariusze błędów).

---

### Endpoint: `DELETE /events/{eventId}/attendance`

#### 1. Przegląd punktu końcowego

Wypisuje użytkownika z wydarzenia.

#### 2. Szczegóły żądania

- **Metoda HTTP:** `DELETE`
- **Struktura URL:** `/events/{eventId}/attendance`
- **Parametry:** Wymagany `eventId` (UUID).
- **Request Body:** Brak.

#### 3. Wykorzystywane typy

- Brak.

#### 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (204 No Content):** Brak ciała.
- **Odpowiedzi błędów:** `400`, `401`, `403`, `404` (wydarzenie lub uczestnictwo nie istnieje), `500`.

#### 5. Przepływ danych

1.  Odebranie żądania.
2.  Middleware: Weryfikacja JWT.
3.  Middleware: Pobranie `user_id` z JWT.
4.  Middleware: Walidacja `eventId`.
5.  Middleware: **Ustawienie kontekstu RLS** (`user_id`).
6.  Wywołanie `EventAttendanceService.leaveEvent`.
7.  `EventAttendanceService`: Wykonanie `DELETE` na `event_attendance` używając `eventId` i `user_id`. Polityka RLS powinna zezwolić na usunięcie tylko swojego rekordu. Sprawdzenie, czy rekord został usunięty. Zwrócenie `true`/`false`.
8.  Kontroler: Jeśli `false`, zwróć `404`. W przeciwnym razie `204`.
9.  Middleware: Obsługa błędów.

#### 6. Względy bezpieczeństwa

- **Autoryzacja:** JWT. RLS zapewnia, że użytkownik może usunąć tylko swoje uczestnictwo.
- **Walidacja:** `eventId`.

#### 7. Obsługa błędów

- Globalny middleware.
- Specyficzne błędy: `400`, `401`, `403`, `404`, `500`.

#### 8. Rozważania dotyczące wydajności

- Szybka operacja `DELETE` na złożonym kluczu głównym.

#### 9. Etapy wdrożenia

1.  Zdefiniowanie trasy `DELETE /events/{eventId}/attendance`.
2.  Dodanie middleware JWT, walidacji i RLS.
3.  Implementacja metody `leaveEvent` w `EventAttendanceService`.
4.  Aktualizacja kontrolera (obsługa 404).
5.  Dodanie testów jednostkowych i integracyjnych.

---

### Endpoint: `GET /events/{eventId}/attendees`

#### 1. Przegląd punktu końcowego

Pobiera listę użytkowników zapisanych na wydarzenie. Dostępne dla członków grupy wydarzenia.

#### 2. Szczegóły żądania

- **Metoda HTTP:** `GET`
- **Struktura URL:** `/events/{eventId}/attendees`
- **Parametry:** Wymagany `eventId` (UUID). Opcjonalna paginacja (`limit`, `offset`).
- **Request Body:** Brak.

#### 3. Wykorzystywane typy

- `ListEventAttendeesResponseDto` (`@shared/types/ListEventAttendeesResponseDto.ts`)
- `AttendeeDetailsDto` (`@shared/types/AttendeeDetailsDto.ts`)

#### 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (200 OK):** Obiekt JSON zgodny z `ListEventAttendeesResponseDto`.
- **Odpowiedzi błędów:** `400`, `401`, `403`, `404` (wydarzenie), `500`.

#### 5. Przepływ danych

1.  Odebranie żądania.
2.  Middleware: Weryfikacja JWT.
3.  Middleware: Pobranie `user_id` z JWT.
4.  Middleware: Walidacja `eventId`, `limit`, `offset`.
5.  Middleware: **Ustawienie kontekstu RLS** (`user_id`).
6.  Wywołanie `EventAttendanceService.listAttendees`.
7.  `EventAttendanceService`:
    a. Sprawdzenie, czy użytkownik ma dostęp do wydarzenia (`eventId`) przez RLS (polityka SELECT na `event_attendance`). Jeśli RLS odrzuci, zwróć błąd (np. 403 lub 404).
    b. Wykonanie zapytań:
    _ Pobranie listy uczestników (`JOIN` `event_attendance` z `users` dla `eventId`, z `LIMIT`/`OFFSET`), wybierając potrzebne pola dla `AttendeeDetailsDto`.
    _ Pobranie całkowitej liczby uczestników dla `eventId` (`COUNT`).
    c. Zwrócenie `{ attendees, total_count }`.
8.  Kontroler: Zwrócenie `200 OK`.
9.  Middleware: Obsługa błędów.

#### 6. Względy bezpieczeństwa

- **Autoryzacja:** JWT. RLS kontroluje dostęp do listy uczestników.
- **Walidacja:** `eventId`, parametry filtrów i paginacji.
- **Wyciek Danych:** Zwracać tylko dane z `AttendeeDetailsDto`.

#### 7. Obsługa błędów

- Globalny middleware.
- Specyficzne błędy: `400`, `401`, `403`, `404`, `500`.

#### 8. Rozważania dotyczące wydajności

- Wymaga `JOIN` i paginacji/`COUNT`. Indeksy na `event_attendance(event_id)` i `users(user_id)` są ważne.

#### 9. Etapy wdrożenia

1.  Zdefiniowanie trasy `GET /events/{eventId}/attendees`.
2.  Dodanie middleware JWT, walidacji i RLS.
3.  Implementacja metody `listAttendees` w `EventAttendanceService`.
4.  Aktualizacja kontrolera.
5.  Dodanie testów jednostkowych i integracyjnych.

---

## Zasób: AI Suggestions

### Endpoint: `GET /ai/event-suggestions`

#### 1. Przegląd punktu końcowego

Pobiera sugestie wydarzeń z zewnętrznego serwisu AI (Google Gemini) na podstawie podanych kryteriów.

#### 2. Szczegóły żądania

- **Metoda HTTP:** `GET`
- **Struktura URL:** `/ai/event-suggestions`
- **Parametry:**
  - Wymagane parametry zapytania:
    - `startDate` (string, ISO8601 date).
    - `endDate` (string, ISO8601 date).
    - `location` (string).
  - Opcjonalny parametr zapytania:
    - `type` (string).
- **Request Body:** Brak.

#### 3. Wykorzystywane typy

- `GetEventSuggestionsQuery` (`@shared/types/GetEventSuggestionsQuery.ts`): Reprezentuje parametry zapytania.
- `ListEventSuggestionsResponseDto` (`@shared/types/ListEventSuggestionsResponseDto.ts`)
- `AISuggestionDto` (`@shared/types/AISuggestionDto.ts`)

#### 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (200 OK):** Obiekt JSON zgodny z `ListEventSuggestionsResponseDto`.
- **Odpowiedzi błędów:** `400` (brakujące/niepoprawne parametry), `401` (JWT), `500` (błąd wewnętrzny, błąd AI), `503` (serwis AI niedostępny/timeout).

#### 5. Przepływ danych

1.  Odebranie żądania.
2.  Middleware: Weryfikacja JWT.
3.  Middleware: Walidacja wymaganych i opcjonalnych parametrów zapytania (`startDate`, `endDate`, `location`, `type`), w tym formatów dat.
4.  Wywołanie `AISuggestionService.getSuggestions` przekazując parametry jako `GetEventSuggestionsQuery`.
5.  `AISuggestionService`:
    a. Pobranie klucza API Google AI z `process.env.GOOGLE_API_KEY`.
    b. Inicjalizacja klienta Google AI SDK (`@google/generative-ai`).
    c. Sformułowanie odpowiedniego promptu dla modelu Gemini na podstawie parametrów zapytania (np. "Suggest events like [type] in [location] between [startDate] and [endDate]").
    d. Wywołanie metody `generateContent` (lub odpowiedniej) z modelu Gemini.
    e. Obsługa potencjalnych błędów odpowiedzi z AI SDK (np. timeout, błąd autoryzacji API key, błędy związane z treścią promptu).
    f. Sparowanie odpowiedzi tekstowej z AI do struktury `AISuggestionDto[]`. Może wymagać dodatkowego prompt engineeringu, aby AI zwracało dane w bardziej ustrukturyzowanym formacie (np. JSON) lub ręcznego parsowania tekstu.
    g. Zwrócenie obiektu `{ suggestions }`.
6.  Kontroler: Zwrócenie `200 OK`.
7.  Middleware: Obsługa błędów (mapowanie błędów AI SDK na `500` lub `503`).

#### 6. Względy bezpieczeństwa

- **Autoryzacja:** Wymagany JWT.
- **Klucz API:** Klucz Google API musi być bezpiecznie przechowywany w zmiennych środowiskowych i nie może wyciec na frontend.
- **Walidacja:** Walidacja parametrów wejściowych.
- **Prompt Injection:** Zabezpieczenie przed wstrzykiwaniem złośliwych instrukcji do promptu AI, jeśli parametry użytkownika są bezpośrednio włączane do promptu (np. przez sanitizację lub użycie parametrów w sposób, który nie pozwala na wykonanie kodu/instrukcji).
- **Rate Limiting:** Rozważyć rate limiting, aby kontrolować koszty i użycie API Google AI.

#### 7. Obsługa błędów

- Globalny middleware.
- Specyficzne błędy:
  - Błędy walidacji -> `400`.
  - Brak JWT -> `401`.
  - Błędy komunikacji z Google AI (timeout, niedostępność) -> `503 Service Unavailable`.
  - Inne błędy AI SDK (np. zły klucz API, błąd wewnętrzny AI) -> `500`.
  - Błędy parsowania odpowiedzi AI -> `500`.

#### 8. Rozważania dotyczące wydajności

- Wydajność zależy głównie od czasu odpowiedzi API Google Gemini.
- Implementacja może wymagać asynchronicznej obsługi, jeśli odpowiedzi AI są długotrwałe.
- Parsowanie odpowiedzi AI może być kosztowne, jeśli format nie jest ustrukturyzowany.

#### 9. Etapy wdrożenia

1.  Zdefiniowanie trasy `GET /ai/event-suggestions`.
2.  Dodanie middleware JWT i walidacji parametrów.
3.  Utworzenie `AISuggestionService`.
4.  Implementacja metody `getSuggestions` w `AISuggestionService`:
    - Konfiguracja i inicjalizacja Google AI SDK.
    - Pobranie klucza API z `.env`.
    - Implementacja logiki tworzenia promptu.
    - Wywołanie AI SDK.
    - Implementacja logiki parsowania odpowiedzi AI do DTO.
    - Obsługa błędów AI SDK.
5.  Aktualizacja kontrolera.
6.  Skonfigurowanie zmiennej środowiskowej `GOOGLE_API_KEY`.
7.  Dodanie testów jednostkowych dla `AISuggestionService` (może wymagać mockowania AI SDK).
8.  Dodanie testów integracyjnych (mogą być trudne bez rzeczywistego API key lub płatnego konta; rozważyć mockowanie odpowiedzi HTTP).

---

## Zasób: Roles (Admin Only)

### Endpoint: `GET /admin/roles`

#### 1. Przegląd punktu końcowego

Pobiera listę wszystkich dostępnych ról w systemie (np. 'standard', 'admin'). Dostępne tylko dla administratorów.

#### 2. Szczegóły żądania

- **Metoda HTTP:** `GET`
- **Struktura URL:** `/admin/roles`
- **Parametry:** Brak.
- **Request Body:** Brak.

#### 3. Wykorzystywane typy

- `RoleDto` (`@shared/types/RoleDto.ts`): Definiuje strukturę obiektu roli (np. `{ role_id: string, role_name: string }`).
- `ListRolesResponseDto` (`@shared/types/ListRolesResponseDto.ts`, opcjonalne, lub po prostu tablica `RoleDto[]`): Definiuje strukturę odpowiedzi (prawdopodobnie tablica `RoleDto[]`).

#### 4. Szczegóły odpowiedzi

- **Odpowiedź sukcesu (200 OK):** Tablica obiektów JSON zgodnych z `RoleDto`.
  ```json
  [
    {
      "role_id": "uuid-for-admin",
      "role_name": "admin"
    },
    {
      "role_id": "uuid-for-standard",
      "role_name": "standard"
    }
  ]
  ```
- **Odpowiedzi błędów:**
  - `401 Unauthorized`: Brak lub niepoprawny token JWT.
  - `403 Forbidden`: Użytkownik nie jest administratorem.
  - `500 Internal Server Error`: Błąd bazy danych.

#### 5. Przepływ danych

1.  Odebranie żądania `GET /admin/roles`.
2.  Middleware: Weryfikacja tokena JWT i sprawdzenie roli 'admin'. Jeśli błąd, zwróć `401`/`403`.
3.  Wywołanie metody `listRoles` w `AdminRoleController` (lub odpowiednim serwisie).
4.  Kontroler/Serwis:
    a. Wykonanie zapytania do bazy danych: `SELECT role_id, role_name FROM roles ORDER BY role_name`.
    b. Sformatowanie wyników jako tablica `RoleDto[]`.
    c. Zwrócenie tablicy ról.
5.  Kontroler: Otrzymanie wyniku.
6.  Wysłanie odpowiedzi `200 OK` z tablicą `RoleDto[]` jako ciałem.
7.  Middleware: Obsługa błędów (`401`, `403`, `500`).

#### 6. Względy bezpieczeństwa

- **Autoryzacja:** Kluczowe jest middleware sprawdzające rolę 'admin'.

#### 7. Obsługa błędów

- Globalny middleware.
- Specyficzne błędy: `401`, `403`, `500`.

#### 8. Rozważania dotyczące wydajności

- Zapytanie do tabeli `roles` jest bardzo szybkie (mała tabela).

#### 9. Etapy wdrożenia

1.  (Zakończone) Zdefiniowanie trasy `GET /admin/roles` w `admin.routes.ts`.
2.  (Zakończone) Dodanie middleware autoryzacji admina (w ramach `router.use` dla wszystkich tras admina).
3.  (Zakończone) Implementacja metody `listRoles` w `AdminRoleController` (bezpośrednio w pliku tras lub w dedykowanym kontrolerze/serwisie).
4.  Dodanie testów jednostkowych (jeśli logika jest w serwisie).
5.  Dodanie testów integracyjnych dla endpointu `GET /admin/roles`.

</rewritten_file>
