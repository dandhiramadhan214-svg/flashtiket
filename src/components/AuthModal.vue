<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../stores/authStore';
import { useTicketStore } from '../stores/ticketStore';
import { useQueueStore } from '../stores/queueStore';
import { useNotifStore } from '../stores/notifStore';
import SvgIcon from './SvgIcon.vue';

const authStore = useAuthStore();
const ticketStore = useTicketStore();
const queueStore = useQueueStore();
const notifStore = useNotifStore();

// Login Form State
const loginEmail = ref('');
const loginPassword = ref('');
const rememberMe = ref(true);

// Register Form State
const regName = ref('');
const regEmail = ref('');
const regPhone = ref('');
const regNik = ref('');
const regPassword = ref('');
const agreeTerms = ref(true);

const errorMessage = ref('');

function handleLoginSubmit() {
  errorMessage.value = '';
  if (!loginEmail.value || !loginPassword.value) {
    errorMessage.value = 'Silakan isi email dan kata sandi Anda.';
    return;
  }

  const res = authStore.login(loginEmail.value, loginPassword.value);
  
  // Role-based behavior:
  if (res?.role === 'admin') {
    queueStore.setStage('admin');
    notifStore.push('success', 'Role Administrator', 'Login berhasil! Membuka Dashboard Admin FlashTiket.');
    return;
  }

  // Regular user role
  ticketStore.customer.name = authStore.currentUser.name;
  ticketStore.customer.email = authStore.currentUser.email;
  ticketStore.customer.phone = authStore.currentUser.phone;
  ticketStore.customer.nik = authStore.currentUser.nik;
  notifStore.push('info', 'Login Berhasil', `Selamat datang kembali, ${authStore.currentUser.name}!`);
}



function handleRegisterSubmit() {
  errorMessage.value = '';
  if (!regName.value || !regEmail.value || !regPhone.value || !regNik.value || !regPassword.value) {
    errorMessage.value = 'Mohon lengkapi seluruh formulir pendaftaran.';
    return;
  }
  if (!agreeTerms.value) {
    errorMessage.value = 'Anda harus menyetujui Syarat & Ketentuan.';
    return;
  }

  authStore.register({
    name: regName.value,
    email: regEmail.value,
    phone: regPhone.value,
    nik: regNik.value,
    password: regPassword.value,
  });

  // Auto-sync with ticket customer info
  ticketStore.customer.name = regName.value;
  ticketStore.customer.email = regEmail.value;
  ticketStore.customer.phone = regPhone.value;
  ticketStore.customer.nik = regNik.value;
  notifStore.push('success', 'Pendaftaran Berhasil', 'Akun resmi FlashTiket Anda telah aktif!');
}
</script>

