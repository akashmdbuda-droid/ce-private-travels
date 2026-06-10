const url = "https://udkiaurvvypmnuolnpce.supabase.co/functions/v1/telegram-alert";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVka2lhdXJ2dnlwbW51b2xucGNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1OTYxMzYsImV4cCI6MjA5NjE3MjEzNn0.My_qC5Ada2mVeDkb4VbQVw2MfTmHKFs6YAmy7ll51pA";

async function test() {
  const payload = {
    type: "INSERT",
    table: "leads",
    record: {
      customer_name: "Test User",
      pickup_location: "Vienna",
      destination_location: "Budapest",
      pax_count: 2,
      travel_datetime: new Date().toISOString(),
      lead_source: "Test Script",
      whatsapp_number: "+43 660 123 4567"
    }
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`
      },
      body: JSON.stringify(payload)
    });
    
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
