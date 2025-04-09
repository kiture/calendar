# Dokument wymagań produktu (PRD) - Kalendarz Grupowy AI

## 1. Przegląd produktu

Kalendarz Grupowy AI to aplikacja webowa zaprojektowana w celu ułatwienia koordynacji i synchronizacji wydarzeń w ramach zdefiniowanych grup użytkowników. Aplikacja umożliwia tworzenie, przeglądanie, edycję i usuwanie wydarzeń grupowych. Kluczową funkcją jest integracja ze sztuczną inteligencją (AI), która dostarcza użytkownikom sugestie interesujących wydarzeń w ich okolicy na podstawie zdefiniowanych kryteriów. Celem Minimum Viable Product (MVP) jest dostarczenie podstawowej funkcjonalności kalendarza grupowego wraz z mechanizmem sugestii AI, działającego w przeglądarce internetowej. Grupy i użytkownicy są zarządzani centralnie przez administratora aplikacji. Aplikacja skierowana jest do ogólnych użytkowników, bez specyficznych ograniczeń demograficznych, którzy potrzebują lepszego narzędzia do planowania wspólnych aktywności w zamkniętych kręgach znajomych, współpracowników lub członków organizacji.

## 2. Problem użytkownika

Głównym problemem, który aplikacja ma rozwiązać, jest trudność w efektywnym koordynowaniu wspólnych wydarzeń i synchronizowaniu kalendarzy w grupach osób. Obecne narzędzia często nie zapewniają wystarczającej widoczności planów innych członków grupy, co prowadzi do konfliktów terminów i nieporozumień. Użytkownicy doświadczają frustracji związanej z brakiem informacji o zajętości innych osób przy próbie organizacji spotkania czy wspólnego wyjścia. Dodatkowo, użytkownicy często zapominają o zaplanowanych wydarzeniach (zarówno własnych, jak i grupowych) oraz mają trudności ze znalezieniem interesujących aktywności czy wydarzeń kulturalnych w swojej okolicy, które mogłyby zainteresować całą grupę.

Aplikacja ma na celu:
*   Ułatwić planowanie wydarzeń poprzez współdzielony kalendarz grupowy.
*   Zapewnić centralne miejsce do zarządzania wydarzeniami grupy.
*   Działać jako przypominajka (poprzez widoczność w kalendarzu) o nadchodzących wydarzeniach.
*   Insprować użytkowników do uczestnictwa w lokalnych wydarzeniach poprzez sugestie AI.

## 3. Wymagania funkcjonalne

Poniżej znajduje się lista wymagań funkcjonalnych dla wersji MVP aplikacji:

3.1. Zarządzanie Użytkownikami (Rola: Administrator)
    *   Możliwość tworzenia nowych kont użytkowników (wymaga zdefiniowania sposobu przekazania danych logowania).
    *   Możliwość edycji danych istniejących użytkowników.
    *   Możliwość usuwania kont użytkowników.

3.2. Zarządzanie Grupami (Rola: Administrator)
    *   Możliwość tworzenia nowych grup.
    *   Możliwość edycji nazw/opisów istniejących grup.
    *   Możliwość usuwania grup.
    *   Możliwość przypisywania użytkowników do jednej lub wielu grup.
    *   Możliwość usuwania użytkowników z grup.
    *   (Wymaga zdefiniowania interfejsu administratora - czy jest to osobny panel, czy część głównej aplikacji).

3.3. Uwierzytelnianie i Autoryzacja
    *   Użytkownicy muszą móc zalogować się do aplikacji przy użyciu danych uwierzytelniających (sposób dostarczenia danych TBD).
    *   System musi rozróżniać role: Użytkownik Standardowy i Administrator (z różnymi uprawnieniami).

3.4. Widoki Kalendarza (Rola: Użytkownik Standardowy, Administrator)
    *   Możliwość przeglądania kalendarza w widoku dziennym.
    *   Możliwość przeglądania kalendarza w widoku tygodniowym.
    *   Możliwość przeglądania kalendarza w widoku miesięcznym.
    *   Wydarzenia wyświetlane w kalendarzu muszą być filtrowane na podstawie aktualnie wybranej grupy przez użytkownika (wymaga zdefiniowania mechanizmu wyboru/przełączania grup, jeśli użytkownik może należeć do wielu).

