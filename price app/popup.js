document.getElementById("check").addEventListener("click", async () => {
  const items = document
    .getElementById("items")
    .value.split("\n")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript(
    {
      target: { tabId: tab.id },
      func: checkPricesOnPage,
      args: [items],
    },
    (results) => {
      const output =
        results && results[0] && results[0].result ? results[0].result : [];
      const outElem = document.getElementById("output");
      outElem.textContent = output.length
        ? JSON.stringify(output, null, 2)
        : "No items over $20 found.";
    }
  );
});

function checkPricesOnPage(itemsToCheck) {
  const results = [];
  const listings = document.querySelectorAll(".s-item");

  listings.forEach((item) => {
    try {
      const titleElem = item.querySelector(".s-item__title");
      const priceElem = item.querySelector(".s-item__price");

      if (!titleElem || !priceElem) return;

      const title = titleElem.innerText.trim();
      const priceMatch = priceElem.innerText.match(/\$([\d,]+(\.\d{2})?)/);

      if (!priceMatch) return;

      const price = parseFloat(priceMatch[1].replace(/,/g, ""));

      for (const keyword of itemsToCheck) {
        if (title.toLowerCase().includes(keyword.toLowerCase()) && price > 20) {
          results.push({ title, price: `$${price.toFixed(2)}` });
          break;
        }
      }
    } catch (err) {
      // Ignore iframe or cross-origin access errors
    }
  });

  return results;
}
