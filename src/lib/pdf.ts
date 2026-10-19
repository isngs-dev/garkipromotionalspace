import QRCode from 'qrcode';
import type { Pass } from '../types';
import { fmtRange, fmtTimeRange } from './dates';

// jsPDF is loaded on demand so it doesn't weigh down the main bundle.
type JsPDF = InstanceType<(typeof import('jspdf'))['jsPDF']>;

const BRAND: [number, number, number] = [30, 64, 175];
const ACCENT: [number, number, number] = [5, 150, 105];
const INK: [number, number, number] = [15, 31, 61];
const MUTE: [number, number, number] = [100, 116, 139];

async function qrPng(value: string): Promise<string> {
  return QRCode.toDataURL(value, { width: 420, margin: 1, errorCorrectionLevel: 'M' });
}

const PAGE_W = 105;
const PAGE_H = 165; // slightly taller than A6 so the QR + footer fit comfortably
const PAGE: [number, number] = [PAGE_W, PAGE_H];

async function drawPass(doc: JsPDF, pass: Pass) {
  const W = PAGE_W;
  const H = PAGE_H;

  // page background + card
  doc.setFillColor(241, 245, 249);
  doc.rect(0, 0, W, H, 'F');
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(6, 6, W - 12, H - 12, 5, 5, 'F');

  // header band
  doc.setFillColor(...BRAND);
  doc.roundedRect(6, 6, W - 12, 27, 5, 5, 'F');
  doc.rect(6, 20, W - 12, 13, 'F');
  doc.setTextColor(191, 219, 254);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('GARKI MARKET', 12, 15);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.text('Promotion Pass', 12, 24);
  doc.setFillColor(...ACCENT);
  doc.roundedRect(W - 36, 11, 24, 7, 3.5, 3.5, 'F');
  doc.setFontSize(6.5);
  doc.text(pass.type === 'space' ? 'SPACE' : 'MOBILE', W - 24, 15.6, { align: 'center' });

  // company
  doc.setTextColor(...MUTE);
  doc.setFontSize(6.5);
  doc.text('COMPANY / BRAND', 12, 41);
  doc.setTextColor(...INK);
  doc.setFontSize(14);
  const companyLines = (doc.splitTextToSize(pass.company, W - 24) as string[]).slice(0, 2);
  doc.text(companyLines, 12, 47.5);
  const extra = (companyLines.length - 1) * 5.6;

  // representative
  const repY = 53.5 + extra;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(12, repY, W - 24, 16, 3, 3, 'F');
  doc.setTextColor(...MUTE);
  doc.setFontSize(6);
  doc.text('REPRESENTATIVE', 16, repY + 4.6);
  doc.setTextColor(...INK);
  doc.setFontSize(11);
  doc.text(pass.holder, 16, repY + 9.8);
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(pass.mobile, 16, repY + 14);

  // details grid
  const gy = repY + 23;
  const cell = (label: string, value: string, x: number, y: number) => {
    doc.setTextColor(...MUTE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.text(label, x, y);
    doc.setTextColor(...INK);
    doc.setFontSize(8.5);
    const lines = doc.splitTextToSize(value, 38) as string[];
    doc.text(lines.slice(0, 2), x, y + 4.4);
  };
  cell(pass.type === 'space' ? 'SPACE ID' : 'ZONE', pass.targetLabel, 12, gy);
  cell('PROMOTION TYPE', pass.typeLabel, 56, gy);
  cell('VALID DATE', fmtRange(pass.startDate, pass.endDate), 12, gy + 14);
  cell('VALID TIME', fmtTimeRange(pass.startTime, pass.endTime), 56, gy + 14);

  // perforation
  const py = gy + 27;
  doc.setDrawColor(203, 213, 225);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.line(12, py, W - 12, py);
  doc.setLineDashPattern([], 0);
  doc.setFillColor(241, 245, 249);
  doc.circle(6, py, 3, 'F');
  doc.circle(W - 6, py, 3, 'F');

  // QR + footer (shrinks a little if the company name wrapped onto two lines)
  const qs = 34 - extra;
  const qr = await qrPng(pass.qr);
  doc.addImage(qr, 'PNG', (W - qs) / 2, py + 5, qs, qs);
  const fy = py + 5 + qs + 5.5;
  doc.setFont('courier', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  doc.text(pass.id, W / 2, fy, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...MUTE);
  doc.text('Authorised by AICL · Present this pass at the gate', W / 2, fy + 4.5, { align: 'center' });
  doc.text(`Booking ${pass.bookingRef}`, W / 2, fy + 8, { align: 'center' });
}

async function newDoc(): Promise<JsPDF> {
  const { jsPDF } = await import('jspdf');
  return new jsPDF({ unit: 'mm', format: PAGE, orientation: 'portrait', compress: true });
}

export async function buildPassPdf(passes: Pass[]): Promise<Blob> {
  const doc = await newDoc();
  for (let i = 0; i < passes.length; i++) {
    if (i > 0) doc.addPage(PAGE, 'portrait');
    await drawPass(doc, passes[i]);
  }
  return doc.output('blob');
}

export async function downloadPassPdf(pass: Pass) {
  const doc = await newDoc();
  await drawPass(doc, pass);
  doc.save(`Garki-Market-Pass-${pass.id}.pdf`);
}

export async function downloadAllPassPdfs(passes: Pass[]) {
  if (!passes.length) return;
  const doc = await newDoc();
  for (let i = 0; i < passes.length; i++) {
    if (i > 0) doc.addPage(PAGE, 'portrait');
    await drawPass(doc, passes[i]);
  }
  doc.save(`Garki-Market-Passes-${passes[0].bookingRef}.pdf`);
}