3.5. Zarządzanie Wydarzeniami (Rola: Użytkownik Standardowy, Administrator)
    *   Tworzenie nowego wydarzenia z następującymi polami: Tytuł, Data (dzień), Godzina rozpoczęcia, Miejsce (tekstowe), Opis (tekstowe). Wydarzenie jest przypisane do konkretnej grupy.
    *   Przeglądanie szczegółów istniejącego wydarzenia.
    *   Możliwość dołączenia ("przypisania się") do wydarzenia przez użytkownika należącego do grupy.
    *   Możliwość opuszczenia ("odpisania się") od wydarzenia przez użytkownika.
    *   Edycja istniejącego wydarzenia (pola: Tytuł, Data, Godzina, Miejsce, Opis) przez DOWOLNEGO członka grupy, do której wydarzenie jest przypisane. (Uwaga: Wysokie ryzyko przypadkowych zmian/utraty danych).
    *   Usunięcie istniejącego wydarzenia przez DOWOLNEGO członka grupy, do której wydarzenie jest przypisane. (Uwaga: Wysokie ryzyko przypadkowego usunięcia).
    *   (Wymaga zdefiniowania, czy lista uczestników jest widoczna dla innych).

3.6. Sugestie Wydarzeń AI (Rola: Użytkownik Standardowy, Administrator)
    *   Dedykowany interfejs umożliwiający użytkownikowi wprowadzenie kryteriów wyszukiwania wydarzeń: Okres (np. zakres dat), Miejsce (np. miasto), Charakterystyka/Typ wydarzenia (np. koncert, teatr, sport). (Wymaga uszczegółowienia filtrów).
    *   Integracja z zewnętrznym API AI (np. ChatGPT) w celu pobrania listy sugerowanych wydarzeń na podstawie podanych kryteriów.
    *   Wyświetlenie listy sugerowanych wydarzeń użytkownikowi.
    *   Możliwość wybrania przez użytkownika jednego lub więcej sugerowanych wydarzeń i dodania ich do kalendarza wybranej grupy jako nowe wydarzenie (z pre-wypełnionymi danymi, jeśli API je dostarcza).
    *   Obsługa błędów komunikacji z API AI lub braku wyników.

3.7. Prywatność
    *   Dane wydarzenia są widoczne tylko dla użytkowników należących do grupy, do której wydarzenie jest przypisane.
    *   Użytkownik widzi tylko te grupy, do których został przypisany przez administratora.

## 4. Granice produktu

Funkcje i cechy wchodzące w zakres MVP:
*   Wszystkie funkcje opisane w sekcji 3. Wymagania funkcjonalne.
*   Aplikacja dostępna wyłącznie jako aplikacja webowa.
*   Ręczne zarządzanie użytkownikami i grupami przez administratora.
*   Podstawowe pola wydarzeń (tytuł, data, godzina, miejsce, opis).
*   Mechanizm dołączania/opuszczania wydarzeń przez użytkowników.
*   Integracja z AI dla sugestii wydarzeń.

Funkcje i cechy wyłączone z zakresu MVP (Out of Scope):
*   Aplikacje mobilne (iOS, Android).
*   System powiadomień (w aplikacji, push, email).
*   Funkcje zaawansowane kalendarza (np. wydarzenia cykliczne, zaproszenia dla osób spoza aplikacji, strefy czasowe, integracja z zewnętrznymi kalendarzami).
*   Możliwość dodawania załączników do wydarzeń.
*   Definiowanie szczegółowych statusów wydarzeń (np. Potwierdzone, Anulowane, Wstępne).
*   Automatyczne wykrywanie i sygnalizowanie konfliktów w kalendarzu.
*   Możliwość samodzielnej rejestracji użytkowników.
*   System zapraszania nowych użytkowników przez istniejących.
*   Zaawansowana personalizacja profilu użytkownika lub ustawień aplikacji.
*   Zaawansowane narzędzia analityczne i raportowe dla administratora.
*   Wyszukiwanie wydarzeń w kalendarzu.
*   Komentarze lub dyskusje pod wydarzeniami.

## 5. Historyjki użytkowników

Poniżej znajdują się historyjki użytkowników opisujące interakcje z aplikacją w wersji MVP.

---
ID: US-001
Tytuł: Logowanie użytkownika
Opis: Jako zarejestrowany użytkownik (Standardowy lub Admin), chcę móc zalogować się do aplikacji przy użyciu moich danych uwierzytelniających, aby uzyskać dostęp do moich kalendarzy grupowych.
Kryteria akceptacji:
*   Istnieje strona logowania z polami na login (np. email) i hasło.
*   Po podaniu poprawnych danych użytkownik zostaje zalogowany i przekierowany do głównego widoku aplikacji (np. widoku kalendarza).
*   Po podaniu niepoprawnych danych użytkownik widzi komunikat błędu i pozostaje na stronie logowania.
*   Sesja użytkownika jest utrzymywana po zalogowaniu.
*   (Niejawne: Musi istnieć mechanizm ustawienia/przekazania pierwszego hasła przez admina).

