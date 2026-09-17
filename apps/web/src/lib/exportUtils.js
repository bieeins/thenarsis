import html2pdf from 'html2pdf.js';
import { format } from 'date-fns';
import { formatRupiah } from './currency.js';

export const exportToCSV = (filename, columns, data) => {
  const csvContent = [
    columns.join(','),
    ...data.map(row => 
      columns.map(col => {
        const val = row[col] || '';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Shared invoice template used by the owner's Payment Tracking PDF export and
// the public invoice page's download/print, so the two always match.
// Expects invoice.order (customer_name, phone_number, event_name, event_date,
// event_location, product.package_name), invoice.totalPaid and
// invoice.remainingBalance already computed by the caller.
const buildInvoiceHTML = (invoice) => `
  <div style="padding: 40px; font-family: sans-serif; color: #000;">
    <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #FBBF24; padding-bottom: 20px; mb-6">
      <div>
         <h1 style="font-size: 32px; color: #000; margin: 0;">THENARSIS</h1>
         <p style="color: #666; margin: 5px 0;">Professional Event Services</p>
      </div>
      <div style="text-align: right;">
         <h2 style="font-size: 24px; margin: 0; color: #FBBF24;">INVOICE</h2>
         <p>#${invoice.invoice_number}</p>
         <p>${invoice.created_at ? format(new Date(invoice.created_at), 'MMM dd, yyyy') : ''}</p>
      </div>
    </div>

    <div style="display: flex; justify-content: space-between; margin-top: 40px;">
      <div>
        <h3 style="margin-bottom: 10px; color: #333;">Billed To:</h3>
        <p style="font-weight: bold; margin: 0;">${invoice.order?.customer_name || ''}</p>
        <p style="margin: 5px 0;">${invoice.order?.phone_number || ''}</p>
      </div>
      <div style="text-align: right;">
        <h3 style="margin-bottom: 10px; color: #333;">Event Details:</h3>
        <p style="margin: 0;">${invoice.order?.event_name || ''}</p>
        <p style="margin: 5px 0;">${invoice.order?.event_date ? format(new Date(invoice.order.event_date), 'MMM dd, yyyy') : ''}</p>
        <p style="margin: 0;">${invoice.order?.event_location || ''}</p>
      </div>
    </div>

    <table style="width: 100%; margin-top: 40px; border-collapse: collapse;">
      <thead>
        <tr style="background: #FBBF24; color: #000;">
          <th style="padding: 12px; text-align: left;">Description</th>
          <th style="padding: 12px; text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">
            <strong>${invoice.order?.product?.package_name || 'Event Package'}</strong>
          </td>
          <td style="padding: 12px; text-align: right; border-bottom: 1px solid #eee;">
            ${formatRupiah(invoice.total_amount)}
          </td>
        </tr>
      </tbody>
    </table>

    <div style="margin-top: 40px; width: 300px; float: right;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
        <span>Total Amount:</span>
        <strong>${formatRupiah(invoice.total_amount)}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: green;">
        <span>Total Paid:</span>
        <span>- ${formatRupiah(invoice.totalPaid)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; border-top: 2px solid #000; padding-top: 10px; font-size: 18px;">
        <strong>Balance Due:</strong>
        <strong style="color: #FBBF24;">${formatRupiah(invoice.remainingBalance)}</strong>
      </div>
    </div>

    <div style="clear: both; margin-top: 60px; text-align: center; color: #666; font-size: 12px;">
       Thank you for trusting Thenarsis Management System.
    </div>
  </div>
`;

export const exportInvoiceToPDF = async (invoice) => {
  const html2pdfLib = (await import('html2pdf.js')).default;

  const element = document.createElement('div');
  element.innerHTML = buildInvoiceHTML(invoice);

  const opt = {
    margin: 10,
    filename: `${invoice.invoice_number}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  await html2pdfLib().from(element).set(opt).save();
};

// Opens the browser's native print dialog (same as the old window.print())
// but renders the same styled invoice template as exportInvoiceToPDF, via a
// hidden iframe, instead of printing whatever happens to be on screen. The
// user can still choose "Save as PDF" themselves from that dialog.
export const printInvoice = (invoice) => {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(`<!DOCTYPE html><html><head><title>${invoice.invoice_number || 'Invoice'}</title></head><body>${buildInvoiceHTML(invoice)}</body></html>`);
  doc.close();

  const cleanup = () => {
    if (iframe.parentNode) document.body.removeChild(iframe);
  };

  // Give the iframe a tick to lay out the content before printing.
  setTimeout(() => {
    iframe.contentWindow.onafterprint = cleanup;
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    // Fallback in case `afterprint` never fires (e.g. the user cancels in
    // some browsers without emitting the event).
    setTimeout(cleanup, 5000);
  }, 250);
};

export const exportToPDF = (elementId, filename) => {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  const opt = {
    margin:       0.5,
    filename:     `${filename}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true },
    jsPDF:        { unit: 'in', format: 'letter', orientation: 'landscape' }
  };
  
  html2pdf().set(opt).from(element).save();
};

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return formatRupiah(0);
  return formatRupiah(amount);
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    return format(new Date(dateString), 'dd/MM/yyyy');
  } catch (e) {
    return '';
  }
};

const downloadCSV = (content, filename) => {
  // Add BOM for UTF-8 Excel compatibility
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportDesignFeesToCSV = (designFees, filters = {}) => {
  const headers = ['Designer Name', 'Event Name', 'Fee Amount (Rp)', 'Submission Date', 'Status', 'Notes'];
  
  let totalAmount = 0;
  let statusCounts = { pending: 0, approved: 0, paid: 0 };

  const rows = designFees.map(fee => {
    const amount = fee.fee_amount || 0;
    totalAmount += amount;
    statusCounts[fee.status] = (statusCounts[fee.status] || 0) + 1;

    return [
      `"${(fee.designer_name || '').replace(/"/g, '""')}"`,
      `"${(fee.order?.event_name || '').replace(/"/g, '""')}"`,
      `"${formatCurrency(amount)}"`,
      `"${formatDate(fee.created_at)}"`,
      `"${(fee.status || '').toUpperCase()}"`,
      `""`
    ].join(',');
  });

  const summaryRows = [
    '',
    'SUMMARY',
    `Total Design Fees,"${formatCurrency(totalAmount)}"`,
    `Total Count,${designFees.length}`,
    `Submitted,${statusCounts.pending || 0}`,
    `Approved,${statusCounts.approved || 0}`,
    `Paid,${statusCounts.paid || 0}`
  ];

  const csvContent = [headers.join(','), ...rows, ...summaryRows].join('\r\n');
  const filename = `Design_Fees_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  downloadCSV(csvContent, filename);
};

export const exportCrewAttendanceToCSV = (crewAttendance, filters = {}) => {
  const headers = ['Crew Name', 'Event Name', 'Event Date', 'Attendance Status', 'Attendance Reason', 'Amount (Rp)', 'Submission Date', 'Notes'];
  
  let totalAmount = 0;
  let statusCounts = { hadir: 0, tidak_hadir: 0, belum_jawab: 0 };

  const rows = crewAttendance.map(crew => {
    const amount = crew.attendance_amount || 0;
    totalAmount += amount;
    const status = crew.attendance_status || 'belum_jawab';
    statusCounts[status] = (statusCounts[status] || 0) + 1;

    return [
      `"${(crew.crew?.name || '').replace(/"/g, '""')}"`,
      `"${(crew.order?.event_name || '').replace(/"/g, '""')}"`,
      `"${formatDate(crew.order?.event_date)}"`,
      `"${status.toUpperCase()}"`,
      `"${(crew.attendance_reason || '').replace(/"/g, '""')}"`,
      `"${formatCurrency(amount)}"`,
      `"${formatDate(crew.created_at)}"`,
      `"${(crew.crew_notes || '').replace(/"/g, '""')}"`
    ].join(',');
  });

  const total = crewAttendance.length;
  const hadirPct = total > 0 ? Math.round(((statusCounts.hadir || 0) / total) * 100) : 0;

  const summaryRows = [
    '',
    'SUMMARY',
    `Total Count,${total}`,
    `Total Amount,"${formatCurrency(totalAmount)}"`,
    `Hadir,${statusCounts.hadir || 0}`,
    `Tidak Hadir,${statusCounts.tidak_hadir || 0}`,
    `Belum Jawab,${statusCounts.belum_jawab || 0}`,
    `Hadir Percentage,${hadirPct}%`
  ];

  const csvContent = [headers.join(','), ...rows, ...summaryRows].join('\r\n');
  const filename = `Crew_Attendance_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  downloadCSV(csvContent, filename);
};

export const exportCombinedReportToCSV = (designFees, crewAttendance, orders, filters = {}) => {
  // Calculate Revenue Impact
  const grossRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const totalDesignFees = designFees.reduce((sum, fee) => sum + (fee.fee_amount || 0), 0);
  const totalCrewAmounts = crewAttendance.reduce((sum, crew) => sum + (crew.attendance_amount || 0), 0);
  const netRevenue = grossRevenue - totalDesignFees - totalCrewAmounts;

  const impactSection = [
    'REVENUE IMPACT SUMMARY',
    `Calculation Date,"${formatDate(new Date())}"`,
    `Gross Revenue,"${formatCurrency(grossRevenue)}"`,
    `Total Design Fees,"-${formatCurrency(totalDesignFees)}"`,
    `Total Crew Amounts,"-${formatCurrency(totalCrewAmounts)}"`,
    `Net Revenue,"${formatCurrency(netRevenue)}"`,
    '',
    ''
  ];

  // Design Fees Section
  const dfHeaders = ['DESIGN FEES', '', '', '', '', ''];
  const dfCols = ['Designer Name', 'Event Name', 'Fee Amount (Rp)', 'Submission Date', 'Status', 'Notes'];
  const dfRows = designFees.map(fee => [
    `"${(fee.designer_name || '').replace(/"/g, '""')}"`,
    `"${(fee.order?.event_name || '').replace(/"/g, '""')}"`,
    `"${formatCurrency(fee.fee_amount || 0)}"`,
    `"${formatDate(fee.created_at)}"`,
    `"${(fee.status || '').toUpperCase()}"`,
    `""`
  ].join(','));

  // Crew Attendance Section
  const caHeaders = ['', '', '', '', '', '', '', ''];
  const caTitle = ['CREW ATTENDANCE', '', '', '', '', '', '', ''];
  const caCols = ['Crew Name', 'Event Name', 'Event Date', 'Attendance Status', 'Attendance Reason', 'Amount (Rp)', 'Submission Date', 'Notes'];
  const caRows = crewAttendance.map(crew => [
    `"${(crew.crew?.name || '').replace(/"/g, '""')}"`,
    `"${(crew.order?.event_name || '').replace(/"/g, '""')}"`,
    `"${formatDate(crew.order?.event_date)}"`,
    `"${(crew.attendance_status || 'belum_jawab').toUpperCase()}"`,
    `"${(crew.attendance_reason || '').replace(/"/g, '""')}"`,
    `"${formatCurrency(crew.attendance_amount || 0)}"`,
    `"${formatDate(crew.created_at)}"`,
    `"${(crew.crew_notes || '').replace(/"/g, '""')}"`
  ].join(','));

  const csvContent = [
    ...impactSection,
    dfHeaders.join(','),
    dfCols.join(','),
    ...dfRows,
    ...caHeaders,
    caTitle.join(','),
    caCols.join(','),
    ...caRows
  ].join('\r\n');

  const filename = `Fees_and_Compensation_Report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  downloadCSV(csvContent, filename);
};