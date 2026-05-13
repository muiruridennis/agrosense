import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';

export interface SeasonReportData {
  farmName: string;
  ownerName: string;
  fromDate: string;
  toDate: string;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  currency: string;
  breakdown: {
    recordType: string;
    category: string;
    total: number;
    count: number;
  }[];
  cropSummary: {
    cropType: string;
    status: string;
    count: number;
    totalYieldKg: number;
  }[];
}

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  async generateSeasonReport(data: SeasonReportData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      this.renderReport(doc, data);
      doc.end();
    });
  }

  private renderReport(doc: PDFKit.PDFDocument, data: SeasonReportData) {
    const { currency } = data;
    const fmt = (n: number) =>
      `${currency} ${n.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
    const positive = data.netProfit >= 0;

    // ── Header ──────────────────────────────────────────────────────────────
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('AgroSense — Season Report', { align: 'center' });

    doc.moveDown(0.5);
    doc
      .fontSize(11)
      .font('Helvetica')
      .text(`Farm: ${data.farmName}`, { align: 'center' })
      .text(`Owner: ${data.ownerName}`, { align: 'center' })
      .text(`Period: ${data.fromDate} to ${data.toDate}`, { align: 'center' });

    doc.moveDown(1);
    doc
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .strokeColor('#cccccc')
      .stroke();

    // ── P&L Summary ─────────────────────────────────────────────────────────
    doc.moveDown(0.8);
    doc.fontSize(13).font('Helvetica-Bold').text('Financial Summary');
    doc.moveDown(0.4);

    const summaryRows = [
      ['Total Income', fmt(data.totalIncome)],
      ['Total Expenses', fmt(data.totalExpenses)],
      ['Net Profit / Loss', fmt(data.netProfit)],
    ];

    for (const [label, value] of summaryRows) {
      const isNet = label.startsWith('Net');
      doc
        .font(isNet ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(11)
        .fillColor(isNet ? (positive ? '#1a7a4a' : '#c0392b') : '#000000')
        .text(label, 50, doc.y, { continued: true, width: 300 })
        .text(value, { align: 'right' });
      doc.fillColor('#000000');
      doc.moveDown(0.3);
    }

    // ── Breakdown by category (FIXED TABLE ALIGNMENT) ───────────────────────
    doc.moveDown(0.8);
    doc.fontSize(13).font('Helvetica-Bold').text('Breakdown by Category');
    doc.moveDown(0.4);

    // Define table columns
    const startX = 50;
    const colWidths = [80, 150, 100, 120];
    const headers = ['Type', 'Category', 'Count', 'Total'];
    
    // Save current Y position for header
    const headerY = doc.y;
    
    // Draw header row
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#555555');
    let currentX = startX;
    headers.forEach((header, i) => {
      doc.text(header, currentX, headerY, { 
        width: colWidths[i],
        align: i === 3 ? 'right' : 'left' // Right-align the Total column
      });
      currentX += colWidths[i];
    });
    
    // Draw header underline
    const underlineY = doc.y + 5;
    doc
      .moveTo(startX, underlineY)
      .lineTo(startX + colWidths.reduce((a, b) => a + b, 0), underlineY)
      .strokeColor('#dddddd')
      .stroke();
    
    // Reset Y position after header
    doc.moveDown(0.5);
    
    // Draw data rows
    doc.font('Helvetica').fillColor('#000000');
    
    for (const row of data.breakdown) {
      const rowY = doc.y;
      currentX = startX;
      
      // Format category name (replace underscores with spaces and capitalize)
      const categoryName = row.category
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      // Format record type (capitalize first letter)
      const recordType = row.recordType.charAt(0).toUpperCase() + row.recordType.slice(1);
      
      const columns = [
        recordType,
        categoryName,
        row.count.toString(),
        fmt(row.total),
      ];
      
      // Draw each column in the row
      columns.forEach((value, i) => {
        doc.fontSize(10).text(value, currentX, rowY, {
          width: colWidths[i],
          align: i === 3 ? 'right' : 'left', // Right-align the Total column
        });
        currentX += colWidths[i];
      });
      
      doc.moveDown(0.4);
    }

    // Optional: Add total row at bottom
    if (data.breakdown.length > 0) {
      doc.moveDown(0.2);
      
      // Draw a light separator line
      const lineY = doc.y;
      doc
        .moveTo(startX, lineY)
        .lineTo(startX + colWidths.reduce((a, b) => a + b, 0), lineY)
        .strokeColor('#eeeeee')
        .stroke();
      doc.moveDown(0.2);
      
      // Draw totals row
      const totalY = doc.y;
      currentX = startX;
      
      // Empty cells for Type and Category
      doc.fontSize(10).font('Helvetica-Bold').text('', currentX, totalY, { width: colWidths[0] });
      currentX += colWidths[0];
      doc.text('TOTAL', currentX, totalY, { width: colWidths[1] });
      currentX += colWidths[1];
      
      // Total count
      const totalCount = data.breakdown.reduce((sum, row) => sum + row.count, 0);
      doc.text(totalCount.toString(), currentX, totalY, { 
        width: colWidths[2],
        align: 'left'
      });
      currentX += colWidths[2];
      
      // Total amount
      const totalAmount = data.breakdown.reduce((sum, row) => sum + row.total, 0);
      doc.text(fmt(totalAmount), currentX, totalY, { 
        width: colWidths[3],
        align: 'right'
      });
      
      doc.moveDown(0.5);
    }

    // ── Crop Summary ─────────────────────────────────────────────────────────
    if (data.cropSummary.length > 0) {
      doc.moveDown(0.8);
      doc.fontSize(13).font('Helvetica-Bold').text('Crop Summary');
      doc.moveDown(0.4);

      // Create crop summary table
      const cropStartX = 50;
      const cropColWidths = [150, 100, 100, 120];
      const cropHeaders = ['Crop Type', 'Status', 'Plots', 'Total Yield (kg)'];
      
      const cropHeaderY = doc.y;
      currentX = cropStartX;
      
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#555555');
      cropHeaders.forEach((header, i) => {
        doc.text(header, currentX, cropHeaderY, { 
          width: cropColWidths[i],
          align: i === 3 ? 'right' : 'left'
        });
        currentX += cropColWidths[i];
      });
      
      doc.moveDown(0.5);
      doc.font('Helvetica').fillColor('#000000');
      
      for (const crop of data.cropSummary) {
        const rowY = doc.y;
        currentX = cropStartX;
        
        const columns = [
          crop.cropType,
          crop.status,
          crop.count.toString(),
          crop.totalYieldKg ? crop.totalYieldKg.toLocaleString() : '0',
        ];
        
        columns.forEach((value, i) => {
          doc.fontSize(10).text(value, currentX, rowY, {
            width: cropColWidths[i],
            align: i === 3 ? 'right' : 'left',
          });
          currentX += cropColWidths[i];
        });
        
        doc.moveDown(0.4);
      }
    }

    // ── Footer ───────────────────────────────────────────────────────────────
    doc.moveDown(2);
    doc
      .fontSize(9)
      .fillColor('#aaaaaa')
      .text(
        `Generated by AgroSense on ${new Date().toLocaleDateString('en-KE')}`,
        { align: 'center' },
      );
  }
}