<script setup>
import { computed } from 'vue';
import { useEventsStore } from '../stores/eventsStore';
import { useQueueStore } from '../stores/queueStore';
import { useTicketStore } from '../stores/ticketStore';
import { useWishlistStore } from '../stores/wishlistStore';
import { useNotifStore } from '../stores/notifStore';
import { useReviewStore } from '../stores/reviewStore';
import { useAuthStore } from '../stores/authStore';
import SvgIcon from './SvgIcon.vue';

const eventsStore = useEventsStore();
const queueStore = useQueueStore();
const ticketStore = useTicketStore();
const wishlistStore = useWishlistStore();
const notifStore = useNotifStore();
const reviewStore = useReviewStore();
const authStore = useAuthStore();

function handleEventClick(event) {
  if (event.status === 'ended') {
    reviewStore.openReviewModal(event);
    return;
  }
  if (event.status === 'sold-out') {
    notifStore.push('error', 'Tiket Habis', `Seluruh kuota tiket "${event.title}" telah habis terjual (Sold Out).`);
    return;
  }
  if (event.status === 'coming-soon') {
    notifStore.push('info', 'Segera Dibuka', `Tiket "${event.title}" akan segera dibuka.`);
    return;
  }

  // Ensure user is logged in before booking
  if (!authStore.isLoggedIn) {
    eventsStore.selectEvent(event.id);
    notifStore.push(
      'warning',
      'Wajib Punya Akun',
      'Anda harus memiliki akun dan masuk (login) terlebih dahulu sebelum dapat memesan tiket!'
    );
    authStore.openLogin();
    return;
  }

  eventsStore.selectEvent(event.id);
  ticketStore.resetAll();
  queueStore.setStage('lobby');
}

function toggleWishlist(e, event) {
  e.stopPropagation();
  const already = wishlistStore.isWishlisted(event.id);
  wishlistStore.toggle(event.id);
  if (already) {
    notifStore.push('info', 'Wishlist', `"${event.title}" dihapus dari favorit.`);
  } else {
    notifStore.push('success', 'Wishlist', `"${event.title}" disimpan ke favorit.`);
  }
}

const bannerEvent = computed(() => {
  return eventsStore.events.find(e => e.hot && e.status === 'on-sale') || eventsStore.events[0];
});
</script>

