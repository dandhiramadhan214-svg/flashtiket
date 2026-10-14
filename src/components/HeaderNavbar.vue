<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { useQueueStore } from '../stores/queueStore';
import { useEventsStore } from '../stores/eventsStore';
import { useAuthStore } from '../stores/authStore';
import { useWishlistStore } from '../stores/wishlistStore';
import { useAdminStore } from '../stores/adminStore';
import SvgIcon from './SvgIcon.vue';

const queueStore = useQueueStore();
const eventsStore = useEventsStore();
const authStore = useAuthStore();
const wishlistStore = useWishlistStore();
const adminStore = useAdminStore();

const isUserMenuOpen = ref(false);
const isCategoryOpen = ref(false);
const isMobileMenuOpen = ref(false);
const isMobileCategoryExpanded = ref(false);

function countByCategory(cat) {
  if (cat === 'Semua') return eventsStore.events.length;
  return eventsStore.events.filter(e => e.category === cat).length;
}

function goHome() {
  queueStore.setStage('home');
  closeMobileMenu();
}

function selectCategory(cat) {
  eventsStore.activeCategory = cat;
  isCategoryOpen.value = false;
  queueStore.setStage('home');
  closeMobileMenu();
}

function openHowToBuy() {
  queueStore.isGuideModalOpen = true;
  closeMobileMenu();
}

function closeMobileMenu() {
  isMobileMenuOpen.value = false;
  isMobileCategoryExpanded.value = false;
}

function handleOutsideClick(e) {
  if (!e.target.closest('.category-dropdown-wrapper')) {
    isCategoryOpen.value = false;
  }
  if (!e.target.closest('.user-menu-wrapper')) {
    isUserMenuOpen.value = false;
  }
}

watch(isMobileMenuOpen, (val) => {
  document.body.style.overflow = val ? 'hidden' : '';
});

onMounted(() => {
  document.addEventListener('click', handleOutsideClick);
});
onBeforeUnmount(() => {
  document.removeEventListener('click', handleOutsideClick);
  document.body.style.overflow = '';
});
</script>

