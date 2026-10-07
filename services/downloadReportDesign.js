const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/* ---------------- Fonts (₹ symbol needs a TTF font) ----------------
   Put Roboto-Regular.ttf and Roboto-Bold.ttf in a "fonts" folder next to this file.
   If they are missing, the report falls back to Helvetica and prints "Rs." */
const FONT_DIR = path.join(__dirname, 'fonts');
const REG = path.join(FONT_DIR, 'Roboto-Regular.ttf');
const BOLD = path.join(FONT_DIR, 'Roboto-Bold.ttf');
const HAS_FONT = fs.existsSync(REG) && fs.existsSync(BOLD);
const F = HAS_FONT ? { r: 'ReportRegular', b: 'ReportBold' } : { r: 'Helvetica', b: 'Helvetica-Bold' };
const RS = HAS_FONT ? '₹ ' : 'Rs. ';

/* ---------------- Theme ---------------- */
const TEAL = '#1799A7';
const LIGHT = '#D6F0F0';
const GREY = '#EDEDED';
const WHITE = '#FFFFFF';
const BORDER = '#6B7280';
const GREEN = '#2E7D32';
const RED = '#E53935';
const BLUE = '#1565C0';
const PURPLE = '#4B3B9A';

const LEFT = 30;
const WIDTH = 535; // A4 (595) - 2 * 30
const W_DAY = [70, 140, 140, 90, 95];
const W_YEAR = [133, 134, 134, 134];
const W_NOTE = [150, 385];

/* ---------------- Helpers ---------------- */
const pad2 = (n) => String(n).padStart(2, '0');
const fmtDate = (d) => `${pad2(d.getDate())}-${pad2(d.getMonth() + 1)}-${d.getFullYear()}`;
const fmt = (n) =>
    Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const monthName = (y, m) => new Date(y, m, 1).toLocaleString('en-US', { month: 'long' });

const centerText = (doc, text, size, color = '#111111') => {
    doc.font(F.b).fontSize(size).fillColor(color)
        .text(text, LEFT, doc.y, { width: WIDTH, align: 'center' });
    doc.moveDown(0.6);
};

// Draws one table row. Cells: { t, align, color, bold, fill, span }
const drawRow = (doc, widths, cells, opts = {}) => {
    const { fill = WHITE, onNewPage, minH = 18 } = opts;

    let col = 0;
    const resolved = cells.map((c) => {
        const span = c.span || 1;
        const w = widths.slice(col, col + span).reduce((a, b) => a + b, 0);
        const x = LEFT + widths.slice(0, col).reduce((a, b) => a + b, 0);
        col += span;
        return { ...c, w, x };
    });

    let h = minH;
    resolved.forEach((c) => {
        doc.font(c.bold ? F.b : F.r).fontSize(8);
        h = Math.max(h, doc.heightOfString(String(c.t ?? ''), { width: c.w - 10 }) + 8);
    });

    if (doc.y + h > doc.page.height - 45) {
        doc.addPage();
        if (onNewPage) onNewPage();
    }

    const y = doc.y;
    resolved.forEach((c) => {
        doc.lineWidth(0.5).rect(c.x, y, c.w, h).fillAndStroke(c.fill || fill, BORDER);
        doc.fillColor(c.color || '#222222').font(c.bold ? F.b : F.r).fontSize(8)
            .text(String(c.t ?? ''), c.x + 5, y + 5, { width: c.w - 10, align: c.align || 'left' });
    });
    doc.y = y + h;
};

const headerRow = (doc, widths, labels) =>
    drawRow(doc, widths, labels.map((t) => ({ t, bold: true, color: WHITE, align: 'center', fill: TEAL })));

/* ---------------- Month table ---------------- */
const monthSection = (doc, year, monthIdx, items) => {
    if (doc.y > doc.page.height - 140) doc.addPage();

    centerText(doc, `${monthName(year, monthIdx)} ${year}`, 10);

    const labels = ['Date', 'Description', 'Category', 'Income', 'Expense'];
    const hdr = () => headerRow(doc, W_DAY, labels);
    hdr();

    // group by day
    const days = new Map();
    items.forEach((i) => {
        const k = fmtDate(i.date);
        if (!days.has(k)) days.set(k, []);
        days.get(k).push(i);
    });

    let idx = 0;
    let mInc = 0;
    let mExp = 0;

    for (const [dayKey, list] of days) {
        let dInc = 0;
        let dExp = 0;

        list.forEach((i) => {
            const isInc = i.type === 'income';
            if (isInc) dInc += i.amount; else dExp += i.amount;
            drawRow(doc, W_DAY, [
                { t: dayKey },
                { t: i.desc },
                { t: i.cat },
                { t: isInc ? fmt(i.amount) : '', align: 'right' },
                { t: !isInc ? fmt(i.amount) : '', align: 'right' }
            ], { fill: idx++ % 2 === 0 ? GREY : WHITE, onNewPage: hdr });
        });

        // day subtotal
        drawRow(doc, W_DAY, [
            { t: '' }, { t: '' }, { t: '' },
            { t: fmt(dInc), align: 'right', bold: true },
            { t: fmt(dExp), align: 'right', bold: true }
        ], { fill: LIGHT, onNewPage: hdr });

        mInc += dInc;
        mExp += dExp;
    }

    // month total
    drawRow(doc, W_DAY, [
        { t: '' }, { t: '' }, { t: '' },
        { t: `${RS}${fmt(mInc)}`, align: 'right', bold: true, color: GREEN },
        { t: `${RS}${fmt(mExp)}`, align: 'right', bold: true, color: RED }
    ], { fill: LIGHT, onNewPage: hdr });

    // savings
    drawRow(doc, W_DAY, [
        { t: '', span: 3 },
        { t: `Savings = ${RS}${fmt(mInc - mExp)}`, span: 2, align: 'right', bold: true, color: BLUE }
    ], { fill: LIGHT, onNewPage: hdr });

    doc.moveDown(1.5);
    return { inc: mInc, exp: mExp };
};

