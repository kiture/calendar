# Schemat Bazy Danych PostgreSQL - Kalendarz Grupowy AI

## 1. Tabele i Funkcje Pomocnicze

### Rozszerzenia
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Funkcje Pomocnicze

```sql
-- Funkcja do automatycznej aktualizacji kolumny updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Funkcja do pobierania roli bieżącego użytkownika
CREATE OR REPLACE FUNCTION current_user_role() 
RETURNS varchar AS $$
DECLARE
  role_name_var varchar;
BEGIN
  SELECT r.role_name INTO role_name_var
  FROM users u
  JOIN roles r ON u.role_id = r.role_id
  WHERE u.user_id = current_setting('myapp.user_id', true)::uuid;
  RETURN role_name_var;
EXCEPTION
  WHEN others THEN
    RETURN null;
END;
$$ LANGUAGE plpgsql STABLE;

-- Funkcja do pobierania ID bieżącego użytkownika
CREATE OR REPLACE FUNCTION current_user_id() 
RETURNS uuid AS $$
BEGIN
  RETURN current_setting('myapp.user_id', true)::uuid;
EXCEPTION
  WHEN others THEN
    RETURN null;
END;
$$ LANGUAGE plpgsql STABLE;
```

## 2. Struktura Tabel

### Tabela Ról
```sql
CREATE TABLE roles (
    role_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_name varchar(50) UNIQUE NOT NULL -- np. 'standard', 'admin'
);
```

### Tabela Użytkowników
```sql
CREATE TABLE users (
    user_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email varchar(255) UNIQUE NOT NULL,
    login varchar(100) NOT NULL,
    password_hash varchar(255) NOT NULL,
    first_name varchar(100),
    last_name varchar(100),
    role_id uuid NOT NULL REFERENCES roles(role_id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger dla aktualizacji updated_at
CREATE TRIGGER set_timestamp_users
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();
```

### Tabela Grup
```sql
CREATE TABLE groups (
    group_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_name varchar(255) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger dla aktualizacji updated_at
CREATE TRIGGER set_timestamp_groups
BEFORE UPDATE ON groups
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();
```

### Tabela Wydarzeń
```sql
CREATE TABLE events (
    event_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id uuid NOT NULL REFERENCES groups(group_id) ON DELETE CASCADE,
    creator_user_id uuid REFERENCES users(user_id) ON DELETE SET NULL,
    title varchar(255) NOT NULL,
    start_time timestamptz NOT NULL,
    end_time timestamptz NOT NULL,
    place varchar(255),
    description text,
    is_ai_suggestion boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger dla aktualizacji updated_at
CREATE TRIGGER set_timestamp_events
BEFORE UPDATE ON events
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();
```

### Tabela Członkostw w Grupach
```sql
CREATE TABLE group_memberships (
    user_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    group_id uuid NOT NULL REFERENCES groups(group_id) ON DELETE CASCADE,
    joined_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, group_id)
);
```

### Tabela Uczestnictwa w Wydarzeniach
```sql
CREATE TABLE event_attendance (
    user_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    event_id uuid NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    joined_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, event_id)
);
```

## 3. Row Level Security (RLS)

### Włączenie RLS
```sql
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendance ENABLE ROW LEVEL SECURITY;
```

### Polityki RLS dla Grup
```sql
-- Polityki dla tabeli groups
CREATE POLICY "Allow admin full access on groups" ON groups FOR ALL
    USING (current_user_role() = 'admin');
CREATE POLICY "Allow members read access on their groups" ON groups FOR SELECT
    USING (EXISTS (
        SELECT 1 
        FROM group_memberships 
        WHERE group_id = groups.group_id 
        AND user_id = current_user_id()
    ));
```

### Polityki RLS dla Członkostw w Grupach
```sql
-- Polityki dla tabeli group_memberships
CREATE POLICY "Allow admin full access on group_memberships" ON group_memberships FOR ALL
    USING (current_user_role() = 'admin');
CREATE POLICY "Allow users to read their own memberships" ON group_memberships FOR SELECT
    USING (user_id = current_user_id());
```

