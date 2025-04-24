import { RootState, AppDispatch } from '../redux/store';
import { getConfig } from '../service/config.service';
// Import actions needed within the helper
import {
  setAppError,
  setAppIdle,
  setAppLoading,
} from '../redux/app/app.reducer';

export const getErrorMessage = async (
  error: unknown,
  response?: Response
): Promise<string> => {
  if (response && !response.ok) {
    // Handle specific unauthorized error
    if (response.status === 401 || response.status === 403) {
      return 'Unauthorized: Please log in.';
    }
    try {
      const errorData = await response.json();
      let errorMessage =
        errorData?.message || `HTTP error! status: ${response.status}`;
      if (errorData?.errors) {
        errorMessage = errorData.errors
          .map((error: { msg: string }) => error.msg)
          .join('\n');
      }
      return errorMessage;
    } catch {
      // Error parsing JSON body, or no body
      return `HTTP error! status: ${response.status}`;
    }
  } else if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred';
};

// Helper to get auth headers
export const getAuthHeaders = (getState: () => RootState): HeadersInit => {
  const token = getState().user.accessToken;
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  // Default Content-Type, can be overridden if needed
  headers['Content-Type'] = 'application/json';
  return headers;
};

// Define the structure of the thunkAPI object we expect
interface ThunkApi {
  getState: () => RootState;
  dispatch: AppDispatch;
  // Use unknown for the return type of rejectWithValue for broader compatibility
  rejectWithValue: (value: string) => unknown;
}

// Generic API request helper
export const makeApiRequest = async <TResponse>(
  urlPath: string, // Path relative to API base URL e.g., '/api/groups'
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  thunkAPI: ThunkApi,
  options: {
    data?: unknown; // Use unknown instead of any for body data
    loadingMessage: string;
    headers?: HeadersInit; // Allow overriding/extending headers
    tokenRequired?: boolean;
  }
): Promise<TResponse | ReturnType<ThunkApi['rejectWithValue']>> => {
  const { getState, dispatch, rejectWithValue } = thunkAPI;
  const {
    data,
    loadingMessage,
    headers: customHeaders,
    tokenRequired = true,
  } = options;

  dispatch(setAppLoading(loadingMessage));
  const config = getConfig();
  const defaultHeaders = getAuthHeaders(getState);

  // Merge default headers with custom/overriding headers
  const headers = { ...defaultHeaders, ...customHeaders };

  // Check for authorization token if it's required (modify if some endpoints are public)
  const authHeader = (headers as Record<string, string>)['Authorization'];
  if (!authHeader && tokenRequired) {
    const errorMsg = 'Authentication token not found.';
    dispatch(setAppError(errorMsg));
    return rejectWithValue(errorMsg);
  }

  try {
    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    // Use type guard for data before stringifying
    if (data !== undefined && (method === 'POST' || method === 'PUT')) {
      fetchOptions.body = JSON.stringify(data);
    } else if (method === 'GET' || method === 'DELETE') {
      // Ensure Content-Type is not sent for GET/DELETE requests if body is absent
      // Although getAuthHeaders sets it, fetch might ignore it, but being explicit is safer
      delete (fetchOptions.headers as Record<string, string>)['Content-Type'];
    }

    const response = await fetch(`${config.apiUrl}${urlPath}`, fetchOptions);

    if (!response.ok) {
      const errorMsg = await getErrorMessage(null, response);
      dispatch(setAppError(errorMsg));
      return rejectWithValue(errorMsg);
    }

    // Handle responses with no content (e.g., 204 No Content)
    if (response.status === 204) {
      dispatch(setAppIdle());
      // Need to cast to TResponse, assuming TResponse might be void or similar
      return {} as TResponse;
    }

    const responseData: TResponse = await response.json();
    dispatch(setAppIdle());
    return responseData;
  } catch (error: unknown) {
    const errorMsg = await getErrorMessage(error);
    dispatch(setAppError(errorMsg));
    return rejectWithValue(errorMsg);
  }
};
