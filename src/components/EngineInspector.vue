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

function tagColor(tag) {
  const map = {
    GATEWAY: 'bg-navy/10 text-navy',
    REDIS: 'bg-mint-light text-mint',
    LUA: 'bg-purple-50 text-purple-600',
    LOCK: 'bg-purple-50 text-purple-600',
    WORKER: 'bg-amber-light text-amber',
    POSTGRES: 'bg-sky-light text-sky',
    ERROR: 'bg-coral-light text-coral font-bold',
  };
  return map[tag] || 'bg-slate-100 text-slate-500';
}
</script>

<template>
  <div>
    <!-- Floating Button -->
    <div class="fixed bottom-5 right-5 z-40 print:hidden">
      <button
        @click="inspectorStore.toggleDrawer()"
        class="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white shadow-card-hover hover:shadow-elevated border border-slate-200 text-slate-600 text-[12px] font-semibold transition-all hover:scale-105 active:scale-95"
      >
        <span class="w-2 h-2 rounded-full bg-mint animate-pulse"></span>
        <span class="material-symbols-rounded text-[16px]">terminal</span>
        <span class="hidden sm:inline">Inspector</span>
      </button>
    </div>

    <!-- Drawer Panel -->
    <Transition name="slide">
      <div
        v-if="inspectorStore.isDrawerOpen"
        class="fixed inset-y-0 right-0 w-full sm:w-[440px] z-50 bg-white border-l border-slate-200 shadow-elevated flex flex-col print:hidden"
      >
        <!-- Header -->
        <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="material-symbols-rounded text-navy text-[20px]">troubleshoot</span>
            <div>
              <div class="font-bold text-sm text-slate-800">Engine Inspector</div>
              <div class="text-[11px] text-slate-400">Distributed Event Stream</div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button @click="inspectorStore.clearLogs()" class="text-[11px] text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg bg-slate-50 font-medium">Clear</button>
            <button @click="inspectorStore.toggleDrawer()" class="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500">
              <span class="material-symbols-rounded text-[16px]">close</span>
            </button>
          </div>
        </div>

        <!-- Node Health -->
        <div class="px-5 py-2.5 border-b border-slate-50 flex flex-wrap items-center gap-3 text-[11px] font-medium text-slate-400">
          <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full" :class="inspectorStore.nodes.gateway ? 'bg-mint' : 'bg-coral'"></span> Gateway</span>
          <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full" :class="inspectorStore.nodes.redis ? 'bg-mint' : 'bg-coral'"></span> Redis</span>
          <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full" :class="inspectorStore.nodes.worker ? 'bg-mint' : 'bg-coral'"></span> Worker</span>
          <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full" :class="inspectorStore.nodes.postgres ? 'bg-mint' : 'bg-coral'"></span> Postgres</span>
        </div>

        <!-- Log Stream -->
        <div ref="logContainer" class="flex-1 p-4 overflow-y-auto space-y-1.5 bg-slate-50/50">
          <div v-if="inspectorStore.logs.length === 0" class="text-center text-slate-400 py-10 text-sm">
            Belum ada event. Menunggu aktivitas sistem...
          </div>
          <div
            v-for="entry in inspectorStore.logs" :key="entry.id"
            class="flex items-start gap-2 text-[11px] leading-relaxed hover:bg-white p-1.5 rounded-lg transition-colors"
          >
            <span class="text-slate-300 font-mono shrink-0">{{ entry.time }}</span>
            <span class="px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0" :class="tagColor(entry.tag)">{{ entry.tag }}</span>
            <span class="text-slate-600">{{ entry.message }}</span>
          </div>
        </div>

        <!-- Stress Test Buttons -->
        <div class="p-4 border-t border-slate-100 space-y-2 bg-white">
          <div class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Simulasi Uji Beban</div>
          <div class="grid grid-cols-2 gap-2">
            <button @click="queueStore.simulateTrafficSpike()"
              class="px-3 py-2 rounded-xl bg-sky-light hover:bg-sky/10 text-sky text-[11px] font-bold flex items-center justify-center gap-1 transition-colors">
              <span class="material-symbols-rounded text-[14px]">bolt</span> +10k Fans
            </button>
            <button @click="ticketStore.simulateRaceCondition()"
              class="px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-600 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors">
              <span class="material-symbols-rounded text-[14px]">swords</span> 50 Bots vs 2
            </button>
            <button @click="inspectorStore.toggleWorkerHealth()"
              class="px-3 py-2 rounded-xl bg-amber-light hover:bg-amber/10 text-amber text-[11px] font-bold flex items-center justify-center gap-1 transition-colors">
              <span class="material-symbols-rounded text-[14px]">power_settings_new</span> Toggle Worker
            </button>
            <button @click="ticketStore.resetAll(); queueStore.resetQueue();"
              class="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors">
              <span class="material-symbols-rounded text-[14px]">refresh</span> Reset Semua
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.slide-enter-active, .slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-enter-from, .slide-leave-to {
  transform: translateX(100%);
}
</style>
