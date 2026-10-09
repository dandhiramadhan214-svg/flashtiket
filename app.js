/**
 * TICKETWAR // OFFICIAL CONCERT TICKETING PORTAL ENGINE
 * Underlying Distributed Architecture:
 * - Virtual Waiting Room (Redis FIFO Queue)
 * - Atomic Concurrency Control (Redis Lua Script)
 * - Distributed Seat Locking (TTL 600s)
 * - Asynchronous Payment Watcher & Auto-Rollback Engine
 */

// ==========================================
// 1. DISTRIBUTED STATE & DATA STORE
// ==========================================
const DistributedStore = {
  // In-Memory Stock (Redis Keys: stock:vip, stock:cat1, stock:cat2)
  stock: {
    vip: 50,
    cat1: 150,
    cat2: 300
  },
  initialStock: {
    vip: 50,
    cat1: 150,
    cat2: 300
  },
  prices: {
    vip: 3500000,
    cat1: 2200000,
    cat2: 1250000
  },
  categoryNames: {
    vip: 'Aetheria Soundcheck VIP',
    cat1: 'CAT 1 Festival Standing',
    cat2: 'CAT 2 Tribune Numbered'
  },
  // Active Distributed Locks (Redis SETEX lock:order:<id> 600)
  activeLocks: {},
  // Nodes Health
  nodes: {
    gateway: true,
    redis: true,
    worker: true
  },
  // User Session State
  user: {
    queueNumber: 1420,
    totalQueue: 48210,
    selectedCat: 'cat1',
    qty: 1,
    currentOrderId: null,
    lockTimeRemaining: 600, // 10 minutes in seconds
    lockTimerInterval: null
  }
};

// ==========================================
// 2. DOM ELEMENT REFERENCES
// ==========================================
const UI = {
  stages: {
    hero: document.getElementById('stage-hero'),
    waitingRoom: document.getElementById('stage-waiting-room'),
    selection: document.getElementById('stage-selection'),
    checkout: document.getElementById('stage-checkout'),
    ticket: document.getElementById('stage-ticket')
  },
  // Hero Elements
  heroCountdown: {
    hours: document.getElementById('cd-hours'),
    minutes: document.getElementById('cd-minutes'),
    seconds: document.getElementById('cd-seconds'),
    btnStart: document.getElementById('btn-start-war')
  },
  // Waiting Room Elements
  waitingRoom: {
    userNumber: document.getElementById('user-queue-number'),
    totalQueue: document.getElementById('total-queue-count'),
    eta: document.getElementById('queue-eta'),
    progressBar: document.getElementById('queue-bar-fill'),
    progressPct: document.getElementById('queue-progress-pct'),
    btnSkip: document.getElementById('btn-skip-queue')
  },
  // Selection Elements
  selection: {
    ticketCards: document.querySelectorAll('.ticket-card'),
    seatZones: document.querySelectorAll('.seat-zone'),
    stockVip: document.getElementById('val-stock-vip'),
    stockCat1: document.getElementById('val-stock-cat1'),
    stockCat2: document.getElementById('val-stock-cat2'),
    mapStockVip: document.getElementById('map-stock-vip'),
    mapStockCat1: document.getElementById('map-stock-cat1'),
    mapStockCat2: document.getElementById('map-stock-cat2'),
    qtyVal: document.getElementById('ticket-qty'),
    btnQtyMinus: document.getElementById('btn-qty-minus'),
    btnQtyPlus: document.getElementById('btn-qty-plus'),
    totalPrice: document.getElementById('selected-total-price'),
    btnLock: document.getElementById('btn-lock-tickets')
  },
  // Checkout Elements
  checkout: {
    lockCountdown: document.getElementById('lock-countdown'),
    inputName: document.getElementById('input-name'),
    inputNik: document.getElementById('input-nik'),
    inputPhone: document.getElementById('input-phone'),
    inputEmail: document.getElementById('input-email'),
    summaryCatBadge: document.getElementById('summary-cat-badge'),
    summaryQty: document.getElementById('summary-ticket-qty'),
    summaryUnitPrice: document.getElementById('summary-unit-price'),
    summaryTax: document.getElementById('summary-tax'),
    summaryGrandTotal: document.getElementById('summary-grand-total'),
    summaryOrderId: document.getElementById('summary-order-id'),
    btnPay: document.getElementById('btn-confirm-payment'),
    btnTimeout: document.getElementById('btn-simulate-timeout')
  },
  // Ticket Success Elements
  ticketSuccess: {
    holderName: document.getElementById('ticket-holder-name'),
    finalCat: document.getElementById('ticket-final-cat'),
    seatNo: document.getElementById('ticket-seat-no'),
    orderRef: document.getElementById('ticket-order-ref'),
    qrHash: document.getElementById('ticket-qr-hash'),
    btnPrint: document.getElementById('btn-print-ticket'),
    btnRestart: document.getElementById('btn-restart-demo')
  },
  // Inspector Drawer & Controls (Discreet developer mode)
  inspector: {
    drawer: document.getElementById('engine-inspector'),
    btnToggle: document.getElementById('btn-toggle-inspector'),
    btnClose: document.getElementById('btn-close-inspector'),
    btnClear: document.getElementById('btn-clear-logs'),
    logConsole: document.getElementById('log-console'),
    btnResetDemo: document.getElementById('btn-reset-demo'),
    simSpike: document.getElementById('sim-spike-btn'),
    simRace: document.getElementById('sim-race-btn'),
    simKillWorker: document.getElementById('sim-kill-worker-btn')
  }
};

