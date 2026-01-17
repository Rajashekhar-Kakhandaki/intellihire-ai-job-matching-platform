document.addEventListener("DOMContentLoaded", () => {
  const popups = document.querySelectorAll(".flash-popup");

  popups.forEach((popup) => {
    const closeBtn = popup.querySelector(".close-btn");

    // Auto-close after 4s
    const autoClose = setTimeout(() => {
      slideOutPopup(popup);
    }, 4000);

    // Manual close
    closeBtn.addEventListener("click", () => {
      clearTimeout(autoClose);
      slideOutPopup(popup);
    });

    function slideOutPopup(popupEl) {
      popupEl.style.animation = "slideOut 0.5s ease forwards";
      popupEl.addEventListener("animationend", () => {
        popupEl.remove();
      });
    }
  });
});
