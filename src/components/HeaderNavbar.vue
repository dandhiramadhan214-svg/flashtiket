<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { useQueueStore } from '../stores/queueStore';
import { useEventsStore } from '../stores/eventsStore';
import { useAuthStore } from '../stores/authStore';
import { useWishlistStore } from '../stores/wishlistStore';
import { useThemeStore } from '../stores/themeStore';
import { useAdminStore } from '../stores/adminStore';
import SvgIcon from './SvgIcon.vue';

const queueStore = useQueueStore();
const eventsStore = useEventsStore();
const authStore = useAuthStore();
const wishlistStore = useWishlistStore();
const themeStore = useThemeStore();
const adminStore = useAdminStore();

const isUserMenuOpen = ref(false);
const isCategoryOpen = ref(false);
const isMobileMenuOpen = ref(false);
const isMobileCategoryExpanded = ref(false);

// Color mapping for each category — consistent with eventsStore.categoryColor
const categoryColorMap = {
  'Semua':          { dot: '#64748b', bg: '#f1f5f9', ring: '#94a3b8' },
  'Konser':         { dot: '#a855f7', bg: '#faf5ff', ring: '#c084fc' },
  'Festival':       { dot: '#4f8cff', bg: '#e8f0ff', ring: '#93b8ff' },
  'Olahraga':       { dot: '#00c48c', bg: '#e6faf3', ring: '#34d399' },
  'Seni & Budaya':  { dot: '#ffb800', bg: '#fff8e6', ring: '#fcd34d' },
  'Workshop':       { dot: '#ff5757', bg: '#fff0f0', ring: '#fca5a5' },
  'Esports':        { dot: '#1e266d', bg: '#eef0ff', ring: '#6366f1' },
};

// Count events per category
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

// Close dropdowns on outside click
function handleOutsideClick(e) {
  if (!e.target.closest('.category-dropdown-wrapper')) {
    isCategoryOpen.value = false;
  }
  if (!e.target.closest('.user-menu-wrapper')) {
    isUserMenuOpen.value = false;
  }
}

