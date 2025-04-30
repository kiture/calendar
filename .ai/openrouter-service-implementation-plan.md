# OpenRouter Service Implementation Plan

## 1. Opis usługi

Serwis `OpenRouterService` jest odpowiedzialny za komunikację z API OpenRouter w celu generowania sugestii wydarzeń w kalendarzu. Głównym zadaniem jest przetwarzanie zapytań o sugestie wydarzeń i zwracanie ustrukturyzowanych odpowiedzi w formacie JSON.

## 2. Konfiguracja i Inicjalizacja

```typescript
interface OpenRouterConfig {
  apiKey: string;
  defaultModel?: string;
  baseUrl?: string;
}

const openRouter = new OpenRouterService({
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultModel: process.env.OPENROUTER_MODEL,
  baseUrl: process.env.OPENROUTER_BASE_URL,
});
```

## 3. Schema Walidacji Odpowiedzi

```typescript
const eventSuggestionsSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    suggestions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          startTime: { type: 'string' },
          endTime: { type: 'string' },
          location: { type: 'string' },
          type: { type: 'string' },
        },
        required: [
          'title',
          'description',
          'startTime',
          'endTime',
          'location',
          'type',
        ],
      },
    },
  },
  required: ['suggestions'],
};
```

## 4. Interfejsy i Typy

```typescript
interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface AuthRequest extends Request {
  user?: {
    user_id: string;
    role_id: string;
  };
}
```

## 5. Endpoint API

### GET /api/event-suggestions

#### Walidacja Parametrów
```typescript
const validateGetSuggestions = [
  queryValidator('startDate')
    .isISO8601()
    .withMessage('Valid startDate (ISO8601 format) is required'),
  queryValidator('endDate')
    .isISO8601()
    .withMessage('Valid endDate (ISO8601 format) is required'),
  queryValidator('location')
    .notEmpty()
    .withMessage('Location query parameter is required'),
  queryValidator('type')
    .optional()
    .isString()
    .withMessage('Type must be a string'),
];
```

#### Obsługa Błędów Walidacji
```typescript
const handleValidationErrors: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  next();
};
```

#### Kontroler
```typescript
const aiController = {
  getSuggestions: async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new Error('Authentication required');
      }

      const { startDate, endDate, location, type } = req.query;

      const systemMessage = {
        role: 'system',
        content: `You are an AI event planner assistant. Generate event suggestions based on the given parameters.
          Your response MUST strictly follow this JSON structure:
          {
            "suggestions": [
              {
                "title": "string",
                "description": "string",
                "startTime": "ISO8601 string",
                "endTime": "ISO8601 string",
                "location": "string",
                "type": "string"
              }
            ]
          }`,
      };

      const userMessage = {
        role: 'user',
        content: `Please suggest events with the following criteria:
          - Time frame: between ${startDate} and ${endDate}
          - Location: ${location}
          ${type ? `- Type of event: ${type}` : ''}
          Please provide 3-5 varied suggestions that would be interesting and feasible.`,
      };

      const response = await openRouter.sendMessage(
        [systemMessage, userMessage],
        {
          responseFormat: {
            type: 'json_schema',
            json_schema: {
              name: 'EventSuggestionsSchema',
              strict: true,
              schema: eventSuggestionsSchema,
            },
          },
        }
      );

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No suggestions received from AI');
      }

      const parsedContent = JSON.parse(content);
      res.status(200).json(parsedContent.suggestions);
    } catch (error) {
      next(error);
    }
  },
};
```

## 6. Konfiguracja Routera

```typescript
const router = express.Router();

// Wszystkie ścieżki wymagają uwierzytelnienia
router.use(authenticateToken as RequestHandler);

// GET /ai/event-suggestions
router.get(
  '/event-suggestions',
  validateGetSuggestions,
  handleValidationErrors,
  aiController.getSuggestions
);
```

## 7. Bezpieczeństwo i Uwierzytelnianie

1. **Middleware Uwierzytelniania**
   - Każde żądanie wymaga tokenu JWT
   - Wykorzystanie middleware `authenticateToken`
   - Weryfikacja obecności użytkownika w żądaniu

2. **Walidacja Wejścia**
   - Sprawdzanie formatu dat (ISO8601)
   - Wymagane pole lokalizacji
   - Opcjonalne pole typu wydarzenia
   - Obsługa błędów walidacji

3. **Bezpieczne Przetwarzanie Odpowiedzi**
   - Walidacja schematu JSON
   - Obsługa błędów parsowania
   - Bezpieczne przekazywanie błędów do middleware

## 8. Plan Wdrożenia

1. **Zmienne Środowiskowe**
   ```bash
   OPENROUTER_API_KEY=your_api_key
   OPENROUTER_MODEL=gpt-4o-mini
   OPENROUTER_BASE_URL=https://api.openrouter.ai
   ```

2. **Instalacja Zależności**
   ```bash
   npm install express-validator
   ```

3. **Struktura Plików**
   ```
   backend/
   ├── src/
   │   ├── routes/
   │   │   └── ai/
   │   │       └── ai.routes.ts
   │   ├── services/
   │   │   └── openrouter.service.ts
   │   └── middleware/
   │       └── authMiddleware.ts
   ```

4. **Testy**
   - Testy jednostkowe dla walidacji
   - Testy integracyjne dla endpointu
   - Testy bezpieczeństwa (uwierzytelnianie)

5. **Monitorowanie**
   - Logowanie błędów AI
   - Monitorowanie czasu odpowiedzi
   - Śledzenie wykorzystania API

## 9. Przykładowa Odpowiedź

```json
[
  {
    "title": "Tech Conference 2024",
    "description": "Annual technology conference featuring latest innovations",
    "startTime": "2024-03-15T09:00:00Z",
    "endTime": "2024-03-15T17:00:00Z",
    "location": "Warsaw Expo Center",
    "type": "business"
  }
]
```
