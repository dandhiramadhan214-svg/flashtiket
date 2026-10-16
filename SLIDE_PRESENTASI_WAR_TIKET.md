# 🎟️ SLIDE PRESENTASI: SISTEM WAR TIKET FLASHTIKET
**Tema**: Arsitektur Sistem Terdistribusi FlashTiket — Rekayasa Konkurensi & Distributed Lock  
**Gaya Desain**: *Minimalist Technical Blueprint / Editorial Engineering Console* (Bukan AI Slop).  
**Palet Warna**: Deep Slate (`#090D16`), Crisp White (`#F8FAFC`), Muted Steel (`#64748B`), Terminal Emerald (`#10B981`), Signal Amber (`#F59E0B`), Edge Cyan (`#06B6D4`).

---

## 🚫 ATURAN DESAIN (ANTI-AI SLOP DIRECTIVE)
Jika mendesain di Canva atau PowerPoint, patuhi pedoman visual ini agar presentasi tampak seperti engineering deck berstandar Stripe, Cloudflare, atau Vercel:
* ❌ **JANGAN GUNAKAN**: Ilustrasi otak bercahaya, robot 3D generik, manusia kartun hologram, latar belakang partikel siber acak, atau foto stok korporat klise.
* ✅ **GUNAKAN**: 
  * Layout grid geometris bersih (Card UI) dengan garis batas tipis (*1px border*).
  * Tipografi monospace (*JetBrains Mono / Courier / Roboto Mono*) untuk kode dan metrik sistem.
  * Diagram alur berkotak rapi (*Architecture Box Diagram*).
  * Badge status ala konsol server (`[HEALTHY]`, `[TTL: 600s]`, `[FIFO]`).

---

## 📋 PROMPT CANVA (ANTI-AI SLOP VERSION)

Salin teks berikut ke Canva Magic Design:

```text
Buatkan presentasi teknis 7 slide dengan gaya "Minimalist Engineering Console / Technical Architecture Blueprint".

PANDUAN DESAIN WAJIB:
- Latar belakang: Deep Charcoal / Dark Slate (#090D16), teks putih tegas (#F8FAFC), dan aksen Cyan (#06B6D4) & Amber (#F59E0B).
- Tampilan: Clean, modern, data-driven, monospace code blocks, dan layout kartu/grid terstruktur.
- DILARANG menggunakan gambar AI abstrak, robot, hologram, atau ilustrasi fiksi ilmiah yang tidak relevan (NO AI SLOP). Fokus pada diagram blok sistem, tabel metrik, dan skema teknis.

STRUKTUR 7 SLIDE:
Slide 1: Judul Proyek - FlashTiket (High-Concurrency Distributed Ticket Reservation System)
Slide 2: Technical Breakdown - 3 Akar Masalah Web Tiket Konvensional (Connection Exhaustion, Race Conditions, Bot Attacks)
Slide 3: Topologi Arsitektur - 4 Layer Sistem Terdistribusi (Edge Gateway, Redis ZSET Queue, In-Memory Lua Locks, PostgreSQL Storage)
Slide 4: Strategi Database Ganda - Perbandingan Kinerja Redis RAM (<1ms) vs PostgreSQL SSD Supabase
Slide 5: Alur Siklus Transaksi - 5 Tahapan Reservasi, Penguncian Kuota TTL 10 Menit, & Rollback Otomatis
Slide 6: Spesifikasi Tech Stack - Vue 3, Express.js Node.js, Redis Cluster, Supabase, Vercel Edge
Slide 7: Kesimpulan & Verifikasi - Jaminan Zero-Overselling, Anti-Crash, dan Sesi Diskusi Teknikal
```

---

## 🖥️ RINCIAN 7 SLIDE & SKRIP PRESENTASI

---

### 🖥️ SLIDE 1: COVER PRESENTASI
* **Visual**: Layout minimalis asimetris. Judul besar putih, badge status hijau neon di kiri atas, garis aksen cyan tipis.

```text
[ STATUS: SYSTEM ONLINE · CONCURRENCY ENGINE V2.0 ]

FLASHTIKET
High-Concurrency Distributed Ticket Reservation Architecture

Rekayasa Sistem Terdistribusi untuk Menangani Flash Crowd Konser Skala Besar 
Tanpa Server Crash & Jaminan Zero-Overselling

Oleh: [Nama Anda / Kelompok]
Teknik Informatika · Rekayasa Perangkat Lunak
```

