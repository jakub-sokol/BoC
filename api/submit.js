// Serverless handler for the conference forms on /boca27 and /bocomp27.
//
// Every submission is appended as a row to the correct Google Sheet + tab and
// triggers an email notification. Routing is driven by two hidden fields the
// forms send:
//   conference : "boca27" | "bocomp27"          -> which spreadsheet
//   formType   : "registration" | "partner"     -> which tab + column order
//                | "suggestion" | "posted"
//
// Credentials live only in Vercel environment variables (never in the repo).

const { google } = require('googleapis');
const nodemailer = require('nodemailer');

// conference -> spreadsheet id
const SHEETS = {
  boca27: process.env.SHEET_ID_BOCA27,
  bocomp27: process.env.SHEET_ID_BOCOMP27,
};

// Human labels used in the notification subject line.
const CONFERENCE_LABELS = {
  boca27: 'Business of Class Actions 2027',
  bocomp27: 'Business of Competition 2027',
};

// formType -> { tab, label, columns }. `columns` is the fixed order written to
// the sheet; the first entry of each row is always the timestamp (added below).
const FORMS = {
  registration: {
    tab: 'Registrations',
    label: 'registration',
    columns: [
      ['Full name', 'fullName'],
      ['Email', 'email'],
      ['Phone', 'phone'],
      ['Organization', 'organization'],
      ['Job title', 'jobTitle'],
      ['Ticket type', 'ticketType'],
      ['Needs invoice', 'needInvoice'],
      ['Billing name', 'billingName'],
      ['Company ID', 'companyId'],
      ['VAT ID', 'vatId'],
      ['Billing address', 'billingAddress'],
      ['Consent', 'consent'],
      ['Participant list consent', 'participantList'],
    ],
  },
  partner: {
    tab: 'Partners',
    label: 'partnership enquiry',
    columns: [
      ['Contact name', 'contactName'],
      ['Email', 'email'],
      ['Company', 'company'],
      ['Tier', 'tier'],
      ['Message', 'message'],
      ['Consent', 'consent'],
    ],
  },
  suggestion: {
    tab: 'Suggestions',
    label: 'topic / speaker suggestion',
    columns: [
      ['Name', 'name'],
      ['Email', 'email'],
      ['Topic', 'topic'],
      ['Speaker', 'speaker'],
    ],
  },
  posted: {
    tab: 'Mailing list',
    label: 'mailing-list sign-up',
    columns: [
      ['Name', 'name'],
      ['Email', 'email'],
      ['LinkedIn', 'linkedin'],
    ],
  },
};

// Checkbox fields arrive as "on" when ticked and are absent otherwise.
function displayValue(field, raw) {
  if (field === 'needInvoice' || field === 'consent' || field === 'participantList') {
    return raw ? 'Yes' : 'No';
  }
  return raw == null ? '' : String(raw);
}

// Normalise the private key so it tolerates common paste mistakes in the Vercel
// env UI: surrounding single/double quotes, stray whitespace, and either literal
// "\n" sequences or real newlines.
function normalizePrivateKey(raw) {
  let key = (raw || '').trim();
  if ((key.startsWith('"') && key.endsWith('"')) ||
      (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }
  return key.replace(/\\n/g, '\n');
}

function getSheetsClient() {
  const auth = new google.auth.JWT({
    email: (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '').trim(),
    key: normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

// Append one row, writing a header row first if the tab is still empty.
async function appendRow(sheets, spreadsheetId, form, values) {
  const tab = form.tab;
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${tab}!A1:A1`,
  });
  const hasHeader = existing.data.values && existing.data.values.length > 0;

  if (!hasHeader) {
    const header = ['Timestamp'].concat(form.columns.map(function (c) { return c[0]; }));
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${tab}!A1`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [header] },
    });
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${tab}!A1`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [values] },
  });
}

// Strip surrounding quotes and all whitespace — Gmail app passwords are 16
// letters with no spaces, and the account UI displays them in spaced groups.
function normalizePassword(raw) {
  let pw = (raw || '').trim();
  if ((pw.startsWith('"') && pw.endsWith('"')) ||
      (pw.startsWith("'") && pw.endsWith("'"))) {
    pw = pw.slice(1, -1);
  }
  return pw.replace(/\s+/g, '');
}

async function sendEmail(conference, form, body) {
  const smtpUser = (process.env.SMTP_USER || '').trim();
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: smtpUser, pass: normalizePassword(process.env.SMTP_PASS) },
  });

  const lines = form.columns.map(function (c) {
    return c[0] + ': ' + displayValue(c[1], body[c[1]]);
  });

  const confLabel = CONFERENCE_LABELS[conference] || conference;
  const submitter = (body.email || '').trim();

  await transporter.sendMail({
    from: smtpUser,
    to: (process.env.NOTIFY_TO || smtpUser).trim(),
    replyTo: submitter || undefined,
    subject: `New ${form.label} — ${confLabel}`,
    text: `A new ${form.label} was submitted for ${confLabel}.\n\n` + lines.join('\n'),
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const body = req.body || {};

  // Honeypot: silently accept (but ignore) submissions from bots.
  if (body.botcheck) {
    return res.status(200).json({ ok: true });
  }

  const conference = body.conference;
  const formType = body.formType;
  const spreadsheetId = SHEETS[conference];
  const form = FORMS[formType];

  if (!form || !spreadsheetId) {
    return res.status(400).json({ ok: false, error: 'Unknown conference or form type' });
  }

  const timestamp = new Date().toISOString();
  const rowValues = [timestamp].concat(
    form.columns.map(function (c) { return displayValue(c[1], body[c[1]]); })
  );

  // Run the sheet append and the email independently so one failing still lets
  // the other through — but report a failure if either did not succeed.
  const results = await Promise.allSettled([
    appendRow(getSheetsClient(), spreadsheetId, form, rowValues),
    sendEmail(conference, form, body),
  ]);

  const failed = results.filter(function (r) { return r.status === 'rejected'; });
  if (failed.length) {
    var steps = ['sheet', 'email'];
    // Log the underlying reason server-side (visible in Vercel function logs)
    // without exposing details to the client.
    results.forEach(function (r, i) {
      if (r.status === 'rejected') console.error('submit error [' + steps[i] + ']:', r.reason);
    });
    return res.status(502).json({ ok: false, error: 'Delivery failed' });
  }

  return res.status(200).json({ ok: true });
};
