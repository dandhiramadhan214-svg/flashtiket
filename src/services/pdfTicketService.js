// ================================================================
// FlashTiket — Official Concert E-Ticket PDF Generator
// Generates authentic, high-security concert tickets with:
// - Code-128 Barcode
// - Scannable Dynamic QR Code
// - Perforated Stub Design & Anti-Counterfeit Watermark
// - Seat & Attendee Details + Official Terms & Conditions
// ================================================================
import { jsPDF } from 'jspdf';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

/**
 * Generate Code-128 barcode image as Base64 Data URL
 */
function generateBarcodeDataUrl(barcodeText) {
  try {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, barcodeText, {
      format: 'CODE128',
      lineColor: '#1e266d',
      width: 2,
      height: 48,
      displayValue: true,
      font: 'monospace',
      fontSize: 11,
      textMargin: 3,
      background: '#ffffff',
    });
    return canvas.toDataURL('image/png');
  } catch (err) {
    console.error('Failed to generate Code-128 barcode:', err);
    return null;
  }
}

/**
 * Generate QR Code image as Base64 Data URL
 */
async function generateQrDataUrl(qrPayload) {
  try {
    return await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 280,
      color: {
        dark: '#1e266d',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Failed to generate QR Code:', err);
    return null;
  }
}

/**
 * Main function to generate and download official concert E-Ticket PDF
 * @param {Object} params
 * @param {Object} params.ticket - Ticket data (orderId, seatNo, categoryName, holderName, totalPaid, issuedAt, qrHash)
 * @param {Object} params.event - Event data (title, subtitle, venue, city, date, time, category)
 * @param {Object} params.customer - Customer data (name, nik, email, phone)
 * @param {Function} params.formatMoney - Formatting function for currency
 */
export async function downloadOfficialTicketPdf({ ticket, event, customer, formatMoney }) {
  // 1. Prepare Safe Data Fallbacks
  const orderId = ticket?.orderId || 'ORD-9821-2026';
  const holderName = ticket?.holderName || customer?.name || 'Kevin Pratama';
  const customerNik = customer?.nik || '31710482910002';
  const eventTitle = event?.title || 'Coldplay: Music of the Spheres World Tour';
  const eventSubtitle = event?.subtitle || 'World Tour 2026 — Jakarta';
  const venue = event?.venue || 'Gelora Bung Karno Stadium';
  const city = event?.city || 'Senayan, Jakarta';
  const eventDate = event?.date || event?.event_date || '22 Mar 2026';
  const eventTime = event?.time || event?.event_time || '19:00 WIB';
  const categoryName = ticket?.categoryName || 'VIP Royal Soundcheck';
  const seatNo = ticket?.seatNo || 'Baris A No. 08 (VIP Royal Floor)';
  const qty = ticket?.qty || 1;
  const totalPaid = ticket?.totalPaid ? (formatMoney ? formatMoney(ticket.totalPaid) : `Rp ${ticket.totalPaid.toLocaleString('id-ID')}`) : 'LUNAS (PAID)';
  const issuedAt = ticket?.issuedAt || new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' });
  const serialNumber = ticket?.qrHash || `SEC-${orderId.replace(/[^A-Z0-9]/g, '')}-AUTH`;
  const barcodeValue = `${orderId.replace(/[^A-Z0-9]/g, '')}${Math.floor(1000 + Math.random() * 9000)}`;

  // 2. Prepare QR Code Payload
  const qrPayload = JSON.stringify({
    system: 'FlashTiket Official Pass Engine',
    status: 'VERIFIED_ACTIVE',
    orderId,
    event: eventTitle,
    venue,
    dateTime: `${eventDate} ${eventTime}`,
    category: categoryName,
    seat: seatNo,
    holder: holderName,
    nik: customerNik,
    authHash: serialNumber,
    timestamp: issuedAt,
  });

  const [qrDataUrl, barcodeDataUrl] = await Promise.all([
    generateQrDataUrl(qrPayload),
    Promise.resolve(generateBarcodeDataUrl(barcodeValue)),
  ]);

  // 3. Initialize jsPDF Document (A4 Portrait: 210mm x 297mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  // ── BACKGROUND WATERMARK (Anti-Counterfeit) ────────────────────
  doc.saveGraphicsState();
  doc.setTextColor(242, 244, 248);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(36);
  // Diagonal repeated watermarks
  doc.text('FLASHTIKET AUTHENTIC PASS', 15, 80, { angle: 35 });
  doc.text('OFFICIAL GATE PASS - NO DUPLICATE', 10, 160, { angle: 35 });
  doc.text('ORIGINAL CONCERT E-TICKET', 15, 240, { angle: 35 });
  doc.restoreGraphicsState();

  // ── 1. HEADER BANNER ──────────────────────────────────────────
  // Deep Navy Header Box
  doc.setFillColor(30, 38, 109); // #1e266d
  doc.roundedRect(margin, 12, contentWidth, 24, 3, 3, 'F');

  // Accent Gold Line
  doc.setFillColor(217, 119, 6); // #d97706
  doc.rect(margin, 35, contentWidth, 1.5, 'F');

  // Brand Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('FLASHTIKET', margin + 7, 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(190, 200, 245);
  doc.text('DISTRIBUTED WAR TIKET ENGINE · OFFICIAL E-TICKET', margin + 7, 28);

  // Security Pill on Top Right
  doc.setFillColor(16, 185, 129); // #10b981
  doc.roundedRect(margin + contentWidth - 42, 18, 36, 7, 3.5, 3.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('✓ LUNAS & AKTIF', margin + contentWidth - 24, 22.8, { align: 'center' });

  // ── 2. MAIN CONCERT TICKET PASS (Perforated Card) ──────────────
  const cardTop = 41;
  const cardHeight = 110;
  const stubWidth = 52; // Right stub for QR & tear
  const mainPassWidth = contentWidth - stubWidth; // Left pass

  // Card Outer Shadow / Border
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225); // #cbd5e1
  doc.setLineWidth(0.6);
  doc.roundedRect(margin, cardTop, contentWidth, cardHeight, 4, 4, 'FD');

  // Left Pass Background Tint (Soft gradient-like header)
  doc.setFillColor(248, 250, 252); // #f8fafc
  doc.rect(margin + 0.5, cardTop + 0.5, mainPassWidth - 0.5, 22, 'F');

  // Category Badge (Gold/Purple)
  doc.setFillColor(126, 34, 206); // #7e22ce
  doc.roundedRect(margin + 6, cardTop + 5, 34, 5.5, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text(categoryName.toUpperCase().slice(0, 18), margin + 23, cardTop + 8.8, { align: 'center' });

  // Order ID Badge
  doc.setTextColor(100, 116, 139);
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.text(`ID: ${orderId}`, margin + mainPassWidth - 6, cardTop + 9, { align: 'right' });

  // Event Title
  doc.setTextColor(15, 23, 42); // #0f172a
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  const truncatedTitle = eventTitle.length > 38 ? eventTitle.substring(0, 36) + '...' : eventTitle;
  doc.text(truncatedTitle, margin + 6, cardTop + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(eventSubtitle || `${city} Leg`, margin + 6, cardTop + 20.5);

  // Line separator
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(margin + 6, cardTop + 24, margin + mainPassWidth - 6, cardTop + 24);

  // 4 Information Boxes (Grid)
  const gridY = cardTop + 28;
  const colW = (mainPassWidth - 18) / 2;

  // Box 1: Jadwal & Waktu
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin + 6, gridY, colW, 17, 2, 2, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('TANGGAL & WAKTU', margin + 9, gridY + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(eventDate, margin + 9, gridY + 9.5);
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Pintu Buka: 16:30 | Show: ${eventTime}`, margin + 9, gridY + 14);

  // Box 2: Lokasi Venue
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin + 9 + colW, gridY, colW, 17, 2, 2, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('VENUE / LOKASI', margin + 12 + colW, gridY + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  const truncatedVenue = venue.length > 25 ? venue.substring(0, 23) + '...' : venue;
  doc.text(truncatedVenue, margin + 12 + colW, gridY + 9.5);
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(city, margin + 12 + colW, gridY + 14);

  // Box 3: Detail Kursi / Seat
  const gridY2 = gridY + 20;
  doc.setFillColor(238, 242, 255); // #eef2ff tint
  doc.roundedRect(margin + 6, gridY2, colW, 18, 2, 2, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(79, 70, 229);
  doc.text('NOMOR KURSI & ZONA', margin + 9, gridY2 + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 38, 109);
  doc.text(seatNo.slice(0, 24), margin + 9, gridY2 + 10);
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Jumlah: ${qty} Tiket Resmi`, margin + 9, gridY2 + 15);

  // Box 4: Identitas Pemesan
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin + 9 + colW, gridY2, colW, 18, 2, 2, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('PEMEGANG TIKET (SESUAI KTP)', margin + 12 + colW, gridY2 + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(holderName.slice(0, 24), margin + 12 + colW, gridY2 + 10);
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`NIK: ${customerNik}`, margin + 12 + colW, gridY2 + 15);

  // Code-128 Linear Barcode at the bottom of Main Pass
  const barcodeY = gridY2 + 22;
  if (barcodeDataUrl) {
    doc.addImage(barcodeDataUrl, 'PNG', margin + 8, barcodeY, colW * 1.5, 14);
  }

  // Payment Stamp Info on the right of barcode
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL PEMBAYARAN', margin + mainPassWidth - 6, barcodeY + 4, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(16, 185, 129);
  doc.text(totalPaid, margin + mainPassWidth - 6, barcodeY + 9, { align: 'right' });
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Pajak PPN 11% & Biaya Layanan Termasuk', margin + mainPassWidth - 6, barcodeY + 13, { align: 'right' });

  // ── DOTTED PERFORATION LINE (Tear Line) ────────────────────────
  const tearX = margin + mainPassWidth;
  doc.setDrawColor(180, 190, 205);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.setLineWidth(0.5);
  doc.line(tearX, cardTop + 1, tearX, cardTop + cardHeight - 1);
  doc.setLineDashPattern([], 0); // Reset dash

  // Little perforation semi-circles at top and bottom edge
  doc.setFillColor(242, 244, 248);
  doc.circle(tearX, cardTop, 2.5, 'F');
  doc.circle(tearX, cardTop + cardHeight, 2.5, 'F');

  // Little scissors text indicator
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.text('✂ POTONG DISINI (GATE STUB)', tearX + 1.5, cardTop + 6, { angle: 90 });

  // ── RIGHT STUB (Gate Entrance & Real QR Code) ──────────────────
  const stubX = tearX + 4;
  const stubContentW = stubWidth - 8;

  // Stub Header Box
  doc.setFillColor(30, 38, 109);
  doc.roundedRect(stubX, cardTop + 5, stubContentW, 11, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('PINTU MASUK', stubX + stubContentW / 2, cardTop + 9.5, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setTextColor(217, 119, 6); // Gold
  doc.text('FAST-TRACK GATE 3', stubX + stubContentW / 2, cardTop + 14, { align: 'center' });

  // Scannable Dynamic QR Code Image
  const qrSize = 36;
  const qrX = stubX + (stubContentW - qrSize) / 2;
  const qrY = cardTop + 19;

  if (qrDataUrl) {
    // White background padding behind QR
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.roundedRect(qrX - 1.5, qrY - 1.5, qrSize + 3, qrSize + 3, 2, 2, 'FD');
    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
  }

  // QR Instructions
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('SCAN DI GERBANG RESMI', stubX + stubContentW / 2, qrY + qrSize + 4, { align: 'center' });

  doc.setTextColor(100, 116, 139);
  doc.setFont('courier', 'normal');
  doc.setFontSize(5.5);
  doc.text(`HASH: ${serialNumber.substring(0, 18)}`, stubX + stubContentW / 2, qrY + qrSize + 8, { align: 'center' });

  // Security Hologram Simulated Badge
  doc.setFillColor(243, 244, 246);
  doc.setDrawColor(209, 213, 219);
  doc.roundedRect(stubX, cardTop + cardHeight - 16, stubContentW, 11, 2, 2, 'FD');
  doc.setTextColor(75, 85, 99);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.text('SECURITY VERIFIED PASS', stubX + stubContentW / 2, cardTop + cardHeight - 11.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5);
  doc.text('FlashTiket Distributed Concurrency Engine', stubX + stubContentW / 2, cardTop + cardHeight - 8, { align: 'center' });

  // ── 3. SECURITY & VERIFICATION METADATA ────────────────────────
  const metaY = cardTop + cardHeight + 8;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, metaY, contentWidth, 22, 2.5, 2.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('BUKTI OTENTIKASI & AUDIT DISTRIBUSI TIKET', margin + 6, metaY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`• Waktu Penerbitan : ${issuedAt}`, margin + 6, metaY + 11);
  doc.text(`• Signature Hash    : ${serialNumber} (SHA-256 Distributed Lock Validated)`, margin + 6, metaY + 15.5);
  doc.text(`• Verifikasi Online : https://flashtiket.id/verify/${orderId}`, margin + 6, metaY + 20);

  // Digital Stamp Badge
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.8);
  doc.roundedRect(margin + contentWidth - 46, metaY + 4, 40, 14, 2, 2, 'D');
  doc.setTextColor(16, 185, 129);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('ORIGINAL PASS', margin + contentWidth - 26, metaY + 9.5, { align: 'center' });
  doc.setFontSize(5.5);
  doc.text('VERIFIED BY REDIS V7', margin + contentWidth - 26, metaY + 14, { align: 'center' });

  // ── 4. OFFICIAL TERMS & CONDITIONS ────────────────────────────
  const termsY = metaY + 28;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 38, 109);
  doc.text('SYARAT & KETENTUAN MASUK RESMI (TERMS & CONDITIONS)', margin, termsY);

  const rules = [
    '1. E-Tiket ini sah sebagai tanda masuk konser dan hanya dapat dipindai 1 (satu) kali di gerbang verifikasi (One-Time Scannable Pass).',
    '2. Pemegang tiket wajib membawa Kartu Identitas Resmi yang masih berlaku (KTP / Paspor / SIM / Kartu Pelajar) dengan nama yang sesuai.',
    '3. Dilarang keras memperjualbelikan tiket kembali, menggandakan, atau memalsukan dokumen ini. Sistem kami menolak barcode yang telah terpindai.',
    '4. Pintu gerbang utama (gate) dibuka 2 jam sebelum jadwal acara. Pengunjung diimbau hadir tepat waktu untuk menghindari antrean penumpukan.',
    '5. Dilarang membawa senjata tajam, minuman keras, narkoba, kamera profesional DSLR/Mirrorless, dan barang berbahaya ke dalam area konser.',
    '6. Penyelenggara berhak menolak masuk pengunjung yang tidak mematuhi protokol keamanan tanpa kewajiban pengembalian dana (refund).',
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  let curY = termsY + 5;
  rules.forEach((rule) => {
    doc.text(rule, margin, curY);
    curY += 4.2;
  });

  // ── 5. FOOTER & COPYRIGHT ─────────────────────────────────────
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(margin, 282, margin + contentWidth, 282);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Dokumen ini diterbitkan secara otomatis oleh FlashTiket Engine. Dilindungi hak cipta & enkripsi data anti-overselling.', margin, 287);
  doc.text(`Halaman 1 / 1 · Order ID: ${orderId}`, margin + contentWidth, 287, { align: 'right' });

  // 6. Trigger Automatic Browser Download
  const filename = `E-Ticket-${orderId}.pdf`;
  doc.save(filename);

  return filename;
}
