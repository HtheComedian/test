(function () {
  const keywords = ["Trump"];
  const matched = keywords.some((keyword) => pageText.includes(keyword));
  const pageText = document.body.innerText.toLowerCase();

  if (matched) {
    window.location.href = "www.Lateflix.com";
  }
})();
