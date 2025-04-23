import { AppConfig } from '../model/AppConfig';

// Internal variable to hold the loaded configuration
let appConfig: AppConfig | null = null;

// Default/fallback configuration
const defaultConfig: AppConfig = {
  apiUrl: 'http://localhost:3000', // Default value in case loading fails
};

/**
 * Asynchronously fetches the configuration from /config.json and stores it.
 * This should be called once during application initialization (e.g., in main.tsx).
 */
export const loadAppConfig = async (): Promise<void> => {
  if (appConfig) {
    return;
  }
  try {
    const response = await fetch('/config.json'); // Fetches from the public folder
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const config = await response.json();
    appConfig = config;
  } catch (error) {
    console.error(
      'Failed to load application configuration from /config.json:',
      error
    );
    console.warn('Using default configuration.');
    appConfig = defaultConfig;
  }
};

/**
 * Returns the loaded application configuration.
 * Throws an error if the configuration hasn't been loaded yet.
 */
export const getConfig = (): AppConfig => {
  if (!appConfig) {
    // This indicates a programming error - loadAppConfig should have been called first.
    console.error(
      'Attempted to access configuration before it was loaded. Using default fallback.'
    );
    // Returning default config to prevent hard crash, but this is not ideal.
    return defaultConfig;
  }
  return appConfig;
};
