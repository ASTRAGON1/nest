import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import writtenNumber from 'written-number';

// Get company info from localStorage - Settings saves keys: storeName, storePhone, storeEmail, storeAddress
const getCompanyInfo = () => {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return {
            name: user.storeName || user.companyName || user.name || 'Votre Entreprise',
            address: user.storeAddress || user.address || 'Adresse de la boutique',
            phone: user.storePhone || user.phone || user.phoneNumber || '+212 X XX XX XX XX',
            email: user.storeEmail || user.email || 'contact@entreprise.ma',
        };
    } catch {
        return {
            name: 'Votre Entreprise',
            address: 'Adresse de la boutique',
            phone: '+212 X XX XX XX XX',
            email: 'contact@entreprise.ma',
        };
    }
};

export const printReceipt = (sale, language = 'en', isEstimation = false, isInvoice = false) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const company = getCompanyInfo();
    const pageWidth = 210;
    const margin = 15;

    const isFr = language === 'fr';
    const isAr = language === 'ar';
    let title = isFr ? 'BON DE LIVRAISON' : (isAr ? 'أمر عمل' : 'DELIVERY NOTE');

    // Use Arabic devis internally if language is Arabic.
    // 'DEVIS' is commonly used in Morocco for French & Arabic.
    if (isEstimation) {
        title = isFr ? 'DEVIS' : (isAr ? 'عرض سعر' : 'ESTIMATION');
    } else if (isInvoice) {
        title = isFr ? 'FACTURE' : (isAr ? 'فاتورة' : 'INVOICE');
    }

    // Parse date
    const saleDate = new Date(sale.createdAt || sale.saleDate || new Date());
    const dateStr = `${saleDate.getDate()}/${saleDate.getMonth() + 1}/${saleDate.getFullYear()}`;

    // Customer name - handle multiple possible structures
    const customerName =
        sale.customer?.name ||
        sale.customerName ||
        (sale.customerId ? `Client #${sale.customerId}` : (isFr ? 'Passage' : 'Walk-in'));

    // Items - handle multiple possible structures
    const items = (sale.saleItems || sale.items || []).map(item => ({
        name: item.productName || item.product?.name || item.name || 'Article',
        qty: item.quantity || 0,
        unitPrice: parseFloat(item.unitPrice || 0),
        total: parseFloat(item.subtotal || (item.unitPrice * item.quantity) || 0),
    }));

    // ─── TITLE top-middle ──────────────────────────────────────────────────────
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(30, 100, 190);
    doc.text(title, pageWidth / 2, 22, { align: 'center' });

    // ─── RIGHT-SIDE INFO BOX ───────────────────────────────────────────────────
    const boxX = 130;
    const boxW = 65;
    // Add prefix to Order No depending on if estimation or sale
    let receiptLabel = isFr ? 'N Bon:' : 'Order No:';
    if (isEstimation) {
        receiptLabel = isFr ? 'N Devis:' : 'Estim No:';
    } else if (isInvoice) {
        receiptLabel = isFr ? 'N Facture:' : 'Invoice No:';
    }

    const boxRows = [
        { label: receiptLabel, value: sale.receiptNumber || 'N/A' },
        { label: isFr ? 'Date:' : 'Date:', value: dateStr },
    ];

    if (!isEstimation) {
        boxRows.push({ label: isFr ? 'Methode:' : 'Payment:', value: sale.paymentMethod || 'Cash' });
    }
    const rowH = 7;
    const boxY = 36;

    boxRows.forEach((row, i) => {
        const ry = boxY + i * rowH;
        doc.setFillColor(i % 2 === 0 ? 240 : 248, i % 2 === 0 ? 243 : 250, 255);
        doc.setDrawColor(200, 210, 230);
        doc.rect(boxX, ry, boxW, rowH, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(60, 60, 60);
        doc.text(row.label, boxX + 2, ry + 4.8);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30, 90, 180);
        doc.text(String(row.value), boxX + boxW - 2, ry + 4.8, { align: 'right' });
    });

    // ─── COMPANY HEADER (left side) ────────────────────────────────────────────
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(20, 20, 20);
    doc.text(company.name, margin, 38);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 80);
    doc.text(company.address, margin, 44);
    doc.text(`Tel: ${company.phone}`, margin, 49);
    doc.text(`Email: ${company.email}`, margin, 54);

    // ─── DIVIDER ──────────────────────────────────────────────────────────────
    let y = 62;
    doc.setDrawColor(180, 180, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    // ─── CLIENT SECTION ────────────────────────────────────────────────────────
    let labelW = 40;
    if (!isEstimation) {
        doc.setFillColor(30, 100, 180);
        doc.rect(margin, y, pageWidth - margin * 2, 7, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.text(isFr ? 'CLIENT' : 'CUSTOMER', margin + 3, y + 5);
        y += 10;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(60, 60, 60);
        doc.text(isFr ? 'Nom / Societe:' : 'Name / Company:', margin + 2, y + 4);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(20, 20, 20);
        doc.text(customerName, margin + labelW, y + 4);
        doc.setDrawColor(150, 150, 180);
        doc.line(margin + labelW - 1, y + 5, margin + labelW + 70, y + 5);
        y += 12;
    } else {
        // Just add a bit of spacing if there's no client section
        y += 5;
    }

    // ─── PRODUCTS TABLE ────────────────────────────────────────────────────────
    const tableHead = [[
        isFr ? 'DESIGNATION' : 'DESIGNATION',
        'QTE',
        isFr ? 'PRIX UNITAIRE (DH)' : 'UNIT PRICE (DH)',
        'TOTAL (DH)',
    ]];
    const tableBody = items.map(item => [
        item.name,
        String(item.qty),
        `${item.unitPrice.toFixed(2)} DH`,
        `${item.total.toFixed(2)} DH`,
    ]);

    // Remove empty rows to only show products bought
    // No padding needed anymore

    autoTable(doc, {
        startY: y,
        head: tableHead,
        body: tableBody,
        margin: { left: margin, right: margin },
        tableWidth: pageWidth - margin * 2,
        styles: {
            fontSize: 9,
            cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
            textColor: [30, 30, 30],
            lineColor: [210, 215, 230],
            lineWidth: 0.2,
        },
        headStyles: {
            fillColor: [35, 55, 80],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center',
            fontSize: 9,
        },
        columnStyles: {
            0: { halign: 'left', cellWidth: 80 },
            1: { halign: 'center', cellWidth: 15 },
            2: { halign: 'right', cellWidth: 50 },
            3: { halign: 'right', cellWidth: 35, textColor: [30, 90, 180] },
        },
        alternateRowStyles: { fillColor: [247, 249, 255] },
        bodyStyles: { minCellHeight: 8 },
    });

    y = doc.lastAutoTable.finalY + 2;

    // ─── TOTAL ROW ─────────────────────────────────────────────────────────────
    doc.setFillColor(235, 242, 255);
    doc.setDrawColor(180, 200, 230);
    doc.rect(margin, y, pageWidth - margin * 2, 10, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    doc.text('TOTAL', margin + 4, y + 7);
    doc.setTextColor(30, 90, 180);
    doc.text(`${parseFloat(sale.totalAmount || 0).toFixed(2)} DH`, pageWidth - margin - 4, y + 7, { align: 'right' });
    y += 14;

    // ─── SIGNATURE ─────────────────────────────────────────────────────────────
    if (!isEstimation) {
        const sigY = 240;

        doc.setFont('helvetica', 'bolditalic');
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        doc.text(isFr ? 'Signature / Cachet' : 'Signature / Stamp', margin, sigY);

        doc.setDrawColor(140, 140, 160);
        doc.setLineWidth(0.3);
        doc.rect(margin, sigY + 3, pageWidth - margin * 2, 25);
    }
    doc.autoPrint();
    doc.output('dataurlnewwindow');
};

export const printInvoice = (sale, language = 'en', invoiceData = {}) => {
    const { invoiceNumber = '', clientIce = '' } = invoiceData;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const company = getCompanyInfo();
    const pageWidth = 210;
    const margin = 15;

    const isFr = language === 'fr';
    const isAr = language === 'ar';
    const title = isFr ? 'FACTURE' : (isAr ? 'فاتورة' : 'INVOICE');

    // Number format config
    writtenNumber.defaults.lang = isFr ? 'fr' : 'en';

    // Parse date
    const saleDate = new Date();
    const dateStr = `${saleDate.getDate()}/${saleDate.getMonth() + 1}/${saleDate.getFullYear()}`;

    // Customer name - handle multiple possible structures
    const customerName =
        sale.customer?.name ||
        sale.customerName ||
        (sale.customerId ? `Client #${sale.customerId}` : (isFr ? 'Passage' : 'Walk-in'));

    // Items
    const items = (sale.saleItems || sale.items || []).map(item => ({
        name: item.productName || item.product?.name || item.name || 'Article',
        qty: item.quantity || 0,
        unitPrice: parseFloat(item.unitPrice || 0),
        total: parseFloat(item.subtotal || (item.unitPrice * item.quantity) || 0),
    }));

    // Math
    const totalTTC = parseFloat(sale.totalAmount || 0);
    // Assuming 20% TVA applied to the HT amount: TotalHT = TotalTTC / 1.2, TVA = TotalHT * 0.2
    const totalHT = totalTTC / 1.2;
    const tva = totalHT * 0.2;

    // ─── TITLE top-middle ──────────────────────────────────────────────────────
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(30, 100, 190);
    doc.text(title, pageWidth / 2, 22, { align: 'center' });

    // ─── RIGHT-SIDE INFO BOX ───────────────────────────────────────────────────
    const boxX = 130;
    const boxW = 65;
    const receiptLabel = isFr ? 'N Facture:' : 'Invoice No:';

    const boxRows = [
        { label: receiptLabel, value: invoiceNumber || sale.receiptNumber || 'N/A' },
        { label: isFr ? 'Date:' : 'Date:', value: dateStr },
    ];

    const rowH = 7;
    const boxY = 36;

    boxRows.forEach((row, i) => {
        const ry = boxY + i * rowH;
        doc.setFillColor(i % 2 === 0 ? 240 : 248, i % 2 === 0 ? 243 : 250, 255);
        doc.setDrawColor(200, 210, 230);
        doc.rect(boxX, ry, boxW, rowH, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(60, 60, 60);
        doc.text(row.label, boxX + 2, ry + 4.8);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30, 90, 180);
        doc.text(String(row.value), boxX + boxW - 2, ry + 4.8, { align: 'right' });
    });

    // ─── COMPANY HEADER (left side) ────────────────────────────────────────────
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(20, 20, 20);
    doc.text(company.name, margin, 38);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 80);
    doc.text(company.address, margin, 44);
    doc.text(`Tel: ${company.phone}`, margin, 49);
    doc.text(`Email: ${company.email}`, margin, 54);

    // Add Company ICE if found
    const companyIce = company.ice || company.ICE || 'XXXXXXXXXXXXXXX'; // Fallback if no ICE saved in Settings
    doc.setFont('helvetica', 'bold');
    doc.text(`ICE: ${companyIce}`, margin, 59);

    // ─── DIVIDER ──────────────────────────────────────────────────────────────
    let y = 66;
    doc.setDrawColor(180, 180, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    // ─── CLIENT SECTION ────────────────────────────────────────────────────────
    let labelW = 40;
    doc.setFillColor(30, 100, 180);
    doc.rect(margin, y, pageWidth - margin * 2, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(isFr ? 'CLIENT / DESTINATAIRE' : 'CUSTOMER / RECIPIENT', margin + 3, y + 5);
    y += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(60, 60, 60);
    doc.text(isFr ? 'Nom / Societe:' : 'Name / Company:', margin + 2, y + 4);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 20, 20);
    doc.text(customerName, margin + labelW, y + 4);
    doc.setDrawColor(150, 150, 180);
    doc.line(margin + labelW - 1, y + 5, margin + labelW + 70, y + 5);
    y += 10;

    if (clientIce) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        doc.text(isFr ? 'ICE Client:' : 'Client ICE:', margin + 2, y + 4);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(20, 20, 20);
        doc.text(clientIce, margin + labelW, y + 4);
        doc.setDrawColor(150, 150, 180);
        doc.line(margin + labelW - 1, y + 5, margin + labelW + 70, y + 5);
        y += 12;
    } else {
        y += 2;
    }

    // ─── PRODUCTS TABLE ────────────────────────────────────────────────────────
    const tableHead = [[
        isFr ? 'DESIGNATION' : 'DESIGNATION',
        'QTE',
        isFr ? 'PRIX UNITAIRE (DH)' : 'UNIT PRICE (DH)',
        'TOTAL HT (DH)',
    ]];
    const tableBody = items.map(item => [
        item.name,
        String(item.qty),
        `${(item.unitPrice / 1.2).toFixed(2)}`, // Assuming prices in DB are TTC 
        `${(item.total / 1.2).toFixed(2)}`,
    ]);

    autoTable(doc, {
        startY: y,
        head: tableHead,
        body: tableBody,
        margin: { left: margin, right: margin },
        tableWidth: pageWidth - margin * 2,
        styles: {
            fontSize: 9,
            cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
            textColor: [30, 30, 30],
            lineColor: [210, 215, 230],
            lineWidth: 0.2,
        },
        headStyles: {
            fillColor: [35, 55, 80],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center',
            fontSize: 9,
        },
        columnStyles: {
            0: { halign: 'left', cellWidth: 80 },
            1: { halign: 'center', cellWidth: 15 },
            2: { halign: 'right', cellWidth: 50 },
            3: { halign: 'right', cellWidth: 35, textColor: [30, 90, 180] },
        },
        alternateRowStyles: { fillColor: [247, 249, 255] },
        bodyStyles: { minCellHeight: 8 },
    });

    y = doc.lastAutoTable.finalY + 5;

    // ─── TOTALS BOX ─────────────────────────────────────────────────────────────
    const totalBoxW = 70;
    const totalBoxX = pageWidth - margin - totalBoxW;

    // Total HT
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(20, 20, 20);
    doc.text('Total HT', totalBoxX, y + 7);
    doc.text(`${totalHT.toFixed(2)} DH`, pageWidth - margin, y + 7, { align: 'right' });
    y += 8;

    // TVA (20%)
    doc.text('TVA (20%)', totalBoxX, y + 7);
    doc.text(`${tva.toFixed(2)} DH`, pageWidth - margin, y + 7, { align: 'right' });
    y += 8;

    // Total TTC
    doc.setFillColor(235, 242, 255);
    doc.setDrawColor(180, 200, 230);
    doc.rect(totalBoxX - 2, y, totalBoxW + 2, 10, 'FD');
    doc.setFontSize(12);
    doc.setTextColor(30, 90, 180);
    doc.text('TOTAL TTC', totalBoxX, y + 7);
    doc.text(`${totalTTC.toFixed(2)} DH`, pageWidth - margin, y + 7, { align: 'right' });
    y += 18;

    // ─── WRITTEN NUMBER SUM ───────────────────────────────────────────────────
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);

    // We get the integer part and fractional part correctly rounded
    const totalTTCRounded = Math.round(totalTTC * 100) / 100;
    const dirhams = Math.floor(totalTTCRounded);
    const centimes = Math.round((totalTTCRounded - dirhams) * 100);

    let amountInWords = isFr ? 'Arrêtée la présente facture à la somme de : ' : 'Invoice resolved at the sum of: ';
    amountInWords += writtenNumber(dirhams).toUpperCase() + ' DIRHAMS';
    if (centimes > 0) {
        amountInWords += ` ET ${writtenNumber(centimes).toUpperCase()} CENTIMES`;
    }

    const splitText = doc.splitTextToSize(amountInWords, pageWidth - margin * 2);
    doc.text(splitText, margin, y);
    y += (splitText.length * 5) + 5;

    // ─── PAYMENT TYPE ──────────────────────────────────────────────────────────
    doc.setFont('helvetica', 'bold');
    doc.text(isFr ? 'Mode de Paiement:' : 'Payment Method:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(sale.paymentMethod || 'Cash', margin + labelW, y);
    y += 15;


    // ─── SIGNATURE ─────────────────────────────────────────────────────────────
    const sigY = Math.max(y, 240); // Lock to bottom usually, unless very long receipt

    doc.setFont('helvetica', 'bolditalic');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.text(isFr ? 'Signature / Cachet' : 'Signature / Stamp', margin, sigY);

    doc.setDrawColor(140, 140, 160);
    doc.setLineWidth(0.3);
    doc.rect(margin, sigY + 3, pageWidth - margin * 2, 25);

    doc.autoPrint();
    doc.output('dataurlnewwindow');
};
