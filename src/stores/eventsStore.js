import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useEventsStore = defineStore('events', () => {
  const searchQuery = ref('');
  const activeCategory = ref('Semua');

  const categories = [
    'Semua', 'Konser', 'Festival', 'Olahraga', 'Seni & Budaya', 'Workshop', 'Esports',
  ];

  const events = ref([
    {
      id: 'aurora-sg-2025',
      title: 'AURORA: Echoes of Eternity',
      subtitle: 'World Tour 2025 — Night 1',
      venue: 'Singapore National Stadium',
      city: 'Kallang, Singapore',
      date: '15 Nov 2025',
      time: '19:30 SGT',
      category: 'Konser',
      priceFrom: 188,
      currency: 'SGD',
      status: 'on-sale',
      image: '/banner.jpg',
      hot: true,
      stock: { vip: 50, cat1: 150, cat2: 300 },
    },
    {
      id: 'coldplay-jkt-2026',
      title: 'Coldplay: Music of the Spheres',
      subtitle: 'World Tour 2026 — Jakarta',
      venue: 'Gelora Bung Karno Stadium',
      city: 'Senayan, Jakarta',
      date: '22 Mar 2026',
      time: '19:00 WIB',
      category: 'Konser',
      priceFrom: 1250000,
      currency: 'IDR',
      status: 'on-sale',
      image: '/events/coldplay.jpg',
      hot: true,
      stock: { vip: 80, cat1: 500, cat2: 1200 },
    },
    {
      id: 'taylor-swift-sg',
      title: 'Taylor Swift: The Eras Tour',
      subtitle: 'Asia Pacific Leg — 6 Nights',
      venue: 'Singapore National Stadium',
      city: 'Kallang, Singapore',
      date: '2-7 Mar 2026',
      time: '19:00 SGT',
      category: 'Konser',
      priceFrom: 228,
      currency: 'SGD',
      status: 'sold-out',
      image: '/events/taylor-swift.jpg',
      hot: false,
      stock: { vip: 0, cat1: 0, cat2: 0 },
    },
    {
      id: 'dewa19-reunion',
      title: 'Dewa 19 Reunion Concert',
      subtitle: '30th Anniversary Special',
      venue: 'Indonesia Arena',
      city: 'Senayan, Jakarta',
      date: '10 Jan 2026',
      time: '20:00 WIB',
      category: 'Konser',
      priceFrom: 450000,
      currency: 'IDR',
      status: 'on-sale',
      image: '/events/dewa19.jpg',
      hot: false,
      stock: { vip: 100, cat1: 350, cat2: 800 },
    },
    {
      id: 'jakarta-marathon-2026',
      title: 'Jakarta Marathon 2026',
      subtitle: 'International AIMS Certified',
      venue: 'Monas - Sudirman Route',
      city: 'Jakarta Pusat',
      date: '25 Oct 2026',
      time: '05:00 WIB',
      category: 'Olahraga',
      priceFrom: 350000,
      currency: 'IDR',
      status: 'on-sale',
      image: '/events/marathon.jpg',
      hot: false,
      stock: { vip: 200, cat1: 2000, cat2: 5000 },
    },
    {
      id: 'comic-con-sg',
      title: 'Singapore Comic Con 2026',
      subtitle: 'Pop Culture & Cosplay Convention',
      venue: 'Sands Expo & Convention Centre',
      city: 'Marina Bay, Singapore',
      date: '8-9 Feb 2026',
      time: '10:00 SGT',
      category: 'Festival',
      priceFrom: 45,
      currency: 'SGD',
      status: 'on-sale',
      image: '/events/comic-con.jpg',
      hot: false,
      stock: { vip: 500, cat1: 2000, cat2: 5000 },
    },
    {
      id: 'java-jazz-2026',
      title: 'Java Jazz Festival 2026',
      subtitle: 'Southeast Asia\'s Largest Jazz Festival',
      venue: 'JIExpo Kemayoran',
      city: 'Jakarta Utara',
      date: '27-29 Mar 2026',
      time: '14:00 WIB',
      category: 'Festival',
      priceFrom: 550000,
      currency: 'IDR',
      status: 'coming-soon',
      image: '/events/java-jazz.jpg',
      hot: true,
      stock: { vip: 300, cat1: 1500, cat2: 4000 },
    },
    {
      id: 'valorant-masters-sg',
      title: 'VALORANT Masters Singapore',
      subtitle: 'VCT 2026 Stage 2',
      venue: 'Singapore Indoor Stadium',
      city: 'Kallang, Singapore',
      date: '15-22 Jun 2026',
      time: '12:00 SGT',
      category: 'Esports',
      priceFrom: 38,
      currency: 'SGD',
      status: 'on-sale',
      image: '/events/valorant.jpg',
      hot: true,
      stock: { vip: 100, cat1: 800, cat2: 3000 },
    },
    {
      id: 'wayang-kulit-solo',
      title: 'Festival Wayang Kulit Nusantara',
      subtitle: 'Dalang Ki Manteb Soedharsono',
      venue: 'Pendopo Mangkunegaran',
      city: 'Solo, Jawa Tengah',
      date: '5 Dec 2025',
      time: '19:30 WIB',
      category: 'Seni & Budaya',
      priceFrom: 75000,
      currency: 'IDR',
      status: 'ended',
      image: '/events/wayang.jpg',
      hot: false,
      stock: { vip: 0, cat1: 0, cat2: 0 },
    },
    {
      id: 'ui-ux-workshop-jkt',
      title: 'Masterclass: Product Design',
      subtitle: 'UI/UX Workshop Series by Google',
      venue: 'Google Office Jakarta',
      city: 'Pacific Century Place, Jakarta',
      date: '20 Nov 2025',
      time: '09:00 WIB',
      category: 'Workshop',
      priceFrom: 250000,
      currency: 'IDR',
      status: 'on-sale',
      image: '/events/workshop.jpg',
      hot: false,
      stock: { vip: 0, cat1: 30, cat2: 70 },
    },
  ]);

  const selectedEventId = ref(null);

  const selectedEvent = computed(() => {
    return events.value.find(e => e.id === selectedEventId.value) || events.value[0];
  });

  const filteredEvents = computed(() => {
    let result = events.value;

    if (activeCategory.value !== 'Semua') {
      result = result.filter(e => e.category === activeCategory.value);
    }

    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase();
      result = result.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q) ||
        e.city.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
      );
    }

    return result;
  });

  const hotEvents = computed(() => events.value.filter(e => e.hot && e.status !== 'sold-out'));

  function selectEvent(eventId) {
    selectedEventId.value = eventId;
  }

  function formatPrice(price, currency) {
    if (currency === 'IDR') {
      return 'Rp ' + price.toLocaleString('id-ID');
    }
    return '$' + price;
  }

  // Generate color from event category
  function categoryColor(cat) {
    const map = {
      'Konser': { bg: 'bg-purple-50', text: 'text-purple-600', dot: 'bg-purple-500' },
      'Festival': { bg: 'bg-sky-light', text: 'text-sky', dot: 'bg-sky' },
      'Olahraga': { bg: 'bg-mint-light', text: 'text-mint', dot: 'bg-mint' },
      'Seni & Budaya': { bg: 'bg-amber-light', text: 'text-amber', dot: 'bg-amber' },
      'Workshop': { bg: 'bg-coral-light', text: 'text-coral', dot: 'bg-coral' },
      'Esports': { bg: 'bg-navy/5', text: 'text-navy', dot: 'bg-navy' },
    };
    return map[cat] || { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' };
  }

  // Generate gradient for event card without image
  function eventGradient(index) {
    const gradients = [
      'from-purple-600 to-indigo-800',
      'from-sky to-blue-700',
      'from-rose-500 to-pink-700',
      'from-amber to-orange-600',
      'from-mint to-emerald-700',
      'from-navy to-indigo-900',
      'from-violet-500 to-purple-800',
      'from-cyan-500 to-blue-700',
      'from-pink-500 to-rose-700',
      'from-teal-500 to-cyan-700',
    ];
    return gradients[index % gradients.length];
  }

  return {
    searchQuery,
    activeCategory,
    categories,
    events,
    selectedEventId,
    selectedEvent,
    filteredEvents,
    hotEvents,
    selectEvent,
    formatPrice,
    categoryColor,
    eventGradient,
  };
});