* **🗣️ Skrip Bicara**:
  > *"Selamat pagi/siang bapak/ibu dosen dan teman-teman. Hari ini saya membawakan presentasi mengenai 'FlashTiket', sebuah arsitektur sistem web terdistribusi yang direkayasa khusus untuk memecahkan kegagalan sistematis yang selalu terjadi pada momen 'War Tiket' konser berskala puluhan ribu penonton."*

---

### 🖥️ SLIDE 2: 3 KELEMAHAN SISTEM KONVENSIONAL
* **Visual**: 3 Kartu Persegi Berjajar (*Grid 3 Kolom*), latar kartu `#0F172A`, border tipis `#334155`, angka 01, 02, 03 berwarna amber.

```text
AKAR MASALAH PADA ARSITEKTUR MONOLITIK BIASA
Karakteristik Flash Crowd: 100.000 request serentak menembak sistem pada detik 10:00:00.

┌─────────────────────────┬─────────────────────────┬─────────────────────────┐
│ 01. CONNECTION POOL     │ 02. RACE CONDITION      │ 03. BOT & CALO SPIKE    │
│     EXHAUSTION          │     (OVERSELLING)       │                         │
├─────────────────────────┼─────────────────────────┼─────────────────────────┤
│ • Ribuan koneksi SQL    │ • Kuota sisa 1 tiket,   │ • Script curl/bot       │
│   langsung mengunci     │   namun 5 query SELECT  │   menembak 20 req/detik │
│   tabel (SELECT FOR     │   membaca sisa 1 di     │   per thread.           │
│   UPDATE) di harddisk.  │   milidetik yang sama.  │                         │
│ • Database kehabisan    │ • Hasil: Tiket terjual  │ • Pengunjung manusia    │
│   koneksi (Error 502/   │   melebihi kapasitas    │   terdepak karena tidak │
│   504 Gateway Timeout). │   fisik stadion.        │   ada FIFO rate-limit.  │
└─────────────────────────┴─────────────────────────┴─────────────────────────┘
```

* **🗣️ Skrip Bicara**:
  > *"Mengapa web tiket biasa selalu tumbang? Bukan karena internet lemot, tapi karena arsitektur database relasional biasa tidak dirancang untuk lonjakan serentak. Pertama, connection pool database langsung penuh dan crash. Kedua, terjadi race condition—stok sisa 1 terbaca oleh beberapa thread bersamaan sehingga terjual dobel. Ketiga, serbuan bot otomatis menghabiskan kuota dalam hitungan milidetik."*

---

### 🖥️ SLIDE 3: BLUEPRINT ARSITEKTUR MULTI-TIER
* **Visual**: Diagram blok teknis rapi dengan panah data bersih, menampilkan alur dari Edge hingga Storage.

```text
TOPOLOGI SISTEM TERDISTRIBUSI MULTI-TIER

[ USER CLIENT (BROWSER) ] ➔ Vue 3 SPA + Device Fingerprinting
           │
           ▼
[ LAYER 1: EDGE GATEWAY ] ➔ Vercel Edge / Nginx Reverse Proxy
  • Rate Limiting Token Bucket (Maksimal 5 req/detik per IP)
  • Menyaring request bot dan menangani kompresi SSL/Gzip
           │
           ▼
[ LAYER 2: VIRTUAL WAITING ROOM ] ➔ Redis Sorted Set (ZSET FIFO)
  • User diantrekan secara adil berbasis milidetik kedatangan
  • Inflow Controller meloloskan user secara bertahap (100 user/detik)
           │
           ▼
[ LAYER 3: CONCURRENCY ENGINE ] ➔ Redis In-Memory RAM + Lua Script
  • Eksekusi atomik single-threaded: validasi stok & potong kuota (< 1ms)
  • Distributed Lock sementara dengan TTL 600 detik (SETEX)
           │
           ▼
[ LAYER 4: PERSISTENT STORAGE ] ➔ PostgreSQL (Supabase Cloud)
  • Database relasional hanya mencatat transaksi user yang sah
  • Menulis tabel orders, users, dan payload QR Code e-tiket resmi
```

