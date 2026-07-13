const KEY = process.env.WEB3FORMS_ACCESS_KEY || '6032078b-2e8d-4cd9-ac75-cb876205b848'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: cors, body: 'Method Not Allowed' }
  }

  let payload = {}
  try {
    payload = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ ok: false, error: 'Invalid JSON' }) }
  }

  const message = [
    'She said YES.',
    '',
    `Day: ${payload.dateDay || '—'}`,
    `Time: ${payload.dateTime || '—'}`,
    `Activity: ${payload.activity || '—'}`,
    `Notes for the gentleman: ${payload.notes?.trim() || '(none)'}`,
  ].join('\n')

  try {
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        access_key: KEY,
        subject: `Date confirmed: ${payload.activity} on ${payload.dateDay} at ${payload.dateTime}`,
        from_name: 'AskMeOut',
        name: 'AskMeOut',
        message,
      }),
    })

    const text = await response.text()
    let data = {}
    try {
      data = JSON.parse(text)
    } catch {
      data = { raw: text.slice(0, 300) }
    }

    return {
      statusCode: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ok: response.ok && data.success !== false,
        status: response.status,
        data,
      }),
    }
  } catch (error) {
    return {
      statusCode: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: error.message }),
    }
  }
}
