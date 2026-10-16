<script setup>
import { ref, watch, nextTick } from 'vue';
import { useInspectorStore } from '../stores/inspectorStore';
import { useQueueStore } from '../stores/queueStore';
import { useTicketStore } from '../stores/ticketStore';

const inspectorStore = useInspectorStore();
const queueStore = useQueueStore();
const ticketStore = useTicketStore();

const logContainer = ref(null);

watch(
  () => inspectorStore.logs.length,
  async () => {
    await nextTick();
    if (logContainer.value) logContainer.value.scrollTop = logContainer.value.scrollHeight;
  }
);
</script>

<template>
  <div class="font-mono">
    <!-- Floating Button (Minimalist Monochrome) -->
    <div class="fixed bottom-6 right-6 z-40 print:hidden">
      <button
        @click="inspectorStore.toggleDrawer()"
        class="flex items-center gap-2 px-4 py-2 bg-black text-white border-2 border-black text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors shadow-none cursor-pointer"
      >
        <span class="w-2 h-2 bg-white inline-block"></span>
        <span>TELEMETRY INSPECTOR</span>
      </button>
    </div>

    <!-- Drawer Panel -->
    <div
      v-if="inspectorStore.isDrawerOpen"
      class="fixed inset-y-0 right-0 w-full sm:w-[480px] z-50 bg-white border-l-4 border-black flex flex-col print:hidden font-mono"
    >
      <!-- Header -->
      <div class="p-5 border-b-2 border-black flex items-center justify-between bg-black text-white">
        <div>
          <div class="font-bold text-sm tracking-wider uppercase">ENGINE TELEMETRY INSPECTOR</div>
          <div class="text-[10px] text-white/60">Distributed Cluster Event Log</div>
        </div>
        <div class="flex items-center gap-3">
          <button 
            @click="inspectorStore.clearLogs()" 
            class="text-[10px] uppercase text-white/70 hover:text-white underline cursor-pointer"
          >
            [Clear]
          </button>
          <button 
            @click="inspectorStore.toggleDrawer()" 
            class="w-7 h-7 border border-white text-white hover:bg-white hover:text-black flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- Node Health Indicators -->
      <div class="px-5 py-3 border-b-2 border-black flex flex-wrap items-center gap-4 text-[10px] uppercase font-bold bg-[#F5F5F5]">
        <span class="flex items-center gap-1.5"><span class="w-2 h-2" :class="inspectorStore.nodes.gateway ? 'bg-black' : 'border border-black'"></span> GATEWAY</span>
        <span class="flex items-center gap-1.5"><span class="w-2 h-2" :class="inspectorStore.nodes.redis ? 'bg-black' : 'border border-black'"></span> REDIS V7</span>
        <span class="flex items-center gap-1.5"><span class="w-2 h-2" :class="inspectorStore.nodes.worker ? 'bg-black' : 'border border-black'"></span> WORKER</span>
        <span class="flex items-center gap-1.5"><span class="w-2 h-2" :class="inspectorStore.nodes.postgres ? 'bg-black' : 'border border-black'"></span> POSTGRES</span>
      </div>

      <!-- Log Stream -->
      <div ref="logContainer" class="flex-1 p-4 overflow-y-auto space-y-2 bg-white text-xs">
        <div v-if="inspectorStore.logs.length === 0" class="text-center text-[#525252] py-12 text-xs uppercase">
          Menunggu aktivitas sistem terdistribusi...
        </div>
        <div
          v-for="entry in inspectorStore.logs" :key="entry.id"
          class="border-b border-[#E5E5E5] pb-2 text-[11px] leading-relaxed space-y-0.5"
        >
          <div class="flex items-center gap-2">
            <span class="text-[#525252] text-[10px]">{{ entry.time }}</span>
            <span class="px-1.5 py-0.2 border border-black text-[9px] font-bold bg-black text-white uppercase">{{ entry.tag }}</span>
          </div>
          <div class="text-black font-mono pl-1">{{ entry.message }}</div>
        </div>
      </div>

      <!-- Stress Test Buttons -->
      <div class="p-5 border-t-2 border-black space-y-3 bg-[#F5F5F5]">
        <div class="text-[10px] font-bold text-[#525252] uppercase tracking-wider">Simulasi Stres Beban</div>
        <div class="grid grid-cols-2 gap-3">
          <button @click="queueStore.simulateTrafficSpike()"
            class="px-3 py-2.5 border-2 border-black bg-white hover:bg-black hover:text-white text-black text-[10px] font-bold uppercase transition-colors cursor-pointer text-center">
            Injeksi 500 Pengantre
          </button>
          <button @click="ticketStore.simulateRaceCondition()"
            class="px-3 py-2.5 border-2 border-black bg-black text-white hover:bg-white hover:text-black text-[10px] font-bold uppercase transition-colors cursor-pointer text-center">
            Uji 50 Bot Serentak
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
