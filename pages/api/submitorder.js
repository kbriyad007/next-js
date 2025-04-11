import axios from "axios";
import { getDocs, collection, doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase"; // Make sure this is your Firebase client

const sendToSteadfast = async (order) => {
  const res = await axios.post("https://portal.packzy.com/api/v1/create_order", {
    invoice: order.invoice,
    recipient_name: order.recipient_name,
    recipient_phone: order.recipient_phone,
    recipient_address: order.recipient_address,
    cod_amount: order.cod_amount,
    note: order.note,
  }, {
    headers: {
      "Api-Key": "your-steadfast-api-key",
      "Secret-Key": "your-steadfast-secret-key",
      "Content-Type": "application/json"
    }
  });

  return res.data;
};

const sendToRedx = async (order) => {
  const res = await axios.post("https://api.redx.com/order/create", {
    invoice: order.invoice,
    recipient_name: order.recipient_name,
    recipient_phone: order.recipient_phone,
    recipient_address: order.recipient_address,
    cod_amount: order.cod_amount,
    note: order.note,
  }, {
    headers: {
      "Api-Key": "your-redx-api-key",
      "Content-Type": "application/json"
    }
  });

  return res.data;
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const snapshot = await getDocs(collection(db, "orders"));

    for (const docSnap of snapshot.docs) {
      const order = docSnap.data();

      // Skip if already sent
      if (order.sent) continue;

      try {
        if (order.courier === "steadfast") {
          await sendToSteadfast(order);
        } else if (order.courier === "redx") {
          await sendToRedx(order);
        }

        // Mark as sent
        await updateDoc(doc(db, "orders", docSnap.id), {
          sent: true,
        });

        console.log("Sent order:", order.invoice);
      } catch (err) {
        console.error("Error sending order:", err.message);
      }
    }

    return res.status(200).json({ message: "All orders processed" });
  } catch (error) {
    console.error("Failed to process orders:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}
