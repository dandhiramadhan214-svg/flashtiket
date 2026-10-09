<script setup>
import { onMounted } from 'vue';
import { useQueueStore } from './stores/queueStore';
import { useThemeStore } from './stores/themeStore';
import { useAuthStore } from './stores/authStore';

import HeaderNavbar from './components/HeaderNavbar.vue';
import StageHome from './components/StageHome.vue';
import StageLobby from './components/StageLobby.vue';
import StageQueue from './components/StageQueue.vue';
import StageSelection from './components/StageSelection.vue';
import StageCheckout from './components/StageCheckout.vue';
import StageTicket from './components/StageTicket.vue';
import StageWishlist from './components/StageWishlist.vue';
import StageAdmin from './components/StageAdmin.vue';
import AuthModal from './components/AuthModal.vue';
import MyTicketsModal from './components/MyTicketsModal.vue';
import HowToBuyModal from './components/HowToBuyModal.vue';
import ReviewModal from './components/ReviewModal.vue';
import ToastNotification from './components/ToastNotification.vue';
import SvgIcon from './components/SvgIcon.vue';

const queueStore = useQueueStore();
const themeStore = useThemeStore();
const authStore = useAuthStore();

onMounted(() => {
  themeStore.applyTheme();
});
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 antialiased flex flex-col font-sans transition-colors duration-200">
    
    <!-- Top Sticky Admin Preview Bar (Hanya tampil jika login sebagai admin dan sedang di tampilan publik) -->
    <div 
      v-if="authStore.isAdmin && queueStore.currentStage !== 'admin'" 
      class="bg-gradient-to-r from-amber-600 via-rose-600 to-indigo-700 text-white text-xs font-bold py-2 px-4 shadow-lg flex items-center justify-between sticky top-0 z-50 border-b border-white/20"
    >
      <div class="flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full bg-white animate-pulse"></span>
        <SvgIcon name="crown" className="w-4 h-4 text-amber-200" />
        <span>Mode Pratinjau Pengguna (Super Administrator)</span>
      </div>
      <div class="flex items-center gap-2">
        <button 
          @click="queueStore.setStage('admin')" 
          class="px-3 py-1 rounded-lg bg-white text-slate-900 font-extrabold text-xs hover:bg-slate-100 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <SvgIcon name="bolt" className="w-3.5 h-3.5 text-navy" />
          <span>Kembali ke Dashboard Admin</span>
        </button>
        <button 
          @click="authStore.logout(); queueStore.setStage('home')" 
          class="px-2.5 py-1 rounded-lg bg-black/30 hover:bg-black/50 text-white text-xs font-semibold cursor-pointer transition-colors"
        >
          Logout Admin
        </button>
      </div>
    </div>

    <!-- Header Navbar Publik (Sembunyikan saat di dashboard admin) -->
    <HeaderNavbar v-if="queueStore.currentStage !== 'admin'" />

    <!-- Main Content Stages -->
    <main class="flex-1 w-full" :class="queueStore.currentStage !== 'admin' ? 'pb-16' : ''">
      <transition name="stage-fade" mode="out-in">
        <StageHome v-if="queueStore.currentStage === 'home'" key="home" />
        <StageLobby v-else-if="queueStore.currentStage === 'lobby'" key="lobby" />
        <StageQueue v-else-if="queueStore.currentStage === 'queue'" key="queue" />
        <StageSelection v-else-if="queueStore.currentStage === 'selection'" key="selection" />
        <StageCheckout v-else-if="queueStore.currentStage === 'checkout'" key="checkout" />
        <StageTicket v-else-if="queueStore.currentStage === 'ticket'" key="ticket" />
        <StageWishlist v-else-if="queueStore.currentStage === 'wishlist'" key="wishlist" />
        <StageAdmin v-else-if="queueStore.currentStage === 'admin'" key="admin" />
      </transition>
    </main>

    <!-- Footer Yesplis Style (Sembunyikan saat di dashboard admin) -->
    <footer v-if="queueStore.currentStage !== 'admin'" class="bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 py-8 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
      <div class="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-lg bg-navy dark:bg-sky flex items-center justify-center text-white text-xs font-bold">
            <SvgIcon name="bolt" className="w-3.5 h-3.5 text-white" />
          </div>
          <span class="font-bold text-navy dark:text-sky">FlashTiket Indonesia</span>
          <span class="text-slate-400 dark:text-slate-500">© 2026. Official Ticketing Platform.</span>
        </div>
        <div class="flex items-center gap-4 text-slate-500 dark:text-slate-400">
          <span class="hover:text-navy dark:hover:text-white cursor-pointer transition-colors">Syarat &amp; Ketentuan</span>
          <span>·</span>
          <span class="hover:text-navy dark:hover:text-white cursor-pointer transition-colors">Kebijakan Privasi</span>
          <span>·</span>
          <span class="hover:text-navy dark:hover:text-white cursor-pointer transition-colors">Pusat Bantuan</span>
        </div>
      </div>
    </footer>

    <!-- Global Modals -->
    <AuthModal />
    <MyTicketsModal />
    <HowToBuyModal />
    <ReviewModal />
    <ToastNotification />
  </div>
</template>

<style scoped>
.stage-fade-enter-active,
.stage-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.stage-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.stage-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
