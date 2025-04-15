# Schemat Bazy Danych PostgreSQL - Kalendarz Grupowy AI

## 1. Lista tabel z ich kolumnami, typami danych i ograniczeniami

```sql
-- Rozszerzenie do generowania UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Funkcja do automatycznej aktualizacji kolumny updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tabela Ról
CREATE TABLE roles (
    role_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_name VARCHAR(50) UNIQUE NOT NULL -- np. 'standard', 'admin'
);

-- Tabela Użytkowników
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    login VARCHAR(100) NOT NULL, -- Bez ograniczenia UNIQUE zgodnie z decyzją
    password_hash VARCHAR(255) NOT NULL, -- Dodano pole na hasło (niezbędne do logowania)
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role_id UUID NOT NULL REFERENCES roles(role_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger dla tabeli users do aktualizacji updated_at
CREATE TRIGGER set_timestamp_users
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Tabela Grup
CREATE TABLE groups (
    group_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger dla tabeli groups do aktualizacji updated_at
CREATE TRIGGER set_timestamp_groups
BEFORE UPDATE ON groups
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Tabela Wydarzeń
CREATE TABLE events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(group_id) ON DELETE CASCADE,
    creator_user_id UUID REFERENCES users(user_id) ON DELETE SET NULL, -- Może być NULL, jeśli twórca zostanie usunięty
    title VARCHAR(255) NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    place VARCHAR(255),
    description TEXT,
    is_ai_suggestion BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger dla tabeli events do aktualizacji updated_at
CREATE TRIGGER set_timestamp_events
BEFORE UPDATE ON events
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Tabela Członkostw w Grupach (tabela łącząca users i groups)
CREATE TABLE group_memberships (
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES groups(group_id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, group_id) -- Złożony klucz główny
);

-- Tabela Uczestnictwa w Wydarzeniach (tabela łącząca users i events)
CREATE TABLE event_attendance (
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, event_id) -- Złożony klucz główny
);

2. Relacje między tabelami

users 1:* roles (Każdy użytkownik ma jedną rolę, rola może mieć wielu użytkowników) - Realizowane przez users.role_id FK.

users N:M groups (Użytkownik może należeć do wielu grup, grupa może mieć wielu użytkowników) - Realizowane przez tabelę łączącą group_memberships.

groups 1:* events (Grupa może mieć wiele wydarzeń, wydarzenie należy do jednej grupy) - Realizowane przez events.group_id FK.

users 1:* events (Użytkownik może być twórcą wielu wydarzeń, wydarzenie ma jednego twórcę - lub NULL) - Realizowane przez events.creator_user_id FK.

users N:M events (Użytkownik może uczestniczyć w wielu wydarzeniach, wydarzenie może mieć wielu uczestników) - Realizowane przez tabelę łączącą event_attendance.

3. Indeksy

Oprócz indeksów automatycznie tworzonych dla kluczy głównych i ograniczeń UNIQUE:

-- Indeksy dla kluczy obcych (poprawiają wydajność JOIN i egzekwowanie FK)
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_events_group_id ON events(group_id);
CREATE INDEX idx_events_creator_user_id ON events(creator_user_id);
CREATE INDEX idx_group_memberships_user_id ON group_memberships(user_id);
CREATE INDEX idx_group_memberships_group_id ON group_memberships(group_id);
CREATE INDEX idx_event_attendance_user_id ON event_attendance(user_id);
CREATE INDEX idx_event_attendance_event_id ON event_attendance(event_id);

-- Indeksy dla często filtrowanych/sortowanych kolumn
CREATE INDEX idx_users_email ON users(email); -- Już objęty przez UNIQUE, ale jawne dodanie nie zaszkodzi
CREATE INDEX idx_events_start_time ON events(start_time); -- Kluczowe dla widoków kalendarza
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
SQL
IGNORE_WHEN_COPYING_END
4. Zasady PostgreSQL (Row-Level Security - RLS)
-- Włączenie RLS dla odpowiednich tabel
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendance ENABLE ROW LEVEL SECURITY;
-- Tabela users i roles zwykle nie wymagają RLS w tym modelu,
-- dostęp do nich jest zarządzany na poziomie aplikacji/API,
-- ale jeśli zajdzie potrzeba, można je również włączyć.

-- Funkcje pomocnicze (wymagają implementacji mechanizmu ustawiania w backendzie)
-- UWAGA: Implementacja tych funkcji jest przykładowa i zależy od sposobu
-- przekazywania kontekstu użytkownika (np. przez `SET LOCAL ...`)
CREATE OR REPLACE FUNCTION current_user_id() RETURNS UUID AS $$
BEGIN
  RETURN current_setting('request.jwt.claim.sub', true)::UUID; -- Przykład dla JWT w Supabase/PostgREST
  -- Alternatywnie: RETURN current_setting('myapp.user_id', true)::UUID; -- Jeśli używasz SET LOCAL
EXCEPTION
  WHEN others THEN
    RETURN NULL; -- lub rzuć błąd, jeśli użytkownik musi być zawsze zdefiniowany
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION current_user_role() RETURNS VARCHAR AS $$
DECLARE
  role_name_var VARCHAR;
BEGIN
  -- Pobierz role_id na podstawie user_id
  SELECT r.role_name INTO role_name_var
  FROM users u JOIN roles r ON u.role_id = r.role_id
  WHERE u.user_id = current_user_id();
  RETURN role_name_var;
EXCEPTION
  WHEN others THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Polityki dla tabeli groups
CREATE POLICY "Allow admin full access on groups" ON groups FOR ALL
    USING (current_user_role() = 'admin');
CREATE POLICY "Allow members read access on their groups" ON groups FOR SELECT
    USING (EXISTS (SELECT 1 FROM group_memberships WHERE group_id = groups.group_id AND user_id = current_user_id()));
-- INSERT/UPDATE/DELETE grup tylko przez admina (zgodnie z PRD)

-- Polityki dla tabeli group_memberships
CREATE POLICY "Allow admin full access on group_memberships" ON group_memberships FOR ALL
    USING (current_user_role() = 'admin');
CREATE POLICY "Allow users to read their own memberships" ON group_memberships FOR SELECT
    USING (user_id = current_user_id());
-- INSERT/DELETE członkostw tylko przez admina (zgodnie z PRD)

-- Polityki dla tabeli events
CREATE POLICY "Allow admin full access on events" ON events FOR ALL
    USING (current_user_role() = 'admin');
CREATE POLICY "Allow group members to access events in their groups" ON events FOR ALL -- Obejmuje SELECT, INSERT, UPDATE, DELETE
    USING (EXISTS (SELECT 1 FROM group_memberships WHERE group_id = events.group_id AND user_id = current_user_id()));
    -- WITH CHECK zapewnia, że nowe wydarzenia są tworzone tylko w grupach, do których użytkownik należy
    -- UWAGA: Ta polityka implementuje ryzykowne wymaganie, że KAŻDY członek grupy może edytować/usuwać wydarzenia.

-- Polityki dla tabeli event_attendance
CREATE POLICY "Allow admin full access on event_attendance" ON event_attendance FOR ALL
    USING (current_user_role() = 'admin');
CREATE POLICY "Allow users to manage attendance for events in their groups" ON event_attendance FOR ALL
    USING (
        -- Użytkownik musi należeć do grupy, w której jest wydarzenie
        EXISTS (
            SELECT 1
            FROM events e
            JOIN group_memberships gm ON e.group_id = gm.group_id
            WHERE e.event_id = event_attendance.event_id AND gm.user_id = current_user_id()
        )
        AND
        -- Użytkownik może zarządzać tylko własnym uczestnictwem
        user_id = current_user_id()
    );
CREATE POLICY "Allow group members to see attendance for events in their groups" ON event_attendance FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM events e
            JOIN group_memberships gm ON e.group_id = gm.group_id
            WHERE e.event_id = event_attendance.event_id AND gm.user_id = current_user_id()
        )
    );
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
SQL
IGNORE_WHEN_COPYING_END
5. Wszelkie dodatkowe uwagi lub wyjaśnienia dotyczące decyzji projektowych

Limity VARCHAR: W powyższym schemacie założono przykładowe limity dla VARCHAR (np. 255, 100, 50). Należy je dostosować do rzeczywistych potrzeb aplikacji.

Hasła Użytkowników: Dodano kolumnę password_hash do tabeli users, która jest niezbędna do implementacji logowania (US-001). Należy używać silnych algorytmów haszujących (np. bcrypt, Argon2).

Kontekst RLS: Implementacja RLS wymaga, aby backend (Express.js) poprawnie ustawiał kontekst sesji dla każdego zapytania do bazy danych (np. poprzez SET LOCAL myapp.user_id = '...'). Sposób implementacji funkcji current_user_id() i current_user_role() zależy od wybranego mechanizmu przekazywania kontekstu.

Ryzyko Uprawnień: Zgodnie z decyzją, polityka RLS dla tabeli events zezwala każdemu członkowi grupy na edycję i usuwanie wszystkich wydarzeń w tej grupie. Jest to znaczące ryzyko dla integralności danych i powinno być jasno komunikowane oraz potencjalnie monitorowane.

Trigger updated_at: Załączono definicję funkcji i przykładowe triggery dla automatycznej aktualizacji updated_at.

IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
IGNORE_WHEN_COPYING_END