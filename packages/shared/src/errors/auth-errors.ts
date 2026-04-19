/**
 * Mapa de tradução de mensagens de erro do Supabase Auth para PT-BR.
 *
 * As chaves são as mensagens originais em inglês retornadas pela API.
 * Os valores são as mensagens traduzidas exibidas ao usuário.
 */
const AUTH_ERROR_MAP: Record<string, string> = {
  "Invalid login credentials": "E-mail ou senha incorretos.",
  "Email not confirmed":
    "E-mail ainda não confirmado. Verifique sua caixa de entrada.",
  "User already registered": "Este e-mail já está cadastrado.",
  "Signup requires a valid password": "A senha informada não é válida.",
  "Password should be at least 6 characters.":
    "A senha deve ter no mínimo 6 caracteres.",
  "Email rate limit exceeded":
    "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.",
  "For security purposes, you can only request this after 60 seconds.":
    "Por segurança, aguarde 60 segundos antes de tentar novamente.",
};

/**
 * Traduz uma mensagem de erro do Supabase Auth para PT-BR.
 *
 * Se a mensagem não possuir tradução mapeada, retorna o `fallback` fornecido
 * ou um texto genérico.
 *
 * @param message - Mensagem original retornada pelo Supabase
 * @param fallback - Texto alternativo caso não exista tradução
 * @returns {string} Mensagem traduzida para o usuário
 *
 * @example
 * ```ts
 * catch (err) {
 *   error.value = translateAuthError(err instanceof Error ? err.message : undefined)
 * }
 * ```
 */
export function translateAuthError(
  message?: string,
  fallback = "Ocorreu um erro inesperado. Tente novamente.",
): string {
  if (!message) return fallback;
  return AUTH_ERROR_MAP[message] ?? fallback;
}
