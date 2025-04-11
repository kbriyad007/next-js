// pages/api/submitorder.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { invoice, recipient_name, recipient_phone, recipient_address, cod_amount, note } = req.body;

  try {
    const response = await fetch('https://portal.packzy.com/api/v1/create_order', {
      method: 'POST',
      headers: {
        'Api-Key': process.env.STEADFAST_API_KEY,
        'Secret-Key': process.env.STEADFAST_SECRET_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        invoice,
        recipient_name,
        recipient_phone,
        recipient_address,
        cod_amount,
        note,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ message: 'Failed to place order', data });
    }

    return res.status(200).json({ message: 'Order submitted successfully', data });
  } catch (error) {
    return res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
}

