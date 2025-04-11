import axios from 'axios';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const orderData = req.body;

    // Extract the selected courier from the order data
    const { courier, ...orderDetails } = orderData;

    try {
      let response;

      // Check the selected courier and forward the order to the correct API
      if (courier === 'steadfast') {
        response = await sendToSteadfast(orderDetails);
      } else if (courier === 'redx') {
        response = await sendToRedx(orderDetails);
      } else {
        return res.status(400).json({ error: 'Invalid courier selected' });
      }

      // Send a success response with the result from the courier API
      return res.status(200).json(response.data);

    } catch (error) {
      console.error('Error submitting order:', error);
      return res.status(500).json({ error: 'Error submitting order to courier' });
    }
  } else {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
}

// Function to send the order data to Steadfast
const sendToSteadfast = async (orderDetails) => {
  const url = 'https://portal.packzy.com/api/v1/create_order';
  const headers = {
    'Content-Type': 'application/json',
    'Api-Key': process.env.STEADFAST_API_KEY,
    'Secret-Key': process.env.STEADFAST_SECRET_KEY,
  };

  const data = {
    invoice: orderDetails.invoice,
    recipient_name: orderDetails.recipient_name,
    recipient_phone: orderDetails.recipient_phone,
    recipient_address: orderDetails.recipient_address,
    cod_amount: orderDetails.cod_amount,
    note: orderDetails.note,
  };

  return await axios.post(url, data, { headers });
};

// Function to send the order data to Redx
const sendToRedx = async (orderDetails) => {
  const url = 'https://api.redx.com/order/create'; // Adjust URL based on Redx API documentation
  const headers = {
    'Content-Type': 'application/json',
    'Api-Key': process.env.REDX_API_KEY,
  };

  const data = {
    invoice: orderDetails.invoice,
    recipient_name: orderDetails.recipient_name,
    recipient_phone: orderDetails.recipient_phone,
    recipient_address: orderDetails.recipient_address,
    cod_amount: orderDetails.cod_amount,
    note: orderDetails.note,
  };

  return await axios.post(url, data, { headers });
};
