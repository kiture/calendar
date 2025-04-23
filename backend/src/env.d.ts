declare namespace NodeJS {
  interface ProcessEnv {
    DB_USER: string;
    DB_PASSWORD: string;
    DB_HOST: string;
    DB_PORT: string;
    DB_NAME: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    OPENROUTER_API_KEY: string;
    OPENROUTER_MODEL: string;
    OPENROUTER_BASE_URL: string;
  }
}