* **🗣️ Skrip Bicara**:
  > *"Solusi kami adalah memecah beban ke 4 lapisan terpisah. Kami tidak membiarkan satu request pun langsung menyentuh PostgreSQL di awal. Beban disaring di Edge Gateway, ditahan secara adil di Redis Virtual Waiting Room berbasis urutan milidetik, stok tiket divalidasi dan dikunci langsung di memori RAM, dan database PostgreSQL hanya menerima transaksi dari pengguna yang sudah dipastikan memenangkan antrean."*

---

### 🖥️ SLIDE 4: DUAL-DATABASE ARCHITECTURE (REDIS VS POSTGRESQL)
* **Visual**: Tabel data teknis monospaced dengan badge metrik, tanpa ilustrasi kartun.

```text
STRATEGI 2 DATABASE: OPTIMASI RAM VS INTEGRITAS RELASIONAL

METRIK / FITUR         ⚡ REDIS IN-MEMORY               🐘 POSTGRESQL (SUPABASE)
────────────────────────────────────────────────────────────────────────────────
Lokasi Media           RAM Komputer (Volatile/Cache)     SSD Cloud (Persistent Storage)
Waktu Respons          < 1 Milidetik (Mikrodetik)        15 – 80 Milidetik
Model Data             Key-Value, ZSET, TTL Counters     Relational Tables (ACID)
Peran Kritis           1. Queue FIFO (ZADD, ZRANK)       1. User Profile & Data NIK
                       2. Atomic Decr via Lua Script     2. Status Order (PENDING/PAID)
                       3. Lock Kursi 10 Menit (SETEX)    3. E-Tiket & Verifikasi QR Code
Toleransi Beban        Sangat Tinggi (100.000+ ops/sec)  Tinggi untuk Transaksi Sah

PRINSIP REKAYASA:
Redis melindungi PostgreSQL dari ledakan trafik; PostgreSQL menjamin keamanan transaksi permanen.
```

* **🗣️ Skrip Bicara**:
  > *"Sistem kami tidak memilih antara Redis atau SQL, melainkan menduetkan keduanya sesuai kekuatannya masing-masing. Redis beroperasi di RAM untuk kecepatan brutal di atas 100 ribu operasi per detik guna menangani antrean dan penguncian stok. Sementara PostgreSQL di cloud Supabase menjaga integritas data hukum: pencatatan uang, nomor NIK KTP pembeli, dan penerbitan tiket resmi."*

---

### 🖥️ SLIDE 5: SIKLUS RESERVASI TIKET (5 TAHAPAN)
* **Visual**: Sequence box horizontal dengan blok kode kecil untuk setiap tahapan teknis.

```text
SIKLUS HIDUP TRANSAKSI & MEKANISME ROLLBACK

[ 01. AUTH GUARD ]
• Validasi JWT Token & NIK KTP valid.
• Pembelian dibatasi maksimal 2–4 tiket per NIK untuk mencegah praktik calo.

[ 02. REDIS WAITING QUEUE ]
• ZADD waiting_room:concert_1 <timestamp> <user_id>
• Pengunjung memantau countdown nomor antrean langsung dari cluster Redis.

[ 03. ATOMIC LUA LOCK ]
• Mengeksekusi script Lua: Cek kuota -> Kurangi stok -> Kunci kursi.
• SETEX "lock:order:TKT-108" 600 "RESERVED"  ➔ TTL Kunci: Tepat 10 Menit.

[ 04. PAYMENT VERIFICATION ]
• Transaksi dicatat di PostgreSQL dengan status 'PENDING'.
• Pembayaran diverifikasi via Virtual Account / QRIS Midtrans.

[ 05. TERMINASI TRANSAKSI ]
• KONDISI A (Lunas)  ➔ Status jadi 'PAID', terbitkan PDF & QR Code resmi.
• KONDISI B (Hangus) ➔ TTL 10 menit habis tanpa bayar, worker otomatis
                       mengembalikan kuota ke pasar (INCRBY) tanpa bantuan admin!
```

