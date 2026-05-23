const testWebhook = async () => {
  // Swap this with your actual Vercel domain
  const url = "https://YOUR-VERCEL-URL.vercel.app/v2/callbacks/ota";
  
  const payload = {
    event: "OTA_UPDATE_SUCCESS",
    nodeId: "NODE-X-774-MESH",
    status: "ONLINE",
    firmwareVersion: "v2.5.2-stable",
    message: "Cloud Mesh sync completed successfully without errors."
  };

  try {
    console.log("Sending payload to webhook...");
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    console.log("✅ Webhook Response:", result);
  } catch (error) {
    console.error("❌ Error triggering webhook:", error);
  }
};

testWebhook();