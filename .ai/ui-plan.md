# Architektura UI dla Kalendarza Grupowego AI

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika (UI) opiera się na bibliotece React i wykorzystuje architekturę komponentową. Do nawigacji między widokami używany jest `react-router-dom`. Zarządzanie stanem globalnym aplikacji, w tym stanem uwierzytelnienia użytkownika, tokenem JWT, aktywną grupą oraz stanami ładowania/błędów, realizowane jest za pomocą Redux (Redux Toolkit + Thunk). Stylowanie zapewnione jest przez TailwindCSS w połączeniu z predefiniowanymi komponentami z biblioteki `shadcn/ui`.

Struktura UI obejmuje:
*   Widok publiczny (Logowanie).
*   Widoki chronione (`Protected Routes`) dostępne po zalogowaniu dla użytkowników standardowych (Kalendarz, Wydarzenia, Sugestie AI).
*   Widoki chronione (`Protected Routes`) dostępne tylko dla administratorów (Zarządzanie Użytkownikami, Zarządzanie Grupami).
*   Główną nawigację w formie górnego paska (`TopNavBar`) zawierającego logo, selektor grup (jeśli użytkownik należy do wielu), linki do kluczowych sekcji oraz opcje administracyjne i wylogowanie.
*   Mechanizm obsługi stanów ładowania i błędów API w postaci pełnoekranowych nakładek (`LoadingOverlay`, `ErrorOverlay`).
*   Token JWT jest przechowywany wyłącznie w stanie Redux, co wymaga ponownego logowania przy każdym odświeżeniu strony lub nowej sesji.

## 2. Lista widoków

Poniżej znajduje się lista kluczowych widoków aplikacji:

---

**1. Widok Logowania (Login View)**
*   **Ścieżka:** `/login`
*   **Główny cel:** Uwierzytelnienie użytkownika.
*   **Kluczowe informacje:** Formularz z polami na email i hasło, przycisk logowania, komunikaty błędów.
*   **Kluczowe komponenty:** `LoginForm`, `Input` (shadcn), `Button` (shadcn), `ErrorMessage`.
*   **UX/Dostępność/Bezpieczeństwo:** Standardowy formularz logowania. Jasne komunikaty o błędach. Brak przechowywania hasła po stronie klienta. Endpoint API: `POST /auth/login`.

---

**2. Widok Wyboru Grupy (Group Selection View)**
*   **Ścieżka:** `/groups`
*   **Główny cel:** Umożliwienie użytkownikowi należącemu do wielu grup wybrania aktywnej grupy.
*   **Kluczowe informacje:** Lista grup, do których należy użytkownik.
*   **Kluczowe komponenty:** `GroupList`, `GroupListItem`, `Button` (shadcn).
*   **UX/Dostępność/Bezpieczeństwo:** Wyświetlany warunkowo po logowaniu (jeśli `user.groups.length > 1`). Prosta, czytelna lista. Wybór grupy zapisuje `activeGroupId` w stanie Redux i przekierowuje do kalendarza. Endpoint API: Dane grup pobierane podczas logowania lub osobnym zapytaniem.

---

**3. Widok Kalendarza Grupy (Group Calendar View)**
*   **Ścieżka:** `/groups/{groupId}/calendar`
*   **Główny cel:** Wyświetlanie wydarzeń dla wybranej grupy w formacie kalendarza (dziennym, tygodniowym, miesięcznym). Główny widok aplikacji po zalogowaniu i wyborze grupy.
*   **Kluczowe informacje:** Siatka kalendarza (`react-big-calendar`), znaczniki wydarzeń, nazwa aktywnej grupy (w `GroupSelector`), przyciski zmiany widoku (Dzień/Tydzień/Miesiąc), link do Sugestii AI, link do "Moje Wydarzenia", linki administracyjne (jeśli użytkownik jest adminem).
*   **Kluczowe komponenty:** `MainLayout`, `TopNavBar`, `GroupSelector`, `CalendarView` (wrapper dla `react-big-calendar`), `EventMarker`.
*   **UX/Dostępność/Bezpieczeństwo:** Standardowa interakcja z kalendarzem. Kliknięcie dnia przenosi do Widoku Dnia. Kliknięcie wydarzenia może otwierać modal z podsumowaniem lub przenosić do Szczegółów Wydarzenia. Kontekst grupy jest jasny dzięki `GroupSelector`. Endpoint API: `GET /groups/{groupId}/events` (z filtrowaniem zakresu dat).