* **🗣️ Skrip Bicara**:
  > *"Ini adalah alur hidup transaksi tiket: Setiap pembeli wajib login dengan NIK valid. Di ruang antrean, timestamp mereka diurutkan di Redis. Begitu giliran tiba, kursi dikunci tepat 600 detik via perintah SETEX. Jika pembeli membayar, e-tiket QR Code diterbitkan. Namun jika pembeli batal atau waktu habis, kunci Redis otomatis kedaluwarsa dan kuota tiket otomatis kembali ke pasar tanpa perlu bantuan admin."*

---

### 🖥️ SLIDE 6: IMPLEMENTASI TEKNOLOGI (TECH STACK)
* **Visual**: Tampilan 4 kotak teknis dengan teks monospaced dan badge versi.

```text
SPESIFIKASI TEKNIS IMPLEMENTASI SISTEM

[ FRONTEND CLIENT ]
• Framework: Vue 3 (Composition API, <script setup>)
• State Management: Pinia Store (Reaktif: Auth, Ticket, Queue, Live Telemetry)
• Styling: TailwindCSS (Editorial Clean Style + Dark Administrative Console)
• Build Tool: Vite v6.4 (Production chunk splitting & gzip optimization)

[ BACKEND & GATEWAY ]
• Runtime & Framework: Node.js + Express.js API
• Security & Guard: Helmet.js, CORS, Express-Rate-Limit (Token Bucket Algorithm)
• Concurrency Engine: ioredis v5.4 dengan Custom Lua Script Executor
• Containerization: Docker Compose v3.8 + Nginx v1.25 Alpine

[ CLOUD & INFRASTRUCTURE ]
• Cloud Database: PostgreSQL 16 (Hosted via Supabase Cloud Engine)
• Edge Deployment: Vercel Global Edge Network (Automated GitHub CI/CD Pipeline)
```

* **🗣️ Skrip Bicara**:
  > *"Seluruh arsitektur ini sudah kami bangun dan buktikan secara nyata: Frontend dibangun menggunakan Vue 3 dengan Pinia state management dan TailwindCSS. Backend menggunakan Node.js Express yang terhubung ke Redis engine. Databasenya menggunakan PostgreSQL di Supabase. Serta seluruh sistem ini telah live di Vercel dengan otomatisasi deployment CI/CD dari repositori GitHub."*

---

### 🖥️ SLIDE 7: KESIMPULAN & HASIL PENGUJIAN
* **Visual**: Card metrik hasil performa sistem dengan checkbox hijau dan URL live demo di bagian bawah.

```text
HASIL PENGUJIAN & KESIMPULAN REKAYASA

[ KINERJA SISTEM ]
✓ ZERO-OVERSELLING: Terbukti 0% kelebihan jual dalam uji konkurensi multi-thread.
✓ 100% POSTGRES HEALTH: Database relasional terbebas dari ancaman Connection Exhaustion.
✓ SUB-MILLISECOND LATENCY: Validasi stok di RAM Redis selesai dalam waktu < 1 ms.
✓ AUTOMATIC RECOVERY: Rollback otomatis kuota tiket jika pembayaran ditinggalkan pembeli.

─────────────────────────────────────────────────────────────────────────────
💻 REPOSITORI & ARTIFAK PROYEK:
• GitHub: https://github.com/dandhiramadhan214-svg/flashtiket.git
• Database Cloud: Supabase PostgreSQL (Production Cluster)
• Dokumentasi Arsitektur: ARSITEKTUR_SISTEM_TIKET_KONSER.md

TERIMA KASIH — SESI TANYA JAWAB DIPERSILAKAN
```

* **🗣️ Skrip Bicara**:
  > *"Kesimpulannya, FlashTiket membuktikan bahwa lonjakan trafik flash crowd dapat diselesaikan bukan dengan menambah kapasitas server secara boros, melainkan dengan rekayasa sistem terdistribusi yang tepat. Dengan pemisahan peran antara Redis di RAM dan PostgreSQL di storage, sistem dijamin tidak akan pernah overselling dan terbebas dari server crash. Sekian presentasi dari saya, terima kasih dan saya persilakan jika ada pertanyaan dari bapak/ibu dosen atau rekan-rekan sekalian."*
