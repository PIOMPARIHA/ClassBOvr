const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const ExcelJS = require('exceljs');
const { Connection, Statement } = require('idb-pconnector');

const app = express();
const PORT = 3108;

/* ================= Middleware ================= */

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/* ================= UI ================= */

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

/* ================= Helper ================= */

/* Send error message back to iframe */
function sendIFrameError(res, message) {
  res.status(200).send(`
    <html>
      <body>
        <script>
          window.parent.postMessage({
            type: 'DOWNLOAD_ERROR',
            message: ${JSON.stringify(message)}
          }, '*');
        </script>
      </body>
    </html>
  `);
}

/* ================= Route ================= */

app.post('/ClassB', async (req, res) => {
  let connection;
  let stmt;

  try {
    const customer = (req.body.code || '').trim();
    const rawAmount = (req.body.amount || '').trim();

    let decimalAmount = null;

    /* ✅ Validate override % ONLY if user entered value */
    if (rawAmount !== '') {
      const percent = Number(rawAmount);

      if (
        isNaN(percent) ||
        percent <= 0 ||
        percent > 100
      ) {
        return sendIFrameError(
          res,
          'Invalid Class B Override %. Example: 10.00 = 10%'
        );
      }

      /* ✅ Convert percent → decimal for DB2 */
      decimalAmount = percent / 100;
    }

    const rows = await runAs400Query({
      amount: decimalAmount,
      customer
    });

    if (!rows || rows.length === 0) {
      return sendIFrameError(res, 'No data found for the given input.');
    }

    /* ================= Excel ================= */

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('ClassB_Report');

    sheet.columns = Object.keys(rows[0]).map(col => ({
      header: col,
      key: col,
      width: 18
    }));

    rows.forEach(row => sheet.addRow(row));

    res.setHeader(
      'Content-Disposition',
      'attachment; filename=ClassB_Report.xlsx'
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error('❌ Error generating report:', err);
    return sendIFrameError(res, 'Unexpected error while generating report.');
  }
});

/* ================= Server ================= */

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

/* ================= DB2 Logic ================= */

async function runAs400Query({ amount, customer }) {
  const connection = new Connection({ url: '*LOCAL', naming: 'system' });
  const stmt = new Statement(connection);

  try {
    let sql = `
      SELECT
        SUBSTR(T02.FFDCUSN, 6, 5) AS CUST,
        T02.FFDCNMB,
        T01.WNCBVP,
        T02.FFDARCD
      FROM PWRDTA.WNCBOXP AS T01
      JOIN PWRDTA.FFDCSTBP AS T02
        ON T01.WNCUSN = T02.FFDCUSN
      WHERE 1 = 1
    `;

    const params = [];

    /* ✅ Optional customer filter */
    if (customer) {
      sql += ` AND SUBSTR(T02.FFDCUSN, 6, 5) = ?`;
      params.push(customer);
    }

    /* ✅ Optional override % filter */
    if (amount !== null) {
      sql += ` AND T01.WNCBVP = ?`;
      params.push(amount);
    }

    sql += ` ORDER BY CUST`;

    await stmt.prepare(sql);

    if (params.length) {
      await stmt.bindParameters(params);
    }

    await stmt.execute();
    return await stmt.fetchAll();

  } finally {
    try { stmt.close(); } catch {}
    try { connection.close(); } catch {}
  }
}
