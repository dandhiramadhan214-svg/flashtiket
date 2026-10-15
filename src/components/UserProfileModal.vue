<script setup>
import { ref, watch } from 'vue';
import { useAuthStore } from '../stores/authStore';
import { useNotifStore } from '../stores/notifStore';

const authStore = useAuthStore();
const notifStore = useNotifStore();

const isEditing = ref(false);
const editName = ref('');
const editPhone = ref('');
const isSaving = ref(false);

watch(() => authStore.isProfileModalOpen, (isOpen) => {
  if (isOpen) {
    isEditing.value = false;
    editName.value = authStore.currentUser.name || '';
    editPhone.value = authStore.currentUser.phone || '';
  }
});

async function handleSaveProfile() {
  if (!editName.value.trim()) {
    notifStore.push('error', 'Validasi Gagal', 'Nama lengkap tidak boleh kosong.');
    return;
  }

  isSaving.value = true;
  try {
    await authStore.updateProfile({
      name: editName.value.trim(),
      phone: editPhone.value.trim(),
    });
    isEditing.value = false;
    notifStore.push('success', 'Profil Diperbarui', 'Data akun resmi Anda telah tersimpan dan disinkronkan.');
  } catch (err) {
    notifStore.push('error', 'Gagal Menyimpan', 'Terjadi kesalahan saat memperbarui profil.');
  } finally {
    isSaving.value = false;
  }
}
</script>

<template>
  <div 
    v-if="authStore.isProfileModalOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-none transition-all"
    @click.self="authStore.closeProfileModal()"
  >
    <!-- Modal Card (Brutalist Monochrome) -->
    <div class="relative w-full max-w-lg bg-white border-4 border-black p-6 sm:p-8 space-y-6 z-10 font-mono text-xs">
      
      <!-- Header -->
      <div class="flex items-center justify-between border-b-2 border-black pb-4">
        <div>
          <span class="text-[10px] text-[#525252] uppercase tracking-widest">SISTEM IDENTITAS RESMI</span>
          <h2 class="font-serif font-black text-2xl text-black">PROFIL PENGGUNA</h2>
        </div>
        <button 
          @click="authStore.closeProfileModal()"
          class="font-mono text-xs uppercase underline text-[#525252] hover:text-black cursor-pointer"
        >
          [Tutup]
        </button>
      </div>

      <!-- User Card Header Badge -->
      <div class="border-2 border-black p-4 bg-[#F5F5F5] flex items-center gap-4">
        <div class="w-14 h-14 bg-black text-white flex items-center justify-center font-bold text-lg border border-black">
          {{ authStore.currentUser.avatarText || 'KP' }}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <h3 class="font-serif font-black text-lg text-black truncate">{{ authStore.currentUser.name }}</h3>
            <span class="bg-black text-white text-[9px] px-2 py-0.5 font-mono uppercase font-bold">
              {{ authStore.currentUser.role === 'admin' ? 'ADMIN' : 'ANGGOTA RESMI' }}
            </span>
          </div>
          <div class="text-[11px] text-[#525252] font-mono truncate">{{ authStore.currentUser.email }}</div>
          <div class="text-[10px] text-[#059669] font-bold mt-0.5 flex items-center gap-1">
            <span>●</span>
            <span>TERVERIFIKASI ANTI-CALO (1 AKUN = 1 NIK)</span>
          </div>
        </div>
      </div>

      <!-- Profile Information Display / Edit Form -->
      <div v-if="!isEditing" class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="border border-black p-3">
            <span class="block text-[10px] text-[#525252] uppercase font-bold">ID PENGGUNA</span>
            <span class="font-bold text-black text-sm">{{ authStore.currentUser.id || 'USR-8921' }}</span>
          </div>
          <div class="border border-black p-3 bg-[#FAFAFA]">
            <span class="block text-[10px] text-[#525252] uppercase font-bold">NIK KTP (16 DIGIT)</span>
            <span class="font-bold text-black text-sm">{{ authStore.currentUser.nik || '31710482910002' }}</span>
            <span class="block text-[9px] text-[#737373] mt-0.5">Terkunci (Sesuai regulasi konser)</span>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="border border-black p-3">
            <span class="block text-[10px] text-[#525252] uppercase font-bold">EMAIL RESMI</span>
            <span class="font-bold text-black text-sm truncate block">{{ authStore.currentUser.email }}</span>
          </div>
          <div class="border border-black p-3">
            <span class="block text-[10px] text-[#525252] uppercase font-bold">WHATSAPP / HP</span>
            <span class="font-bold text-black text-sm">{{ authStore.currentUser.phone || '-' }}</span>
          </div>
        </div>

        <!-- Security / Anti-Calo Info Banner -->
        <div class="border border-dashed border-black p-3 bg-white text-[11px] space-y-1">
          <div class="font-bold text-black uppercase flex items-center gap-1.5">
            <span>🛡️ KEAMANAN TIKET RESMI</span>
          </div>
          <div class="text-[#525252]">
            NIK KTP Anda digunakan otomatis saat membeli tiket untuk mencegah calo dan menjamin keaslian tiket di pintu masuk stadion.
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3 pt-2">
          <button 
            @click="isEditing = true"
            class="flex-1 py-3 border-2 border-black font-bold uppercase hover:bg-black hover:text-white transition-colors cursor-pointer text-center"
          >
            Ubah Data Profil
          </button>
          <button 
            @click="authStore.closeProfileModal(); authStore.isMyTicketsOpen = true"
            class="flex-1 py-3 bg-black text-white border-2 border-black font-bold uppercase hover:bg-white hover:text-black transition-colors cursor-pointer text-center"
          >
            Lihat Tiket Saya →
          </button>
        </div>
      </div>

      <!-- EDIT MODE FORM -->
      <form v-else @submit.prevent="handleSaveProfile" class="space-y-4">
        <div>
          <label class="block uppercase tracking-wider text-[#525252] text-[10px] mb-1 font-bold">Nama Lengkap (Sesuai KTP)</label>
          <input 
            v-model="editName"
            type="text"
            class="w-full bg-transparent border-2 border-black p-2.5 text-sm font-serif font-bold text-black focus:outline-none"
            placeholder="Nama Lengkap"
            required
          />
        </div>

        <div>
          <label class="block uppercase tracking-wider text-[#525252] text-[10px] mb-1 font-bold">WhatsApp / No. Telepon</label>
          <input 
            v-model="editPhone"
            type="text"
            class="w-full bg-transparent border-2 border-black p-2.5 text-sm font-mono text-black focus:outline-none"
            placeholder="08123456789"
          />
        </div>

        <div class="border border-black p-3 bg-[#F5F5F5] text-[10px] text-[#525252]">
          <span class="font-bold text-black">Catatan:</span> NIK ({{ authStore.currentUser.nik }}) dan Email tidak dapat diubah sembarangan demi keamanan kepemilikan tiket konser Anda.
        </div>

        <div class="flex gap-3 pt-2">
          <button 
            type="button"
            @click="isEditing = false"
            class="flex-1 py-3 border-2 border-black font-bold uppercase hover:bg-[#F2F2F2] transition-colors cursor-pointer text-center"
          >
            Batal
          </button>
          <button 
            type="submit"
            :disabled="isSaving"
            class="flex-1 py-3 bg-black text-white border-2 border-black font-bold uppercase hover:bg-white hover:text-black transition-colors cursor-pointer text-center disabled:opacity-50"
          >
            <span>{{ isSaving ? 'Menyimpan...' : 'Simpan Perubahan ✓' }}</span>
          </button>
        </div>
      </form>

    </div>
  </div>
</template>
