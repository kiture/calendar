import express, {
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from 'express';
import { query as queryValidator, validationResult } from 'express-validator';
import authenticateToken, {
  AuthRequest,
} from '../../middleware/authMiddleware';
import { OpenRouterService } from '../../services/openrouter.service';

// Initialize OpenRouter service
const openRouter = new OpenRouterService({
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultModel: process.env.OPENROUTER_MODEL,
  baseUrl: process.env.OPENROUTER_BASE_URL,
});

// Response schema for event suggestions
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
          type: { type: 'string' }
        },
        required: ['title', 'description', 'startTime', 'endTime', 'location', 'type']
      }
    }
  },
  required: ['suggestions']
};

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

// --- Controller Implementation ---
const aiController = {
  // GET /ai/event-suggestions
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

      // Prepare the system message
      const systemMessage = {
        role: 'system' as const,
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
          }
          All fields are required. Do not include any additional fields.
          Make the suggestions realistic and appropriate for the location and time frame.
          Ensure all times are within the specified start and end dates and use ISO8601 format.
          For type, use general categories like: business, social, entertainment, sports, education, etc.`
      };

      // Prepare the user message with query parameters
      const userMessage = {
        role: 'user' as const,
        content: `Please suggest events with the following criteria:
          - Time frame: between ${startDate} and ${endDate}
          - Location: ${location}
          ${type ? `- Type of event: ${type}` : ''}
          Please provide 3-5 varied suggestions that would be interesting and feasible.`
      };

      // Call OpenRouter API with JSON schema validation
      const response = await openRouter.sendMessage(
        [systemMessage, userMessage],
        {
          responseFormat: {
            type: 'json_schema',
            json_schema: {
              name: 'EventSuggestionsSchema',
              strict: true,
              schema: eventSuggestionsSchema
            }
          }
        }
      ) as OpenRouterResponse;

      // Parse the response content
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No suggestions received from AI');
      }

      // Parse the JSON content
      const parsedContent = JSON.parse(content);
      
      // Return the suggestions array directly
      res.status(200).json(parsedContent.suggestions);
    } catch (error) {
      next(error);
    }
  },
};
// --- End Controller Implementation ---

// --- Validation Error Handler Middleware ---
const handleValidationErrors: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return; // Explicitly return void after sending response
  }
  next();
};

const router = express.Router();

// --- Validation Chains ---
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

// --- AI Routes ---
// All routes require authentication
router.use(authenticateToken as RequestHandler);

// GET /ai/event-suggestions
router.get(
  '/event-suggestions',
  validateGetSuggestions,
  handleValidationErrors,
  aiController.getSuggestions
);

export default router;
