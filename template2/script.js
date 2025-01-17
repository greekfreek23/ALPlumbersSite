(function() {
  // 1. Grab the ?site= parameter from the URL
  const urlParams = new URLSearchParams(window.location.search);
  const siteParam = urlParams.get('site');
  if (!siteParam) {
    console.warn("No ?site= parameter provided. Falling back to placeholders.");
    return;
  }

  // 2. Check if businessData.js is loaded
  if (!window.businessData) {
    console.error("No businessData found! Ensure businessData.js is loaded.");
    return;
  }

  // 3. Get the data for the requested site
  const data = window.businessData[siteParam];
  if (!data) {
    console.warn(`No data found for site key: ${siteParam}. Using placeholders.`);
    return;
  }

  // 4. Replace placeholders in the document
  for (const key in data) {
    const value = data[key];
    if (typeof value === "string") {
      document.body.innerHTML = document.body.innerHTML.replace(
        new RegExp(`\\{${key}\\}`, "g"),
        value
      );
    }
  }

  // 5. Update the document title
  if (data.title) {
    document.title = data.title;
  }
})();
