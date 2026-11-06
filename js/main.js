/* ==========================================================================
   StudyFlow — shared site behaviour
   Loads on every page: mobile navigation, live clock, footer year, toast.
   Author: Shuhan Chen · Assignment 3.1
   ========================================================================== */
"use strict";

/* ---------- Mobile navigation ---------- */
(function initNav() {
  var nav = document.getElementById("primaryNav");
  var toggle = document.getElementById("navToggle");
  if (!nav || !toggle) return;

  toggle.addEventListener("click", function () {
    var open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });

  // Close the menu after choosing a link (mobile)
  nav.addEventListener("click", function (e) {
    if (e.target.tagName === "A") {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
})();

/* ---------- Current date & time (bottom bar) ---------- */
(function initClock() {
  var clock = document.getElementById("clock");
  if (!clock) return;

  function pad(n) { return String(n).padStart(2, "0"); }

  function tick() {
    var now = new Date();
    var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var text = days[now.getDay()] + ", " + now.getDate() + "/" + pad(now.getMonth() + 1) + "/" +
      now.getFullYear() + " — " + pad(now.getHours()) + ":" + pad(now.getMinutes()) + ":" + pad(now.getSeconds());
    clock.textContent = text;
  }

  tick();
  setInterval(tick, 1000);
})();

/* ---------- Footer year ---------- */
(function initYear() {
  var el = document.getElementById("year");
  if (el) el.textContent = String(new Date().getFullYear());
})();

/* ---------- Toast helper ---------- */
var StudyFlow = window.StudyFlow || {};

StudyFlow.toast = function (message, duration) {
  var toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toast._timer);
  toast._timer = window.setTimeout(function () {
    toast.classList.remove("is-visible");
  }, duration || 2600);
};

window.StudyFlow = StudyFlow;
