'use client';

import React, { useState, useEffect } from 'react';
import { useDashboard } from '../DashboardContext';
import { useAuth } from '@/lib/AuthContext';
import { apiClient } from '@/lib/api';
import {
  Plus, Trash2, Download, CheckCircle, ChevronLeft,
  FileText, User, Receipt, Briefcase, Printer, Edit, Trash,
  Eye, MessageCircle, Mail, Copy, Check, X, Phone, Calendar,
  ArrowRight, Sparkles, Share2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function QuotationPage() {
  const context = useDashboard();
  if (!context) return null;
  const { 
    quotations, setQuotations,
    successMsg, setSuccessMsg,
    errorMsg, setErrorMsg,
    studio
  } = context;

  const { user } = useAuth();

  const [quotationSubView, setQuotationSubView] = useState<'list' | 'add'>('list');
  
  // Form States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newQuoteClient, setNewQuoteClient] = useState('');
  const [newQuotePhone, setNewQuotePhone] = useState('');
  const [newQuoteEmail, setNewQuoteEmail] = useState('');
  const [newQuoteNotes, setNewQuoteNotes] = useState('');
  const [newQuoteStatus, setNewQuoteStatus] = useState('Pending');
  const [newQuoteValidityDays, setNewQuoteValidityDays] = useState(30);
  const [newQuoteItems, setNewQuoteItems] = useState([{ name: '', price: 0, notes: '' }]);
  
  // Preview Modal State
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [copiedText, setCopiedText] = useState(false);

  const totalAmount = newQuoteItems.reduce((acc, item) => acc + (Number(item.price) || 0), 0);

  const handleAddItem = () => {
    setNewQuoteItems([...newQuoteItems, { name: '', price: 0, notes: '' }]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...newQuoteItems];
    newItems.splice(index, 1);
    setNewQuoteItems(newItems);
  };

  const handleItemChange = (index: number, field: 'name' | 'price' | 'notes', value: string) => {
    const newItems = [...newQuoteItems];
    if (field === 'price') {
      newItems[index].price = parseFloat(value) || 0;
    } else {
      (newItems[index] as any)[field] = value;
    }
    setNewQuoteItems(newItems);
  };

  const handleEdit = (quote: any) => {
    setEditingId(quote._id || quote.id);
    setNewQuoteClient(quote.clientName || quote.client || '');
    setNewQuotePhone(quote.clientPhone || '');
    setNewQuoteEmail(quote.clientEmail || '');
    setNewQuoteNotes(quote.notes || '');
    setNewQuoteStatus(quote.status || 'Pending');
    setNewQuoteItems(
      quote.items?.length > 0 
        ? quote.items.map((it: any) => ({ name: it.name || '', price: it.price || 0, notes: it.notes || '' })) 
        : [{ name: quote.scope || 'General Photography', price: quote.amount || quote.value || 0, notes: '' }]
    );
    setQuotationSubView('add');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quotation?')) return;
    try {
      await apiClient.delete(`/dashboard/quotations/${id}`);
      setQuotations(quotations.filter((q: any) => (q._id || q.id) !== id));
      toast.success('Quotation deleted successfully.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete quotation');
    }
  };

  // Open In-App Preview Modal
  const openPreview = (quote: any) => {
    setPreviewData(quote);
    setPreviewModalOpen(true);
  };

  // Preview directly from Form
  const handlePreviewFromForm = () => {
    if (!newQuoteClient.trim()) {
      toast.error('Please enter the client name to preview quotation');
      return;
    }
    if (newQuoteItems.length === 0 || !newQuoteItems[0].name.trim()) {
      toast.error('Please add at least one line item with description');
      return;
    }

    const tempQuote = {
      _id: editingId || 'TEMP',
      quotationNumber: `QT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      clientName: newQuoteClient,
      clientPhone: newQuotePhone,
      clientEmail: newQuoteEmail,
      notes: newQuoteNotes,
      status: newQuoteStatus || 'Pending',
      items: newQuoteItems,
      amount: totalAmount,
      createdAt: new Date(),
      validUntil: new Date(Date.now() + newQuoteValidityDays * 24 * 60 * 60 * 1000)
    };
    setPreviewData(tempQuote);
    setPreviewModalOpen(true);
  };

  // Send via WhatsApp
  const handleSendWhatsApp = (quote: any) => {
    const clientName = quote.clientName || quote.client || 'Client';
    const total = quote.amount || quote.value || 0;
    const studioName = studio?.name || user?.name || 'Our Studio';
    const quoteNumber = quote.quotationNumber || `QT-${new Date(quote.createdAt || Date.now()).getFullYear()}-${(quote._id || '').slice(-4).toUpperCase()}`;
    
    let itemsText = (quote.items || [])
      .map((it: any, idx: number) => `${idx + 1}. *${it.name}* - ₹${Number(it.price).toLocaleString('en-IN')}${it.notes ? ` (${it.notes})` : ''}`)
      .join('\n');
    if (!itemsText && quote.scope) itemsText = `• ${quote.scope} - ₹${total.toLocaleString('en-IN')}`;

    const validDate = quote.validUntil ? new Date(quote.validUntil).toLocaleDateString('en-GB') : '30 days from issue';

    const message = `Hello *${clientName}*,\n\nGreetings from *${studioName}*! 📸✨\n\nHere is your official price quotation:\n📋 *Quotation No:* ${quoteNumber}\n\n*Services & Pricing:*\n${itemsText}\n\n💰 *Total Amount:* ₹${total.toLocaleString('en-IN')}\n⏳ *Valid Until:* ${validDate}\n\n${quote.notes ? `*Terms & Notes:* ${quote.notes}\n\n` : ''}Feel free to reply if you have any questions or customization requests!\n\nBest regards,\n*${studioName}*`;

    const rawPhone = (quote.clientPhone || '').replace(/\D/g, '');
    const phone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
    const waUrl = phone 
      ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    
    window.open(waUrl, '_blank');
  };

  // Send via Email
  const handleSendEmail = (quote: any) => {
    const clientName = quote.clientName || quote.client || 'Client';
    const total = quote.amount || quote.value || 0;
    const studioName = studio?.name || user?.name || 'Our Studio';
    const quoteNumber = quote.quotationNumber || `QT-${new Date(quote.createdAt || Date.now()).getFullYear()}-${(quote._id || '').slice(-4).toUpperCase()}`;

    let itemsText = (quote.items || [])
      .map((it: any, idx: number) => `${idx + 1}. ${it.name} - ₹${Number(it.price).toLocaleString('en-IN')}${it.notes ? ` (${it.notes})` : ''}`)
      .join('\n');

    const subject = `Photography Price Quotation [${quoteNumber}] - ${studioName}`;
    const body = `Dear ${clientName},\n\nThank you for considering ${studioName} for your upcoming photography coverage.\n\nPlease find your requested price quotation breakdown below:\n\nQuotation No: ${quoteNumber}\nDate: ${new Date(quote.createdAt || Date.now()).toLocaleDateString('en-GB')}\n\nSERVICES & PRICING:\n${itemsText}\n\nTOTAL AMOUNT: ₹${total.toLocaleString('en-IN')}\n\n${quote.notes ? `Terms & Notes:\n${quote.notes}\n\n` : ''}Please let us know if you would like to proceed with booking or if you need any adjustments.\n\nWarm regards,\n${studioName}`;

    window.location.href = `mailto:${quote.clientEmail || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  // Copy Quotation Summary
  const handleCopySummary = (quote: any) => {
    const clientName = quote.clientName || quote.client || 'Client';
    const total = quote.amount || quote.value || 0;
    const studioName = studio?.name || user?.name || 'Our Studio';
    const quoteNumber = quote.quotationNumber || `QT-${new Date(quote.createdAt || Date.now()).getFullYear()}-${(quote._id || '').slice(-4).toUpperCase()}`;

    let itemsText = (quote.items || [])
      .map((it: any, idx: number) => `${idx + 1}. ${it.name} - ₹${Number(it.price).toLocaleString('en-IN')}${it.notes ? ` (${it.notes})` : ''}`)
      .join('\n');

    const summary = `QUOTATION: ${quoteNumber}\nStudio: ${studioName}\nClient: ${clientName}\n\nServices:\n${itemsText}\n\nTotal: ₹${total.toLocaleString('en-IN')}`;
    navigator.clipboard.writeText(summary);
    setCopiedText(true);
    toast.success('Quotation summary copied to clipboard!');
    setTimeout(() => setCopiedText(false), 2500);
  };

  // Direct PDF Download (no print dialog, instantly saves .pdf file to disk)
  const handleDownloadPDF = async (quote: any) => {
    try {
      toast.loading('Generating PDF...', { id: 'pdf-download' });

      const { jsPDF } = await import('jspdf');
      const autoTableModule = await import('jspdf-autotable');
      const autoTable = autoTableModule.default || autoTableModule;

      const studioName = studio?.name || user?.name || 'Mara Photo Studio';
      const studioEmail = user?.email || studio?.email || '';
      const studioPhone = user?.phone || studio?.phone || '';
      const studioAddress = studio?.address || '';
      const clientName = quote.clientName || quote.client || 'Valued Client';
      const clientPhone = quote.clientPhone || '';
      const clientEmail = quote.clientEmail || '';
      const total = quote.amount || quote.value || 0;
      const quoteDate = new Date(quote.createdAt || Date.now());
      const validUntil = quote.validUntil ? new Date(quote.validUntil) : new Date(quoteDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      const quoteNumber = quote.quotationNumber || `QT-${quoteDate.getFullYear()}${String(quoteDate.getMonth() + 1).padStart(2, '0')}-${(quote._id || '').slice(-4).toUpperCase() || '101'}`;

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      // Top decorative gold accent line
      doc.setFillColor(197, 168, 128);
      doc.rect(0, 0, 210, 4, 'F');

      // Studio Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(15, 23, 42);
      doc.text(studioName, 15, 20);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      let subY = 25;
      if (studioAddress) {
        doc.text(studioAddress, 15, subY);
        subY += 4.5;
      }
      const contactBits: string[] = [];
      if (studioPhone) contactBits.push(`Phone: ${studioPhone}`);
      if (studioEmail) contactBits.push(`Email: ${studioEmail}`);
      if (contactBits.length > 0) {
        doc.text(contactBits.join('  |  '), 15, subY);
      }

      // Title on Right
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(181, 141, 85);
      doc.text('QUOTATION', 195, 20, { align: 'right' });

      // Quotation Number Pill
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(145, 24, 50, 8, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(quoteNumber, 170, 29.5, { align: 'center' });

      // Metadata Card
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(15, 38, 180, 26, 3, 3, 'FD');

      // Quotation For
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('QUOTATION FOR', 20, 44);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(clientName, 20, 50);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      const clientContact = [clientPhone ? `Phone: ${clientPhone}` : '', clientEmail ? `Email: ${clientEmail}` : ''].filter(Boolean).join('  |  ');
      if (clientContact) {
        doc.text(clientContact, 20, 56);
      }

      // Dates
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('ISSUE DATE', 125, 44);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(quoteDate.toLocaleDateString('en-GB'), 125, 50);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('VALID UNTIL', 162, 44);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(validUntil.toLocaleDateString('en-GB'), 162, 50);

      // Table of Items
      const tableRows = (quote.items || []).map((it: any, idx: number) => {
        const itemTitle = it.name || 'Photography Service';
        const itemNotes = it.notes ? `\n${it.notes}` : '';
        return [
          String(idx + 1).padStart(2, '0'),
          itemTitle + itemNotes,
          `Rs. ${Number(it.price || 0).toLocaleString('en-IN')}`
        ];
      });

      autoTable(doc, {
        startY: 70,
        head: [['#', 'SERVICE / DELIVERABLE DESCRIPTION', 'AMOUNT']],
        body: tableRows,
        theme: 'plain',
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
          cellPadding: 4
        },
        bodyStyles: {
          textColor: [15, 23, 42],
          fontSize: 9.5,
          cellPadding: 4
        },
        alternateRowStyles: {
          fillColor: [250, 250, 249]
        },
        columnStyles: {
          0: { cellWidth: 12, halign: 'center' },
          1: { cellWidth: 128 },
          2: { cellWidth: 40, halign: 'right', fontStyle: 'bold' }
        },
        margin: { left: 15, right: 15 }
      });

      const finalY = (doc as any).lastAutoTable?.finalY || 100;

      // Totals Box
      const totalsX = 125;
      const totalsY = finalY + 8;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(totalsX, totalsY, 70, 24, 3, 3, 'FD');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('Subtotal:', totalsX + 6, totalsY + 8);
      doc.text(`Rs. ${Number(total).toLocaleString('en-IN')}`, totalsX + 64, totalsY + 8, { align: 'right' });

      doc.setDrawColor(226, 232, 240);
      doc.line(totalsX + 6, totalsY + 12, totalsX + 64, totalsY + 12);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('Grand Total:', totalsX + 6, totalsY + 19);
      doc.setTextColor(181, 141, 85);
      doc.text(`Rs. ${Number(total).toLocaleString('en-IN')}`, totalsX + 64, totalsY + 19, { align: 'right' });

      // Notes section (if any)
      let currentY = totalsY + 30;
      if (quote.notes) {
        const noteLines = doc.splitTextToSize(quote.notes, 170);
        const boxHeight = 11 + noteLines.length * 4.5;
        if (currentY + boxHeight > 260) {
          doc.addPage();
          currentY = 20;
        }
        doc.setFillColor(254, 252, 232);
        doc.setDrawColor(254, 240, 138);
        doc.roundedRect(15, currentY, 180, boxHeight, 2, 2, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(146, 64, 14);
        doc.text('TERMS & CONDITIONS', 20, currentY + 5.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(120, 53, 15);
        doc.text(noteLines, 20, currentY + 10.5);
      }

      // Footer
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setDrawColor(226, 232, 240);
      doc.line(15, pageHeight - 18, 195, pageHeight - 18);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`Thank you for choosing ${studioName}. This is a computer-generated quotation.`, 15, pageHeight - 12);

      doc.setFont('helvetica', 'bold');
      doc.text('Authorized Signature', 195, pageHeight - 12, { align: 'right' });

      // Trigger instant direct download
      const safeClient = clientName.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `Quotation_${quoteNumber}_${safeClient}.pdf`;
      doc.save(filename);

      toast.success(`Quotation ${quoteNumber} downloaded as PDF!`, { id: 'pdf-download' });
    } catch (err) {
      console.error('Error generating PDF:', err);
      toast.error('Failed to download PDF. Please try again.', { id: 'pdf-download' });
    }
  };

  // Optional Print View (Opens browser print dialog if user explicitly wants paper print)
  const handlePrint = (quote: any) => {
    const studioName = studio?.name || user?.name || 'Mara Photo Studio';
    const studioLogo = studio?.logoUrl || '';
    const studioEmail = user?.email || studio?.email || '';
    const studioPhone = user?.phone || studio?.phone || '';
    const studioAddress = studio?.address || '';
    const clientName = quote.clientName || quote.client || 'Valued Client';
    const clientPhone = quote.clientPhone || '';
    const clientEmail = quote.clientEmail || '';
    const total = quote.amount || quote.value || 0;
    const quoteDate = new Date(quote.createdAt || Date.now());
    const validUntil = quote.validUntil ? new Date(quote.validUntil) : new Date(quoteDate.getTime() + 30*24*60*60*1000);
    const quoteNumber = quote.quotationNumber || `QT-${quoteDate.getFullYear()}${String(quoteDate.getMonth()+1).padStart(2,'0')}-${(quote._id || '').slice(-4).toUpperCase() || '101'}`;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups in your browser to print / download PDF.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Quotation_${quoteNumber}_${clientName.replace(/\s+/g, '_')}</title>
          <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
              background: white;
              color: #0f172a;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              line-height: 1.5;
            }
            
            @page {
              size: A4;
              margin: 1.2cm;
            }
            
            @media screen {
              body {
                background: #f1f5f9;
                padding: 40px 20px;
                display: flex;
                justify-content: center;
              }
              .invoice-page {
                box-shadow: 0 20px 40px -15px rgba(0,0,0,0.12);
                border-radius: 16px;
                border: 1px solid #e2e8f0;
              }
            }

            .invoice-page {
              width: 100%;
              max-width: 21cm;
              background: white;
              padding: 40px;
            }

            .header-bar {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #f1f5f9;
              padding-bottom: 28px;
              margin-bottom: 28px;
            }

            .studio-title {
              font-size: 26px;
              font-weight: 900;
              color: #0f172a;
              letter-spacing: -0.02em;
            }

            .studio-sub {
              font-size: 12px;
              color: #64748b;
              margin-top: 4px;
              line-height: 1.5;
            }

            .quote-badge-title {
              text-align: right;
            }

            .quote-title-text {
              font-size: 32px;
              font-weight: 900;
              color: #c5a880;
              letter-spacing: 0.05em;
              line-height: 1;
            }

            .quote-number-pill {
              display: inline-block;
              margin-top: 8px;
              font-size: 13px;
              font-weight: 700;
              color: #334155;
              background: #f8fafc;
              padding: 4px 12px;
              border-radius: 6px;
              border: 1px solid #e2e8f0;
            }

            .meta-grid {
              display: grid;
              grid-template-columns: 2fr 1fr 1fr;
              gap: 20px;
              margin-bottom: 32px;
              background: #f8fafc;
              padding: 20px;
              border-radius: 12px;
              border: 1px solid #f1f5f9;
            }

            .meta-item h4 {
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.06em;
              color: #64748b;
              margin-bottom: 6px;
            }

            .meta-item p {
              font-size: 15px;
              font-weight: 700;
              color: #0f172a;
            }

            .meta-item span {
              display: block;
              font-size: 12px;
              color: #64748b;
              font-weight: 500;
              margin-top: 2px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 32px;
            }

            thead th {
              background: #0f172a;
              color: white;
              font-size: 11px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.06em;
              padding: 12px 16px;
              text-align: left;
            }

            thead th:first-child { border-top-left-radius: 8px; border-bottom-left-radius: 8px; }
            thead th:last-child { border-top-right-radius: 8px; border-bottom-right-radius: 8px; text-align: right; }

            tbody td {
              padding: 14px 16px;
              border-bottom: 1px solid #f1f5f9;
              vertical-align: top;
            }

            tbody tr:nth-child(even) {
              background-color: #fafaf9;
            }

            .item-title {
              font-size: 14px;
              font-weight: 700;
              color: #0f172a;
            }

            .item-notes {
              font-size: 12px;
              color: #64748b;
              margin-top: 3px;
            }

            .item-price {
              text-align: right;
              font-size: 14px;
              font-weight: 700;
              color: #0f172a;
              white-space: nowrap;
            }

            .totals-container {
              display: flex;
              justify-content: flex-end;
              margin-bottom: 40px;
            }

            .totals-box {
              width: 320px;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 20px;
            }

            .total-line {
              display: flex;
              justify-content: space-between;
              font-size: 13px;
              font-weight: 600;
              color: #64748b;
              padding: 6px 0;
            }

            .total-line.grand {
              border-top: 2px solid #e2e8f0;
              margin-top: 8px;
              padding-top: 12px;
              font-size: 16px;
              font-weight: 800;
              color: #0f172a;
            }

            .total-line.grand .val {
              color: #b58d55;
              font-size: 20px;
              font-weight: 900;
            }

            .notes-section {
              background: #fffbeb;
              border: 1px solid #fde68a;
              border-radius: 10px;
              padding: 16px;
              margin-bottom: 32px;
            }

            .notes-section h5 {
              font-size: 11px;
              font-weight: 800;
              color: #92400e;
              text-transform: uppercase;
              margin-bottom: 4px;
            }

            .notes-section p {
              font-size: 12px;
              color: #78350f;
              line-height: 1.5;
            }

            .footer-sign {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              border-top: 2px solid #f1f5f9;
              padding-top: 24px;
              margin-top: 20px;
            }

            .footer-left {
              font-size: 12px;
              color: #64748b;
              max-width: 360px;
              line-height: 1.5;
            }

            .footer-right {
              text-align: right;
            }

            .sign-line {
              width: 180px;
              border-top: 1px solid #0f172a;
              margin-bottom: 6px;
            }

            .sign-label {
              font-size: 11px;
              font-weight: 700;
              color: #475569;
              text-transform: uppercase;
            }
          </style>
        </head>
        <body>
          <div class="invoice-page">
            <div class="header-bar">
              <div>
                ${studioLogo ? `<img src="${studioLogo}" alt="Studio Logo" style="max-height: 55px; max-width: 160px; object-fit: contain; margin-bottom: 10px;" />` : ''}
                <div class="studio-title">${studioName}</div>
                <div class="studio-sub">
                  ${studioAddress ? `<div>${studioAddress}</div>` : ''}
                  ${studioPhone ? `<div>Phone: ${studioPhone}</div>` : ''}
                  ${studioEmail ? `<div>Email: ${studioEmail}</div>` : ''}
                </div>
              </div>

              <div class="quote-badge-title">
                <div class="quote-title-text">QUOTATION</div>
                <div class="quote-number-pill">${quoteNumber}</div>
              </div>
            </div>

            <div class="meta-grid">
              <div class="meta-item">
                <h4>Quotation For</h4>
                <p>${clientName}</p>
                ${clientPhone ? `<span>M: ${clientPhone}</span>` : ''}
                ${clientEmail ? `<span>E: ${clientEmail}</span>` : ''}
              </div>
              <div class="meta-item">
                <h4>Issue Date</h4>
                <p>${quoteDate.toLocaleDateString('en-GB')}</p>
              </div>
              <div class="meta-item">
                <h4>Valid Until</h4>
                <p>${validUntil.toLocaleDateString('en-GB')}</p>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 45px;">#</th>
                  <th>Service / Deliverable Description</th>
                  <th style="text-align: right; width: 150px;">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${(quote.items || []).map((item: any, idx: number) => `
                  <tr>
                    <td style="color: #64748b; font-weight: 700;">${String(idx + 1).padStart(2, '0')}</td>
                    <td>
                      <div class="item-title">${item.name}</div>
                      ${item.notes ? `<div class="item-notes">${item.notes}</div>` : ''}
                    </td>
                    <td class="item-price">₹${Number(item.price).toLocaleString('en-IN')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="totals-container">
              <div class="totals-box">
                <div class="total-line">
                  <span>Subtotal</span>
                  <span>₹${total.toLocaleString('en-IN')}</span>
                </div>
                <div class="total-line grand">
                  <span>Grand Total</span>
                  <span class="val">₹${total.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            ${quote.notes ? `
              <div class="notes-section">
                <h5>Terms & Notes</h5>
                <p>${quote.notes.replace(/\n/g, '<br/>')}</p>
              </div>
            ` : ''}

            <div class="footer-sign">
              <div class="footer-left">
                Thank you for considering <strong>${studioName}</strong> for your special occasion.<br/>
                This is a computer-generated quotation and does not constitute a booking confirmation until advance is paid.
              </div>

              <div class="footer-right">
                <div class="sign-line"></div>
                <div class="sign-label">Authorized Signature</div>
              </div>
            </div>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const resetForm = () => {
    setEditingId(null);
    setNewQuoteClient('');
    setNewQuotePhone('');
    setNewQuoteEmail('');
    setNewQuoteNotes('');
    setNewQuoteItems([{ name: '', price: 0, notes: '' }]);
    setNewQuoteStatus('Pending');
    setNewQuoteValidityDays(30);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8f7f4] text-slate-900 p-4 md:p-8 font-poppins min-h-screen">
      <div className="max-w-7xl mx-auto flex flex-col gap-6 text-left">
        
        {/* LIST VIEW */}
        {quotationSubView === 'list' ? (
          <>
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f8f1e5] border border-[#c5a880]/40 text-xs font-bold text-[#99732e] uppercase tracking-wider mb-2">
                  <Briefcase className="w-3.5 h-3.5 text-[#99732e]" />
                  <span>Estimates & Quotes</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Quotations Management</h1>
                <p className="text-xs md:text-sm text-slate-500 mt-1 font-medium">
                  Create, preview, send via WhatsApp/Email, and download formal price estimates for clients.
                </p>
              </div>

              <button 
                onClick={() => { resetForm(); setQuotationSubView('add'); }} 
                className="bg-[#c5a880] hover:bg-[#b69970] text-slate-900 px-5 py-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md hover:scale-105 shrink-0"
              >
                <Plus className="h-4 w-4" /> Create New Quotation
              </button>
            </div>
            
            {/* Quotations Grid */}
            {quotations.length === 0 ? (
              <div className="text-center py-16 text-slate-500 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm max-w-xl mx-auto my-8 p-8">
                <div className="w-16 h-16 rounded-2xl bg-[#f8f1e5] border border-[#c5a880]/30 mx-auto flex items-center justify-center text-[#99732e] mb-4">
                  <FileText className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">No Quotations Yet</h3>
                <p className="text-xs text-slate-500 mb-6">Create your first client quotation with personalized pricing, line items, and instant WhatsApp sharing.</p>
                <button
                  onClick={() => { resetForm(); setQuotationSubView('add'); }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#c5a880] text-slate-900 font-bold text-xs shadow-md"
                >
                  <Plus className="w-4 h-4" /> Generate Quotation
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quotations.map((quote: any, i: number) => {
                  const quoteId = quote._id || quote.id;
                  const clientName = quote.clientName || quote.client || 'Valued Client';
                  const total = quote.amount || quote.value || 0;
                  const quoteNum = quote.quotationNumber || `QT-${new Date(quote.createdAt || Date.now()).getFullYear()}-${(quoteId || '').slice(-4).toUpperCase()}`;
                  const createdDate = new Date(quote.createdAt || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                  
                  return (
                    <div 
                      key={quoteId || i} 
                      className="bg-white border border-slate-200/90 hover:border-[#c5a880] rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                    >
                      <div>
                        {/* Header Row */}
                        <div className="flex justify-between items-start gap-2 mb-3">
                          <div>
                            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1">
                              {quoteNum}
                            </span>
                            <h3 className="text-lg font-black text-slate-900 line-clamp-1 group-hover:text-[#99732e] transition-colors">
                              {clientName}
                            </h3>
                          </div>
                          
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider shrink-0 ${
                            quote.status === 'Accepted'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : quote.status === 'Rejected'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {quote.status || 'Pending'}
                          </span>
                        </div>

                        {/* Client Meta Badges */}
                        <div className="flex flex-wrap items-center gap-2 mb-4 text-[11px] text-slate-500">
                          <span className="inline-flex items-center gap-1 font-medium bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                            <Calendar className="w-3 h-3 text-slate-400" /> {createdDate}
                          </span>
                          {quote.clientPhone && (
                            <span className="inline-flex items-center gap-1 font-medium bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-100">
                              <Phone className="w-3 h-3 text-emerald-600" /> {quote.clientPhone}
                            </span>
                          )}
                        </div>
                        
                        {/* Items Preview */}
                        <div className="bg-slate-50/70 rounded-xl p-3.5 mb-5 border border-slate-100 space-y-2">
                          {(quote.items || []).slice(0, 3).map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center text-xs">
                              <span className="truncate pr-2 text-slate-600 font-medium">• {item.name}</span>
                              <span className="font-bold text-slate-800 shrink-0">₹{Number(item.price).toLocaleString('en-IN')}</span>
                            </div>
                          ))}
                          {quote.items?.length > 3 && (
                            <div className="text-[11px] text-[#99732e] font-bold pt-1">
                              + {quote.items.length - 3} more line items...
                            </div>
                          )}
                          {(!quote.items || quote.items.length === 0) && quote.scope && (
                            <div className="text-xs text-slate-600 truncate">• {quote.scope}</div>
                          )}
                        </div>
                      </div>
                      
                      {/* Footer Actions */}
                      <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total</span>
                          <span className="text-xl font-black text-[#99732e]">
                            ₹{Number(total).toLocaleString('en-IN')}
                          </span>
                        </div>

                        {/* Action Buttons Row */}
                        <div className="grid grid-cols-4 gap-1.5 pt-1">
                          {/* Preview Button */}
                          <button 
                            onClick={() => openPreview(quote)}
                            className="flex flex-col items-center justify-center gap-1 p-2 bg-[#fdfaf5] hover:bg-[#f6efe4] text-[#99732e] border border-[#c5a880]/30 rounded-xl transition-all cursor-pointer shadow-xs hover:scale-105"
                            title="Preview Quotation"
                          >
                            <Eye className="w-4 h-4 text-[#99732e]" />
                            <span className="text-[10px] font-bold">Preview</span>
                          </button>

                          {/* WhatsApp Button */}
                          <button 
                            onClick={() => handleSendWhatsApp(quote)}
                            className="flex flex-col items-center justify-center gap-1 p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/60 rounded-xl transition-all cursor-pointer shadow-xs hover:scale-105"
                            title="Send via WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4 text-emerald-600" />
                            <span className="text-[10px] font-bold">WhatsApp</span>
                          </button>

                          {/* Direct Download PDF */}
                          <button 
                            onClick={() => handleDownloadPDF(quote)}
                            className="flex flex-col items-center justify-center gap-1 p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-xs hover:scale-105"
                            title="Direct Download PDF"
                          >
                            <Download className="w-4 h-4 text-[#99732e]" />
                            <span className="text-[10px] font-bold">PDF</span>
                          </button>

                          {/* Edit / More */}
                          <button 
                            onClick={() => handleEdit(quote)}
                            className="flex flex-col items-center justify-center gap-1 p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-xs hover:scale-105"
                            title="Edit Quotation"
                          >
                            <Edit className="w-4 h-4 text-slate-600" />
                            <span className="text-[10px] font-bold">Edit</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          /* FORM VIEW */
          <div className="w-full relative">
            <button 
              onClick={() => { setQuotationSubView('list'); resetForm(); }} 
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#c5a880] hover:bg-[#b69970] text-slate-900 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer mb-6"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Quotations</span>
            </button>

            <div className="max-w-3xl mx-auto w-full">
              <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200/90 shadow-sm mb-6">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900">
                  {editingId ? 'Edit Quotation' : 'Generate Price Quotation'}
                </h1>
                <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
                  Enter client information and itemized photography deliverables. You can preview, send via WhatsApp, or download as PDF.
                </p>
              </div>

              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (newQuoteClient && newQuoteItems.length > 0) {
                    try {
                      const reqBody = {
                        clientName: newQuoteClient,
                        clientPhone: newQuotePhone,
                        clientEmail: newQuoteEmail,
                        notes: newQuoteNotes,
                        items: newQuoteItems,
                        amount: totalAmount,
                        validUntil: new Date(Date.now() + newQuoteValidityDays * 24 * 60 * 60 * 1000),
                        status: newQuoteStatus || 'Pending'
                      };
                      
                      let res: any;
                      if (editingId) {
                        res = await apiClient.put(`/dashboard/quotations/${editingId}`, reqBody);
                        setQuotations(quotations.map((q: any) => (q._id || q.id) === editingId ? res.data : q));
                        toast.success('Quotation updated successfully!');
                      } else {
                        res = await apiClient.post('/dashboard/quotations', reqBody);
                        setQuotations([res.data, ...quotations]);
                        toast.success('Quotation generated successfully!');
                      }
                      
                      // Auto-open preview for the generated quote
                      openPreview(res.data);
                      resetForm();
                      setQuotationSubView('list');
                    } catch (err) {
                      console.error(err);
                      toast.error(editingId ? 'Failed to update quotation' : 'Failed to create quotation');
                    }
                  } else {
                    toast.error('Please enter client name and at least one line item');
                  }
                }} 
                className="bg-white border border-slate-200/90 p-6 md:p-8 rounded-2xl flex flex-col gap-6 text-left shadow-sm"
              >
                
                {/* Client Details Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 flex flex-col gap-1.5">
                    <label className="text-xs text-slate-600 uppercase font-extrabold tracking-wider">
                      Client Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Ayush Patel & Kinjal Sharma"
                      value={newQuoteClient} 
                      onChange={(e) => setNewQuoteClient(e.target.value)}  
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-[#c5a880] focus:bg-white transition-all" 
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-600 uppercase font-extrabold tracking-wider flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      Client Mobile / WhatsApp
                    </label>
                    <input 
                      type="tel" 
                      placeholder="e.g. 9876543210"
                      value={newQuotePhone} 
                      onChange={(e) => setNewQuotePhone(e.target.value)}  
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-[#c5a880] focus:bg-white transition-all" 
                    />
                    <span className="text-[11px] text-slate-400">Used for direct WhatsApp quotation sharing</span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-600 uppercase font-extrabold tracking-wider flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-blue-500" />
                      Client Email (Optional)
                    </label>
                    <input 
                      type="email" 
                      placeholder="e.g. client@gmail.com"
                      value={newQuoteEmail} 
                      onChange={(e) => setNewQuoteEmail(e.target.value)}  
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-[#c5a880] focus:bg-white transition-all" 
                    />
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* Line Items Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-xs text-slate-600 uppercase font-extrabold tracking-wider">
                        Photography Deliverables & Line Items <span className="text-rose-500">*</span>
                      </h4>
                      <p className="text-[11px] text-slate-400">Add packages, events, candid photography, cinematography, drone, album books, etc.</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-4">
                    {newQuoteItems.map((item, index) => (
                      <div key={index} className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 flex flex-col gap-3 relative group hover:border-[#c5a880] transition-colors">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full">
                          <div className="w-full sm:flex-1 flex flex-col gap-1">
                            <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Service Description *</label>
                            <input 
                              type="text" 
                              required 
                              placeholder="e.g. Wedding Day Candid Photography & 4K Cinematography"
                              value={item.name} 
                              onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[#c5a880]" 
                            />
                          </div>
                          <div className="w-full sm:w-44 flex flex-col gap-1">
                            <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Price (₹) *</label>
                            <input 
                              type="number" 
                              required 
                              min="0"
                              placeholder="₹ 0"
                              value={item.price || ''} 
                              onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#c5a880]" 
                            />
                          </div>
                          {newQuoteItems.length > 1 && (
                            <button 
                              type="button" 
                              onClick={() => handleRemoveItem(index)} 
                              className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors mt-4 shrink-0"
                              title="Delete Item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Details / Inclusions (Optional)</label>
                          <textarea
                            value={item.notes || ''}
                            onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                            placeholder="e.g. 2 Senior Photographers, 1 Traditional Videographer, 1 Drone Pilot, all raw files included"
                            rows={2}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#c5a880] resize-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <button 
                    type="button" 
                    onClick={handleAddItem} 
                    className="mt-4 inline-flex items-center gap-2 text-xs font-extrabold text-[#99732e] hover:text-[#b58d55] bg-[#f8f1e5] hover:bg-[#f3e9d8] px-4 py-2 rounded-xl transition-all border border-[#c5a880]/30 shadow-xs cursor-pointer"
                  >
                    <Plus className="h-4 w-4" /> Add Another Line Item
                  </button>
                </div>

                <hr className="border-slate-100" />

                {/* Additional Terms / Validity */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-600 uppercase font-extrabold tracking-wider">Validity Period</label>
                    <select
                      value={newQuoteValidityDays}
                      onChange={(e) => setNewQuoteValidityDays(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-[#c5a880]"
                    >
                      <option value={15}>Valid for 15 Days</option>
                      <option value={30}>Valid for 30 Days (Recommended)</option>
                      <option value={60}>Valid for 60 Days</option>
                      <option value={90}>Valid for 90 Days</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-600 uppercase font-extrabold tracking-wider">Initial Status</label>
                    <select
                      value={newQuoteStatus}
                      onChange={(e) => setNewQuoteStatus(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-[#c5a880]"
                    >
                      <option value="Pending">Pending (Draft / Sent)</option>
                      <option value="Accepted">Accepted by Client</option>
                      <option value="Rejected">Rejected / Expired</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 flex flex-col gap-1.5">
                    <label className="text-xs text-slate-600 uppercase font-extrabold tracking-wider">Terms & Conditions / Special Notes</label>
                    <textarea
                      rows={3}
                      placeholder="e.g. 50% advance payment required to block dates. Remaining 50% upon delivery of photo album and video teaser. Outstation travel & accommodation to be borne by client."
                      value={newQuoteNotes}
                      onChange={(e) => setNewQuoteNotes(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 focus:outline-none focus:border-[#c5a880] resize-none"
                    />
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* Total Summary */}
                <div className="flex items-center justify-between bg-[#fbf8f3] border border-[#c5a880]/30 p-5 rounded-2xl">
                  <div>
                    <span className="text-xs font-extrabold text-[#99732e] uppercase tracking-wider block">Total Estimated Amount</span>
                    <span className="text-[11px] text-slate-500 font-medium">Sum of all deliverables</span>
                  </div>
                  <span className="text-3xl font-black text-[#99732e]">₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
                
                {/* Form Action Buttons: Preview & Save */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={handlePreviewFromForm}
                    className="w-full sm:w-1/2 border-2 border-[#c5a880] text-[#99732e] hover:bg-[#fbf8f3] font-black py-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Eye className="w-4 h-4 text-[#99732e]" />
                    <span>Preview Quotation</span>
                  </button>

                  <button 
                    type="submit" 
                    className="w-full sm:w-1/2 bg-[#c5a880] hover:bg-[#b69970] text-slate-900 font-black py-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02]"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{editingId ? 'Update & Save Quote' : 'Generate Price Quote'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* IN-APP QUOTATION PREVIEW & ACTION MODAL                       */}
      {/* ───────────────────────────────────────────────────────────── */}
      {previewModalOpen && previewData && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden relative">
            
            {/* Modal Top Bar */}
            <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#c5a880]/20 rounded-xl text-[#c5a880]">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm md:text-base leading-snug">Quotation Preview</h3>
                  <span className="text-xs text-slate-400 font-mono">
                    {previewData.quotationNumber || `QT-${new Date(previewData.createdAt || Date.now()).getFullYear()}-${(previewData._id || '').slice(-4).toUpperCase()}`}
                  </span>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2">
                {/* Direct Download PDF */}
                <button
                  onClick={() => handleDownloadPDF(previewData)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#c5a880] hover:bg-[#b69970] text-slate-900 text-xs font-black transition-all cursor-pointer shadow-sm hover:scale-105"
                  title="Direct Download PDF File"
                >
                  <Download className="w-4 h-4 text-slate-900" />
                  <span>Download PDF</span>
                </button>

                {/* Print Option */}
                <button
                  onClick={() => handlePrint(previewData)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer"
                  title="Print Quotation"
                >
                  <Printer className="w-4 h-4 text-slate-300" />
                  <span className="hidden sm:inline">Print</span>
                </button>

                {/* WhatsApp Share */}
                <button
                  onClick={() => handleSendWhatsApp(previewData)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold transition-all cursor-pointer shadow-sm"
                  title="Send to Client on WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Send WhatsApp</span>
                </button>

                {/* Email Share */}
                <button
                  onClick={() => handleSendEmail(previewData)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer"
                  title="Send via Email"
                >
                  <Mail className="w-4 h-4" />
                  <span className="hidden md:inline">Email</span>
                </button>

                {/* Copy Summary */}
                <button
                  onClick={() => handleCopySummary(previewData)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                  title="Copy Text Summary"
                >
                  {copiedText ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>

                {/* Close Modal */}
                <button
                  onClick={() => setPreviewModalOpen(false)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-rose-600 text-white transition-all cursor-pointer ml-1"
                  title="Close Preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: The Formatted Quotation Sheet */}
            <div className="p-6 md:p-10 overflow-y-auto bg-slate-100 flex justify-center">
              <div className="bg-white rounded-2xl p-6 md:p-10 w-full max-w-3xl shadow-md border border-slate-200/80 text-left">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-200">
                  <div>
                    {studio?.logoUrl ? (
                      <img src={studio.logoUrl} alt="Logo" className="max-h-12 max-w-[150px] object-contain mb-2" />
                    ) : (
                      <div className="text-2xl font-black text-slate-900 tracking-tight mb-1">
                        {studio?.name || user?.name || 'Mara Photo Studio'}
                      </div>
                    )}
                    <div className="text-xs text-slate-500 font-medium space-y-0.5">
                      {studio?.address && <div>{studio.address}</div>}
                      {user?.phone && <div>M: {user.phone}</div>}
                      {user?.email && <div>E: {user.email}</div>}
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <span className="text-2xl md:text-3xl font-black text-[#c5a880] tracking-wider uppercase block">
                      QUOTATION
                    </span>
                    <span className="inline-block mt-1.5 px-3 py-1 bg-slate-100 border border-slate-200 rounded-md text-xs font-mono font-bold text-slate-700">
                      {previewData.quotationNumber || `QT-${new Date(previewData.createdAt || Date.now()).getFullYear()}-${(previewData._id || '').slice(-4).toUpperCase()}`}
                    </span>
                  </div>
                </div>

                {/* Meta details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Quotation For</span>
                    <strong className="text-sm font-bold text-slate-900 block">{previewData.clientName}</strong>
                    {previewData.clientPhone && <span className="text-slate-600 block mt-0.5">M: {previewData.clientPhone}</span>}
                    {previewData.clientEmail && <span className="text-slate-600 block">E: {previewData.clientEmail}</span>}
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Date Issued</span>
                    <strong className="text-xs font-bold text-slate-900">
                      {new Date(previewData.createdAt || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Valid Until</span>
                    <strong className="text-xs font-bold text-slate-900">
                      {previewData.validUntil ? new Date(previewData.validUntil).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '30 Days'}
                    </strong>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="overflow-x-auto my-6">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-900 text-white uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-4 rounded-l-lg" style={{ width: '40px' }}>#</th>
                        <th className="py-3 px-4">Service & Deliverable Description</th>
                        <th className="py-3 px-4 text-right rounded-r-lg" style={{ width: '130px' }}>Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(previewData.items || []).map((it: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-3.5 px-4 font-bold text-slate-400">{String(idx + 1).padStart(2, '0')}</td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 text-sm">{it.name}</div>
                            {it.notes && <div className="text-slate-500 text-xs mt-0.5">{it.notes}</div>}
                          </td>
                          <td className="py-3.5 px-4 text-right font-black text-slate-900 text-sm">
                            ₹{Number(it.price).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Subtotal & Total */}
                <div className="flex justify-end my-6">
                  <div className="w-full sm:w-72 bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-500 font-semibold">
                      <span>Subtotal</span>
                      <span>₹{Number(previewData.amount).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                      <span>Total Amount</span>
                      <span className="text-[#99732e]">₹{Number(previewData.amount).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Notes & Terms */}
                {previewData.notes && (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs my-6">
                    <strong className="text-amber-900 block mb-1 font-bold uppercase text-[10px] tracking-wider">Terms & Notes</strong>
                    <p className="text-amber-800 leading-relaxed whitespace-pre-line">{previewData.notes}</p>
                  </div>
                )}

                {/* Footer sign */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pt-6 border-t border-slate-200 text-[11px] text-slate-500">
                  <div className="max-w-xs">
                    Thank you for choosing <strong>{studio?.name || user?.name || 'our studio'}</strong>. Please reach out if you have any questions or customization needs.
                  </div>

                  <div className="text-right sm:self-end">
                    <div className="w-40 border-t border-slate-800 mb-1"></div>
                    <span className="font-bold uppercase text-[10px] text-slate-700 tracking-wider">Authorized Signature</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Bottom Action Bar */}
            <div className="bg-slate-50 px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 shrink-0">
              <span className="text-xs text-slate-500 font-medium">
                Send this quotation directly to <strong>{previewData.clientName}</strong>:
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSendWhatsApp(previewData)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Send on WhatsApp</span>
                </button>

                <button
                  onClick={() => handleDownloadPDF(previewData)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#c5a880] hover:bg-[#b69970] text-slate-900 text-xs font-black transition-all shadow-sm cursor-pointer hover:scale-105"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