let queueSimulationInterval = null;
let heroCountdownInterval = null;

// ==========================================
// 3. LOGGING SUBSYSTEM (DISTRIBUTED EVENT STREAM)
// ==========================================
function appendEngineLog(tag, message) {
  if (!UI.inspector.logConsole) return;

  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');

  const logEntry = document.createElement('div');
  logEntry.className = 'log-entry';

  let tagClass = 'gateway';
  if (tag === 'REDIS') tagClass = 'redis';
  if (tag === 'LUA' || tag === 'LOCK') tagClass = 'lock';
  if (tag === 'WORKER') tagClass = 'worker';
  if (tag === 'ERROR') tagClass = 'error';

  logEntry.innerHTML = `
    <span class="log-time">${timeStr}</span>
    <span class="log-tag ${tagClass}">[${tag}]</span>
    <span class="log-msg">${escapeHtml(message)}</span>
  `;

  UI.inspector.logConsole.appendChild(logEntry);
  UI.inspector.logConsole.scrollTop = UI.inspector.logConsole.scrollHeight;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ==========================================
// 4. STAGE TRANSITION CONTROLLER
// ==========================================
function switchStage(targetStageKey) {
  Object.keys(UI.stages).forEach(key => {
    if (UI.stages[key]) {
      UI.stages[key].classList.remove('active');
    }
  });

  if (UI.stages[targetStageKey]) {
    UI.stages[targetStageKey].classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  appendEngineLog('GATEWAY', `Stage transition -> ${targetStageKey.toUpperCase()}`);
}

// ==========================================
// 5. STAGE 1: COUNTDOWN & HERO
// ==========================================
function initHeroCountdown() {
  let totalSeconds = 2 * 60 + 15; // 2 minutes 15 seconds

  heroCountdownInterval = setInterval(() => {
    if (totalSeconds <= 0) {
      clearInterval(heroCountdownInterval);
      appendEngineLog('GATEWAY', 'Countdown reached 00:00:00! Official ticket sale gates opened.');
      return;
    }
    totalSeconds--;
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    if (UI.heroCountdown.minutes) UI.heroCountdown.minutes.textContent = String(m).padStart(2, '0');
    if (UI.heroCountdown.seconds) UI.heroCountdown.seconds.textContent = String(s).padStart(2, '0');
  }, 1000);
}

// ==========================================
// 6. STAGE 2: VIRTUAL WAITING ROOM (FIFO QUEUE)
// ==========================================
function startWaitingRoomQueue() {
  switchStage('waitingRoom');

  DistributedStore.user.queueNumber = Math.floor(Math.random() * 600) + 1200;
  DistributedStore.user.totalQueue = DistributedStore.user.queueNumber - 1;
  const initialUserNum = DistributedStore.user.queueNumber;

  appendEngineLog('GATEWAY', `Client IP 182.1.20.4 passed rate-limit (Token Bucket: 1/5 req)`);
  appendEngineLog('REDIS', `ZADD waiting_room:queue ${Date.now()} "user_${Math.random().toString(36).substring(7)}"`);
  appendEngineLog('REDIS', `ZRANK waiting_room:queue -> Your queue position is #${DistributedStore.user.queueNumber}`);

  updateWaitingRoomUI(initialUserNum);

  if (queueSimulationInterval) clearInterval(queueSimulationInterval);

  // Move queue forward smoothly
  queueSimulationInterval = setInterval(() => {
    const step = Math.floor(Math.random() * 60) + 70;
    DistributedStore.user.queueNumber -= step;

    if (DistributedStore.user.queueNumber <= 0) {
      DistributedStore.user.queueNumber = 0;
      clearInterval(queueSimulationInterval);

      appendEngineLog('REDIS', `ZPOPMIN waiting_room:queue -> User turn reached! Generated secure booking token.`);
      appendEngineLog('GATEWAY', `Access granted to /api/tickets/selection (Session TTL: 15m)`);

      // Auto transition to selection
      setTimeout(() => {
        initSelectionStage();
      }, 700);
    }

    updateWaitingRoomUI(initialUserNum);
  }, 450);
}

function updateWaitingRoomUI(initialNum) {
  const current = Math.max(0, DistributedStore.user.queueNumber);
  if (UI.waitingRoom.userNumber) UI.waitingRoom.userNumber.textContent = `#${current.toLocaleString('id-ID')}`;
  if (UI.waitingRoom.totalQueue) UI.waitingRoom.totalQueue.textContent = Math.max(0, current - 1).toLocaleString('id-ID');

  // Calculate ETA (approx 120 users/sec)
  const remainingSecs = Math.ceil(current / 120);
  if (UI.waitingRoom.eta) UI.waitingRoom.eta.textContent = `00:${String(remainingSecs).padStart(2, '0')}s`;

  // Calculate percentage
  const donePct = Math.min(100, Math.max(5, Math.round(((initialNum - current) / initialNum) * 100)));
  if (UI.waitingRoom.progressBar) UI.waitingRoom.progressBar.style.width = `${donePct}%`;
  if (UI.waitingRoom.progressPct) UI.waitingRoom.progressPct.textContent = `${donePct}% Selesai`;
}

// ==========================================
// 7. STAGE 3: SELECTION & SEAT RESERVATION
// ==========================================
function initSelectionStage() {
  switchStage('selection');
  renderStockCounts();
}

function renderStockCounts() {
  if (UI.selection.stockVip) UI.selection.stockVip.textContent = DistributedStore.stock.vip;
  if (UI.selection.stockCat1) UI.selection.stockCat1.textContent = DistributedStore.stock.cat1;
  if (UI.selection.stockCat2) UI.selection.stockCat2.textContent = DistributedStore.stock.cat2;

  if (UI.selection.mapStockVip) UI.selection.mapStockVip.textContent = `Tersedia: ${DistributedStore.stock.vip} / ${DistributedStore.initialStock.vip}`;
  if (UI.selection.mapStockCat1) UI.selection.mapStockCat1.textContent = `Tersedia: ${DistributedStore.stock.cat1} / ${DistributedStore.initialStock.cat1}`;
  if (UI.selection.mapStockCat2) UI.selection.mapStockCat2.textContent = `Tersedia: ${DistributedStore.stock.cat2} / ${DistributedStore.initialStock.cat2}`;

  // Update card styles if sold out
  ['vip', 'cat1', 'cat2'].forEach(cat => {
    const card = document.getElementById(`card-${cat}`);
    const badge = document.getElementById(`badge-stock-${cat}`);
    if (DistributedStore.stock[cat] <= 0) {
      if (card) card.classList.add('sold-out');
      if (badge) badge.innerHTML = `<span style="color:var(--neon-rose);font-weight:800;">HABIS (SOLD OUT)</span>`;
    }
  });

  updatePriceCalculation();
}

function selectCategory(catKey) {
  if (DistributedStore.stock[catKey] <= 0) {
    alert(`Maaf, tiket kategori ${catKey.toUpperCase()} sudah habis terjual!`);
    return;
  }

  DistributedStore.user.selectedCat = catKey;

  // Update cards
  UI.selection.ticketCards.forEach(card => {
    card.classList.remove('selected');
    const btn = card.querySelector('.btn-select-cat');
    if (btn) {
      btn.classList.remove('active');
      btn.textContent = `Pilih ${card.dataset.cat.toUpperCase()}`;
    }
  });

  const selectedCard = document.getElementById(`card-${catKey}`);
  if (selectedCard) {
    selectedCard.classList.add('selected');
    const btn = selectedCard.querySelector('.btn-select-cat');
    if (btn) {
      btn.classList.add('active');
      btn.textContent = 'Dipilih ✓';
    }
  }

  updatePriceCalculation();
  appendEngineLog('GATEWAY', `User selected category: ${catKey.toUpperCase()}`);
}

function updatePriceCalculation() {
  const cat = DistributedStore.user.selectedCat;
  const qty = DistributedStore.user.qty;
  const unitPrice = DistributedStore.prices[cat] || 0;
  const total = unitPrice * qty;

  if (UI.selection.qtyVal) UI.selection.qtyVal.textContent = qty;
  if (UI.selection.totalPrice) UI.selection.totalPrice.textContent = formatRupiah(total);
}

function formatRupiah(amount) {
  return 'Rp ' + amount.toLocaleString('id-ID');
}

// ==========================================
// 8. REDIS ATOMIC LUA SCRIPT LOCK (CORE LOGIC)
// ==========================================
function executeRedisAtomicLock() {
  const cat = DistributedStore.user.selectedCat;
  const qty = DistributedStore.user.qty;

  appendEngineLog('LUA', `Executing atomic Lua Script on Redis Cluster:`);
  appendEngineLog('LUA', `> EVAL "if redis.call('get', KEYS[1]) >= ARGV[1] then return redis.call('decrby', KEYS[1], ARGV[1]) else return -1 end" 1 stock:${cat} ${qty}`);

  // Check stock
  if (DistributedStore.stock[cat] < qty) {
    appendEngineLog('ERROR', `Lua Script returned -1: OVERSOLD REJECTED! Remaining stock: ${DistributedStore.stock[cat]}`);
    alert(`Gagal mengamankan tiket! Kuota ${cat.toUpperCase()} tidak mencukupi (Sisa: ${DistributedStore.stock[cat]}).`);
    return false;
  }

  // Atomically decrement stock
  DistributedStore.stock[cat] -= qty;
  renderStockCounts();

  // Generate Order UUID
  const orderId = 'ORD-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-2026';
  DistributedStore.user.currentOrderId = orderId;

  // Set Distributed Lock with TTL 600s
  DistributedStore.activeLocks[orderId] = {
    category: cat,
    qty: qty,
    expiresAt: Date.now() + 600 * 1000
  };

  appendEngineLog('LOCK', `Redis: SETEX "lock:order:${orderId}" 600 "RESERVED" -> OK (Lock TTL: 10 Menit)`);
  appendEngineLog('WORKER', `Auto-rollback watcher scheduled for order ${orderId} in 600 seconds`);

  // Move to checkout stage
  initCheckoutStage(orderId);
  return true;
}

// ==========================================
// 9. STAGE 4: CHECKOUT & 10-MINUTE LOCK TIMER
// ==========================================
function initCheckoutStage(orderId) {
  switchStage('checkout');

  const cat = DistributedStore.user.selectedCat;
  const qty = DistributedStore.user.qty;
  const unitPrice = DistributedStore.prices[cat];
  const tax = Math.round(unitPrice * qty * 0.1); // 10% tax
  const grandTotal = (unitPrice * qty) + tax;

  if (UI.checkout.summaryOrderId) UI.checkout.summaryOrderId.textContent = orderId;
  if (UI.checkout.summaryCatBadge) UI.checkout.summaryCatBadge.textContent = cat.toUpperCase();
  if (UI.checkout.summaryQty) UI.checkout.summaryQty.textContent = `${qty} Tiket`;
  if (UI.checkout.summaryUnitPrice) UI.checkout.summaryUnitPrice.textContent = formatRupiah(unitPrice);
  if (UI.checkout.summaryTax) UI.checkout.summaryTax.textContent = formatRupiah(tax);
  if (UI.checkout.summaryGrandTotal) UI.checkout.summaryGrandTotal.textContent = formatRupiah(grandTotal);

  // Start 10-Minute Lock Countdown Timer
  startLockTimer(orderId);
}

function startLockTimer(orderId) {
  if (DistributedStore.user.lockTimerInterval) {
    clearInterval(DistributedStore.user.lockTimerInterval);
  }

  DistributedStore.user.lockTimeRemaining = 600; // 600 seconds = 10 minutes

  DistributedStore.user.lockTimerInterval = setInterval(() => {
    DistributedStore.user.lockTimeRemaining--;

    const remaining = DistributedStore.user.lockTimeRemaining;
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    if (UI.checkout.lockCountdown) {
      UI.checkout.lockCountdown.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    // If timeout reached
    if (remaining <= 0) {
      clearInterval(DistributedStore.user.lockTimerInterval);
      triggerAutoRollback(orderId, 'TIMEOUT');
    }
  }, 1000);
}

function triggerAutoRollback(orderId, reason) {
  if (DistributedStore.user.lockTimerInterval) {
    clearInterval(DistributedStore.user.lockTimerInterval);
  }

  const lockData = DistributedStore.activeLocks[orderId];
  if (!lockData) return;

  const cat = lockData.category;
  const qty = lockData.qty;

  appendEngineLog('WORKER', `⏰ [AUTO-ROLLBACK TRIGGERED] Order ${orderId} reason: ${reason}`);
  appendEngineLog('REDIS', `INCRBY "stock:${cat}" ${qty} -> Quota restored!`);
  appendEngineLog('REDIS', `DEL "lock:order:${orderId}" -> Lock released.`);

  // Return stock
  DistributedStore.stock[cat] += qty;
  delete DistributedStore.activeLocks[orderId];
  renderStockCounts();

  alert(`Waktu pemesanan Anda telah berakhir (10 Menit). Kursi otomatis dikembalikan ke ketersediaan umum.`);
  switchStage('selection');
}

// ==========================================
// 10. STAGE 5: CONFIRM PAYMENT & ISSUE E-TICKET
// ==========================================
function confirmPayment() {
  const orderId = DistributedStore.user.currentOrderId;
  const name = (UI.checkout.inputName && UI.checkout.inputName.value.trim()) || 'Raden Satria Pratama';
  const cat = DistributedStore.user.selectedCat;

  if (DistributedStore.user.lockTimerInterval) {
    clearInterval(DistributedStore.user.lockTimerInterval);
  }

  appendEngineLog('GATEWAY', `POST /api/tickets/pay (Idempotency-Key: ${orderId})`);
  appendEngineLog('POSTGRES', `BEGIN; UPDATE orders SET status='PAID' WHERE id='${orderId}'; COMMIT;`);
  appendEngineLog('REDIS', `PERSIST "lock:order:${orderId}" -> Promoted to permanent reservation.`);
  appendEngineLog('WORKER', `Ticket Generation Worker issued cryptographic QR Code & PDF ticket.`);

  // Update Ticket UI
  if (UI.ticketSuccess.holderName) UI.ticketSuccess.holderName.textContent = name;
  if (UI.ticketSuccess.finalCat) UI.ticketSuccess.finalCat.textContent = DistributedStore.categoryNames[cat];
  if (UI.ticketSuccess.orderRef) UI.ticketSuccess.orderRef.textContent = orderId;
  if (UI.ticketSuccess.seatNo) {
    UI.ticketSuccess.seatNo.textContent = cat === 'vip' ? 'VIP ROW A - SEAT 14' : (cat === 'cat1' ? 'GATE 3 - FESTIVAL C-104' : 'TRIBUNE SECTION B - SEAT 82');
  }
  if (UI.ticketSuccess.qrHash) {
    UI.ticketSuccess.qrHash.textContent = `SECURE: #${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  }

  // Switch to success
  switchStage('ticket');
}

// ==========================================
// 11. EXTREME CONCURRENCY & STRESS TEST SIMULATIONS
// ==========================================
function simulateSpikeTraffic() {
  DistributedStore.user.totalQueue += 10000;
  appendEngineLog('GATEWAY', `⚡ [TRAFFIC SURGE DETECTED] Incoming burst of 10,000 users!`);
  appendEngineLog('REDIS', `Virtual Waiting Room absorbing load. Redis memory healthy.`);
  if (UI.waitingRoom.totalQueue) UI.waitingRoom.totalQueue.textContent = DistributedStore.user.totalQueue.toLocaleString('id-ID');
  alert(`Simulasi: 10.000 pengantre tambahan masuk antrean. Sistem antrean menahan lonjakan dengan aman.`);
}

function simulateRaceCondition() {
  appendEngineLog('LUA', `⚡ [CONCURRENCY STRESS TEST] 50 bot clients competing for 2 tickets simultaneously...`);

  let wins = 0;
  let rejects = 0;

  for (let i = 1; i <= 50; i++) {
    if (DistributedStore.stock.vip >= 1 && wins < 2) {
      DistributedStore.stock.vip--;
      wins++;
      appendEngineLog('LUA', `Bot #${i}: EVALSHA -> SUCCESS! Claimed ticket. Remaining: ${DistributedStore.stock.vip}`);
    } else {
      rejects++;
    }
  }

  renderStockCounts();
  appendEngineLog('REDIS', `Concurrency test complete: ${wins} claims allowed, ${rejects} rejected (HTTP 409 Conflict). Overselling: 0!`);
  alert(`Uji Konkurensi Selesai!\n50 Bot serentak berebut tiket:\n- Berhasil: ${wins}\n- Ditolak (Anti-Overselling): ${rejects}\n\nSisa Tiket VIP: ${DistributedStore.stock.vip}`);
}

function simulateKillWorker() {
  DistributedStore.nodes.worker = !DistributedStore.nodes.worker;

  if (!DistributedStore.nodes.worker) {
    appendEngineLog('ERROR', `☠️ [FAULT TOLERANCE TEST] Background Worker daemon SIMULATED FAILURE!`);
    appendEngineLog('GATEWAY', `API Gateway & Redis still 100% OPERATIONAL. Users can still browse & queue.`);
    alert(`Simulasi Gangguan Node Worker aktif!\nGateway & Redis tetap berjalan normal melayani antrean (Fault Isolation).`);
  } else {
    appendEngineLog('WORKER', `✅ Background Worker daemon RESTARTED & healthy.`);
    alert(`Worker berhasil direstart normal.`);
  }
}

function resetAllDemoData() {
  DistributedStore.stock = { ...DistributedStore.initialStock };
  DistributedStore.activeLocks = {};
  DistributedStore.user.qty = 1;

  if (queueSimulationInterval) clearInterval(queueSimulationInterval);
  if (DistributedStore.user.lockTimerInterval) clearInterval(DistributedStore.user.lockTimerInterval);

  renderStockCounts();
  appendEngineLog('GATEWAY', `🔄 System state reset to initial catalog values.`);
  switchStage('hero');
  alert(`Data kuota tiket dan antrean telah dikembalikan ke kondisi awal!`);
}

// ==========================================
// 12. EVENT LISTENERS INITIALIZATION
// ==========================================
function setupEventListeners() {
  // Hero Actions
  if (UI.heroCountdown.btnStart) {
    UI.heroCountdown.btnStart.addEventListener('click', () => startWaitingRoomQueue());
  }

  // Waiting Room Actions
  if (UI.waitingRoom.btnSkip) {
    UI.waitingRoom.btnSkip.addEventListener('click', () => {
      if (queueSimulationInterval) clearInterval(queueSimulationInterval);
      DistributedStore.user.queueNumber = 0;
      appendEngineLog('GATEWAY', '⚡ [TEST SPEEDUP] Waiting room queue bypassed.');
      initSelectionStage();
    });
  }

  // Category Selection
  UI.selection.seatZones.forEach(zone => {
    zone.addEventListener('click', () => {
      selectCategory(zone.dataset.category);
    });
  });

  UI.selection.ticketCards.forEach(card => {
    card.addEventListener('click', () => {
      selectCategory(card.dataset.cat);
    });
  });

  // Quantity Controls (Max 2 tickets per user rule)
  if (UI.selection.btnQtyMinus) {
    UI.selection.btnQtyMinus.addEventListener('click', () => {
      if (DistributedStore.user.qty > 1) {
        DistributedStore.user.qty--;
        updatePriceCalculation();
      }
    });
  }

  if (UI.selection.btnQtyPlus) {
    UI.selection.btnQtyPlus.addEventListener('click', () => {
      if (DistributedStore.user.qty < 2) {
        DistributedStore.user.qty++;
        updatePriceCalculation();
      } else {
        alert('Sesuai ketentuan resmi, pembelian dibatasi maksimal 2 tiket per transaksi.');
      }
    });
  }

  // Lock Tickets Button
  if (UI.selection.btnLock) {
    UI.selection.btnLock.addEventListener('click', () => {
      executeRedisAtomicLock();
    });
  }

  // Checkout Actions
  if (UI.checkout.btnPay) {
    UI.checkout.btnPay.addEventListener('click', () => {
      confirmPayment();
    });
  }

  if (UI.checkout.btnTimeout) {
    UI.checkout.btnTimeout.addEventListener('click', () => {
      if (confirm('Apakah Anda yakin ingin membatalkan pemesanan ini? Kursi Anda akan dilepaskan kembali ke ketersediaan umum.')) {
        triggerAutoRollback(DistributedStore.user.currentOrderId, 'USER_MANUAL_CANCEL');
      }
    });
  }

  // Ticket Success Actions
  if (UI.ticketSuccess.btnPrint) {
    UI.ticketSuccess.btnPrint.addEventListener('click', () => {
      window.print();
    });
  }

  if (UI.ticketSuccess.btnRestart) {
    UI.ticketSuccess.btnRestart.addEventListener('click', () => {
      switchStage('hero');
    });
  }

  // Inspector Drawer Controls
  if (UI.inspector.btnToggle) {
    UI.inspector.btnToggle.addEventListener('click', () => {
      UI.inspector.drawer.classList.toggle('open');
    });
  }

  if (UI.inspector.btnClose) {
    UI.inspector.btnClose.addEventListener('click', () => {
      UI.inspector.drawer.classList.remove('open');
    });
  }

  if (UI.inspector.btnClear) {
    UI.inspector.btnClear.addEventListener('click', () => {
      UI.inspector.logConsole.innerHTML = '';
    });
  }

  if (UI.inspector.btnResetDemo) {
    UI.inspector.btnResetDemo.addEventListener('click', () => {
      resetAllDemoData();
    });
  }

  // Simulation Triggers
  if (UI.inspector.simSpike) UI.inspector.simSpike.addEventListener('click', () => simulateSpikeTraffic());
  if (UI.inspector.simRace) UI.inspector.simRace.addEventListener('click', () => simulateRaceCondition());
  if (UI.inspector.simKillWorker) UI.inspector.simKillWorker.addEventListener('click', () => simulateKillWorker());
}

// ==========================================
// 13. BOOTSTRAP APPLICATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  initHeroCountdown();
  renderStockCounts();

  appendEngineLog('GATEWAY', 'Portal Gateway operational on HTTPS :443');
  appendEngineLog('REDIS', 'Stock cluster synchronization active (0 locks active)');
  appendEngineLog('WORKER', 'Auto-Rollback Watcher daemon active (Scanning TTL every 1s)');
  appendEngineLog('POSTGRES', 'Database transaction pool connected and ready');
});