---
ID: US-002
Tytuł: Wylogowanie użytkownika
Opis: Jako zalogowany użytkownik, chcę móc się wylogować z aplikacji, aby zakończyć moją sesję.
Kryteria akceptacji:
*   Istnieje przycisk/link "Wyloguj".
*   Po kliknięciu "Wyloguj" sesja użytkownika jest kończona i jest on przekierowywany na stronę logowania.

---
ID: US-003
Tytuł: Tworzenie nowego użytkownika (Admin)
Opis: Jako Administrator, chcę móc stworzyć nowe konto użytkownika w systemie, podając jego podstawowe dane, abym mógł nadać mu dostęp do aplikacji.
Kryteria akceptacji:
*   Istnieje interfejs (w panelu admina lub zintegrowany) umożliwiający dodanie nowego użytkownika.
*   Wymagane jest podanie co najmniej loginu/emaila dla nowego użytkownika.
*   System generuje/pozwala ustawić tymczasowe hasło lub mechanizm aktywacji (TBD).
*   Nowo utworzony użytkownik pojawia się na liście użytkowników zarządzanych przez admina.

---
ID: US-004
Tytuł: Edycja użytkownika (Admin)
Opis: Jako Administrator, chcę móc edytować dane istniejącego użytkownika, aby zaktualizować jego informacje.
Kryteria akceptacji:
*   Istnieje możliwość wybrania użytkownika z listy i przejścia do formularza edycji.
*   Możliwa jest zmiana danych użytkownika (np. email, status, przypisane grupy - zależnie od projektu).
*   Zmiany są zapisywane w systemie.

---
ID: US-005
Tytuł: Usuwanie użytkownika (Admin)
Opis: Jako Administrator, chcę móc usunąć konto użytkownika, aby odebrać mu dostęp do aplikacji.
Kryteria akceptacji:
*   Istnieje możliwość wybrania użytkownika z listy i zainicjowania procesu usuwania.
*   System prosi o potwierdzenie operacji usunięcia.
*   Po potwierdzeniu konto użytkownika jest usuwane z systemu.

---
ID: US-006
Tytuł: Tworzenie nowej grupy (Admin)
Opis: Jako Administrator, chcę móc stworzyć nową grupę, podając jej nazwę, abym mógł później przypisać do niej użytkowników i wydarzenia.
Kryteria akceptacji:
*   Istnieje interfejs umożliwiający dodanie nowej grupy.
*   Wymagane jest podanie nazwy grupy.
*   Nowo utworzona grupa pojawia się na liście grup zarządzanych przez admina.

---
ID: US-007
Tytuł: Edycja grupy (Admin)
Opis: Jako Administrator, chcę móc edytować nazwę istniejącej grupy.
Kryteria akceptacji:
*   Istnieje możliwość wybrania grupy z listy i przejścia do formularza edycji.
*   Możliwa jest zmiana nazwy grupy.
*   Zmiany są zapisywane w systemie.

---
ID: US-008
Tytuł: Usuwanie grupy (Admin)
Opis: Jako Administrator, chcę móc usunąć istniejącą grupę.
Kryteria akceptacji:
*   Istnieje możliwość wybrania grupy z listy i zainicjowania procesu usuwania.
*   System prosi o potwierdzenie operacji usunięcia.
*   Po potwierdzeniu grupa jest usuwana z systemu (należy zdefiniować co dzieje się z wydarzeniami tej grupy).

---
ID: US-009
Tytuł: Przypisywanie użytkownika do grupy (Admin)
Opis: Jako Administrator, chcę móc przypisać istniejącego użytkownika do jednej lub więcej grup, aby mógł on widzieć i uczestniczyć w wydarzeniach tej grupy.
Kryteria akceptacji:
*   Istnieje interfejs pozwalający wybrać użytkownika i grupę (lub odwrotnie).
*   Możliwe jest dodanie powiązania użytkownik-grupa.
*   Użytkownik po zalogowaniu widzi grupy, do których został przypisany.

