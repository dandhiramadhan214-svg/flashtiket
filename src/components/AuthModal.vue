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

const loginEmail = ref('');
const loginPassword = ref('');
const rememberMe = ref(true);

const regName = ref('');
const regEmail = ref('');
const regPhone = ref('');
const regNik = ref('');
const regPassword = ref('');
const agreeTerms = ref(true);

const errorMessage = ref('');
const isSubmitting = ref(false);

async function handleLoginSubmit() {
  errorMessage.value = '';
  if (!loginEmail.value || !loginPassword.value) {
    errorMessage.value = 'Silakan isi email dan kata sandi Anda.';
    return;
  }

  isSubmitting.value = true;
  try {
    const res = await authStore.login(loginEmail.value, loginPassword.value);
    
    if (res?.success === false) {
      errorMessage.value = res.error || 'Login gagal. Periksa kembali email dan kata sandi Anda.';
      return;
    }

    if (res?.role === 'admin') {
      queueStore.setStage('admin');
      notifStore.push('success', 'Role Administrator', 'Login berhasil! Membuka Dashboard Admin.');
      return;
    }

    ticketStore.customer.name = authStore.currentUser.name;
    ticketStore.customer.email = authStore.currentUser.email;
    ticketStore.customer.phone = authStore.currentUser.phone;
    ticketStore.customer.nik = authStore.currentUser.nik;

    const cloudMsg = res?.fromCloud ? ' (Sinkron Cloud Supabase)' : '';
    notifStore.push('info', 'Login Berhasil', `Selamat datang kembali, ${authStore.currentUser.name}!${cloudMsg}`);
  } catch (err) {
    errorMessage.value = 'Terjadi kesalahan sistem saat masuk. Silakan coba lagi.';
  } finally {
    isSubmitting.value = false;
  }
}

