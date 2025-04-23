# Curl Commands for Testing

## 1. Login to get JWT token
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'
```

Expected response:
```json
{
  "token": "your.jwt.token"
}
```

## 2. Test AI Event Suggestions
```bash
curl -X GET 'http://localhost:3000/api/ai/event-suggestions?startDate=2024-03-20T00:00:00Z&endDate=2024-03-25T00:00:00Z&location=Warsaw&type=business' \
  -H "Authorization: Bearer your.jwt.token" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "suggestions": [
    {
      "title": "Tech Startup Networking Breakfast",
      "description": "Network with local tech entrepreneurs over breakfast",
      "startTime": "2024-03-20T08:00:00Z",
      "endTime": "2024-03-20T10:00:00Z",
      "location": "Centrum Warsaw",
      "type": "business"
    }
    // ... more suggestions
  ]
}
```

## Testing Different Scenarios

### 1. Test without authentication
```bash
curl -X GET 'http://localhost:3000/api/ai/event-suggestions?startDate=2024-03-20T00:00:00Z&endDate=2024-03-25T00:00:00Z&location=Warsaw' \
  -H "Content-Type: application/json"
```

Expected: 401 Unauthorized

### 2. Test with invalid dates
```bash
curl -X GET 'http://localhost:3000/api/ai/event-suggestions?startDate=invalid-date&endDate=2024-03-25T00:00:00Z&location=Warsaw' \
  -H "Authorization: Bearer your.jwt.token" \
  -H "Content-Type: application/json"
```

Expected: 400 Bad Request with validation errors

### 3. Test without required parameters
```bash
curl -X GET 'http://localhost:3000/api/ai/event-suggestions?startDate=2024-03-20T00:00:00Z&endDate=2024-03-25T00:00:00Z' \
  -H "Authorization: Bearer your.jwt.token" \
  -H "Content-Type: application/json"
```

Expected: 400 Bad Request (missing location)

## Environment Variables Required
Make sure these environment variables are set in your `.env` file:
```
OPENROUTER_API_KEY=your-openrouter-api-key
OPENROUTER_MODEL=gpt-4o-mini  # optional
``` 