---
ID: US-010
Tytuł: Usuwanie użytkownika z grupy (Admin)
Opis: Jako Administrator, chcę móc usunąć użytkownika z grupy, aby nie miał on już dostępu do jej zawartości.
Kryteria akceptacji:
*   Istnieje interfejs pozwalający wybrać użytkownika i grupę (lub powiązanie).
*   Możliwe jest usunięcie powiązania użytkownik-grupa.
*   Użytkownik po wylogowaniu i zalogowaniu (lub odświeżeniu) nie widzi już grupy, z której został usunięty.

---
ID: US-011
Tytuł: Przeglądanie kalendarza grupy (Użytkownik)
Opis: Jako zalogowany użytkownik, chcę móc przeglądać kalendarz wybranej grupy w widoku dziennym, tygodniowym i miesięcznym, aby zobaczyć zaplanowane wydarzenia.
Kryteria akceptacji:
*   Dostępny jest widok kalendarza.
*   Możliwe jest przełączanie między widokiem Dziennym, Tygodniowym i Miesięcznym.
*   Jeśli użytkownik należy do wielu grup, istnieje mechanizm wyboru grupy, której kalendarz jest aktualnie wyświetlany (TBD).
*   Wydarzenia przypisane do wybranej grupy są poprawnie wyświetlane w odpowiednich dniach/godzinach kalendarza.

---
ID: US-012
Tytuł: Tworzenie nowego wydarzenia (Użytkownik)
Opis: Jako członek grupy, chcę móc dodać nowe wydarzenie do kalendarza grupy, podając jego szczegóły (tytuł, data, godzina, miejsce, opis), aby poinformować innych członków grupy.
Kryteria akceptacji:
*   Istnieje przycisk/opcja "Dodaj wydarzenie".
*   Wyświetla się formularz z polami: Tytuł, Data, Godzina, Miejsce, Opis.
*   Po wypełnieniu i zapisaniu formularza, nowe wydarzenie jest tworzone i przypisywane do aktualnie wybranej grupy.
*   Nowe wydarzenie pojawia się w widoku kalendarza dla wszystkich członków tej grupy.

---
ID: US-013
Tytuł: Przeglądanie szczegółów wydarzenia (Użytkownik)
Opis: Jako członek grupy, chcę móc kliknąć na wydarzenie w kalendarzu, aby zobaczyć jego pełne szczegóły (tytuł, data, godzina, miejsce, opis).
Kryteria akceptacji:
*   Kliknięcie na wydarzenie w kalendarzu otwiera widok szczegółów (np. modal, osobna strona).
*   Wyświetlane są wszystkie zapisane informacje o wydarzeniu.
*   Widoczne są opcje interakcji (np. Dołącz/Opuść, Edytuj, Usuń).

---
ID: US-014
Tytuł: Dołączanie do wydarzenia (Użytkownik)
Opis: Jako członek grupy, chcę móc oznaczyć, że wezmę udział w wydarzeniu ("dołączyć"), aby inni wiedzieli, że planuję uczestniczyć.
Kryteria akceptacji:
*   W widoku szczegółów wydarzenia (lub bezpośrednio w kalendarzu) znajduje się przycisk/opcja "Dołącz".
*   Po kliknięciu "Dołącz", system zapisuje informację o moim uczestnictwie.
*   Przycisk zmienia status (np. na "Opuść" lub wskazuje na uczestnictwo).
*   (Opcjonalnie) Moje imię/identyfikator pojawia się na liście uczestników (jeśli jest implementowana).

---
ID: US-015
Tytuł: Opuszczanie wydarzenia (Użytkownik)
Opis: Jako członek grupy, który wcześniej dołączył do wydarzenia, chcę móc oznaczyć, że jednak nie wezmę udziału ("opuścić"), aby zaktualizować swój status.
Kryteria akceptacji:
*   Jeśli użytkownik dołączył do wydarzenia, widoczny jest przycisk/opcja "Opuść".
*   Po kliknięciu "Opuść", system usuwa informację o moim uczestnictwie.
*   Przycisk zmienia status (np. na "Dołącz").
*   (Opcjonalnie) Moje imię/identyfikator znika z listy uczestników.

---
ID: US-016
Tytuł: Edycja wydarzenia (Użytkownik)
Opis: Jako członek grupy, chcę móc edytować szczegóły istniejącego wydarzenia w mojej grupie, aby poprawić błędy lub zaktualizować informacje. (Uwaga: Uprawnienie dla każdego członka grupy).
Kryteria akceptacji:
*   W widoku szczegółów wydarzenia znajduje się przycisk/opcja "Edytuj".
*   Kliknięcie "Edytuj" otwiera formularz z aktualnymi danymi wydarzenia (Tytuł, Data, Godzina, Miejsce, Opis).
*   Użytkownik może zmodyfikować dowolne z tych pól.
*   Po zapisaniu zmian, wydarzenie w kalendarzu jest zaktualizowane dla wszystkich członków grupy.

