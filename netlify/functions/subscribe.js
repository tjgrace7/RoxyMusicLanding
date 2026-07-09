// Netlify Function: proxies signups to Mailchimp so the API key never reaches the browser.
// Requires env vars (set in Netlify dashboard, never committed): MAILCHIMP_API_KEY, MAILCHIMP_AUDIENCE_ID

const crypto = require('crypto');

// Color level shown on the site -> exact GTRLEVEL dropdown choice text in Mailchimp.
// These strings must match the Mailchimp merge field choices exactly (case/punctuation included).
const LEVEL_TO_GTRLEVEL = {
  Gold: "I've Never Played Guitar",
  Green: "I Know Some Chords, But Can't Play Songs",
  Purple: "I Can't Play Barre Chords",
  Blue: "I Wanna Play Lead Guitar",
  Orange: "I'm Tired of Pentatonic Scales",
  Red: 'I Want to Play in More Keys',
  Brown: 'I want to learn about Sweep Picking',
  Black: "I'm Ready to Learn About Modes"
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const apiKey = process.env.MAILCHIMP_API_KEY;
  const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;

  if (!apiKey || !audienceId) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server is not configured yet.' }) };
  }

  const dataCenter = apiKey.split('-')[1];
  if (!dataCenter) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Mailchimp API key is malformed.' }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body.' }) };
  }

  const { firstName, lastName, email, phone, level } = payload;

  if (!firstName || !lastName || !email || !phone || !level) {
    return { statusCode: 400, body: JSON.stringify({ error: 'All fields are required.' }) };
  }
  const gtrLevel = LEVEL_TO_GTRLEVEL[level];
  if (!gtrLevel) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid guitar level.' }) };
  }

  // PUT to a subscriber-hash URL upserts: creates the contact if new, or updates their
  // fields (name/phone/level) in place if they've already signed up before. Using "status"
  // (not "status_if_new") also force-resubscribes anyone who had previously unsubscribed.
  const subscriberHash = crypto.createHash('md5').update(email.toLowerCase()).digest('hex');

  const mailchimpRes = await fetch(
    `https://${dataCenter}.api.mailchimp.com/3.0/lists/${audienceId}/members/${subscriberHash}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `apikey ${apiKey}`
      },
      body: JSON.stringify({
        email_address: email,
        status: 'subscribed',
        merge_fields: {
          FNAME: firstName,
          LNAME: lastName,
          PHONE: phone,
          GTRLEVEL: gtrLevel
        }
      })
    }
  );

  const mailchimpData = await mailchimpRes.json();

  if (!mailchimpRes.ok) {
    return {
      statusCode: mailchimpRes.status,
      body: JSON.stringify({ error: mailchimpData.detail || 'Mailchimp rejected the signup.' })
    };
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