async function handleRegisterSubmit() {
  errorMessage.value = '';
  if (!regName.value || !regEmail.value || !regPhone.value || !regNik.value || !regPassword.value) {
    errorMessage.value = 'Mohon lengkapi seluruh formulir pendaftaran.';
    return;
  }
  if (!agreeTerms.value) {
    errorMessage.value = 'Anda harus menyetujui Syarat & Ketentuan.';
    return;
  }

  isSubmitting.value = true;
  try {
    const res = await authStore.register({
      name: regName.value,
      email: regEmail.value,
      phone: regPhone.value,
      nik: regNik.value,
      password: regPassword.value,
    });

    if (res?.success === false) {
      errorMessage.value = res.error || 'Pendaftaran gagal.';
      return;
    }

    ticketStore.customer.name = regName.value;
    ticketStore.customer.email = regEmail.value;
    ticketStore.customer.phone = regPhone.value;
    ticketStore.customer.nik = regNik.value;
    notifStore.push('success', 'Pendaftaran Berhasil', 'Akun resmi FlashTiket Anda telah aktif & tersinkron cloud!');
  } catch (err) {
    errorMessage.value = 'Terjadi kendala saat mendaftar. Silakan coba kembali.';
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div 
    v-if="authStore.isAuthModalOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-none transition-all"
    @click.self="authStore.closeAuthModal()"
  >

    <!-- Modal Box (Minimalist Monochrome) -->
    <div class="relative w-full max-w-md bg-white border-4 border-black p-6 space-y-6 z-10 font-mono">
      
      <!-- Modal Header -->
      <div class="flex items-center justify-between border-b-2 border-black pb-3">
        <div>
          <span class="text-[10px] text-[#525252] uppercase tracking-widest">OTENTIKASI RESMI</span>
          <h2 class="font-serif font-black text-2xl text-black">FLASHTIKET ID</h2>
        </div>
        <button 
          @click="authStore.closeAuthModal()"
          class="font-mono text-xs uppercase underline text-[#525252] hover:text-black cursor-pointer"
        >
          [Tutup]
        </button>
      </div>

      <!-- Tab Switcher (Sharp Black & White) -->
      <div class="grid grid-cols-2 border-2 border-black text-xs uppercase text-center font-bold">
        <button 
          @click="authStore.authModalTab = 'login'; errorMessage = ''"
          class="py-2.5 transition-colors cursor-pointer"
          :class="authStore.authModalTab === 'login' ? 'bg-black text-white' : 'bg-white text-black hover:bg-black hover:text-white'"
        >
          Masuk Akun
        </button>
        <button 
          @click="authStore.authModalTab = 'register'; errorMessage = ''"
          class="py-2.5 transition-colors cursor-pointer border-l-2 border-black"
          :class="authStore.authModalTab === 'register' ? 'bg-black text-white' : 'bg-white text-black hover:bg-black hover:text-white'"
        >
          Daftar Baru
        </button>
      </div>

      <!-- Error Alert -->
      <div v-if="errorMessage" class="p-3 border-2 border-black bg-black text-white text-xs">
        <span>[!] {{ errorMessage }}</span>
      </div>

      <!-- TAB 1: LOGIN FORM -->
      <form v-if="authStore.authModalTab === 'login'" @submit.prevent="handleLoginSubmit" class="space-y-5 text-xs">
        <div>
          <label class="block uppercase tracking-wider text-[#525252] text-[10px] mb-1">Email / Pengenal</label>
          <input 
            v-model="loginEmail"
            type="text"
            placeholder="nama@email.com"
            class="w-full bg-transparent border-b-2 border-black py-2 text-sm text-black font-mono focus:border-b-4 focus:outline-none transition-all placeholder:text-[#525252] placeholder:italic"
          />
        </div>

        <div>
          <label class="block uppercase tracking-wider text-[#525252] text-[10px] mb-1">Kata Sandi</label>
          <input 
            v-model="loginPassword"
            type="password"
            placeholder="••••••••"
            class="w-full bg-transparent border-b-2 border-black py-2 text-sm text-black font-mono focus:border-b-4 focus:outline-none transition-all"
          />
        </div>

        <div class="flex items-center justify-between text-xs pt-1">
          <label class="flex items-center gap-2 cursor-pointer text-[#525252]">
            <input v-model="rememberMe" type="checkbox" class="accent-black" />
            <span>Ingat Saya</span>
          </label>
          <a href="#" class="text-black underline uppercase text-[10px]">Lupa Sandi?</a>
        </div>

        <button 
          type="submit"
          class="btn-mono-primary w-full py-4 text-xs font-bold"
        >
          <span>Masuk ke Sistem →</span>
        </button>
      </form>

      <!-- TAB 2: REGISTER FORM -->
      <form v-else @submit.prevent="handleRegisterSubmit" class="space-y-4 text-xs">
        <div>
          <label class="block uppercase tracking-wider text-[#525252] text-[10px] mb-1">Nama Lengkap (Sesuai KTP)</label>
          <input 
            v-model="regName"
            type="text"
            placeholder="Kevin Pratama"
            class="w-full bg-transparent border-b-2 border-black py-2 text-sm text-black font-serif font-semibold focus:border-b-4 focus:outline-none transition-all placeholder:text-[#525252] placeholder:italic"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block uppercase tracking-wider text-[#525252] text-[10px] mb-1">Email</label>
            <input 
              v-model="regEmail"
              type="email"
              placeholder="nama@email.com"
              class="w-full bg-transparent border-b-2 border-black py-2 text-sm text-black font-mono focus:border-b-4 focus:outline-none transition-all"
            />
          </div>
          <div>
            <label class="block uppercase tracking-wider text-[#525252] text-[10px] mb-1">WhatsApp</label>
            <input 
              v-model="regPhone"
              type="text"
              placeholder="081234567890"
              class="w-full bg-transparent border-b-2 border-black py-2 text-sm text-black font-mono focus:border-b-4 focus:outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <label class="block uppercase tracking-wider text-[#525252] text-[10px] mb-1">NIK (16 Digit KTP)</label>
          <input 
            v-model="regNik"
            type="text"
            placeholder="31710482910002"
            class="w-full bg-transparent border-b-2 border-black py-2 text-sm text-black font-mono focus:border-b-4 focus:outline-none transition-all"
          />
        </div>

        <div>
          <label class="block uppercase tracking-wider text-[#525252] text-[10px] mb-1">Kata Sandi Baru</label>
          <input 
            v-model="regPassword"
            type="password"
            placeholder="Minimal 8 karakter"
            class="w-full bg-transparent border-b-2 border-black py-2 text-sm text-black font-mono focus:border-b-4 focus:outline-none transition-all"
          />
        </div>

        <label class="flex items-start gap-2 cursor-pointer text-[10px] text-[#525252] pt-1">
          <input v-model="agreeTerms" type="checkbox" class="mt-0.5 accent-black" />
          <span>Saya menyetujui Ketentuan Layanan &amp; Kebijakan Privasi Resmi FlashTiket.</span>
        </label>

        <button 
          type="submit"
          class="btn-mono-primary w-full py-4 text-xs font-bold"
        >
          <span>Daftarkan Akun Resmi →</span>
        </button>
      </form>

    </div>
  </div>
</template>
