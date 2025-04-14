'use client';
import React from 'react';

export default function WhatsAppMessage() {
  const phoneNumber = '8801701797016';

  const message = `
Hello Riyad Bin Kibria,

Here is your order summary:

📄 Invoice ID: EMdsStJ3aZ6d6mts4M7y  
🚚 Courier: steadfast  
🔢 Quantity: 2  
🔗 Product Links:  
1. https://www.youtube.com/shorts/7CH_dO_bSfs  
📅 Order Date: 4/14/2025  

Thank you for your order! 🙏
  `;

  const encodedMessage = encodeURIComponent(message.trim());
  const whatsappLink = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100 text-center">
      <h2 className="text-xl font-semibold mb-4">
        Chat on WhatsApp with +{phoneNumber}
      </h2>

      <a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-green-600 text-white px-6 py-3 rounded-lg shadow hover:bg-green-700 transition"
      >
        Continue to Chat
      </a>

      <p className="mt-6 text-sm text-gray-600">
        Don&apos;t have WhatsApp yet?
        <br />
        <a
          href="https://www.whatsapp.com/download/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 underline"
        >
          Download
        </a>
      </p>
    </div>
  );
}