// Lock body scroll when mobile menu is open
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
  <header class="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 transition-colors duration-200">
    <!-- Top Utility Bar (Yesplis Style) -->
    <div class="bg-navy dark:bg-slate-950 text-white text-[11px] font-medium py-1.5 px-4 hidden sm:block border-b dark:border-slate-800/60">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <div class="flex items-center gap-4">
          <span class="flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-mint animate-pulse"></span>
            Platform Resmi Tiket Konser &amp; Festival
          </span>
          <span class="text-white/40">|</span>
          <span class="text-white/80">Transaksi Cepat &amp; Aman 100%</span>
        </div>
        <div class="flex items-center gap-4">
          <a href="#" class="text-white/80 hover:text-white transition-colors">Bantuan &amp; FAQ</a>
          <span class="text-white/40">|</span>
          <span class="text-mint font-semibold">Bahasa Indonesia (ID)</span>
        </div>
      </div>
    </div>

    <!-- Main Clean Navigation Bar -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
      
      <!-- Brand Logo (Always links to Beranda) -->
      <div class="flex items-center gap-2.5 sm:gap-3 shrink-0 cursor-pointer select-none" @click="goHome">
        <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-navy dark:bg-sky flex items-center justify-center shadow-soft hover:bg-navy-light transition-colors text-white">
          <SvgIcon name="bolt" className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        <div>
          <span class="text-base sm:text-lg font-extrabold text-navy dark:text-sky tracking-tight block leading-tight">FlashTiket</span>
          <span class="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-400 font-medium tracking-wider uppercase block">Portal Tiket Resmi</span>
        </div>
      </div>

      <!-- Center Nav Links with Color-Coded Category Dropdown (Desktop) -->
      <nav class="hidden md:flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300">
        <!-- Jelajah Event -->
        <button 
          @click="goHome"
          class="px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5"
          :class="queueStore.currentStage === 'home' && !isCategoryOpen ? 'text-navy dark:text-sky bg-slate-50 dark:bg-slate-800' : 'text-slate-500 dark:text-slate-300'"
        >
          <SvgIcon name="search" className="w-3.5 h-3.5" />
          <span>Jelajah Event</span>
        </button>

        <!-- Kategori Acara — Dropdown with Color Dots -->
        <div class="relative category-dropdown-wrapper">
          <button 
            @click.stop="isCategoryOpen = !isCategoryOpen"
            class="px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5"
            :class="isCategoryOpen ? 'text-navy dark:text-sky bg-slate-50 dark:bg-slate-800' : 'text-slate-500 dark:text-slate-300'"
          >
            <!-- Show active category color dot -->
            <span 
              class="w-2.5 h-2.5 rounded-full ring-2 ring-offset-1 transition-all"
              :style="{
                backgroundColor: categoryColorMap[eventsStore.activeCategory]?.dot || '#64748b',
                '--tw-ring-color': categoryColorMap[eventsStore.activeCategory]?.ring || '#94a3b8',
              }"
            ></span>
            <span>Kategori Acara</span>
            <!-- Chevron -->
            <svg 
              class="w-3 h-3 transition-transform duration-200" 
              :class="{ 'rotate-180': isCategoryOpen }"
              viewBox="0 0 20 20" fill="currentColor"
            >
              <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
            </svg>
          </button>

          <!-- Category Dropdown Panel -->
          <transition
            enter-active-class="transition ease-out duration-200"
            enter-from-class="opacity-0 translate-y-1 scale-95"
            enter-to-class="opacity-100 translate-y-0 scale-100"
            leave-active-class="transition ease-in duration-150"
            leave-from-class="opacity-100 translate-y-0 scale-100"
            leave-to-class="opacity-0 translate-y-1 scale-95"
          >
            <div 
              v-if="isCategoryOpen"
              class="absolute left-1/2 -translate-x-1/2 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-2 z-50"
            >
              <!-- Dropdown Header -->
              <div class="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pilih Kategori</div>
              </div>

              <!-- Category Items -->
              <button
                v-for="cat in eventsStore.categories"
                :key="cat"
                @click="selectCategory(cat)"
                class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 group"
                :class="eventsStore.activeCategory === cat 
                  ? 'bg-slate-50 dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700' 
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/70'"
              >
                <!-- Color Dot -->
                <span 
                  class="w-3 h-3 rounded-full ring-2 ring-offset-1 shrink-0 transition-transform group-hover:scale-125"
                  :style="{
                    backgroundColor: categoryColorMap[cat]?.dot || '#64748b',
                    '--tw-ring-color': categoryColorMap[cat]?.ring || '#94a3b8',
                  }"
                ></span>

                <!-- Label + Count -->
                <div class="flex-1 flex items-center justify-between">
                  <span 
                    class="text-xs font-semibold transition-colors"
                    :class="eventsStore.activeCategory === cat ? 'text-navy dark:text-sky' : 'text-slate-700 dark:text-slate-200 group-hover:text-navy dark:group-hover:text-sky'"
                  >
                    {{ cat }}
                  </span>
                  <span 
                    class="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    :style="{
                      backgroundColor: categoryColorMap[cat]?.bg || '#f1f5f9',
                      color: categoryColorMap[cat]?.dot || '#64748b',
                    }"
                  >
                    {{ countByCategory(cat) }}
                  </span>
                </div>

                <!-- Active Check -->
                <svg 
                  v-if="eventsStore.activeCategory === cat"
                  class="w-3.5 h-3.5 text-navy dark:text-sky shrink-0" 
                  viewBox="0 0 20 20" fill="currentColor"
                >
                  <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          </transition>
        </div>

        <!-- Cara Beli Tiket -->
        <button 
          @click="openHowToBuy"
          class="px-3 py-2 rounded-xl text-slate-500 dark:text-slate-300 hover:text-navy dark:hover:text-sky hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5"
        >
          <SvgIcon name="info" className="w-3.5 h-3.5" />
          <span>Cara Beli Tiket</span>
        </button>

        <!-- Admin Dashboard Portal (Hanya tampil jika login sebagai Admin) -->
        <button 
          v-if="authStore.isAdmin"
          @click="queueStore.setStage('admin')"
          class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:brightness-110 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0"
          title="Buka Live Dashboard Admin"
        >
          <span class="w-2 h-2 rounded-full bg-white animate-pulse"></span>
          <SvgIcon name="crown" className="w-3.5 h-3.5 text-white" />
          <span>Dashboard Admin</span>
        </button>
      </nav>

      <!-- Right Actions: Tiket Saya + Auth / Profile + Hamburger -->
      <div class="flex items-center gap-1.5 sm:gap-3">

        <!-- Theme Toggle (Neutral / System Auto-detect by default) -->
        <button
          @click="themeStore.cycleMode()"
          class="px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 transition-all"
          :title="themeStore.mode === 'system' ? 'Tema: Otomatis Netral (Mengikuti OS)' : (themeStore.mode === 'dark' ? 'Tema: Gelap (Dark)' : 'Tema: Terang (Light)')"
        >
          <SvgIcon v-if="themeStore.mode === 'system'" name="monitor" className="w-4 h-4 text-sky" />
          <SvgIcon v-else-if="themeStore.mode === 'dark'" name="moon" className="w-4 h-4 text-amber" />
          <SvgIcon v-else name="sun" className="w-4 h-4 text-amber" />
          <span class="text-[11px] hidden xl:inline">
            {{ themeStore.mode === 'system' ? 'Netral (OS)' : (themeStore.mode === 'dark' ? 'Gelap' : 'Terang') }}
          </span>
        </button>

        <!-- Wishlist Button (Desktop) -->
        <button
          @click="queueStore.setStage('wishlist')"
          class="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors"
          :class="queueStore.currentStage === 'wishlist' ? 'text-coral bg-coral/10' : 'text-slate-500 dark:text-slate-300 hover:text-coral hover:bg-coral/5'"
          title="Wishlist"
        >
          <SvgIcon name="heart" className="w-4 h-4" />
          <span 
            v-if="wishlistStore.count" 
            class="px-1.5 py-0.5 bg-coral/10 text-coral rounded-full text-[10px] font-bold"
          >
            {{ wishlistStore.count }}
          </span>
        </button>

        <!-- Tiket Saya Button -->
        <button
          @click="authStore.isMyTicketsOpen = true"
          class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-navy dark:hover:text-sky hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200/80 dark:border-slate-700"
        >
          <SvgIcon name="ticket" className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span class="hidden lg:inline">Tiket Saya</span>
          <span 
            v-if="authStore.currentUser.myTickets?.length" 
            class="px-1.5 py-0.5 bg-coral text-white rounded-full text-[10px] font-bold"
          >
            {{ authStore.currentUser.myTickets.length }}
          </span>
        </button>

        <!-- AUTH: When Logged OUT (Desktop) -->
        <template v-if="!authStore.isLoggedIn">
          <button
            @click="authStore.openLogin()"
            class="hidden sm:inline-flex px-4 py-2 rounded-xl text-xs font-bold text-navy hover:bg-slate-100 transition-all border border-slate-200"
          >
            Masuk
          </button>

          <button
            @click="authStore.openRegister()"
            class="hidden md:inline-flex px-4 py-2 rounded-xl text-xs font-bold bg-navy text-white hover:bg-navy-light shadow-soft transition-all"
          >
            Daftar
          </button>
        </template>

        <!-- AUTH: When Logged IN (Desktop) -->
        <div v-if="authStore.isLoggedIn" class="relative user-menu-wrapper hidden sm:block">
          <button 
            @click="isUserMenuOpen = !isUserMenuOpen"
            class="flex items-center gap-2 p-1 pl-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full transition-all"
          >
            <span class="text-xs font-bold text-slate-700 hidden lg:inline max-w-[100px] truncate">
              {{ authStore.currentUser.name.split(' ')[0] }}
            </span>
            <div class="w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {{ authStore.currentUser.avatarText || 'KP' }}
            </div>
          </button>

          <!-- Dropdown Profile Menu -->
          <div 
            v-if="isUserMenuOpen"
            class="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 text-xs space-y-1"
          >
            <div class="px-3 py-2 border-b border-slate-100">
              <div class="font-bold text-slate-800 text-sm truncate">{{ authStore.currentUser.name }}</div>
              <div class="text-[11px] text-slate-400 truncate">{{ authStore.currentUser.email }}</div>
            </div>

            <button 
              v-if="authStore.isAdmin"
              @click="queueStore.setStage('admin'); isUserMenuOpen = false;"
              class="w-full text-left px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold flex items-center gap-2"
            >
              <SvgIcon name="crown" className="w-4 h-4 text-amber-500" />
              <span>Dashboard Admin</span>
            </button>

            <button 
              @click="authStore.isMyTicketsOpen = true; isUserMenuOpen = false;"
              class="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 text-slate-700 font-semibold flex items-center gap-2"
            >
              <SvgIcon name="ticket" className="w-4 h-4 text-purple-600" />
              <span>Tiket Saya</span>
            </button>

            <button 
              @click="authStore.logout(); isUserMenuOpen = false;"
              class="w-full text-left px-3 py-2 rounded-xl hover:bg-coral-light text-coral font-semibold flex items-center gap-2"
            >
              <SvgIcon name="cancel" className="w-4 h-4 text-coral" />
              <span>Keluar / Logout</span>
            </button>
          </div>
        </div>

        <!-- ═══════════════ MOBILE HAMBURGER BUTTON ═══════════════ -->
        <button 
          @click="isMobileMenuOpen = !isMobileMenuOpen"
          class="md:hidden relative w-10 h-10 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors"
          :class="isMobileMenuOpen ? 'bg-slate-100' : ''"
        >
          <!-- Animated Hamburger → X -->
          <div class="w-5 h-4 flex flex-col justify-between relative">
            <span 
              class="block h-0.5 w-full bg-navy rounded-full transition-all duration-300 origin-center"
              :class="isMobileMenuOpen ? 'rotate-45 translate-y-[7px]' : ''"
            ></span>
            <span 
              class="block h-0.5 w-full bg-navy rounded-full transition-all duration-300"
              :class="isMobileMenuOpen ? 'opacity-0 scale-x-0' : ''"
            ></span>
            <span 
              class="block h-0.5 w-full bg-navy rounded-full transition-all duration-300 origin-center"
              :class="isMobileMenuOpen ? '-rotate-45 -translate-y-[7px]' : ''"
            ></span>
          </div>

          <!-- Notification dot when there are wishlist items -->
          <span 
            v-if="wishlistStore.count || authStore.currentUser.myTickets?.length"
            class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-coral animate-pulse"
          ></span>
        </button>

      </div>
    </div>

    <!-- ═══════════════ MOBILE SLIDE-DOWN DRAWER ═══════════════ -->
    <transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 -translate-y-4 max-h-0"
      enter-to-class="opacity-100 translate-y-0 max-h-[100vh]"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0 max-h-[100vh]"
      leave-to-class="opacity-0 -translate-y-4 max-h-0"
    >
      <div 
        v-if="isMobileMenuOpen"
        class="md:hidden bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 overflow-y-auto transition-colors"
        style="max-height: calc(100vh - 56px);"
      >
        <div class="px-4 py-4 space-y-3">

          <!-- User Profile Card (Mobile) -->
          <div v-if="authStore.isLoggedIn" class="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-4 flex items-center gap-3">
            <div class="w-11 h-11 rounded-full bg-navy dark:bg-sky text-white flex items-center justify-center font-bold text-sm shadow-sm">
              {{ authStore.currentUser.avatarText || 'KP' }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{{ authStore.currentUser.name }}</div>
              <div class="text-[11px] text-slate-400 truncate">{{ authStore.currentUser.email }}</div>
            </div>
          </div>

          <!-- Auth Buttons (Mobile, when logged out) -->
          <div v-if="!authStore.isLoggedIn" class="flex gap-2">
            <button
              @click="authStore.openLogin(); closeMobileMenu()"
              class="flex-1 py-3 rounded-2xl text-sm font-bold text-navy dark:text-sky border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-center"
            >
              Masuk
            </button>
            <button
              @click="authStore.openRegister(); closeMobileMenu()"
              class="flex-1 py-3 rounded-2xl text-sm font-bold bg-navy dark:bg-sky text-white hover:bg-navy-light shadow-soft transition-all text-center"
            >
              Daftar
            </button>
          </div>

          <!-- Theme Toggle (Mobile Quick Row) -->
          <div class="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div class="flex items-center gap-2.5">
              <SvgIcon v-if="themeStore.mode === 'system'" name="monitor" className="w-4 h-4 text-sky" />
              <SvgIcon v-else-if="themeStore.mode === 'dark'" name="moon" className="w-4 h-4 text-amber" />
              <SvgIcon v-else name="sun" className="w-4 h-4 text-amber" />
              <div>
                <div class="text-xs font-bold text-slate-700 dark:text-slate-200">Mode Tampilan</div>
                <div class="text-[10px] text-slate-400">
                  {{ themeStore.mode === 'system' ? 'Netral (Mengikuti Tema OS)' : (themeStore.mode === 'dark' ? 'Mode Gelap (Dark)' : 'Mode Terang (Light)') }}
                </div>
              </div>
            </div>
            <button
              @click="themeStore.cycleMode()"
              class="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm"
            >
              Ganti
            </button>
          </div>

          <!-- Divider -->
          <div class="border-t border-slate-100 dark:border-slate-800"></div>

          <!-- Navigation Items -->
          <div class="space-y-1">
            <!-- Jelajah Event -->
            <button 
              @click="goHome"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all"
              :class="queueStore.currentStage === 'home' ? 'bg-navy/5 dark:bg-sky/10 text-navy dark:text-sky' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'"
            >
              <SvgIcon name="search" className="w-5 h-5" />
              <span class="text-sm font-semibold">Jelajah Event</span>
            </button>

            <!-- Kategori Acara (Expandable) -->
            <div>
              <button 
                @click="isMobileCategoryExpanded = !isMobileCategoryExpanded"
                class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <span 
                  class="w-5 h-5 rounded-full ring-2 ring-offset-1 flex items-center justify-center"
                  :style="{
                    backgroundColor: categoryColorMap[eventsStore.activeCategory]?.dot || '#64748b',
                    '--tw-ring-color': categoryColorMap[eventsStore.activeCategory]?.ring || '#94a3b8',
                  }"
                ></span>
                <span class="text-sm font-semibold flex-1">Kategori Acara</span>
                <svg 
                  class="w-4 h-4 text-slate-400 transition-transform duration-200" 
                  :class="{ 'rotate-180': isMobileCategoryExpanded }"
                  viewBox="0 0 20 20" fill="currentColor"
                >
                  <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
                </svg>
              </button>

              <!-- Expanded Category Grid -->
              <transition
                enter-active-class="transition-all duration-200 ease-out"
                enter-from-class="opacity-0 max-h-0"
                enter-to-class="opacity-100 max-h-96"
                leave-active-class="transition-all duration-150 ease-in"
                leave-from-class="opacity-100 max-h-96"
                leave-to-class="opacity-0 max-h-0"
              >
                <div v-if="isMobileCategoryExpanded" class="overflow-hidden pl-4 pr-2 mt-1 space-y-0.5">
                  <button
                    v-for="cat in eventsStore.categories"
                    :key="cat"
                    @click="selectCategory(cat)"
                    class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group"
                    :class="eventsStore.activeCategory === cat 
                      ? 'bg-slate-50 dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'"
                  >
                    <span 
                      class="w-3 h-3 rounded-full ring-2 ring-offset-1 shrink-0"
                      :style="{
                        backgroundColor: categoryColorMap[cat]?.dot || '#64748b',
                        '--tw-ring-color': categoryColorMap[cat]?.ring || '#94a3b8',
                      }"
                    ></span>
                    <span 
                      class="text-xs font-semibold flex-1"
                      :class="eventsStore.activeCategory === cat ? 'text-navy dark:text-sky' : 'text-slate-600 dark:text-slate-300'"
                    >
                      {{ cat }}
                    </span>
                    <span 
                      class="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      :style="{
                        backgroundColor: categoryColorMap[cat]?.bg || '#f1f5f9',
                        color: categoryColorMap[cat]?.dot || '#64748b',
                      }"
                    >
                      {{ countByCategory(cat) }}
                    </span>
                    <svg 
                      v-if="eventsStore.activeCategory === cat"
                      class="w-3.5 h-3.5 text-navy dark:text-sky shrink-0" 
                      viewBox="0 0 20 20" fill="currentColor"
                    >
                      <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </div>
              </transition>
            </div>

            <!-- Cara Beli Tiket -->
            <button 
              @click="openHowToBuy"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              <SvgIcon name="info" className="w-5 h-5" />
              <span class="text-sm font-semibold">Cara Beli Tiket</span>
            </button>

            <!-- Admin Dashboard (Mobile) -->
            <button 
              v-if="authStore.isAdmin"
              @click="queueStore.setStage('admin'); closeMobileMenu();"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left bg-gradient-to-r from-amber-500/10 to-rose-500/10 text-amber-600 dark:text-amber-400 hover:brightness-105 transition-all font-bold"
            >
              <span class="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              <SvgIcon name="crown" className="w-4 h-4 text-amber-500" />
              <span class="text-sm font-bold flex-1">Dashboard Admin</span>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600">AKTIF</span>
            </button>

            <!-- Wishlist -->
            <button 
              @click="queueStore.setStage('wishlist'); closeMobileMenu()"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all"
              :class="queueStore.currentStage === 'wishlist' ? 'text-coral bg-coral/5 dark:bg-coral/10' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'"
            >
              <SvgIcon name="heart" className="w-5 h-5" />
              <span class="text-sm font-semibold flex-1">Wishlist</span>
              <span 
                v-if="wishlistStore.count" 
                class="px-2 py-0.5 bg-coral/10 text-coral rounded-full text-xs font-bold"
              >
                {{ wishlistStore.count }}
              </span>
            </button>

            <!-- Tiket Saya -->
            <button 
              @click="authStore.isMyTicketsOpen = true; closeMobileMenu()"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              <SvgIcon name="ticket" className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span class="text-sm font-semibold flex-1">Tiket Saya</span>
              <span 
                v-if="authStore.currentUser.myTickets?.length" 
                class="px-2 py-0.5 bg-coral text-white rounded-full text-xs font-bold"
              >
                {{ authStore.currentUser.myTickets.length }}
              </span>
            </button>
          </div>

          <!-- Divider -->
          <div class="border-t border-slate-100 dark:border-slate-800"></div>

          <!-- Logout (Mobile) -->
          <button 
            v-if="authStore.isLoggedIn"
            @click="authStore.logout(); closeMobileMenu()"
            class="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left text-coral hover:bg-coral/5 transition-all"
          >
            <SvgIcon name="cancel" className="w-5 h-5 text-coral" />
            <span class="text-sm font-semibold">Keluar / Logout</span>
          </button>

          <!-- Footer Info -->
          <div class="pt-2 pb-1 text-center">
            <span class="text-[10px] text-slate-300 dark:text-slate-600 font-medium">FlashTiket © 2026 — Portal Tiket Resmi</span>
          </div>
        </div>
      </div>
    </transition>
  </header>
</template>