### Polityki RLS dla Wydarzeń
```sql
-- Polityki dla tabeli events
CREATE POLICY "Allow admin full access on events" ON events FOR ALL
    USING (current_user_role() = 'admin');
CREATE POLICY "Allow group members to access events in their groups" ON events FOR ALL
    USING (EXISTS (
        SELECT 1 
        FROM group_memberships 
        WHERE group_id = events.group_id 
        AND user_id = current_user_id()
    ));
```

### Polityki RLS dla Uczestnictwa w Wydarzeniach
```sql
-- Polityki dla tabeli event_attendance
CREATE POLICY "Allow admin full access on event_attendance" ON event_attendance FOR ALL
    USING (current_user_role() = 'admin');
CREATE POLICY "Allow users to manage attendance for events in their groups" ON event_attendance FOR ALL
    USING (
        EXISTS (
            SELECT 1
            FROM events e
            JOIN group_memberships gm ON e.group_id = gm.group_id
            WHERE e.event_id = event_attendance.event_id 
            AND gm.user_id = current_user_id()
        )
        AND
        user_id = current_user_id()
    );
CREATE POLICY "Allow group members to see attendance for events in their groups" ON event_attendance FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM events e
            JOIN group_memberships gm ON e.group_id = gm.group_id
            WHERE e.event_id = event_attendance.event_id 
            AND gm.user_id = current_user_id()
        )
    );
```

## 4. Dane Początkowe

```sql
-- Wstawienie domyślnych ról
INSERT INTO roles (role_name) 
VALUES ('standard'), ('admin') 
ON CONFLICT (role_name) DO NOTHING;

-- Wstawienie domyślnego użytkownika admin
INSERT INTO users (
    email, 
    login, 
    password_hash, 
    first_name, 
    last_name, 
    role_id
)
SELECT
    'admin@admin.com',
    'admin',
    '$2b$10$lnKjlMMNeEjCbbcfsaE7P.ufElOawqXTebwB8lSSUgYaiKc45L0bG',
    'Admin',
    'User',
    (SELECT role_id FROM roles WHERE role_name = 'admin')
WHERE
    NOT EXISTS (
        SELECT 1 FROM users WHERE email = 'admin@admin.com'
    );

-- Wstawienie domyślnej grupy admin
INSERT INTO groups (group_name)
SELECT 'admin_group'
WHERE NOT EXISTS (
    SELECT 1 FROM groups WHERE group_name = 'admin_group'
);

-- Dodanie domyślnego użytkownika admin do grupy admin
INSERT INTO group_memberships (user_id, group_id)
SELECT u.user_id, g.group_id
FROM users u
JOIN groups g ON g.group_name = 'admin_group'
WHERE u.email = 'admin@admin.com'
  AND NOT EXISTS (
    SELECT 1 FROM group_memberships gm
    WHERE gm.user_id = u.user_id
      AND gm.group_id = g.group_id
  );
```

## 5. Kluczowe Zmiany i Uwagi

1. **Struktura Wydarzeń**:
   - Dodano pole `end_time` w tabeli `events` jako wymagane pole
   - Wszystkie pola czasowe używają typu `timestamptz` dla obsługi stref czasowych

2. **Bezpieczeństwo**:
   - RLS jest włączone dla wszystkich tabel oprócz `users` i `roles`
   - Kontekst użytkownika jest ustawiany przez `myapp.user_id`
   - Polityki RLS zapewniają dostęp tylko do autoryzowanych danych

3. **Automatyczne Aktualizacje**:
   - Wszystkie tabele z `updated_at` mają skonfigurowane triggery
   - Używana jest wspólna funkcja `trigger_set_timestamp()`

4. **Kaskadowe Usuwanie**:
   - Wydarzenia są usuwane przy usunięciu grupy
   - Członkostwa i uczestnictwa są usuwane przy usunięciu użytkownika
   - `creator_user_id` w wydarzeniach jest ustawiany na NULL przy usunięciu użytkownika
```
