/* ==========================================================================
   StudyFlow — home page image gallery
   Cycles through the three study images (arrows, dots, keyboard).
   Author: Shuhan Chen (陈姝涵) · Assignment 3.1
   ========================================================================== */
"use strict";

(function () {
  var slides = Array.prototype.slice.call(document.querySelectorAll("#gallery .slide"));
  var dots = Array.prototype.slice.call(document.querySelectorAll("#gallery .dot"));
  var prevBtn = document.getElementById("prevSlide");
  var nextBtn = document.getElementById("nextSlide");
  var counter = document.getElementById("slideCounter");

  if (slides.length === 0) return;

  var current = 0;

  function show(index) {
    // Wrap around both directions so the buttons cycle endlessly
    current = (index + slides.length) % slides.length;

    slides.forEach(function (slide, i) {
      slide.classList.toggle("is-active", i === current);
    });
    dots.forEach(function (dot, i) {
      dot.classList.toggle("is-active", i === current);
    });
    counter.textContent = (current + 1) + " / " + slides.length;
  }

  prevBtn.addEventListener("click", function () { show(current - 1); });
  nextBtn.addEventListener("click", function () { show(current + 1); });
  dots.forEach(function (dot, i) {
    dot.addEventListener("click", function () { show(i); });
  });

  // Keyboard support when the gallery has focus
  document.getElementById("gallery").addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") show(current - 1);
    if (e.key === "ArrowRight") show(current + 1);
  });

  show(0);
})();