---
ID: US-017
Tytuł: Usuwanie wydarzenia (Użytkownik)
Opis: Jako członek grupy, chcę móc usunąć istniejące wydarzenie z kalendarza grupy. (Uwaga: Uprawnienie dla każdego członka grupy).
Kryteria akceptacji:
*   W widoku szczegółów wydarzenia znajduje się przycisk/opcja "Usuń".
*   System prosi o potwierdzenie operacji usunięcia.
*   Po potwierdzeniu, wydarzenie jest trwale usuwane z kalendarza grupy.

---
ID: US-018
Tytuł: Wyszukiwanie sugestii wydarzeń AI (Użytkownik)
Opis: Jako użytkownik, chcę móc skorzystać z funkcji sugestii AI, podając kryteria (okres, miejsce, typ), aby otrzymać listę interesujących wydarzeń w okolicy.
Kryteria akceptacji:
*   Istnieje dedykowany interfejs (np. przycisk, sekcja) do uruchomienia funkcji sugestii AI.
*   Użytkownik może wprowadzić lub wybrać: zakres dat/okres, lokalizację (np. miasto), typ/charakterystykę wydarzenia.
*   Po zatwierdzeniu kryteriów, aplikacja wysyła zapytanie do zewnętrznego API AI.
*   Aplikacja wyświetla listę otrzymanych sugestii w czytelny sposób (np. tytuł, data, krótki opis).
*   Jeśli API zwróci błąd lub brak wyników, użytkownik widzi odpowiedni komunikat.

---
ID: US-019
Tytuł: Dodawanie sugerowanego wydarzenia AI do kalendarza (Użytkownik)
Opis: Jako użytkownik, przeglądając listę sugestii AI, chcę móc wybrać interesujące mnie wydarzenie i dodać je bezpośrednio do kalendarza wybranej grupy.
Kryteria akceptacji:
*   Przy każdej sugestii na liście znajduje się przycisk/opcja "Dodaj do kalendarza" (lub podobny).
*   Po kliknięciu "Dodaj", aplikacja tworzy nowe wydarzenie w wybranej grupie, pre-wypełniając dane na podstawie informacji z sugestii AI (tytuł, data, miejsce itp., jeśli dostępne).
*   Użytkownik może zostać przekierowany do edycji nowo utworzonego wydarzenia, aby uzupełnić/zmodyfikować dane.
*   Nowe wydarzenie pojawia się w kalendarzu grupy.

---

## 6. Metryki sukcesu

Sukces MVP będzie mierzony za pomocą następujących kluczowych wskaźników (KPIs):

6.1. Główny wskaźnik (Zdefiniowany):
    *   Liczba wydarzeń tworzonych tygodniowo na grupę: Suma wydarzeń dodanych manualnie oraz tych dodanych na podstawie sugestii AI, podzielona przez liczbę aktywnych grup. Cel: Monitorowanie podstawowej aktywności tworzenia treści.

6.2. Wskaźniki zaangażowania (Zalecane do śledzenia):
    *   Tygodniowa liczba aktywnych użytkowników (WAU - Weekly Active Users): Liczba unikalnych użytkowników, którzy zalogowali się do aplikacji co najmniej raz w ciągu tygodnia. Cel: Pomiar ogólnego zainteresowania i użytkowania aplikacji.
    *   Średnia liczba dołączeń do wydarzeń na aktywnego użytkownika tygodniowo: Całkowita liczba akcji "Dołącz" wykonanych przez użytkowników w tygodniu, podzielona przez WAU. Cel: Pomiar interakcji użytkowników z kluczową funkcją wydarzeń.

6.3. Wskaźniki retencji (Zalecane do śledzenia):
    *   Retencja użytkowników po 1 tygodniu: Procent użytkowników, którzy wrócili do aplikacji w ciągu 7 dni od pierwszego użycia/rejestracji. Cel: Ocena początkowej wartości aplikacji dla użytkowników.
    *   Retencja użytkowników po 1 miesiącu: Procent użytkowników, którzy nadal korzystają z aplikacji po miesiącu od pierwszego użycia/rejestracji. Cel: Ocena długoterminowej wartości i przywiązania do produktu.

Cele liczbowe dla tych wskaźników zostaną ustalone przed uruchomieniem MVP i będą monitorowane w celu oceny jego przyjęcia na rynku oraz planowania dalszego rozwoju.