---

**4. Widok Dnia (Day View)**
*   **Ścieżka:** `/groups/{groupId}/calendar/{date}` (np. `/groups/uuid/calendar/2023-11-28`)
*   **Główny cel:** Wyświetlenie listy wydarzeń dla konkretnego dnia w wybranej grupie. Umożliwienie dodania nowego wydarzenia na ten dzień.
*   **Kluczowe informacje:** Wybrana data, lista wydarzeń z podstawowymi informacjami (godzina, tytuł), przycisk "Dodaj Wydarzenie".
*   **Kluczowe komponenty:** `MainLayout`, `EventList`, `EventCard`, `Button` (shadcn, "Dodaj Wydarzenie").
*   **UX/Dostępność/Bezpieczeństwo:** Czytelna lista wydarzeń. Łatwy dostęp do tworzenia nowego wydarzenia. Endpoint API: Dane z `GET /groups/{groupId}/events`.

---

**5. Widok Szczegółów Wydarzenia (Event Details View)**
*   **Ścieżka:** `/events/{eventId}`
*   **Główny cel:** Wyświetlenie pełnych informacji o wydarzeniu i umożliwienie interakcji (dołączenie, opuszczenie, edycja, usunięcie).
*   **Kluczowe informacje:** Tytuł, data, godzina, miejsce, opis, twórca (opcjonalnie), lista uczestników (`AttendeesList`), przycisk Dołącz/Opuść, przycisk Edytuj, przycisk Usuń.
*   **Kluczowe komponenty:** `MainLayout`, `EventDetailsCard`, `AttendeesList`, `Button` (shadcn), `ConfirmationDialog` (shadcn, dla Usuń/Edytuj).
*   **UX/Dostępność/Bezpieczeństwo:** Wszystkie informacje o wydarzeniu w jednym miejscu. Jasne przyciski akcji. Wymagane potwierdzenie dla operacji usuwania i edycji (zgodnie z notatkami, aby zapobiec przypadkowym akcjom). Uprawnienia do edycji/usuwania weryfikowane przez API (RLS), UI jedynie pokazuje przyciski, jeśli użytkownik jest w grupie. Endpointy API: `GET /events/{eventId}`, `GET /events/{eventId}/attendees`, `POST/DELETE /events/{eventId}/attendance`, `PUT /events/{eventId}`, `DELETE /events/{eventId}`.

---

**6. Widok/Modal Formularza Wydarzenia (Event Form View/Modal)**
*   **Ścieżka:** Brak dedykowanej ścieżki (preferowany modal) lub np. `/groups/{groupId}/events/new`, `/events/{eventId}/edit`
*   **Główny cel:** Tworzenie nowego wydarzenia lub edycja istniejącego.
*   **Kluczowe informacje:** Pola formularza (Tytuł, Data, Godzina, Miejsce, Opis), przyciski Zapisz/Anuluj, komunikaty błędów walidacji.
*   **Kluczowe komponenty:** `EventForm`, `Input` (shadcn), `DatePicker` (implementacja TBD lub z shadcn), `TimePicker` (implementacja TBD lub z shadcn), `Textarea` (shadcn), `Button` (shadcn), `ErrorMessage`.
*   **UX/Dostępność/Bezpieczeństwo:** Standardowy formularz. Preferowany modal dla szybszej interakcji. Konieczna walidacja po stronie klienta (np. używając `react-hook-form` lub podobnej biblioteki) oprócz walidacji API. Endpointy API: `POST /groups/{groupId}/events` (tworzenie), `PUT /events/{eventId}` (edycja).

---