/* ---------------- Controller ---------------- */
const downloadReport = async (req, res, User, Expense) => {
    try {
        const user = await User.findOne({ where: { id: req.userId } });

        if (!user || !user.isPremium) {
            return res.status(403).json({ message: 'Premium feature only' });
        }

        const query = { where: { UserId: req.userId }, order: [['createdAt', 'ASC']] };
        const expenses = await Expense.findAll(query);

        const entries = expenses.map((e) => ({
            type: 'expense',
            date: new Date(e.createdAt),
            amount: parseFloat(e.amount) || 0,
            desc: e.description || '',
            cat: e.category || ''
        })).sort((a, b) => a.date - b.date);

        const years = new Map();
        entries.forEach((e) => {
            const y = e.date.getFullYear();
            const m = e.date.getMonth();
            if (!years.has(y)) years.set(y, new Map());
            if (!years.get(y).has(m)) years.get(y).set(m, []);
            years.get(y).get(m).push(e);
        });
        const sortedYears = [...years.keys()].sort((a, b) => a - b);

        const doc = new PDFDocument({ size: 'A4', margin: 30 });
        if (HAS_FONT) {
            doc.registerFont('ReportRegular', REG);
            doc.registerFont('ReportBold', BOLD);
        }

        const fileName = `expense-report-${user.name}-${Date.now()}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        doc.pipe(res);

        const now = new Date();
        const stamp = now.toLocaleString('en-GB', {
            day: 'numeric', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true
        }).replace(' at ', ', ').toUpperCase();
        doc.font(F.b).fontSize(7).fillColor(PURPLE).text(stamp, LEFT, 30, { lineBreak: false });

        doc.y = 42;
        centerText(doc, 'Day to Day Expenses', 16, TEAL);
        doc.moveDown(0.8);

        if (sortedYears.length === 0) {
            doc.font(F.r).fontSize(11).fillColor('#444444')
                .text('No records found.', LEFT, doc.y, { width: WIDTH, align: 'center' });
        }

        sortedYears.forEach((year, yi) => {
            if (yi > 0) doc.addPage();

            centerText(doc, String(year), 13);
            doc.moveDown(0.4);

            const months = years.get(year);
            const monthIdxs = [...months.keys()].sort((a, b) => a - b);
            const yearly = [];

            monthIdxs.forEach((m) => {
                const t = monthSection(doc, year, m, months.get(m));
                yearly.push({ m, ...t });
            });

            if (yearly.length) {
                if (doc.y > doc.page.height - 150) doc.addPage();
                doc.moveDown(0.5);
                centerText(doc, `Yearly Report ${year}`, 9);
                const yh = () => headerRow(doc, W_YEAR, ['Month', 'Income', 'Expense', 'Savings']);
                yh();

                let tInc = 0;
                let tExp = 0;
                yearly.forEach((r, i) => {
                    tInc += r.inc;
                    tExp += r.exp;
                    drawRow(doc, W_YEAR, [
                        { t: monthName(year, r.m) },
                        { t: fmt(r.inc), align: 'right' },
                        { t: fmt(r.exp), align: 'right' },
                        { t: fmt(r.inc - r.exp), align: 'right' }
                    ], { fill: i % 2 === 0 ? GREY : WHITE, onNewPage: yh });
                });

                drawRow(doc, W_YEAR, [
                    { t: '' },
                    { t: `${RS}${fmt(tInc)}`, align: 'right', bold: true, color: GREEN },
                    { t: `${RS}${fmt(tExp)}`, align: 'right', bold: true, color: RED },
                    { t: `${RS}${fmt(tInc - tExp)}`, align: 'right', bold: true, color: BLUE }
                ], { fill: LIGHT, onNewPage: yh });
                doc.moveDown(1.5);
            }
        });

        doc.end();
    } catch (error) {
        console.error('Error generating PDF:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Error generating report' });
        }
    }
};

module.exports = { downloadReport };