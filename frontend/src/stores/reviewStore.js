import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useReviewStore = defineStore('reviews', () => {
  // Pre-seed some reviews so user can immediately see & read reviews for events
  const defaultReviews = [
    {
      id: 'rev-1',
      eventId: 'evt-wayang',
      userName: 'Budi Santoso',
      userAvatar: 'BS',
      rating: 5,
      comment: 'Luar biasa sekali pementasan wayang semalam! Dalang Ki Manteb membawakan lakon dengan sangat hidup dan tata lampu panggung modern sangat megah.',
      date: '02 Oktober 2026',
    },
    {
      id: 'rev-2',
      eventId: 'evt-wayang',
      userName: 'Dewi Lestari',
      userAvatar: 'DL',
      rating: 5,
      comment: 'Audio gamelannya sangat jernih dan kursi VIP nyaman banget. FlashTiket proses tiketnya cepat tanpa calo!',
      date: '03 Oktober 2026',
    },
    {
      id: 'rev-3',
      eventId: 'evt-coldplay',
      userName: 'Kevin Pratama',
      userAvatar: 'KP',
      rating: 5,
      comment: 'Konser terbaik sepanjang masa di GBK! War tiket di FlashTiket beneran fair dan anti-bot!',
      date: '15 September 2026',
    },
  ];

  const stored = localStorage.getItem('flashtiket_reviews');
  const reviews = ref(stored ? JSON.parse(stored) : defaultReviews);

  // Active event review modal
  const isReviewModalOpen = ref(false);
  const selectedEventForReview = ref(null);

  function getReviewsForEvent(eventId) {
    return reviews.value.filter(r => r.eventId === eventId);
  }

  function getAverageRating(eventId) {
    const list = getReviewsForEvent(eventId);
    if (!list.length) return null;
    const sum = list.reduce((acc, curr) => acc + curr.rating, 0);
    return (sum / list.length).toFixed(1);
  }

  function addReview(eventId, { userName, userAvatar, rating, comment }) {
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    const newRev = {
      id: 'rev-' + Date.now(),
      eventId,
      userName: userName || 'Anonim',
      userAvatar: userAvatar || (userName ? userName.slice(0, 2).toUpperCase() : 'AN'),
      rating: Number(rating) || 5,
      comment,
      date: dateStr,
    };
    reviews.value.unshift(newRev);
    localStorage.setItem('flashtiket_reviews', JSON.stringify(reviews.value));
  }

  function openReviewModal(event) {
    selectedEventForReview.value = event;
    isReviewModalOpen.value = true;
  }

  function closeReviewModal() {
    isReviewModalOpen.value = false;
    selectedEventForReview.value = null;
  }

  return {
    reviews,
    isReviewModalOpen,
    selectedEventForReview,
    getReviewsForEvent,
    getAverageRating,
    addReview,
    openReviewModal,
    closeReviewModal,
  };
});
