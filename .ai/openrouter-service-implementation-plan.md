# OpenRouter Service Implementation Plan

## 1. Opis usługi
Serwis `OpenRouterService` jest odpowiedzialny za komunikację z API OpenRouter w celu generowania odpowiedzi na podstawie rozmów LLM. Umożliwia przesyłanie wiadomości systemowych i użytkownika, otrzymywanie ustrukturyzowanych odpowiedzi w formacie JSON, wybór modelu oraz konfigurację parametrów modelu.

## 2. Opis konstruktora
```ts
constructor(config: OpenRouterConfig)
```
- **Parametry**:
  1. `apiKey: string` – klucz API do OpenRouter (przechowywany w zmiennych środowiskowych).
  2. `baseUrl?: string` – podstawowy adres endpointu OpenRouter (domyślnie `https://api.openrouter.ai`).
  3. `defaultModel?: string` – nazwa domyślnego modelu (np. `gpt-4o-mini`).
  4. `defaultParams?: ModelParams` – domyślne parametry modelu (temperature, max_tokens itd.).
- **Valdiacja**: Rzuca `InvalidConfigurationError` jeśli `apiKey` jest pusty lub ma nieprawidłowy format.

## 3. Publiczne metody i pola
1. **`sendMessage(messages: ChatMessage[], options?: RequestOptions): Promise<ChatResponse>`**
   - *Opis:* Główna metoda wysyłająca `messages` (tablica obiektów `{ role: 'system'|'user', content: string }`) do OpenRouter.
   - *Parametry:* 
     - `messages` – sekwencja wiadomości systemowych i użytkownika.
     - `options.modelName?` – nadpisuje `defaultModel`.
     - `options.modelParams?` – nadpisuje `defaultParams`.
     - `options.responseFormat?` – np.:
       ```json
       { type: 'json_schema', json_schema: { name: 'MySchema', strict: true, schema: { type: 'object', properties: { answer: { type: 'string' } }, required: ['answer'] }}}
       ```
   - *Zwraca:* Obiekt `ChatResponse` zawierający parsowane pola zgodne z zadanym `responseFormat`.
2. **`getSupportedModels(): Promise<string[]>`**
   - *Opis:* Pobiera listę dostępnych modeli z OpenRouter.

## 4. Prywatne metody i pola
- **Pola prywatne**:
  - `_apiKey: string`
  - `_baseUrl: string`
  - `_defaultModel: string`
  - `_defaultParams: ModelParams`
- **Metody prywatne**:
  1. `_buildPayload(messages, modelName, modelParams, responseFormat): RequestPayload` – konstruuje ciało żądania.
  2. `_validateResponse(raw: unknown, responseFormat): void` – weryfikuje odpowiedź pod kątem `response_format` i rzuca `ResponseFormatError` w razie niezgodności.
  3. `_handleError(error: unknown): never` – mapuje błędy HTTP i sieciowe na `OpenRouterError`, `AuthenticationError`, `RateLimitError`.
  4. `_logRequest(payload, response): void` – opcjonalnie logowanie dla audytu (implementowane jako middleware).

## 5. Obsługa błędów
1. **Błąd sieciowy (np. brak połączenia)**
   - *Scenariusz:* Brak dostępu do internetu lub timeout.
   - *Rozwiązanie:* Rzucić `NetworkError`, retry z backoff.
2. **Błąd autoryzacji (401/403)**
   - *Scenariusz:* Nieprawidłowy lub wygasły klucz API.
   - *Rozwiązanie:* Rzucić `AuthenticationError`, zatrzymać dalsze próby.
3. **Przekroczenie limitu (429)**
   - *Scenariusz:* Zbyt wiele żądań.
   - *Rozwiązanie:* Rzucić `RateLimitError`, retry po zadanym `Retry-After`.
4. **Błąd formatu odpowiedzi**
   - *Scenariusz:* Odpowiedź nie spełnia `response_format`.
   - *Rozwiązanie:* Rzucić `ResponseFormatError` z detalami schematu.
5. **Błąd wewnętrzny serwera (5xx)**
   - *Scenariusz:* Problemy po stronie OpenRouter.
   - *Rozwiązanie:* Rzucić `ServerError`, opcjonalny retry po krótkiej przerwie.

## 6. Kwestie bezpieczeństwa
- **Przechowywanie klucza API:** Używać `.env` i `dotenv`, nigdy nie commitować.
- **Nagłówki HTTP:** Wymusić `Content-Type: application/json`, walidacja CORS.
- **Rate limiting:** Środki ochronne na poziomie serwera (np. express-rate-limit).
- **Sanityzacja wejścia:** Upewnić się, że treść wiadomości nie zawiera niebezpiecznych danych.
- **Middleware:** Użyć `helmet` i `express-async-errors`.

## 7. Plan wdrożenia krok po kroku
1. **Instalacja zależności**
   ```bash
   npm install openrouter axios zod express-async-errors
   ```
2. **Konfiguracja środowiska**
   - `.env`: `OPENROUTER_API_KEY=...`, `OPENROUTER_BASE_URL=https://api.openrouter.ai`
3. **Utworzenie pliku serwisu**
   - `backend/src/services/openrouter.service.ts`
   - Zaimportować `openrouter` i `axios`.
4. **Implementacja klasy `OpenRouterService`**
   - Zaimplementować konstruktor, metody publiczne, prywatne według specyfikacji.
5. **Dodanie middleware**
   - W pliku `backend/src/index.ts` dodać `import 'express-async-errors'` i middleware błędów.
   - Skonfigurować `helmet` i `rateLimit`.
6. **Testy jednostkowe**
   - `tests/services/openrouter.service.spec.ts`
   - Mockować HTTP za pomocą `nock` lub `msw`, weryfikować poprawne mapowanie błędów i odpowiedzi.
7. **Integracja z Redux/Frontend**
   - Utworzyć thunk `generateAISuggestions` w `frontend/src/redux/ai/ai.thunks.ts`, wykorzystujący endpoint `/api/ai/chat`.
   - Dodać UI w `frontend/src/components/views/AISuggestionsView.tsx`.
8. **WDROŻENIE**
   - Skonfigurować CI/CD (np. GitHub Actions) do budowy i deploymentu backendu.
   - Upewnić się, że zmienne środowiskowe są ustawione na serwerze.
   - Monitorować metryki (logi, czas odpowiedzi, błędy) za pomocą narzędzia APM.

---
*Przykłady konfiguracji payloadu:*
```json
{
  "messages": [
    { "role": "system", "content": "You are a helpful assistant." },
    { "role": "user",   "content": "Podsumuj poniższy tekst." }
  ],
  "model": "gpt-4o-mini",
  "parameters": { "temperature": 0.7, "max_tokens": 500 },
  "response_format": { "type": "json_schema", "json_schema": { "name": "SummarySchema", "strict": true, "schema": { "type": "object", "properties": { "summary": { "type": "string" } }, "required": ["summary"] } } }
}
``` 