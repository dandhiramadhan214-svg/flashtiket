import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useInspectorStore } from './inspectorStore';
import { useEventsStore } from './eventsStore';

export const useTicketStore = defineStore('ticket', () => {
  const inspector = useInspectorStore();
  const eventsStore = useEventsStore();

  const stock = ref({
    vip: 50,
    cat1: 150,
    cat2: 300,
  });

  const initialStock = {
    vip: 50,
    cat1: 150,
    cat2: 300,
  };

  // Base tier multipliers relative to event.priceFrom
  const selectedCategory = ref('cat1');
  const selectedSeatName = ref('Baris A No. 08');
  const selectedSeatZone = ref('VIP Royal Floor');
  const quantity = ref(1);
  const currentOrderId = ref(null);
  const lockTimeRemaining = ref(600); // 10 minutes
  let lockTimerInterval = null;

  function setSelectedSeat(name, zone, catKey) {
    if (name) selectedSeatName.value = name;
    if (zone) selectedSeatZone.value = zone;
    if (catKey) selectedCategory.value = catKey;
  }

  const currentCurrency = computed(() => eventsStore.selectedEvent?.currency || 'IDR');

  // Dynamic pricing based on selected event
  const prices = computed(() => {
    const base = eventsStore.selectedEvent?.priceFrom || 188;
    const isIDR = currentCurrency.value === 'IDR';

    if (isIDR) {
      return {
        vip: Math.round(base * 2.5),
        cat1: Math.round(base * 1.5),
        cat2: base,
      };
    } else {
      return {
        vip: Math.round(base * 2.06),
        cat1: Math.round(base * 1.42),
        cat2: base,
      };
    }
  });

  const bookingFees = computed(() => {
    const isIDR = currentCurrency.value === 'IDR';
    return {
      vip: isIDR ? 25000 : 10,
      cat1: isIDR ? 15000 : 8,
      cat2: isIDR ? 10000 : 6,
    };
  });

  const categoryDetails = {
    vip: {
      name: 'VIP Royal Soundcheck',
      sub: 'Akses soundcheck eksklusif, lanyard festival resmi, antrean jalur cepat & goodie bag.',
      badge: 'Limited Seats',
      color: 'secondary',
    },
    cat1: {
      name: 'CAT 1 Standing Festival',
      sub: 'Area berdiri tepat di depan panggung utama & audio surround maksimal.',
      badge: 'Festival Area',
      color: 'primary',
    },
    cat2: {
      name: 'CAT 2 Reserved Seating',
      sub: 'Tribun bernomor dengan jarak pandang panoramik luas ke seluruh panggung.',
      badge: 'Numbered Tribune',
      color: 'surface-container-highest',
    },
  };

  const customer = ref({
    name: 'Kevin Pratama',
    nik: '31710482910002',
    phone: '+62 812-3456-7890',
    email: 'kevin.pratama@war-tiket.com',
  });

  const issuedTicket = ref(null);

  // Computed values
  const unitPrice = computed(() => prices.value[selectedCategory.value] || 0);
  const bookingFee = computed(() => bookingFees.value[selectedCategory.value] || 0);
  const subtotal = computed(() => (unitPrice.value + bookingFee.value) * quantity.value);
  const taxAmount = computed(() => Math.round(subtotal.value * (currentCurrency.value === 'IDR' ? 0.11 : 0.09))); // 11% PPN IDR / 9% GST SGD
  const grandTotal = computed(() => subtotal.value + taxAmount.value);

  function formatMoney(amount) {
    const num = isNaN(Number(amount)) ? 0 : Number(amount);
    if (currentCurrency.value === 'IDR') {
      return 'Rp ' + num.toLocaleString('id-ID');
    }
    return '$' + num.toLocaleString('en-US');
  }

  const lockTimerFormatted = computed(() => {
    const m = Math.floor(lockTimeRemaining.value / 60);
    const s = lockTimeRemaining.value % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  });

  function selectCategory(cat) {
    if (stock.value[cat] <= 0) {
      alert(`Maaf, tiket kategori ${cat.toUpperCase()} sudah habis terjual!`);
      return;
    }
    selectedCategory.value = cat;
    inspector.appendLog('GATEWAY', `User selected category: ${cat.toUpperCase()}`);
  }

  function incrementQty() {
    if (quantity.value < 2) {
      quantity.value++;
    } else {
      alert('Sesuai ketentuan resmi, pembelian dibatasi maksimal 2 tiket per akun untuk mencegah calo.');
    }
  }

  function decrementQty() {
    if (quantity.value > 1) {
      quantity.value--;
    }
  }

  function lockTickets() {
    const cat = selectedCategory.value;
    const qty = quantity.value;

    inspector.appendLog('LUA', `Executing atomic Lua Script on Redis Cluster:`);
    inspector.appendLog('LUA', `> EVAL "if redis.call('get', KEYS[1]) >= ARGV[1] then return redis.call('decrby', KEYS[1], ARGV[1]) else return -1 end" 1 stock:${cat} ${qty}`);

    if (stock.value[cat] < qty) {
      inspector.appendLog('ERROR', `Lua Script returned -1: OVERSOLD REJECTED! Remaining stock: ${stock.value[cat]}`);
      alert(`Gagal mengamankan tiket! Kuota ${cat.toUpperCase()} tidak mencukupi (Sisa: ${stock.value[cat]}).`);
      return false;
    }

    // Atomically decrement
    stock.value[cat] -= qty;

    const orderId = 'ORD-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-2026';
    currentOrderId.value = orderId;

    inspector.appendLog('LOCK', `Redis: SETEX "lock:order:${orderId}" 600 "RESERVED" -> OK (Lock TTL: 10 Menit)`);
    inspector.appendLog('WORKER', `Auto-rollback watcher scheduled for order ${orderId} in 600 seconds`);

    startLockTimer();
    return true;
  }

  function startLockTimer() {
    if (lockTimerInterval) clearInterval(lockTimerInterval);
    lockTimeRemaining.value = 600;

    lockTimerInterval = setInterval(() => {
      lockTimeRemaining.value--;
      if (lockTimeRemaining.value <= 0) {
        clearInterval(lockTimerInterval);
        autoRollback('TIMEOUT');
      }
    }, 1000);
  }

  function autoRollback(reason = 'TIMEOUT') {
    if (lockTimerInterval) clearInterval(lockTimerInterval);

    const cat = selectedCategory.value;
    const qty = quantity.value;
    const orderId = currentOrderId.value;

    inspector.appendLog('WORKER', `[AUTO-ROLLBACK TRIGGERED] Order ${orderId} reason: ${reason}`);
    inspector.appendLog('REDIS', `INCRBY "stock:${cat}" ${qty} -> Quota restored!`);
    inspector.appendLog('REDIS', `DEL "lock:order:${orderId}" -> Lock released.`);

    stock.value[cat] += qty;
    currentOrderId.value = null;

    alert(`Waktu pemesanan Anda telah berakhir (10 Menit). Kursi otomatis dikembalikan ke ketersediaan umum.`);
  }

  function confirmPayment() {
    if (lockTimerInterval) clearInterval(lockTimerInterval);

    const orderId = currentOrderId.value;
    const cat = selectedCategory.value;

    inspector.appendLog('GATEWAY', `POST /api/tickets/pay (Idempotency-Key: ${orderId})`);
    inspector.appendLog('POSTGRES', `BEGIN; UPDATE orders SET status='PAID' WHERE id='${orderId}'; COMMIT;`);
    inspector.appendLog('REDIS', `PERSIST "lock:order:${orderId}" -> Promoted to permanent reservation.`);
    inspector.appendLog('WORKER', `Ticket Generation Worker issued cryptographic QR Code & PDF ticket.`);

    issuedTicket.value = {
      orderId,
      holderName: customer.value.name,
      categoryName: categoryDetails[cat].name,
      qty: quantity.value,
      seatNo: `${selectedSeatName.value} (${selectedSeatZone.value})`,
      qrHash: `SECURE: #${Math.random().toString(36).substring(2, 10).toUpperCase()}-SHA256`,
      totalPaid: grandTotal.value,
      issuedAt: new Date().toLocaleDateString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
    };

    return true;
  }

  function simulateRaceCondition() {
    inspector.appendLog('LUA', `[CONCURRENCY STRESS TEST] 50 bot clients competing for 2 tickets simultaneously...`);
    let wins = 0;
    let rejects = 0;

    for (let i = 1; i <= 50; i++) {
      if (stock.value.vip >= 1 && wins < 2) {
        stock.value.vip--;
        wins++;
        inspector.appendLog('LUA', `Bot #${i}: EVALSHA -> SUCCESS! Claimed ticket. Remaining: ${stock.value.vip}`);
      } else {
        rejects++;
      }
    }

    inspector.appendLog('REDIS', `Concurrency test complete: ${wins} claims allowed, ${rejects} rejected (HTTP 409 Conflict). Overselling: 0!`);
    alert(`Uji Konkurensi Selesai!\n50 Bot serentak berebut tiket:\n- Berhasil: ${wins}\n- Ditolak (Anti-Overselling): ${rejects}\n\nSisa Tiket VIP: ${stock.value.vip}`);
  }

  function resetAll() {
    const evStock = eventsStore.selectedEvent?.stock || initialStock;
    stock.value = { ...evStock };
    quantity.value = 1;
    selectedCategory.value = 'cat1';
    currentOrderId.value = null;
    issuedTicket.value = null;
    if (lockTimerInterval) clearInterval(lockTimerInterval);
    inspector.appendLog('GATEWAY', `[SYSTEM RESET] System state reset to initial catalog values.`);
  }

  return {
    stock,
    initialStock,
    prices,
    bookingFees,
    categoryDetails,
    selectedCategory,
    selectedSeatName,
    selectedSeatZone,
    setSelectedSeat,
    quantity,
    currentOrderId,
    lockTimeRemaining,
    lockTimerFormatted,
    customer,
    issuedTicket,
    unitPrice,
    bookingFee,
    subtotal,
    taxAmount,
    grandTotal,
    currentCurrency,
    formatMoney,
    selectCategory,
    incrementQty,
    decrementQty,
    lockTickets,
    autoRollback,
    confirmPayment,
    simulateRaceCondition,
    resetAll,
  };
});
