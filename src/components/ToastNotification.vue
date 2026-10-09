<script setup>
import { useNotifStore } from '../stores/notifStore';
import SvgIcon from './SvgIcon.vue';

const notifStore = useNotifStore();

const typeConfig = {
  success: { icon: 'check', bg: 'bg-mint/10', border: 'border-mint/30', text: 'text-mint', dot: 'bg-mint' },
  error:   { icon: 'cancel', bg: 'bg-coral/10', border: 'border-coral/30', text: 'text-coral', dot: 'bg-coral' },
  warning: { icon: 'warning', bg: 'bg-amber/10', border: 'border-amber/30', text: 'text-amber', dot: 'bg-amber' },
  info:    { icon: 'info', bg: 'bg-sky/10', border: 'border-sky/30', text: 'text-sky', dot: 'bg-sky' },
};

function getConfig(type) {
  return typeConfig[type] || typeConfig.info;
}
</script>

<template>
  <!-- Toast Container — Fixed Top Right -->
  <div class="fixed top-20 right-4 z-[100] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)] pointer-events-none">
    <transition-group
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 translate-x-8 scale-95"
      enter-to-class="opacity-100 translate-x-0 scale-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 translate-x-0 scale-100"
      leave-to-class="opacity-0 translate-x-8 scale-95"
    >
      <div
        v-for="notif in notifStore.notifications"
        :key="notif.id"
        class="pointer-events-auto rounded-2xl border p-3 shadow-elevated backdrop-blur-md flex items-start gap-3 cursor-pointer group bg-white/95 dark:bg-slate-900/95"
        :class="[getConfig(notif.type).bg, getConfig(notif.type).border]"
        @click="notifStore.dismiss(notif.id)"
      >
        <!-- Icon -->
        <div 
          class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          :class="getConfig(notif.type).bg"
        >
          <SvgIcon :name="getConfig(notif.type).icon" :className="'w-4 h-4 ' + getConfig(notif.type).text" />
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5 mb-0.5">
            <span 
              class="w-1.5 h-1.5 rounded-full animate-pulse"
              :class="getConfig(notif.type).dot"
            ></span>
            <span class="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{{ notif.title }}</span>
          </div>
          <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">{{ notif.message }}</p>
        </div>

        <!-- Close -->
        <button 
          class="shrink-0 w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          @click.stop="notifStore.dismiss(notif.id)"
        >
          <SvgIcon name="cancel" className="w-3 h-3 text-slate-400" />
        </button>
      </div>
    </transition-group>
  </div>
</template>
