<script setup>
import { ref } from 'vue';
import { useReviewStore } from '../stores/reviewStore';
import { useAuthStore } from '../stores/authStore';
import { useNotifStore } from '../stores/notifStore';
import SvgIcon from './SvgIcon.vue';

const reviewStore = useReviewStore();
const authStore = useAuthStore();
const notifStore = useNotifStore();

const rating = ref(5);
const hoverRating = ref(0);
const comment = ref('');

function setRating(val) {
  rating.value = val;
}

function submitReview() {
  if (!comment.value.trim()) {
    notifStore.push('warning', 'Ulasan Kosong', 'Silakan tulis ulasan terlebih dahulu.');
    return;
  }

  const user = authStore.currentUser;
  reviewStore.addReview(reviewStore.selectedEventForReview.id, {
    userName: authStore.isLoggedIn ? user.name : 'Penonton FlashTiket',
    userAvatar: authStore.isLoggedIn ? (user.avatarText || 'PP') : 'PP',
    rating: rating.value,
    comment: comment.value.trim(),
  });

  notifStore.push('success', 'Ulasan Terkirim', 'Terima kasih atas ulasan Anda.');
  comment.value = '';
  rating.value = 5;
}
</script>

<template>
  <div 
    v-if="reviewStore.isReviewModalOpen && reviewStore.selectedEventForReview"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 font-mono"
    @click.self="reviewStore.closeReviewModal()"
  >
    <div class="relative w-full max-w-lg bg-white border-4 border-black p-6 sm:p-8 space-y-6 flex flex-col max-h-[90vh]">
      
      <!-- Header -->
      <div class="flex items-center justify-between border-b-2 border-black pb-3">
        <div>
          <span class="text-[10px] text-[#525252] uppercase tracking-widest">TESTIMONI PENONTON</span>
          <h3 class="text-xl font-serif font-black text-black leading-tight">Ulasan Acara</h3>
          <p class="text-xs text-[#525252] truncate max-w-xs mt-0.5">
            {{ reviewStore.selectedEventForReview.title }}
          </p>
        </div>

        <button 
          @click="reviewStore.closeReviewModal()"
          class="font-mono text-xs uppercase underline text-[#525252] hover:text-black cursor-pointer"
        >
          [Tutup]
        </button>
      </div>

      <!-- Body / Scrollable Area -->
      <div class="overflow-y-auto space-y-6 flex-1">
        
        <!-- Input Review Form -->
        <div class="border-2 border-black p-4 space-y-3">
          <div class="flex items-center justify-between text-xs uppercase">
            <span>Beri Peringkat:</span>
            <!-- Interactive Stars -->
            <div class="flex items-center gap-1">
              <button
                v-for="star in 5"
                :key="star"
                type="button"
                @mouseenter="hoverRating = star"
                @mouseleave="hoverRating = 0"
                @click="setRating(star)"
                class="text-base text-black cursor-pointer"
              >
                {{ star <= (hoverRating || rating) ? '★' : '☆' }}
              </button>
              <span class="font-bold ml-1">
                {{ hoverRating || rating }}/5
              </span>
            </div>
          </div>

          <!-- Textarea -->
          <textarea 
            v-model="comment"
            rows="3"
            placeholder="Bagikan pengalaman tata panggung, audio surround, atau kelancaran verifikasi tiket..."
            class="w-full p-3 bg-transparent border-2 border-black text-xs font-mono placeholder:italic placeholder:text-[#525252] focus:outline-none"
          ></textarea>

          <button 
            @click="submitReview"
            class="btn-mono-primary w-full py-3 text-xs"
          >
            Kirimkan Ulasan Resmi →
          </button>
        </div>

        <!-- List Reviews -->
        <div class="space-y-4">
          <div class="text-[10px] uppercase tracking-widest text-[#525252] border-b border-black pb-1">
            DAFTAR ULASAN TERVERIFIKASI
          </div>

          <div 
            v-for="r in reviewStore.getReviews(reviewStore.selectedEventForReview.id)" 
            :key="r.id"
            class="border border-black p-4 space-y-2 bg-white"
          >
            <div class="flex items-center justify-between text-xs">
              <span class="font-bold text-black">{{ r.userName }}</span>
              <span class="text-black font-mono">
                {{ '★'.repeat(r.rating) }}{{ '☆'.repeat(5 - r.rating) }}
              </span>
            </div>
            <p class="font-body text-xs text-[#525252] leading-relaxed italic">
              "{{ r.comment }}"
            </p>
            <div class="text-[9px] text-[#525252] uppercase">{{ r.timestamp }}</div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>
