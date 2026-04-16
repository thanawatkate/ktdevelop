import { NextRequest, NextResponse } from 'next/server';
import { quoteRepository } from '@/infrastructure/repositories/QuoteRepository';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const id = parseInt(params.id, 10);
  
  try {
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid quote ID' },
        { status: 400 }
      );
    }

    const quote = await quoteRepository.getQuoteById(id);
    if (!quote) {
      return NextResponse.json(
        { success: false, error: 'Quote not found' },
        { status: 404 }
      );
    }

    // Dynamic import to avoid client-side issues
    const { jsPDF } = await import('jspdf');
    require('jspdf-autotable');

    const pdf = new jsPDF() as any;

    // Set up fonts and colors
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const headerColor = [59, 130, 246]; // blue-500
    const textColor = [30, 30, 30]; // Nearly black

    // Header
    pdf.setFillColor(...headerColor);
    pdf.rect(0, 0, pageWidth, 30, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.text('QUOTATION', margin, 22);

    // Quote number and date
    pdf.setTextColor(...textColor);
    pdf.setFontSize(10);
    let yPos = 45;
    pdf.text(`Quote #: ${quote.quote_number}`, margin, yPos);
    yPos += 6;
    pdf.text(`Date: ${new Date(quote.created_at).toLocaleDateString()}`, margin, yPos);
    yPos += 6;
    pdf.text(`Valid Until: ${new Date(quote.valid_until || '').toLocaleDateString()}`, margin, yPos);

    // Client information
    yPos += 12;
    pdf.setFontSize(11);
    pdf.setFont(undefined, 'bold');
    pdf.text('CLIENT INFORMATION', margin, yPos);
    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(10);
    yPos += 7;
    pdf.text(`Name: ${quote.client_name}`, margin, yPos);
    yPos += 5;
    pdf.text(`Email: ${quote.client_email}`, margin, yPos);
    if (quote.client_phone) {
      yPos += 5;
      pdf.text(`Phone: ${quote.client_phone}`, margin, yPos);
    }

    // Line items table
    yPos += 12;
    const tableData = (quote.items || []).map(item => [
      item.description,
      item.quantity.toString(),
      `$${item.unit_price.toFixed(2)}`,
      `$${item.total_price.toFixed(2)}`
    ]);

    (pdf as any).autoTable({
      startY: yPos,
      margin: margin,
      head: [['Description', 'Qty', 'Unit Price', 'Total']],
      body: tableData,
      headStyles: {
        fillColor: headerColor,
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        textColor: textColor,
        fontSize: 9
      },
      footerStyles: {
        fillColor: [240, 240, 240],
        textColor: textColor,
        fontSize: 10,
        fontStyle: 'bold'
      },
      foot: [
        [``, ``, 'Subtotal:', `$${quote.base_price.toFixed(2)}`],
        [``, ``, `Discount (${quote.discount_percent}%):`, `-$${quote.discount_amount.toFixed(2)}`],
        [``, ``, 'TOTAL:', `$${quote.final_price.toFixed(2)}`]
      ],
      columnStyles: {
        0: { halign: 'left' },
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'right' }
      }
    });

    // Additional notes if present
    if (quote.additional_requirements) {
      yPos = (pdf as any).lastAutoTable.finalY + 15;
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'bold');
      pdf.text('ADDITIONAL REQUIREMENTS:', margin, yPos);
      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(9);
      const lines = pdf.splitTextToSize(quote.additional_requirements, pageWidth - 2 * margin);
      pdf.text(lines, margin, yPos + 6);
    }

    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor(120, 120, 120);
    pdf.text(
      'KT Develop - Web & App Development Services',
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));

    // Return PDF with proper headers
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Quote-${quote.quote_number}.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