**7. Widok Sugestii AI (AI Suggestions View)**
*   **Ścieżka:** `/ai-suggestions`
*   **Główny cel:** Umożliwienie użytkownikowi uzyskania sugestii wydarzeń z zewnętrznego serwisu AI na podstawie podanych kryteriów.
*   **Kluczowe informacje:** Formularz kryteriów (Zakres dat, Lokalizacja, Typ wydarzenia), przycisk "Pobierz Sugestie", lista wyników (sugestii), przycisk "Dodaj do Kalendarza" przy każdej sugestii.
*   **Kluczowe komponenty:** `MainLayout`, `AISuggestionForm`, `DatePicker`, `Input` (shadcn), `Button` (shadcn), `SuggestionList`, `SuggestionCard`, `LoadingOverlay`, `ErrorOverlay`.
*   **UX/Dostępność/Bezpieczeństwo:** Prosty formularz, czytelna lista wyników. Przycisk "Dodaj do Kalendarza" tworzy wydarzenie w *aktualnie wybranej grupie* (z Redux) i ustawia flagę `is_ai_suggestion`. Obsługa stanów ładowania i błędów podczas komunikacji z API AI. Endpoint API: `GET /ai/event-suggestions`, `POST /groups/{activeGroupId}/events`.

---

**8. Widok Moje Wydarzenia (My Events View)**
*   **Ścieżka:** `/my-events`
*   **Główny cel:** Wyświetlenie zagregowanej listy wydarzeń, w których użytkownik bierze udział, ze wszystkich grup, do których należy.
*   **Kluczowe informacje:** Lista wydarzeń (Tytuł, Data, Godzina, Nazwa Grupy), potencjalne filtry/sortowanie (TBD).
*   **Kluczowe komponenty:** `MainLayout`, `EventList`, `EventCard` (rozszerzony o nazwę grupy), `FilterControls` (TBD).
*   **UX/Dostępność/Bezpieczeństwo:** Wymaga doprecyzowania UI/UX oraz potencjalnie dedykowanego endpointu API (np. `GET /users/me/events`) dla efektywności. Obecnie brak endpointu w API Plan.

---

**9. Widok Zarządzania Użytkownikami (Admin - User Management View)**
*   **Ścieżka:** `/admin/users`
*   **Główny cel:** Umożliwienie administratorowi zarządzania kontami użytkowników (listowanie, tworzenie, edycja, usuwanie).
*   **Kluczowe informacje:** Tabela użytkowników (Email, Login, Imię, Nazwisko, Rola), przycisk "Dodaj Użytkownika", akcje Edytuj/Usuń dla każdego użytkownika, paginacja.
*   **Kluczowe komponenty:** `AdminLayout` (lub `MainLayout` z menu admina), `UserTable` (shadcn), `Button` (shadcn), `PaginationControls`, `UserForm` (modal/widok), `ConfirmationDialog` (shadcn, dla Usuń).
*   **UX/Dostępność/Bezpieczeństwo:** Dostęp chroniony przez `ProtectedRoute` (wymaga roli admina). Standardowa tabela administracyjna. Mechanizm przekazania hasła nowemu użytkownikowi nie jest zdefiniowany (Unresolved Issue 2). Endpointy API: `POST/GET/PUT/DELETE /admin/users`.

---

**10. Widok Zarządzania Grupami (Admin - Group Management View)**
*   **Ścieżka:** `/admin/groups`
*   **Główny cel:** Umożliwienie administratorowi zarządzania grupami (listowanie, tworzenie, edycja, usuwanie) oraz inicjowanie zarządzania członkostwem.
*   **Kluczowe informacje:** Tabela grup (Nazwa), przycisk "Dodaj Grupę", akcje Edytuj/Usuń/Zarządzaj Członkami dla każdej grupy, paginacja.
*   **Kluczowe komponenty:** `AdminLayout`, `GroupTable` (shadcn), `Button` (shadcn), `PaginationControls`, `GroupForm` (modal/widok), `ConfirmationDialog` (shadcn, dla Usuń).
*   **UX/Dostępność/Bezpieczeństwo:** Dostęp chroniony przez `ProtectedRoute`. Standardowa tabela administracyjna. Endpointy API: `POST/GET/PUT/DELETE /admin/groups`. Akcja "Zarządzaj Członkami" prowadzi do Widoku Zarządzania Członkami Grupy.

---

