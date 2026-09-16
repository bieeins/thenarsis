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