<script setup>
import { useNotifStore } from '../stores/notifStore';
import SvgIcon from './SvgIcon.vue';

const notifStore = useNotifStore();
</script>

<template>
  <!-- Toast Container — Fixed Top Right (Minimalist Monochrome) -->
  <div class="fixed top-20 right-4 z-[100] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)] pointer-events-none font-mono">
    <transition-group
      enter-active-class="transition-all duration-100 ease-out"
      enter-from-class="opacity-0 translate-x-4"
      enter-to-class="opacity-100 translate-x-0"
      leave-active-class="transition-all duration-100 ease-in"
      leave-from-class="opacity-100 translate-x-0"
      leave-to-class="opacity-0 translate-x-4"
    >
      <div
        v-for="notif in notifStore.notifications"
        :key="notif.id"
        class="pointer-events-auto border-2 border-black p-3.5 bg-white text-black shadow-none flex items-start gap-3 cursor-pointer group hover:bg-black hover:text-white transition-colors"
        @click="notifStore.dismiss(notif.id)"
      >
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5 mb-1 text-xs font-bold uppercase tracking-wider">
            <span class="w-2 h-2 bg-black group-hover:bg-white inline-block"></span>
            <span class="truncate">{{ notif.title }}</span>
          </div>
          <p class="font-body text-[11px] opacity-80 leading-relaxed">{{ notif.message }}</p>
        </div>

        <button 
          class="shrink-0 text-xs font-mono opacity-50 group-hover:opacity-100 font-bold"
          @click.stop="notifStore.dismiss(notif.id)"
        >
          [✕]
        </button>
      </div>
    </transition-group>
  </div>
</template>