<template>
  <div class="max-w-6xl mx-auto px-6 md:px-8 py-8 space-y-16">
    
    <!-- ═══════════════ 1. OVERSIZED HERO STATEMENT ═══════════════ -->
    <section class="pt-6 pb-12 border-b-4 border-black">
      <div class="flex items-center justify-between font-mono text-[11px] uppercase tracking-widest text-[#525252] mb-6 border-b border-black pb-3">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 bg-black inline-block"></span>
          <span>FLASHTIKET ARCHITECTURAL ENGINE</span>
        </div>
        <div class="hidden sm:block">
          ZERO-TOLERANCE OVERSELLING · HIGH CONCURRENCY
        </div>
      </div>

      <!-- Oversized Hero Headlines (8xl / 9xl) -->
      <h1 class="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-serif font-black tracking-tighter leading-none text-black uppercase">
        PRESISI.<br/>
        <span class="italic font-normal">SATU DETIK.</span>
      </h1>

      <div class="mt-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
        <div class="md:col-span-8">
          <p class="drop-cap font-body text-base md:text-lg text-[#525252] leading-relaxed max-w-2xl">
            Sistem pemesanan tiket konser dengan teknologi antrean terdistribusi. Ditenagai oleh evaluasi atomik script Lua di RAM Redis v7 dan penguncian kursi TTL 600 detik, menjamin kepastian alokasi kuota tanpa risiko kelebihan jual dalam lonjakan ribuan pengunjung serentak.
          </p>
        </div>

        <div class="md:col-span-4 flex flex-col sm:flex-row md:flex-col gap-3 font-mono text-xs uppercase">
          <button 
            @click="handleEventClick(bannerEvent)"
            class="btn-mono-primary w-full text-center"
          >
            <span>War Tiket Konser →</span>
          </button>
          <button 
            @click="queueStore.isGuideModalOpen = true"
            class="btn-mono-secondary w-full text-center"
          >
            <span>Protokol Antrean</span>
          </button>
        </div>
      </div>
    </section>

    <!-- ═══════════════ 2. FEATURED CONCERT EDITORIAL BANNER ═══════════════ -->
    <section class="space-y-4">
      <div class="flex items-center justify-between font-mono text-[11px] uppercase tracking-widest text-[#525252]">
        <span>[01 / SOROTAN UTAMA]</span>
        <span>STATUS: PENJUALAN DIBUKA</span>
      </div>

      <div 
        @click="handleEventClick(bannerEvent)"
        class="border-2 border-black bg-white cursor-pointer group transition-all duration-100"
      >
        <div class="grid grid-cols-1 lg:grid-cols-12">
          <!-- Image Section (Grayscale by default, scales on hover) -->
          <div class="lg:col-span-7 h-72 sm:h-96 lg:h-auto border-b-2 lg:border-b-0 lg:border-r-2 border-black relative overflow-hidden bg-black">
            <div 
              class="w-full h-full bg-cover bg-center grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-300"
              :style="{ backgroundImage: bannerEvent.image ? `url('${bannerEvent.image}')` : 'none' }"
            ></div>
            <div class="absolute top-4 left-4 font-mono text-[10px] uppercase tracking-widest bg-black text-white px-3 py-1 border border-white">
              POPULER / TRENDING
            </div>
          </div>

          <!-- Editorial Content Section -->
          <div class="lg:col-span-5 p-8 sm:p-10 flex flex-col justify-between space-y-6">
            <div class="space-y-4">
              <div class="font-mono text-xs uppercase tracking-widest text-[#525252]">
                {{ bannerEvent.category }} · {{ bannerEvent.city }}
              </div>
              <h2 class="text-2xl sm:text-3xl font-serif font-bold text-black tracking-tight leading-tight">
                {{ bannerEvent.title }}
              </h2>
              <p class="font-body text-sm text-[#525252] leading-relaxed">
                {{ bannerEvent.subtitle }}
              </p>
            </div>

            <div class="space-y-4 pt-4 border-t border-black">
              <div class="font-mono text-xs space-y-1">
                <div class="text-[#525252] text-[10px] uppercase">Waktu &amp; Lokasi:</div>
                <div class="text-black font-semibold">{{ bannerEvent.date }} · {{ bannerEvent.time }}</div>
                <div class="text-[#525252] truncate">{{ bannerEvent.venue }}, {{ bannerEvent.city }}</div>
              </div>

              <div class="flex items-center justify-between pt-2">
                <div>
                  <div class="font-mono text-[10px] uppercase text-[#525252]">Mulai Dari</div>
                  <div class="font-mono text-xl font-bold text-black">
                    {{ eventsStore.formatPrice(bannerEvent.priceFrom, bannerEvent.currency) }}
                  </div>
                </div>

                <span class="btn-mono-primary text-xs px-5 py-3">
                  Pesan Tiket →
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════ 3. INVERTED STATS SECTION (Required Bold Choice) ═══════════════ -->
    <section class="bg-black text-white border-2 border-black p-8 sm:p-12 pattern-lines-inverted">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center font-mono uppercase">
        <div class="space-y-2 border-r border-white/20 last:border-r-0">
          <div class="text-4xl sm:text-5xl font-serif font-black tracking-tight text-white">0</div>
          <div class="text-[11px] tracking-widest text-white/70">Overselling Toleransi</div>
        </div>

        <div class="space-y-2 border-r border-white/20 last:border-r-0">
          <div class="text-4xl sm:text-5xl font-serif font-black tracking-tight text-white">&lt; 50ms</div>
          <div class="text-[11px] tracking-widest text-white/70">Latensi Kunci Kuota</div>
        </div>

        <div class="space-y-2 border-r border-white/20 last:border-r-0">
          <div class="text-4xl sm:text-5xl font-serif font-black tracking-tight text-white">600s</div>
          <div class="text-[11px] tracking-widest text-white/70">Durasi TTL Lock</div>
        </div>

        <div class="space-y-2">
          <div class="text-4xl sm:text-5xl font-serif font-black tracking-tight text-white">100%</div>
          <div class="text-[11px] tracking-widest text-white/70">Scannable QR &amp; PDF</div>
        </div>
      </div>
    </section>

    <!-- ═══════════════ 4. SEARCH & FILTER (Stark Line Architecture) ═══════════════ -->
    <section class="space-y-6 pt-4">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-2 border-black pb-4">
        <div>
          <div class="font-mono text-[11px] uppercase tracking-widest text-[#525252]">Katalog Konser</div>
          <h2 class="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-black">
            Daftar Acara &amp; Tiket Resmi
          </h2>
        </div>

        <div class="font-mono text-xs uppercase text-[#525252]">
          Menampilkan [{{ eventsStore.filteredEvents.length }}] Acara Aktif
        </div>
      </div>

      <!-- Search Input (Bottom Border Only as per Design System) -->
      <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div class="md:col-span-8 relative">
          <input 
            v-model="eventsStore.searchQuery"
            type="text"
            placeholder="Cari berdasarkan nama artis, judul tur, atau venue..."
            class="w-full py-3.5 bg-transparent border-b-2 border-black text-sm font-mono placeholder:italic placeholder:text-[#525252] focus:border-b-4 focus:outline-none transition-all"
          />
          <button 
            v-if="eventsStore.searchQuery"
            @click="eventsStore.searchQuery = ''"
            class="absolute right-2 top-3 text-xs font-mono uppercase text-[#525252] hover:text-black cursor-pointer"
          >
            [Bersihkan]
          </button>
        </div>

        <!-- Category Horizontal Filter Tabs -->
        <div class="md:col-span-4 flex items-center gap-1.5 overflow-x-auto pb-1 font-mono text-xs uppercase">
          <button
            v-for="cat in eventsStore.categories.slice(0, 4)"
            :key="cat"
            @click="eventsStore.activeCategory = cat"
            class="px-3 py-1.5 border transition-all cursor-pointer whitespace-nowrap text-[11px]"
            :class="eventsStore.activeCategory === cat ? 'bg-black text-white border-black' : 'border-black text-black hover:bg-black hover:text-white'"
          >
            {{ cat }}
          </button>
        </div>
      </div>

      <!-- Event Cards Grid -->
      <div v-if="eventsStore.filteredEvents.length === 0" class="border-2 border-black p-12 text-center space-y-3 font-mono">
        <div class="text-sm uppercase text-[#525252]">Tidak ada acara yang cocok dengan kriteria pencarian.</div>
        <button 
          @click="eventsStore.activeCategory = 'Semua'; eventsStore.searchQuery = '';"
          class="btn-mono-secondary text-xs"
        >
          Tampilkan Semua Acara
        </button>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        <div 
          v-for="(event) in eventsStore.filteredEvents" 
          :key="event.id"
          @click="handleEventClick(event)"
          class="border-2 border-black bg-white flex flex-col justify-between group cursor-pointer transition-all duration-100 hover:border-4 relative"
          :class="{
            'opacity-60': event.status === 'sold-out',
            'opacity-70': event.status === 'ended'
          }"
        >
          <!-- Card Image with Grayscale & Zoom on Hover -->
          <div class="h-52 border-b-2 border-black overflow-hidden relative bg-black">
            <div 
              class="w-full h-full bg-cover bg-center grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-300"
              :style="{ backgroundImage: event.image ? `url('${event.image}')` : 'none' }"
            ></div>

            <!-- Top Left Status Badge -->
            <div class="absolute top-3 left-3 font-mono text-[10px] uppercase tracking-widest bg-black text-white px-2.5 py-1 border border-white">
              {{ event.status === 'sold-out' ? 'HABIS' : (event.status === 'ended' ? 'SELESAI' : (event.hot ? 'POPULER' : 'TERSEDIA')) }}
            </div>

            <!-- Wishlist Heart Button -->
            <button
              type="button"
              @click="toggleWishlist($event, event)"
              class="absolute top-3 right-3 w-7 h-7 bg-white text-black border border-black flex items-center justify-center font-mono text-xs hover:bg-black hover:text-white transition-colors"
              :title="wishlistStore.isWishlisted(event.id) ? 'Hapus' : 'Favorit'"
            >
              {{ wishlistStore.isWishlisted(event.id) ? '★' : '☆' }}
            </button>
          </div>

          <!-- Card Body -->
          <div class="p-6 flex-1 flex flex-col justify-between space-y-6">
            <div class="space-y-2">
              <div class="font-mono text-[10px] uppercase tracking-widest text-[#525252]">
                {{ event.category }} · {{ event.city }}
              </div>
              <h3 class="text-xl font-serif font-bold text-black tracking-tight leading-snug group-hover:underline">
                {{ event.title }}
              </h3>
              <p class="font-body text-xs text-[#525252] line-clamp-2">
                {{ event.subtitle }}
              </p>
            </div>

            <div class="space-y-4 pt-4 border-t border-black">
              <div class="font-mono text-xs space-y-1">
                <div class="text-[#525252] text-[10px] uppercase">Jadwal:</div>
                <div class="text-black font-semibold">{{ event.date }} · {{ event.time }}</div>
                <div class="text-[#525252] text-[11px] truncate">{{ event.venue }}</div>
              </div>

              <div class="flex items-center justify-between pt-2">
                <div>
                  <div class="font-mono text-[10px] uppercase text-[#525252]">Mulai Dari</div>
                  <div class="font-mono text-base font-bold text-black">
                    {{ eventsStore.formatPrice(event.priceFrom, event.currency) }}
                  </div>
                </div>

                <span 
                  class="px-3.5 py-2 font-mono text-[11px] uppercase tracking-wider font-bold border-2 border-black transition-colors"
                  :class="event.status === 'sold-out' ? 'bg-[#F5F5F5] text-[#525252] border-[#E5E5E5]' : 'bg-black text-white group-hover:bg-white group-hover:text-black'"
                >
                  {{ event.status === 'sold-out' ? 'Habis' : (event.status === 'ended' ? 'Ulasan' : 'Pesan →') }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════ 5. EDITORIAL ARCHITECTURAL PILLARS ═══════════════ -->
    <section class="border-t-4 border-black pt-12 space-y-8">
      <div class="text-center max-w-2xl mx-auto space-y-2">
        <div class="font-mono text-[11px] uppercase tracking-widest text-[#525252]">ARSITEKTUR &amp; INTEGRITAS</div>
        <h2 class="text-2xl sm:text-3xl font-serif font-bold text-black">
          Prinsip Rekayasa Sistem Terdistribusi
        </h2>
        <p class="font-body text-xs text-[#525252]">
          Dibangun khusus untuk meredam lonjakan trafik flash crowd tanpa kompromi konsistensi data.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 border-2 border-black">
        <div class="p-6 border-b md:border-b-0 md:border-r border-black space-y-3">
          <div class="font-mono text-xs font-bold text-black">01 / ANTRIAN FIFO</div>
          <h4 class="font-serif font-bold text-base text-black">Virtual Waiting Room</h4>
          <p class="font-body text-xs text-[#525252] leading-relaxed">
            Pengunjung diurutkan secara presisi menggunakan Redis Sorted Set (ZSET) berbasis timestamp milidetik.
          </p>
        </div>

        <div class="p-6 border-b md:border-b-0 md:border-r border-black space-y-3">
          <div class="font-mono text-xs font-bold text-black">02 / SIKLUS TUNGGAL</div>
          <h4 class="font-serif font-bold text-base text-black">Atomic Lua Engine</h4>
          <p class="font-body text-xs text-[#525252] leading-relaxed">
            Verifikasi kuota dan pengurangan stok dieksekusi dalam satu siklus CPU di RAM Redis tanpa race-condition.
          </p>
        </div>

        <div class="p-6 border-b md:border-b-0 md:border-r border-black space-y-3">
          <div class="font-mono text-xs font-bold text-black">03 / RESERVASI 10M</div>
          <h4 class="font-serif font-bold text-base text-black">TTL Distributed Lock</h4>
          <p class="font-body text-xs text-[#525252] leading-relaxed">
            Kursi terkunci aman selama 600 detik. Jika pembayaran tidak tuntas, worker otomatis merestorasi kuota.
          </p>
        </div>

        <div class="p-6 space-y-3">
          <div class="font-mono text-xs font-bold text-black">04 / FILTER GATEWAY</div>
          <h4 class="font-serif font-bold text-base text-black">IP Rate Limiting</h4>
          <p class="font-body text-xs text-[#525252] leading-relaxed">
            Setiap IP dibatasi maksimal 5 request per detik oleh Nginx Reverse Proxy untuk meredam serangan bot calo.
          </p>
        </div>
      </div>
    </section>

  </div>
</template>