**11. Widok/Modal Zarządzania Członkami Grupy (Admin - Group Membership View/Modal)**
*   **Ścieżka:** Brak dedykowanej ścieżki (preferowany modal) lub np. `/admin/groups/{groupId}/members`
*   **Główny cel:** Umożliwienie administratorowi przeglądania, dodawania i usuwania użytkowników z konkretnej grupy.
*   **Kluczowe informacje:** Lista obecnych członków grupy, pole wyszukiwania/wyboru użytkownika do dodania, akcja Usuń Członka dla każdego członka.
*   **Kluczowe komponenty:** `MemberList`, `UserSearchInput` (z autouzupełnianiem), `Button` (shadcn), `ConfirmationDialog` (shadcn, dla Usuń).
*   **UX/Dostępność/Bezpieczeństwo:** Dostęp chroniony przez `ProtectedRoute`. Czytelny interfejs do zarządzania członkami. Endpointy API: `GET /admin/groups/{groupId}/members`, `POST /admin/groups/{groupId}/members`, `DELETE /admin/groups/{groupId}/members/{userId}`.

## 3. Mapa podróży użytkownika

*   **Logowanie i Przegląd Kalendarza:**
    1.  Użytkownik otwiera aplikację -> Widok Logowania (`/login`).
    2.  Wprowadza email i hasło, klika "Zaloguj".
    3.  API (`POST /auth/login`) zwraca sukces (token JWT, dane użytkownika, lista grup). Stan Redux (`user`) jest aktualizowany.
    4.  Jeśli użytkownik ma >1 grupę -> Przekierowanie do Widoku Wyboru Grupy (`/groups`).
    5.  Użytkownik klika na nazwę grupy.
    6.  `activeGroupId` w Redux jest ustawiane -> Przekierowanie do Widoku Kalendarza Grupy (`/groups/{groupId}/calendar`).
    7.  Jeśli użytkownik ma 1 grupę -> `activeGroupId` jest ustawiane automatycznie -> Przekierowanie bezpośrednio do Widoku Kalendarza Grupy (`/groups/{groupId}/calendar`).
    8.  Użytkownik widzi kalendarz z wydarzeniami dla wybranej grupy. Może zmieniać widok (Dzień/Tydzień/Miesiąc).
*   **Tworzenie Wydarzenia:**
    1.  Z Widoku Kalendarza Grupy (`/groups/{groupId}/calendar`), użytkownik klika na wybrany dzień.
    2.  Przechodzi do Widoku Dnia (`/groups/{groupId}/calendar/{date}`).
    3.  Klika przycisk "Dodaj Wydarzenie".
    4.  Otwiera się Modal Formularza Wydarzenia (`EventForm`).
    5.  Wypełnia pola (tytuł, godzina, miejsce, opis - data jest pre-wypełniona).
    6.  Klika "Zapisz".
    7.  Wysyłane jest zapytanie API (`POST /groups/{groupId}/events`).
    8.  Po sukcesie modal jest zamykany, lista wydarzeń w Widoku Dnia (lub Kalendarza) jest odświeżana.
*   **Dołączanie do Wydarzenia:**
    1.  Z Widoku Kalendarza Grupy lub Widoku Dnia, użytkownik klika na wydarzenie.
    2.  Przechodzi do Widoku Szczegółów Wydarzenia (`/events/{eventId}`).
    3.  Klika przycisk "Dołącz".
    4.  Wysyłane jest zapytanie API (`POST /events/{eventId}/attendance`).
    5.  Po sukcesie przycisk zmienia się na "Opuść", lista uczestników jest aktualizowana.
*   **Korzystanie z Sugestii AI:**
    1.  Z dowolnego widoku chronionego, użytkownik klika "Sugestie Wydarzeń" w `TopNavBar`.
    2.  Przechodzi do Widoku Sugestii AI (`/ai-suggestions`).
    3.  Wypełnia formularz kryteriów (daty, lokalizacja, typ).
    4.  Klika "Pobierz Sugestie".
    5.  Wyświetlany jest `LoadingOverlay`. Wysyłane jest zapytanie API (`GET /ai/event-suggestions`).
    6.  Po otrzymaniu odpowiedzi (lub błędzie/braku wyników), `LoadingOverlay` znika, wyświetlana jest lista sugestii (lub komunikat).
    7.  Użytkownik znajduje interesującą sugestię i klika "Dodaj do Kalendarza".
    8.  Wysyłane jest zapytanie API (`POST /groups/{activeGroupId}/events`) z danymi sugestii i `is_ai_suggestion: true`.
    9.  Po sukcesie użytkownik widzi potwierdzenie (np. krótki toast/snackbar), pozostaje na widoku sugestii. Wydarzenie pojawia się w kalendarzu aktywnej grupy.

