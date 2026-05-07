import type { SupabaseClient } from "@supabase/supabase-js";
import type { Leitura } from "./types";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Inscreve-se em mudanças em tempo real na tabela 'registro' para um gerador específico.
 *
 * @param {SupabaseClient} supabase - Instância do Supabase.
 * @param {string} generatorId - ID do gerador para filtrar as leituras.
 * @param {(payload: { new: Leitura; old: Leitura | null }) => void} callback - Função chamada quando uma nova leitura é inserida.
 * @returns {{ unsubscribe: () => Promise<void> }} Objeto com função para cancelar a inscrição.
 */
export const subscribeToGeneratorReadings = (
  supabase: SupabaseClient,
  generatorId: string,
  callback: (payload: { new: Leitura; old: Leitura | null }) => void,
): { unsubscribe: () => Promise<void> } => {
  console.log(
    `[Realtime] Tentando conectar ao canal: registro-gerador-${generatorId}`,
  );

  let retries = 0;
  let channel: ReturnType<SupabaseClient["channel"]> | null = null;
  let retryTimeout: ReturnType<typeof setTimeout> | null = null;
  let isUnsubscribed = false;

  const setupChannel = () => {
    if (isUnsubscribed) return;

    channel = supabase.channel(`registro-gerador-${generatorId}`).on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "registro",
        filter: `gerador_id=eq.${generatorId}`,
      },
      (payload) => {
        console.log("[Realtime] Nova leitura recebida:", payload.new);
        callback({
          new: payload.new as Leitura,
          old: payload.old as Leitura | null,
        });
      },
    );

    channel.subscribe((status, err) => {
      if (isUnsubscribed) return;

      console.log(`[Realtime] Status da conexão: ${status}`);

      if (status === "SUBSCRIBED") {
        console.log("[Realtime] ✅ Conectado com sucesso ao canal!");
        retries = 0;
      }

      if (status === "CHANNEL_ERROR") {
        console.error("[Realtime] ❌ Erro no canal:", err);

        if (retries >= MAX_RETRIES) {
          console.error("[Realtime] Máximo de tentativas excedido.");
          return;
        }

        retries++;
        console.log(
          `[Realtime] Tentando reconectar (${retries}/${MAX_RETRIES})...`,
        );

        retryTimeout = setTimeout(() => {
          if (channel && !isUnsubscribed) {
            supabase
              .removeChannel(channel)
              .then(() => {
                setupChannel();
              })
              .catch(() => {});
          }
        }, RETRY_DELAY_MS);
      }

      if (status === "TIMED_OUT") {
        console.error("[Realtime] ⏱️ Timeout na conexão");
      }

      if (status === "CLOSED") {
        console.warn("[Realtime] 🔌 Conexão fechada");
      }
    });
  };

  setupChannel();

  return {
    unsubscribe: async () => {
      isUnsubscribed = true;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
        retryTimeout = null;
      }
      if (channel) {
        console.log(
          `[Realtime] Cancelando inscrição do canal: ${channel.topic}`,
        );
        await supabase.removeChannel(channel);
        channel = null;
      }
    },
  };
};
