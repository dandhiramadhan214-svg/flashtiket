import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useInspectorStore } from './inspectorStore';
import { useEventsStore } from './eventsStore';
import { supabase } from '../services/supabaseClient';

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

  // Anti-scalping multi-attendee records (1 Ticket = 1 Identity NIK)
  const selectedSeats = ref(['VIP-A08']);
  const attendees = ref([
    { index: 1, name: 'Kevin Pratama', nik: '31710482910002', seat: 'VIP-A08' }
  ]);

  function syncAttendees() {
    const qty = quantity.value;
    while (attendees.value.length < qty) {
      const idx = attendees.value.length + 1;
      const assignedSeat = selectedSeats.value[idx - 1] || `${selectedCategory.value.toUpperCase()}-SEAT-${idx}`;
      attendees.value.push({
        index: idx,
        name: `Teman / Peserta #${idx}`,
        nik: `317104${Math.floor(10000000 + Math.random() * 90000000)}`,
        seat: assignedSeat,
      });
    }
    if (attendees.value.length > qty) {
      attendees.value = attendees.value.slice(0, qty);
    }
  }

  function setSelectedSeats(seatsArr) {
    if (Array.isArray(seatsArr) && seatsArr.length > 0) {
      selectedSeats.value = [...seatsArr];
      quantity.value = seatsArr.length;
      selectedSeatName.value = seatsArr.join(', ');
      syncAttendees();
    }
  }

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
    if (quantity.value < 10) {
      quantity.value++;
      syncAttendees();
    } else {
      alert('Sesuai ketentuan batas reservasi rombongan, maksimal pemesanan adalah 10 tiket per transaksi.');
    }
  }

  function decrementQty() {
    if (quantity.value > 1) {
      quantity.value--;
      syncAttendees();
    }
  }

  function setQuantity(qty) {
    const validQty = Math.max(1, Math.min(10, qty));
    quantity.value = validQty;
    syncAttendees();
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

    async function syncToSupabaseOnline(payload) {
      try {
        inspector.appendLog('POSTGRES', `[SUPABASE CLOUD] Persisting transaction ${payload.orderId} to PostgreSQL...`);
        
        // 1. Insert into orders table in Supabase
        const { error: orderErr } = await supabase.from('orders').insert({
          event_id: payload.eventId,
          customer_name: payload.customer.name,
          customer_email: payload.customer.email,
          customer_phone: payload.customer.phone || '-',
          customer_nik: payload.customer.nik,
          total_amount: payload.totalAmount,
          status: 'PAID',
          expires_at: new Date(Date.now() + 600000).toISOString(),
          paid_at: new Date().toISOString()
        });

        if (orderErr) {
          inspector.appendLog('POSTGRES', `Supabase order log: ${orderErr.message}`);
        } else {
          inspector.appendLog('POSTGRES', `✓ [SUPABASE CLOUD] Order ${payload.orderId} successfully persisted in online table 'orders'!`);
        }

        // 2. Insert into tickets table in Supabase
        const catId = payload.category === 'vip' 
          ? (payload.eventId === 1 ? 1 : 4) 
          : (payload.category === 'cat1' ? (payload.eventId === 1 ? 2 : 5) : (payload.eventId === 1 ? 3 : 6));

        const ticketRows = payload.attendees.map((att, idx) => ({
          event_id: payload.eventId,
          category_id: catId,
          attendee_name: att.name,
          attendee_nik: att.nik,
          seat_number: att.seat || payload.seats[idx] || `SEAT-${idx + 1}`,
          qr_code_token: `QR-${Math.random().toString(36).substring(2, 12).toUpperCase()}`,
          status: 'ACTIVE'
        }));

        const { error: ticketErr } = await supabase.from('tickets').insert(ticketRows);
        if (ticketErr) {
          if (ticketErr.message.includes('idx_unique_event_attendee_nik')) {
            inspector.appendLog('ERROR', `🛡️ [ANTI-CALO TRIGGERED] Supabase rejected duplicate NIK in same concert: ${ticketErr.message}`);
          } else {
            inspector.appendLog('POSTGRES', `Supabase ticket note: ${ticketErr.message}`);
          }
        } else {
          inspector.appendLog('POSTGRES', `✓ [SUPABASE CLOUD] ${ticketRows.length} Individual E-Tickets saved to online table 'tickets'!`);
        }
      } catch (err) {
        inspector.appendLog('POSTGRES', `Supabase sync note: ${err.message}`);
      }
    }

    issuedTicket.value = {
      orderId,
      holderName: customer.value.name,
      categoryName: categoryDetails[cat].name,
      qty: quantity.value,
      seatNo: `${selectedSeatName.value} (${selectedSeatZone.value})`,
      seats: [...selectedSeats.value],
      attendees: [...attendees.value],
      qrHash: `SECURE: #${Math.random().toString(36).substring(2, 10).toUpperCase()}-SHA256`,
      totalPaid: grandTotal.value,
      issuedAt: new Date().toLocaleDateString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
    };

    // Trigger cloud sync to Supabase
    const activeEventId = eventsStore.selectedEvent?.id === 'coldplay-jkt-2026' ? 1 : 2;
    syncToSupabaseOnline({
      orderId,
      eventId: activeEventId,
      customer: customer.value,
      totalAmount: grandTotal.value,
      category: cat,
      seats: [...selectedSeats.value],
      attendees: [...attendees.value],
    });

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
    selectedSeats.value = ['VIP-A08'];
    attendees.value = [
      { index: 1, name: 'Kevin Pratama', nik: '31710482910002', seat: 'VIP-A08' }
    ];
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
    selectedSeats,
    setSelectedSeats,
    attendees,
    syncAttendees,
    quantity,
    setQuantity,
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
