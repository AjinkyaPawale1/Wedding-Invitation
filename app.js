const invite = document.querySelector("#invite");
const openButton = document.querySelector("#openInvite");
const soundToggle = document.querySelector("#soundToggle");
const langButtons = document.querySelectorAll("[data-set-lang]");
const countdown = document.querySelector("#countdown");
const scratchCard = document.querySelector("#scratchCard");
const scratchButton = document.querySelector("#scratchButton");
const scratchCanvas = document.querySelector("#scratchCanvas");
const venueMap = document.querySelector("#venueMap");
const mapPinButton = document.querySelector("#mapPinButton");
const shareInvite = document.querySelector("#shareInvite");

let audioContext;
let soundEnabled = true;

function playCeremonialTone() {
  if (!soundEnabled) return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;

  audioContext ||= new AudioCtx();
  const now = audioContext.currentTime;
  const notes = [261.63, 329.63, 392, 523.25, 659.25];

  notes.forEach((frequency, index) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = index % 2 ? "triangle" : "sine";
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0, now + index * 0.07);
    gain.gain.linearRampToValueAtTime(0.07, now + index * 0.07 + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.07 + 0.72);
    osc.connect(gain).connect(audioContext.destination);
    osc.start(now + index * 0.07);
    osc.stop(now + index * 0.07 + 0.75);
  });
}

openButton.addEventListener("click", () => {
  invite.classList.add("invite-open");
  playCeremonialTone();
  setTimeout(() => document.querySelector(".hero")?.scrollIntoView({ behavior: "smooth" }), 250);
});

soundToggle.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundToggle.classList.toggle("is-muted", !soundEnabled);
  soundToggle.setAttribute("aria-pressed", String(!soundEnabled));
  if (soundEnabled) playCeremonialTone();
});

langButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const lang = button.dataset.setLang;
    invite.dataset.lang = lang;
    langButtons.forEach((item) => item.classList.toggle("active", item === button));
    document.documentElement.lang = lang === "mr" ? "mr" : "en";
  });
});

function setupScratchCard() {
  if (!scratchCanvas || !scratchCard) return;

  const ctx = scratchCanvas.getContext("2d", { willReadFrequently: true });
  let isScratching = false;

  function paintGoldLayer() {
    const { width, height } = scratchCanvas;
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#9d6720");
    gradient.addColorStop(0.22, "#ffd98b");
    gradient.addColorStop(0.5, "#c4862f");
    gradient.addColorStop(0.72, "#fff0b8");
    gradient.addColorStop(1, "#8b581e");

    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(255, 255, 255, 0.14)";
    for (let x = -height; x < width; x += 34) {
      ctx.beginPath();
      ctx.moveTo(x, height);
      ctx.lineTo(x + height, 0);
      ctx.lineTo(x + height + 12, 0);
      ctx.lineTo(x + 12, height);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = "rgba(34, 11, 18, 0.72)";
    ctx.textAlign = "center";
    ctx.font = "700 30px Avenir Next, system-ui, sans-serif";
    ctx.fillText("SCRATCH TO REVEAL", width / 2, height / 2 - 12);
    ctx.font = "600 22px Avenir Next, system-ui, sans-serif";
    ctx.fillText("the wedding dates", width / 2, height / 2 + 28);
  }

  function scratchAt(event) {
    const rect = scratchCanvas.getBoundingClientRect();
    const scaleX = scratchCanvas.width / rect.width;
    const scaleY = scratchCanvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 42, 0, Math.PI * 2);
    ctx.fill();
  }

  function revealIfEnoughScratched() {
    const pixels = ctx.getImageData(0, 0, scratchCanvas.width, scratchCanvas.height).data;
    let transparent = 0;
    for (let i = 3; i < pixels.length; i += 16) {
      if (pixels[i] < 40) transparent += 1;
    }
    if (transparent / (pixels.length / 16) > 0.38) {
      scratchCard.classList.add("is-revealed");
      playCeremonialTone();
    }
  }

  paintGoldLayer();

  scratchCanvas.addEventListener("pointerdown", (event) => {
    isScratching = true;
    scratchCanvas.setPointerCapture(event.pointerId);
    scratchAt(event);
  });

  scratchCanvas.addEventListener("pointermove", (event) => {
    if (!isScratching || scratchCard.classList.contains("is-revealed")) return;
    scratchAt(event);
  });

  scratchCanvas.addEventListener("pointerup", () => {
    isScratching = false;
    revealIfEnoughScratched();
  });

  scratchCanvas.addEventListener("pointercancel", () => {
    isScratching = false;
  });

  scratchButton?.addEventListener("click", () => {
    scratchCard.classList.add("is-revealed");
    playCeremonialTone();
  });
}

mapPinButton.addEventListener("click", () => {
  venueMap.classList.toggle("is-open");
});

shareInvite.addEventListener("click", async () => {
  const isJune19Only = window.location.pathname.includes("june19");
  const shareData = {
    title: isJune19Only ? "Ajinkya & Surbhi Wedding Invitation - 19 June" : "Ajinkya & Surbhi Wedding Invitation",
    text: isJune19Only
      ? "Join us for Ajinkya and Surbhi's wedding ceremony, lunch and reception on 19 June 2026."
      : "Join us for Ajinkya and Surbhi's wedding celebrations on 18 and 19 June 2026.",
    url: window.location.href,
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return;
    } catch {
      return;
    }
  }

  await navigator.clipboard?.writeText(window.location.href);
  shareInvite.classList.add("copied");
  setTimeout(() => shareInvite.classList.remove("copied"), 1600);
});

function updateCountdown() {
  const target = new Date("2026-06-19T12:40:00+05:30").getTime();
  const remaining = Math.max(0, target - Date.now());
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const values = [days, hours, minutes];

  countdown.querySelectorAll("strong").forEach((node, index) => {
    node.textContent = String(values[index]).padStart(2, "0");
  });
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("is-visible");
    });
  },
  { threshold: 0.18 }
);

document.querySelectorAll(".reveal").forEach((section) => observer.observe(section));
setupScratchCard();
updateCountdown();
setInterval(updateCountdown, 60000);
