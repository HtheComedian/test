const images = document.querySelectorAll(".zoomable");

images.forEach((img) => {
  img.addEventListener("mouseover", () => {
    img.classList.add("zoomed");
  });
  img.addEventListener("mouseout", () => {
    img.classList.remove("zoomed");
  });
});
