<script setup>
import { onMounted } from 'vue';
import { useQueueStore } from './stores/queueStore';
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
const authStore = useAuthStore();
</script>

<template>
  <div class="min-h-screen bg-white text-black antialiased flex flex-col font-body pattern-lines selection:bg-black selection:text-white">
    
    <!-- Top Sticky Admin Preview Bar (Minimalist Monochrome Inverted) -->
    <div 
      v-if="authStore.isAdmin && queueStore.currentStage !== 'admin'" 
      class="bg-black text-white text-xs font-mono py-2.5 px-4 flex items-center justify-between sticky top-0 z-50 border-b-2 border-black"
    >
      <div class="flex items-center gap-2.5">
        <span class="w-2 h-2 bg-white animate-pulse"></span>
        <SvgIcon name="crown" className="w-3.5 h-3.5 text-white" />
        <span class="uppercase tracking-widest text-[11px] font-bold">Admin Preview Active (Super Administrator)</span>
      </div>
      <div class="flex items-center gap-2">
        <button 
          @click="queueStore.setStage('admin')" 
          class="px-3 py-1 bg-white text-black font-mono font-bold text-[11px] uppercase tracking-wider hover:bg-black hover:text-white hover:border hover:border-white transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <SvgIcon name="bolt" className="w-3 h-3 text-black" />
          <span>Dashboard Admin</span>
        </button>
        <button 
          @click="authStore.logout(); queueStore.setStage('home')" 
          class="px-2.5 py-1 border border-white/40 hover:border-white text-white text-[11px] font-mono uppercase cursor-pointer transition-colors"
        >
          Logout
        </button>
      </div>
    </div>

    <!-- Header Navbar Publik -->
    <HeaderNavbar v-if="queueStore.currentStage !== 'admin'" />

    <!-- Main Content Stages -->
    <main class="flex-1 w-full" :class="queueStore.currentStage !== 'admin' ? 'pb-20' : ''">
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

    <!-- Editorial Monochrome Footer -->
    <footer v-if="queueStore.currentStage !== 'admin'" class="bg-white border-t-4 border-black py-12 text-center text-xs text-black">
      <div class="max-w-6xl mx-auto px-6 md:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="flex items-center gap-3 text-left">
          <div class="w-8 h-8 bg-black text-white flex items-center justify-center font-serif font-black text-sm">
            F
          </div>
          <div>
            <div class="font-serif font-black text-base tracking-tight uppercase">FLASHTIKET</div>
            <div class="text-[10px] font-mono tracking-widest text-[#525252] uppercase">Distributed Concurrency Engine · Zero-Overselling</div>
          </div>
        </div>

        <div class="flex items-center gap-6 font-mono text-[11px] uppercase tracking-wider text-[#525252]">
          <span class="hover:text-black hover:underline cursor-pointer transition-colors">Syarat &amp; Ketentuan</span>
          <span>/</span>
          <span class="hover:text-black hover:underline cursor-pointer transition-colors">Kebijakan Privasi</span>
          <span>/</span>
          <span class="hover:text-black hover:underline cursor-pointer transition-colors">Pusat Bantuan</span>
        </div>

        <div class="font-mono text-[10px] tracking-widest text-[#525252] uppercase">
          © 2026 FLASHTIKET INC. ALL RIGHTS RESERVED.
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
  transition: opacity 0.1s ease-out;
}
.stage-fade-enter-from,
.stage-fade-leave-to {
  opacity: 0;
}
</style>
