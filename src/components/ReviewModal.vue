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
    notifStore.push('warning', 'Ulasan Kosong', 'Silakan tulis ulasan atau testimoni Anda terlebih dahulu.');
    return;
  }

  const user = authStore.currentUser;
  reviewStore.addReview(reviewStore.selectedEventForReview.id, {
    userName: authStore.isLoggedIn ? user.name : 'Penonton FlashTiket',
    userAvatar: authStore.isLoggedIn ? (user.avatarText || 'PP') : 'PP',
    rating: rating.value,
    comment: comment.value.trim(),
  });

  notifStore.push('success', 'Ulasan Terkirim', 'Terima kasih atas ulasan dan rating yang Anda berikan!');
  comment.value = '';
  rating.value = 5;
}
</script>

<template>
  <div 
    v-if="reviewStore.isReviewModalOpen && reviewStore.selectedEventForReview"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all"
    @click.self="reviewStore.closeReviewModal()"
  >
    <div class="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
      
      <!-- Header -->
      <div class="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-amber/10 text-amber flex items-center justify-center">
            <SvgIcon name="star" className="w-5 h-5 text-amber" />
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-800 dark:text-white leading-tight">Ulasan &amp; Rating Acara</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[260px] sm:max-w-xs">
              {{ reviewStore.selectedEventForReview.title }}
            </p>
          </div>
        </div>

        <button 
          @click="reviewStore.closeReviewModal()"
          class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center justify-center transition-colors"
        >
          <SvgIcon name="cancel" className="w-4 h-4" />
        </button>
      </div>

      <!-- Body / Scrollable Area -->
      <div class="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
        
        <!-- Input Review Form -->
        <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-700 dark:text-slate-200">Beri Nilai Pengalaman Anda:</span>
            <!-- Interactive Stars -->
            <div class="flex items-center gap-1">
              <button
                v-for="star in 5"
                :key="star"
                type="button"
                @mouseenter="hoverRating = star"
                @mouseleave="hoverRating = 0"
                @click="setRating(star)"
                class="transition-transform hover:scale-125 focus:outline-none"
              >
                <SvgIcon 
                  name="star" 
                  className="w-5 h-5" 
                  :class="star <= (hoverRating || rating) ? 'text-amber' : 'text-slate-300 dark:text-slate-600'" 
                />
              </button>
              <span class="text-xs font-extrabold text-amber ml-1 font-mono">
                {{ hoverRating || rating }}/5
              </span>
            </div>
          </div>

          <!-- Textarea -->
          <textarea
            v-model="comment"
            rows="3"
            placeholder="Bagaimana pengalaman Anda menonton acara ini? Ceritakan kesan &amp; pesan Anda..."
            class="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-sky transition-all resize-none"
          ></textarea>

          <div class="flex items-center justify-between pt-1">
            <span class="text-[11px] text-slate-400">
              Posting sebagai: <strong class="text-slate-600 dark:text-slate-300">{{ authStore.isLoggedIn ? authStore.currentUser.name : 'Penonton FlashTiket' }}</strong>
            </span>
            <button
              @click="submitReview"
              class="px-4 py-2 rounded-xl bg-navy dark:bg-sky text-white text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-sm"
            >
              Kirim Ulasan
            </button>
          </div>
        </div>

        <!-- Reviews List -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Ulasan Pengunjung ({{ reviewStore.getReviewsForEvent(reviewStore.selectedEventForReview.id).length }})
            </h4>
            <div v-if="reviewStore.getAverageRating(reviewStore.selectedEventForReview.id)" class="flex items-center gap-1 text-xs font-bold text-amber">
              <SvgIcon name="star" className="w-3.5 h-3.5 text-amber" />
              <span>Rata-rata: {{ reviewStore.getAverageRating(reviewStore.selectedEventForReview.id) }} / 5.0</span>
            </div>
          </div>

          <!-- Empty Reviews -->
          <div 
            v-if="reviewStore.getReviewsForEvent(reviewStore.selectedEventForReview.id).length === 0"
            class="text-center py-8 text-slate-400 text-xs"
          >
            Belum ada ulasan untuk acara ini. Jadilah yang pertama memberikan ulasan!
          </div>

          <!-- Review Cards -->
          <div v-else class="space-y-3">
            <div 
              v-for="rev in reviewStore.getReviewsForEvent(reviewStore.selectedEventForReview.id)"
              :key="rev.id"
              class="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 shadow-sm space-y-2"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 rounded-full bg-navy/10 dark:bg-sky/20 text-navy dark:text-sky flex items-center justify-center font-bold text-[11px]">
                    {{ rev.userAvatar }}
                  </div>
                  <div>
                    <div class="text-xs font-bold text-slate-800 dark:text-slate-100">{{ rev.userName }}</div>
                    <div class="text-[10px] text-slate-400">{{ rev.date }}</div>
                  </div>
                </div>

                <div class="flex items-center gap-0.5">
                  <SvgIcon 
                    v-for="s in 5" 
                    :key="s" 
                    name="star" 
                    className="w-3.5 h-3.5"
                    :class="s <= rev.rating ? 'text-amber' : 'text-slate-200 dark:text-slate-700'" 
                  />
                </div>
              </div>

              <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {{ rev.comment }}
              </p>
            </div>
          </div>
        </div>

      </div>

      <!-- Footer Modal -->
      <div class="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
        <button
          @click="reviewStore.closeReviewModal()"
          class="px-5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
        >
          Tutup
        </button>
      </div>

    </div>
  </div>
</template>
