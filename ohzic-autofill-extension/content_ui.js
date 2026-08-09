window.addEventListener("message", (event) => {
  // Only accept messages from the same window
  if (event.source !== window) return;

  if (event.data && event.data.type === "OHZIC_SYNC") {
    console.log("[OhZic Extension] Received sync data from UI:", event.data.payload);
    
    // Save the payload to extension local storage
    chrome.storage.local.set({ ohzicSyncData: event.data.payload }, () => {
      console.log("[OhZic Extension] Data saved to chrome.storage.local");
    });
  }
});