<template>
  <div 
    v-if="authStore.isAuthModalOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm transition-all"
    @click.self="authStore.closeAuthModal()"
  >

    <!-- Modal Box -->
    <div class="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-10 transition-all scale-100 animate-in fade-in zoom-in-95">
      
      <!-- Modal Header -->
      <div class="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-navy dark:bg-sky flex items-center justify-center text-white">
            <SvgIcon name="bolt" className="w-4 h-4 text-white" />
          </div>
          <span class="font-extrabold text-navy dark:text-sky text-lg tracking-tight">FlashTiket ID</span>
        </div>
        <button 
          @click="authStore.closeAuthModal()"
          class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-colors text-sm font-bold cursor-pointer"
        >
          <SvgIcon name="cancel" className="w-4 h-4" />
        </button>
      </div>

      <!-- Tab Switcher (Only 2 tabs: Masuk Akun & Daftar Baru) -->
      <div class="p-4 pb-0">
        <div class="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold text-center">
          <button 
            @click="authStore.authModalTab = 'login'; errorMessage = ''"
            class="py-2.5 rounded-xl transition-all cursor-pointer"
            :class="authStore.authModalTab === 'login' ? 'bg-white dark:bg-slate-900 text-navy dark:text-sky shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-navy dark:hover:text-sky'"
          >
            Masuk Akun
          </button>
          <button 
            @click="authStore.authModalTab = 'register'; errorMessage = ''"
            class="py-2.5 rounded-xl transition-all cursor-pointer"
            :class="authStore.authModalTab === 'register' ? 'bg-white dark:bg-slate-900 text-navy dark:text-sky shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-navy dark:hover:text-sky'"
          >
            Daftar Baru
          </button>
        </div>
      </div>

      <!-- Error Alert -->
      <div v-if="errorMessage" class="mx-6 mt-4 p-3 rounded-xl bg-coral-light dark:bg-rose-950/40 border border-coral/30 dark:border-rose-900/40 text-xs text-coral dark:text-rose-300 font-medium flex items-center gap-2">
        <SvgIcon name="warning" className="w-4 h-4 text-coral dark:text-rose-400 shrink-0" />
        <span>{{ errorMessage }}</span>
      </div>

      <!-- TAB 1: LOGIN FORM -->
      <form v-if="authStore.authModalTab === 'login'" @submit.prevent="handleLoginSubmit" class="p-6 space-y-4">
        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">Email atau No. Handphone</label>
          <div class="relative">
            <input 
              v-model="loginEmail"
              type="text"
              placeholder="nama@email.com"
              class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-sky focus:bg-white dark:focus:bg-slate-800 transition-all"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">Kata Sandi</label>
          <input 
            v-model="loginPassword"
            type="password"
            placeholder="••••••••"
            class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-sky focus:bg-white dark:focus:bg-slate-800 transition-all"
          />
        </div>

        <div class="flex items-center justify-between text-xs">
          <label class="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-300">
            <input v-model="rememberMe" type="checkbox" class="rounded text-navy dark:text-sky focus:ring-navy" />
            <span>Ingat Saya</span>
          </label>
          <a href="#" class="text-coral hover:underline font-semibold">Lupa Password?</a>
        </div>

        <button 
          type="submit"
          class="w-full py-3.5 rounded-xl bg-navy dark:bg-sky text-white font-bold text-sm shadow-soft hover:bg-navy-light dark:hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Masuk ke FlashTiket</span>
          <SvgIcon name="arrow-right" className="w-4 h-4 text-white" />
        </button>
      </form>

      <!-- TAB 2: REGISTER FORM -->
      <form v-else @submit.prevent="handleRegisterSubmit" class="p-6 space-y-3.5">
        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Nama Lengkap (Sesuai KTP/Paspor)</label>
          <input 
            v-model="regName"
            type="text"
            placeholder="Contoh: Kevin Pratama"
            class="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-sky focus:bg-white dark:focus:bg-slate-800 transition-all"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Email</label>
            <input 
              v-model="regEmail"
              type="email"
              placeholder="nama@email.com"
              class="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-sky focus:bg-white dark:focus:bg-slate-800 transition-all"
            />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">No. WhatsApp</label>
            <input 
              v-model="regPhone"
              type="text"
              placeholder="081234567890"
              class="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-sky focus:bg-white dark:focus:bg-slate-800 transition-all"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">NIK / No. Identitas Resmi</label>
          <input 
            v-model="regNik"
            type="text"
            placeholder="16 digit NIK KTP"
            class="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 font-mono placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-sky focus:bg-white dark:focus:bg-slate-800 transition-all"
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Kata Sandi</label>
          <input 
            v-model="regPassword"
            type="password"
            placeholder="Minimal 8 karakter"
            class="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-navy dark:focus:ring-sky focus:bg-white dark:focus:bg-slate-800 transition-all"
          />
        </div>

        <label class="flex items-start gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-300 pt-1">
          <input v-model="agreeTerms" type="checkbox" class="mt-0.5 rounded text-navy dark:text-sky focus:ring-navy" />
          <span>Saya menyetujui Ketentuan Layanan &amp; Kebijakan Privasi Resmi FlashTiket.</span>
        </label>

        <button 
          type="submit"
          class="w-full py-3.5 rounded-xl bg-navy dark:bg-sky text-white font-bold text-sm shadow-soft hover:bg-navy-light dark:hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
        >
          <span>Buat Akun Resmi</span>
          <SvgIcon name="arrow-right" className="w-4 h-4 text-white" />
        </button>
      </form>

    </div>
  </div>
</template>