<template>
  <header class="sticky top-0 z-40 bg-white border-b-2 border-black">
    <!-- Top Editorial Rule Bar -->
    <div class="bg-black text-white text-[10px] font-mono tracking-widest py-1.5 px-4 hidden sm:block border-b border-black">
      <div class="max-w-6xl mx-auto flex items-center justify-between">
        <div class="flex items-center gap-4">
          <span class="flex items-center gap-2">
            <span class="w-1.5 h-1.5 bg-white"></span>
            <span>OFFICIAL CONCERT PASS &amp; TICKET RESERVATION ENGINE</span>
          </span>
          <span class="text-white/40">/</span>
          <span class="text-white/80">HIGH CONCURRENCY · ZERO OVERSELLING</span>
        </div>
        <div class="flex items-center gap-4 uppercase">
          <span class="text-white/70">EDITION 2026</span>
          <span class="text-white/40">/</span>
          <span class="text-white font-bold">JAKARTA — ASIA</span>
        </div>
      </div>
    </div>

    <!-- Main Navigation Bar -->
    <div class="max-w-6xl mx-auto px-6 md:px-8 h-16 flex items-center justify-between gap-4">
      
      <!-- Brand Logo (Editorial Serif) -->
      <div class="flex items-center gap-3 cursor-pointer select-none group" @click="goHome">
        <div class="w-9 h-9 bg-black text-white flex items-center justify-center font-serif font-black text-base border-2 border-black group-hover:bg-white group-hover:text-black transition-colors">
          F
        </div>
        <div>
          <span class="text-lg font-serif font-black tracking-tight block leading-none">FLASHTIKET</span>
          <span class="text-[9px] font-mono text-[#525252] tracking-widest uppercase block mt-0.5">TERDISTRIBUSI · RESMI</span>
        </div>
      </div>

      <!-- Center Desktop Nav Links -->
      <nav class="hidden md:flex items-center gap-2 font-mono text-xs uppercase tracking-wider">
        <!-- Jelajah Event -->
        <button 
          @click="goHome"
          class="px-3.5 py-2 border transition-all cursor-pointer"
          :class="queueStore.currentStage === 'home' && !isCategoryOpen ? 'bg-black text-white border-black' : 'border-transparent text-black hover:border-black'"
        >
          <span>Katalog Acara</span>
        </button>

        <!-- Kategori Acara Dropdown -->
        <div class="relative category-dropdown-wrapper">
          <button 
            @click.stop="isCategoryOpen = !isCategoryOpen"
            class="px-3.5 py-2 border transition-all flex items-center gap-2 cursor-pointer"
            :class="isCategoryOpen ? 'bg-black text-white border-black' : 'border-transparent text-black hover:border-black'"
          >
            <span>Kategori [{{ eventsStore.activeCategory }}]</span>
            <span class="text-[10px]">▼</span>
          </button>

          <!-- Category Dropdown Panel -->
          <div 
            v-if="isCategoryOpen"
            class="absolute left-0 mt-2 w-60 bg-white border-2 border-black p-1 z-50 shadow-none"
          >
            <div class="px-3 py-2 border-b border-black text-[10px] font-mono text-[#525252] uppercase tracking-widest">
              Pilih Kategori
            </div>

            <button
              v-for="cat in eventsStore.categories"
              :key="cat"
              @click="selectCategory(cat)"
              class="w-full flex items-center justify-between px-3 py-2 text-left font-mono text-xs uppercase transition-colors cursor-pointer"
              :class="eventsStore.activeCategory === cat ? 'bg-black text-white' : 'hover:bg-black hover:text-white'"
            >
              <span>{{ cat }}</span>
              <span class="text-[10px] font-mono opacity-60">({{ countByCategory(cat) }})</span>
            </button>
          </div>
        </div>

        <!-- Panduan Beli Tiket -->
        <button 
          @click="openHowToBuy"
          class="px-3.5 py-2 border border-transparent hover:border-black text-black transition-all cursor-pointer"
        >
          <span>Panduan</span>
        </button>

        <!-- Admin Dashboard Portal (Jika Login Sebagai Admin) -->
        <button 
          v-if="authStore.isAdmin"
          @click="queueStore.setStage('admin')"
          class="px-3 py-1.5 bg-black text-white font-mono text-xs uppercase tracking-wider border-2 border-black hover:bg-white hover:text-black transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <span class="w-2 h-2 bg-white"></span>
          <span>Admin Portal</span>
        </button>
      </nav>

      <!-- Right Actions -->
      <div class="flex items-center gap-2 sm:gap-3">

        <!-- Wishlist Button -->
        <button
          @click="queueStore.setStage('wishlist')"
          class="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 border border-black font-mono text-xs uppercase tracking-wider text-black hover:bg-black hover:text-white transition-all cursor-pointer"
          title="Wishlist"
        >
          <span>Favorit</span>
          <span v-if="wishlistStore.count" class="font-bold">[{{ wishlistStore.count }}]</span>
        </button>

        <!-- Tiket Saya Button -->
        <button
          @click="authStore.isMyTicketsOpen = true"
          class="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 border-2 border-black font-mono text-xs uppercase tracking-wider text-black hover:bg-black hover:text-white transition-all cursor-pointer"
        >
          <span>Tiket Saya</span>
          <span 
            v-if="authStore.currentUser.myTickets?.length" 
            class="px-1.5 py-0.2 bg-black text-white text-[10px] font-bold group-hover:bg-white group-hover:text-black border border-black"
          >
            {{ authStore.currentUser.myTickets.length }}
          </span>
        </button>

        <!-- AUTH: When Logged OUT -->
        <template v-if="!authStore.isLoggedIn">
          <button
            @click="authStore.openLogin()"
            class="hidden sm:inline-flex px-4 py-2 border-2 border-black font-mono text-xs uppercase tracking-widest text-black hover:bg-black hover:text-white transition-all cursor-pointer"
          >
            Masuk
          </button>

          <button
            @click="authStore.openRegister()"
            class="hidden md:inline-flex px-4 py-2 bg-black text-white font-mono text-xs uppercase tracking-widest border-2 border-black hover:bg-white hover:text-black transition-all cursor-pointer"
          >
            Daftar
          </button>
        </template>

        <!-- AUTH: When Logged IN -->
        <div v-if="authStore.isLoggedIn" class="relative user-menu-wrapper hidden sm:block">
          <button 
            @click="isUserMenuOpen = !isUserMenuOpen"
            class="flex items-center gap-2 px-3 py-1.5 border-2 border-black bg-white hover:bg-black hover:text-white transition-all cursor-pointer font-mono text-xs uppercase"
          >
            <span class="font-bold max-w-[120px] truncate">
              {{ authStore.currentUser.name.split(' ')[0] }}
            </span>
            <span class="w-6 h-6 bg-black text-white flex items-center justify-center font-bold text-[10px]">
              {{ authStore.currentUser.avatarText || 'KP' }}
            </span>
          </button>

          <!-- Dropdown Profile Menu -->
          <div 
            v-if="isUserMenuOpen"
            class="absolute right-0 mt-2 w-56 bg-white border-2 border-black p-1 z-50 text-xs font-mono uppercase"
          >
            <div class="px-3 py-2 border-b border-black">
              <div class="font-bold text-black text-xs truncate">{{ authStore.currentUser.name }}</div>
              <div class="text-[10px] text-[#525252] truncate lowercase">{{ authStore.currentUser.email }}</div>
            </div>

            <button 
              v-if="authStore.isAdmin"
              @click="queueStore.setStage('admin'); isUserMenuOpen = false;"
              class="w-full text-left px-3 py-2 text-black hover:bg-black hover:text-white transition-colors flex items-center gap-2 cursor-pointer font-bold"
            >
              <span>[Admin Dashboard]</span>
            </button>

            <button 
              @click="authStore.isMyTicketsOpen = true; isUserMenuOpen = false;"
              class="w-full text-left px-3 py-2 text-black hover:bg-black hover:text-white transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span>Tiket Saya</span>
            </button>

            <button 
              @click="authStore.logout(); isUserMenuOpen = false;"
              class="w-full text-left px-3 py-2 text-black hover:bg-black hover:text-white border-t border-black transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span>Keluar / Logout</span>
            </button>
          </div>
        </div>

        <!-- MOBILE HAMBURGER BUTTON -->
        <button 
          @click="isMobileMenuOpen = !isMobileMenuOpen"
          class="md:hidden w-10 h-10 border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors cursor-pointer"
        >
          <span class="font-mono text-xs font-bold">{{ isMobileMenuOpen ? '✕' : '☰' }}</span>
        </button>

      </div>
    </div>

    <!-- MOBILE SLIDE-DOWN DRAWER -->
    <div 
      v-if="isMobileMenuOpen"
      class="md:hidden bg-white border-t-2 border-black overflow-y-auto"
      style="max-height: calc(100vh - 64px);"
    >
      <div class="p-6 space-y-4 font-mono uppercase text-xs">

        <!-- User Profile Card (Mobile) -->
        <div v-if="authStore.isLoggedIn" class="border-2 border-black p-4 flex items-center gap-3">
          <div class="w-10 h-10 bg-black text-white flex items-center justify-center font-bold text-xs">
            {{ authStore.currentUser.avatarText || 'KP' }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-bold text-black text-sm truncate">{{ authStore.currentUser.name }}</div>
            <div class="text-[10px] text-[#525252] truncate lowercase">{{ authStore.currentUser.email }}</div>
          </div>
        </div>

        <!-- Auth Buttons (Mobile, when logged out) -->
        <div v-if="!authStore.isLoggedIn" class="flex gap-2">
          <button
            @click="authStore.openLogin(); closeMobileMenu()"
            class="flex-1 py-3 border-2 border-black font-bold text-center hover:bg-black hover:text-white transition-colors cursor-pointer"
          >
            Masuk
          </button>
          <button
            @click="authStore.openRegister(); closeMobileMenu()"
            class="flex-1 py-3 bg-black text-white border-2 border-black font-bold text-center hover:bg-white hover:text-black transition-colors cursor-pointer"
          >
            Daftar
          </button>
        </div>

        <!-- Navigation Links -->
        <div class="space-y-1 pt-2 border-t border-black">
          <button 
            @click="goHome"
            class="w-full text-left py-2.5 px-3 border border-transparent hover:border-black hover:bg-black hover:text-white transition-colors cursor-pointer"
          >
            Katalog Acara
          </button>

          <button 
            @click="openHowToBuy"
            class="w-full text-left py-2.5 px-3 border border-transparent hover:border-black hover:bg-black hover:text-white transition-colors cursor-pointer"
          >
            Panduan Pembelian
          </button>

          <button 
            @click="queueStore.setStage('wishlist'); closeMobileMenu()"
            class="w-full text-left py-2.5 px-3 border border-transparent hover:border-black hover:bg-black hover:text-white transition-colors cursor-pointer"
          >
            Favorit ({{ wishlistStore.count }})
          </button>

          <button 
            @click="authStore.isMyTicketsOpen = true; closeMobileMenu()"
            class="w-full text-left py-2.5 px-3 border border-transparent hover:border-black hover:bg-black hover:text-white transition-colors cursor-pointer"
          >
            Tiket Saya ({{ authStore.currentUser.myTickets?.length || 0 }})
          </button>

          <button 
            v-if="authStore.isAdmin"
            @click="queueStore.setStage('admin'); closeMobileMenu();"
            class="w-full text-left py-2.5 px-3 bg-black text-white border-2 border-black hover:bg-white hover:text-black transition-colors cursor-pointer"
          >
            [Dashboard Admin]
          </button>

          <button 
            v-if="authStore.isLoggedIn"
            @click="authStore.logout(); closeMobileMenu()"
            class="w-full text-left py-2.5 px-3 border-t border-black text-[#525252] hover:text-black transition-colors cursor-pointer pt-3"
          >
            Keluar / Logout
          </button>
        </div>

      </div>
    </div>
  </header>
</template>
