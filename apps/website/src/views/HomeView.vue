<script setup lang="ts">
import { RouterLink } from 'vue-router'
import WaterGauge from '@/components/WaterGauge.vue'
import ThermometerGauge from '@/components/ThermometerGauge.vue'
</script>

<template>
  <div class="min-h-screen">
    <header
      class="bg-white shadow-xl p-2 flex flex-wrap justify-between items-center mb-2 border border-gray-200 place-content-between"
    >
      <div class="md:pl-4">
        <RouterLink to="/">
          <img class="w-auto h-10" src="/images/logo.webp" alt="Logo" />
        </RouterLink>
      </div>

      <nav class="mx-auto md:m-2 m-10 flex flex-wrap">
        <RouterLink to="/login" class="bg-black m-1 p-2 text-white rounded-xl hover:bg-gray-700">
          Fazer Login
        </RouterLink>
        <RouterLink
          to="/register"
          class="bg-orange-500 m-1 p-2 text-white rounded-xl hover:bg-orange-600"
        >
          Criar Conta
        </RouterLink>
      </nav>
    </header>
    <div
      class="bg-white rounded-2xl shadow-xl p-8 mt-10 m-5 text-center max-w-2xl mx-auto border border-gray-200"
    >
      <h2 class="text-3xl sm:text-4xl font-bold text-gray-800 mb-3">
        Soluções de monitoramento de geradores
      </h2>
      <div class="text-xl mb-5">
        <p>Sem planilhas.</p>
        <p>Sem visitas presenciais.</p>
        <p>Visualize informação graficamente.</p>
      </div>
      <RouterLink
        to="/register"
        class="inline-block bg-orange-500 px-8 py-3 text-white font-medium rounded-xl hover:bg-orange-600 transition shadow-lg"
      >
        Começar agora →
      </RouterLink>
    </div>
    <main
      class="border border-gray-200 bg-white shadow-xl rounded-xl p-8 max-w-5xl items-center justify-center mx-auto my-10"
    >
      <h1 class="text-2xl font-bold">Quem somos?</h1>
      <section class="text-xl flex flex-col gap-5">
        <p>
          Na Smart Gen, acreditamos que a inteligência não está apenas nos grandes datacenters, mas
          sim nos pequenos gestos de cuidado com cada máquina que mantém o mundo em movimento. Somos
          uma empresa focada em soluções IoT personalizadas para geradores, unindo hardware
          inteligente e software de fácil utilização para levar mais controle, eficiência e
          tranquilidade a quem depende da geração de energia.
        </p>
        <p>
          Hoje, nossa missão é clara: proteger o coração do seu negócio, o gerador, com
          monitoramento essencial e preciso. Por isso, oferecemos um sistema que já acompanha em
          tempo real dois dos parâmetros mais críticos para o bom funcionamento e longevidade do
          equipamento: Nível de água (para controle do sistema de arrefecimento) Temperatura de
          operação (prevenindo superaquecimento e falhas) E para que você não precise ser um
          especialista em tecnologia para entender o que acontece com seu gerador, desenvolvemos um
          dashboard intuitivo e visual, onde todos os dados são apresentados de forma clara, com
          gráficos dinâmicos e indicadores de fácil leitura.
        </p>
        Na prática, você consegue, com poucos cliques, visualizar tendências de temperatura,
        detectar variações anormais no nível de água e tomar decisões rápidas — direto da tela do
        seu computador ou tablet. Quer ver na prática? Logo abaixo, você confere uma demonstração
        interativa do nosso dashboard, mostrando como é simples acompanhar a saúde do seu gerador em
        tempo real. E estamos evoluindo. Em breve, a Smart Gen dará mais um passo importante na
        democratização dos dados industriais: disponibilizaremos a exportação completa dos registros
        em formato CSV.
        <p>
          Isso significa que você poderá analisar históricos, criar relatórios personalizados,
          integrar com outras ferramentas de gestão e levar a análise dos dados para onde preferir.
          Somos uma equipe apaixonada por tecnologia que resolve problemas do mundo real. Não
          entregamos apenas sensores; entregamos autonomia, previsibilidade e a confiança de que seu
          gerador está sob o olhar atento de um parceiro inteligente.
        </p>
      </section>
      <h1 class="text-2xl font-bold">Soluções personalizadas</h1>
      <div class="text-xl">
        <p>Na smartgen temos soluções personalizadas que simplifica a visualização dos dados.</p>
        <div class="flex flex-wrap place-content-center">
          <div class="border border-gray-200 p-2 m-1 rounded-lg flex flex-col w-65">
            <span>Visualizador de água</span>
            <WaterGauge :value="50" class="w-25 h-25 m-2"></WaterGauge>
          </div>
          <div class="border border-gray-200 p-2 m-1 rounded-lg flex flex-col w-65">
            <span>Visualizador de temperatura</span>
            <ThermometerGauge :value="50" class="w-35 h-35"></ThermometerGauge>
          </div>
        </div>
      </div>
    </main>
  </div>

  <footer
    class="bg-white border-t border-gray-100 py-4 text-center text-sm text-gray-400 mt-5 flex flex-wrap gap-5 justify-center"
  >
    <span>Smart gen&trade;</span>
    <a class="underline">sobre nós</a>
  </footer>
</template>

<style>
section {
  margin-bottom: 10px;
}
</style>