## 4. Układ i struktura nawigacji

*   **Główny Układ (`MainLayout`):** Stosowany dla wszystkich widoków po zalogowaniu. Składa się z:
    *   Górnego paska nawigacyjnego (`TopNavBar`).
    *   Głównego obszaru treści, gdzie renderowany jest aktualny widok (zgodnie z routingiem).
*   **Górny Pasek Nawigacyjny (`TopNavBar`):**
    *   Logo/Nazwa Aplikacji (Link do `/` lub `/groups/{activeGroupId}/calendar`).
    *   `GroupSelector` (Dropdown): Widoczny, jeśli użytkownik należy do >1 grupy. Wyświetla nazwę aktywnej grupy i pozwala wybrać inną (aktualizuje stan Redux).
    *   Linki nawigacyjne:
        *   "Kalendarz" (`/groups/{activeGroupId}/calendar`)
        *   "Moje Wydarzenia" (`/my-events`)
        *   "Sugestie Wydarzeń" (`/ai-suggestions`)
    *   Menu/Dropdown "Admin" (Widoczne tylko dla roli Admin):
        *   "Zarządzanie Użytkownikami" (`/admin/users`)
        *   "Zarządzanie Grupami" (`/admin/groups`)
    *   Przycisk "Wyloguj" (czyści stan Redux, przekierowuje do `/login`).
*   **Routing (`react-router-dom`):**
    *   Definiuje ścieżki dla wszystkich widoków.
    *   Wykorzystuje `ProtectedRoute` do ochrony widoków wymagających uwierzytelnienia i/lub roli admina, sprawdzając stan w Redux (`user.isAuthenticated`, `user.role`).
    *   Implementuje logikę przekierowań (np. po logowaniu, przy próbie dostępu do chronionej strony bez uwierzytelnienia, przy wygaśnięciu JWT).

## 5. Kluczowe komponenty

*   **`MainLayout`**: Podstawowy szablon strony dla zalogowanych użytkowników, zawiera `TopNavBar`.
*   **`TopNavBar`**: Górny pasek nawigacyjny z linkami, selektorem grupy i opcjami użytkownika/admina.
*   **`GroupSelector`**: Komponent dropdown (z `shadcn/ui`) do wyboru aktywnej grupy.
*   **`ProtectedRoute`**: Komponent wyższego rzędu lub wrapper do ochrony ścieżek routingu.
*   **`CalendarView`**: Komponent integrujący i konfigurujący `react-big-calendar`.
*   **`EventList` / `EventCard`**: Komponenty do wyświetlania list wydarzeń (np. w Widoku Dnia, Moje Wydarzenia).
*   **`EventDetailsCard`**: Komponent wyświetlający pełne informacje o wydarzeniu.
*   **`AttendeesList`**: Komponent wyświetlający listę uczestników wydarzenia.
*   **`EventForm`**: Reużywalny formularz do tworzenia i edycji wydarzeń (potencjalnie używający `react-hook-form`).
*   **`AISuggestionForm` / `SuggestionList` / `SuggestionCard`**: Komponenty dla widoku sugestii AI.
*   **`UserTable` / `GroupTable` / `MemberList`**: Reużywalne tabele (`shadcn/ui`) dla widoków administracyjnych.
*   **`PaginationControls`**: Przyciski do nawigacji po stronach w listach/tabelach.
*   **`LoadingOverlay` / `ErrorOverlay`**: Pełnoekranowe komponenty do sygnalizowania stanu ładowania lub błędów API.
*   **`ConfirmationDialog`**: Modal (`shadcn/ui`) do potwierdzania krytycznych akcji (np. usuwania).
*   Komponenty z **`shadcn/ui`**: `Button`, `Input`, `DropdownMenu`, `Dialog`, `Table`, `Card`, `Textarea`, itp. używane do budowy interfejsu. 