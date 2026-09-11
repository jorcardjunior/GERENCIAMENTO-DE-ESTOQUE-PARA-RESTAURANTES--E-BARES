function getEnv(key: string, required = true): string {
  const value = process.env[key];
  if (!value) {
    if (required) {
      throw new Error(`❌ VARIÁVEL DE AMBIENTE OBRIGATÓRIA: ${key} não está definida.`);
    }
    if (typeof window === "undefined") {
      console.warn(
        `⚠️  Environment variable ${key} is not set. Usando fallback de desenvolvimento.`,
      );
    }
    return "";
  }
  return value;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "❌ JWT_SECRET não definido! Em produção, isso é uma falha de segurança crítica. " +
        "Execute: 'openssl rand -base64 32' e defina o resultado como JWT_SECRET.",
    );
  }
  console.warn(
    "⚠️ JWT_SECRET não definido. Usando fallback INSEGURO para desenvolvimento local apenas.",
  );
  return "dev-secret-do-not-use-in-production";
}

export const env = {
  DATABASE_URL: getEnv("DATABASE_URL"),
  JWT_SECRET: getJwtSecret(),
  BETTER_AUTH_SECRET: getEnv("BETTER_AUTH_SECRET"),
  BETTER_AUTH_URL: getEnv("BETTER_AUTH_URL", false) || "http://localhost:3000",
  NODE_ENV: getEnv("NODE_ENV", false) || "development",
  isDev: process.env.NODE_ENV !== "production",
  isProd: process.env.NODE_ENV === "production",
} as const;
