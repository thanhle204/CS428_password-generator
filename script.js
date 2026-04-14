const generatedValueEl = document.getElementById("generatedValue");
const copyBtn = document.getElementById("copyBtn");
const saveBtn = document.getElementById("saveBtn");
const regenerateBtn = document.getElementById("regenerateBtn");
const copyStatusEl = document.getElementById("copyStatus");
const saveFormEl = document.getElementById("saveForm");
const saveWebsiteEl = document.getElementById("saveWebsite");
const saveUsernameEl = document.getElementById("saveUsername");
const savePasswordEl = document.getElementById("savePassword");
const cancelSaveBtn = document.getElementById("cancelSaveBtn");

const modeEls = document.querySelectorAll("input[name='mode']");
const lengthRangeEl = document.getElementById("lengthRange");
const lengthValueEl = document.getElementById("lengthValue");
const lengthLabelEl = document.getElementById("lengthLabel");
const lengthHintEl = document.getElementById("lengthHint");

const passwordOptionsEl = document.getElementById("passwordOptions");
const passphraseOptionsEl = document.getElementById("passphraseOptions");

const includeUppercaseEl = document.getElementById("includeUppercase");
const includeLowercaseEl = document.getElementById("includeLowercase");
const includeNumbersEl = document.getElementById("includeNumbers");
const includeSpecialEl = document.getElementById("includeSpecial");
const avoidAmbiguousEl = document.getElementById("avoidAmbiguous");

const capitalizeWordsEl = document.getElementById("capitalizeWords");
const appendNumberEl = document.getElementById("appendNumber");
const separatorSelectEl = document.getElementById("separatorSelect");

const strengthLabelEl = document.getElementById("strengthLabel");
const strengthHintEl = document.getElementById("strengthHint");
const entropyBitsEl = document.getElementById("entropyBits");
const meterEl = document.querySelector(".meter");
const meterFillEl = document.getElementById("meterFill");

const CHARSET = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  special: "!@#$%^&*"
};

const AMBIGUOUS_CHARS = new Set(["l", "I", "O", "0", "1", "|"]);

const WORD_LIST = [
  "anchor", "april", "artist", "atlas", "autumn", "bamboo", "beacon", "beach", "berry", "bison",
  "blossom", "bridge", "cactus", "cannon", "cedar", "cherry", "cinder", "cobalt", "comet", "coral",
  "cosmos", "crystal", "cypress", "daisy", "delta", "desert", "dragon", "dune", "ember", "falcon",
  "fable", "fern", "fjord", "forest", "fossil", "galaxy", "garden", "glacier", "granite", "harbor",
  "hazel", "helium", "horizon", "indigo", "island", "jasmine", "jungle", "keystone", "lagoon", "lantern",
  "lilac", "lotus", "lumen", "maple", "marble", "meadow", "meteor", "midnight", "mist", "nebula",
  "nectar", "north", "nova", "oasis", "onyx", "opal", "orbit", "orchid", "parrot", "pebble",
  "phoenix", "pine", "planet", "prairie", "quartz", "quill", "raven", "reef", "river", "sable",
  "saffron", "sage", "sierra", "silver", "solstice", "sparrow", "spruce", "star", "stone", "sunset",
  "tempest", "thistle", "timber", "topaz", "trail", "valley", "velvet", "violet", "willow", "zephyr"
];

function getSecureRandomInt(maxExclusive) {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
    throw new Error("maxExclusive must be a positive integer");
  }

  const maxUint32 = 0x100000000;
  const limit = maxUint32 - (maxUint32 % maxExclusive);
  const values = new Uint32Array(1);

  while (true) {
    crypto.getRandomValues(values);
    if (values[0] < limit) {
      return values[0] % maxExclusive;
    }
  }
}

function randomFromString(chars) {
  return chars[getSecureRandomInt(chars.length)];
}

function randomWord() {
  return WORD_LIST[getSecureRandomInt(WORD_LIST.length)];
}

function shuffled(chars) {
  const copy = [...chars];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = getSecureRandomInt(i + 1);
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }
  return copy.join("");
}

function stripAmbiguous(chars) {
  return [...chars].filter((char) => !AMBIGUOUS_CHARS.has(char)).join("");
}

function getMode() {
  return document.querySelector("input[name='mode']:checked").value;
}

function getEnabledSets() {
  const avoidAmbiguous = avoidAmbiguousEl.checked;
  const sets = [];

  if (includeUppercaseEl.checked) {
    sets.push(avoidAmbiguous ? stripAmbiguous(CHARSET.upper) : CHARSET.upper);
  }
  if (includeLowercaseEl.checked) {
    sets.push(avoidAmbiguous ? stripAmbiguous(CHARSET.lower) : CHARSET.lower);
  }
  if (includeNumbersEl.checked) {
    sets.push(avoidAmbiguous ? stripAmbiguous(CHARSET.numbers) : CHARSET.numbers);
  }
  if (includeSpecialEl.checked) {
    sets.push(CHARSET.special);
  }

  return sets.filter((set) => set.length > 0);
}

function generatePassword() {
  const length = Number(lengthRangeEl.value);
  const sets = getEnabledSets();

  if (sets.length === 0) {
    throw new Error("Choose at least one character type.");
  }

  const allChars = sets.join("");
  const output = [];

  for (const set of sets) {
    output.push(randomFromString(set));
  }
  for (let i = output.length; i < length; i += 1) {
    output.push(randomFromString(allChars));
  }

  return shuffled(output);
}

function capitalizeWord(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function generatePassphrase() {
  const wordCount = Number(lengthRangeEl.value);
  const words = [];

  for (let i = 0; i < wordCount; i += 1) {
    const word = randomWord();
    words.push(capitalizeWordsEl.checked ? capitalizeWord(word) : word);
  }

  let phrase = words.join(separatorSelectEl.value);
  if (appendNumberEl.checked) {
    phrase += String(getSecureRandomInt(100)).padStart(2, "0");
  }

  return phrase;
}

function estimateEntropy(value) {
  if (!value) {
    return 0;
  }

  if (getMode() === "passphrase") {
    let bits = Number(lengthRangeEl.value) * Math.log2(WORD_LIST.length);
    if (appendNumberEl.checked) {
      bits += Math.log2(100);
    }
    return bits;
  }

  const sets = getEnabledSets();
  const poolSize = sets.join("").length;
  return value.length * Math.log2(poolSize);
}

function strengthBucket(bits) {
  if (bits < 40) {
    return { label: "Weak", value: 20, color: "var(--danger)", hint: "Too easy to brute-force. Increase length." };
  }
  if (bits < 60) {
    return { label: "Fair", value: 45, color: "var(--warn)", hint: "Acceptable for low-risk accounts only." };
  }
  if (bits < 80) {
    return { label: "Good", value: 70, color: "#5b9e1a", hint: "Strong for most accounts." };
  }
  return { label: "Very Strong", value: 100, color: "var(--good)", hint: "High resistance against guessing attacks." };
}

function syncModeUI() {
  const mode = getMode();
  const isPassword = mode === "password";

  passwordOptionsEl.classList.toggle("hidden", !isPassword);
  passphraseOptionsEl.classList.toggle("hidden", isPassword);

  if (isPassword) {
    lengthLabelEl.textContent = "Length";
    lengthRangeEl.min = "4";
    lengthRangeEl.max = "64";
    if (Number(lengthRangeEl.value) < 12) {
      lengthRangeEl.value = "16";
    }
    lengthHintEl.textContent = "Longer passwords improve entropy more than adding symbols alone.";
  } else {
    lengthLabelEl.textContent = "Word count";
    lengthRangeEl.min = "3";
    lengthRangeEl.max = "12";
    if (Number(lengthRangeEl.value) > 12 || Number(lengthRangeEl.value) < 3) {
      lengthRangeEl.value = "4";
    }
    lengthHintEl.textContent = "Passphrases are easier to remember; add words for more entropy.";
  }

  lengthValueEl.textContent = lengthRangeEl.value;
}

function enforceLengthForTypes() {
  if (getMode() !== "password") {
    return;
  }

  const selectedTypeCount = [
    includeUppercaseEl.checked,
    includeLowercaseEl.checked,
    includeNumbersEl.checked,
    includeSpecialEl.checked
  ].filter(Boolean).length;

  const hardMin = Math.max(4, selectedTypeCount || 1);
  lengthRangeEl.min = String(hardMin);

  if (Number(lengthRangeEl.value) < hardMin) {
    lengthRangeEl.value = String(hardMin);
  }

  lengthValueEl.textContent = lengthRangeEl.value;
}

function regenerate() {
  try {
    const mode = getMode();
    const value = mode === "password" ? generatePassword() : generatePassphrase();
    generatedValueEl.value = value;

    const bits = estimateEntropy(value);
    const bucket = strengthBucket(bits);

    meterFillEl.style.width = `${bucket.value}%`;
    meterFillEl.style.backgroundColor = bucket.color;
    meterEl.setAttribute("aria-valuenow", String(bucket.value));

    strengthLabelEl.textContent = bucket.label;
    strengthHintEl.textContent = bucket.hint;
    entropyBitsEl.textContent = bits.toFixed(1);
    copyStatusEl.textContent = "Generated securely with Web Crypto.";
  } catch (error) {
    generatedValueEl.value = "";
    meterFillEl.style.width = "0%";
    meterEl.setAttribute("aria-valuenow", "0");
    strengthLabelEl.textContent = "Invalid";
    strengthHintEl.textContent = error.message;
    entropyBitsEl.textContent = "0.0";
    copyStatusEl.textContent = error.message;
  }
}

async function copyGeneratedValue() {
  const value = generatedValueEl.value;
  if (!value) {
    copyStatusEl.textContent = "Nothing to copy.";
    return;
  }

  try {
    await navigator.clipboard.writeText(value);
    copyStatusEl.textContent = "Copied to clipboard.";
  } catch (_) {
    generatedValueEl.select();
    const success = document.execCommand("copy");
    copyStatusEl.textContent = success ? "Copied to clipboard." : "Copy failed. Select text and copy manually.";
  }
}

function openSaveForm() {
  const value = generatedValueEl.value;
  if (!value) {
    copyStatusEl.textContent = "Generate a password before saving.";
    return;
  }

  savePasswordEl.value = value;
  saveFormEl.classList.remove("hidden");
  saveWebsiteEl.focus();
}

function closeSaveForm() {
  saveFormEl.reset();
  savePasswordEl.value = "";
  saveFormEl.classList.add("hidden");
}

async function saveGeneratedPassword(event) {
  event.preventDefault();

  const website = saveWebsiteEl.value.trim();
  const username = saveUsernameEl.value.trim();
  const password = savePasswordEl.value;

  if (!passwordKey) {
    copyStatusEl.textContent = "Unlock the Password Vault first before saving.";
    return;
  }

  if (!website || !username || !password) {
    copyStatusEl.textContent = "Website and username are required.";
    return;
  }

  passwordRecords.push({
    website,
    username,
    password,
    created_at: new Date().toISOString()
  });

  try {
    await savePasswordRecords();
    renderPasswordRecords();
    copyStatusEl.textContent = `Saved password for ${website} (${username}).`;
    closeSaveForm();
  } catch (_) {
    copyStatusEl.textContent = "Failed to save password record.";
  }
}

lengthRangeEl.addEventListener("input", () => {
  lengthValueEl.textContent = lengthRangeEl.value;
  regenerate();
});

regenerateBtn.addEventListener("click", regenerate);
copyBtn.addEventListener("click", copyGeneratedValue);
saveBtn.addEventListener("click", openSaveForm);
cancelSaveBtn.addEventListener("click", closeSaveForm);
saveFormEl.addEventListener("submit", saveGeneratedPassword);

for (const el of modeEls) {
  el.addEventListener("change", () => {
    syncModeUI();
    enforceLengthForTypes();
    regenerate();
  });
}

[
  includeUppercaseEl,
  includeLowercaseEl,
  includeNumbersEl,
  includeSpecialEl,
  avoidAmbiguousEl,
  capitalizeWordsEl,
  appendNumberEl,
  separatorSelectEl
].forEach((el) => {
  el.addEventListener("change", () => {
    enforceLengthForTypes();
    regenerate();
  });
});

syncModeUI();
enforceLengthForTypes();
regenerate();

// ─── Tab Navigation ───────────────────────────────────────────────
const tabs = document.querySelectorAll(".tab");
const generatorTab = document.getElementById("generatorTab");
const passwordVaultTab = document.getElementById("passwordVaultTab");
const vaultTab = document.getElementById("vaultTab");
const autofillTab = document.getElementById("autofillTab");

const panelEl = document.querySelector(".panel");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("tab--active"));
    tab.classList.add("tab--active");
    const target = tab.dataset.tab;

    // Clear any leftover inline styles from a previous animation
    panelEl.style.transition = "none";
    panelEl.style.height = "";
    panelEl.style.overflow = "";
    void panelEl.offsetHeight;

    const startHeight = panelEl.offsetHeight;

    // Switch tabs to measure new height
    generatorTab.classList.toggle("hidden", target !== "generator");
    passwordVaultTab.classList.toggle("hidden", target !== "password-vault");
    vaultTab.classList.toggle("hidden", target !== "vault");
    autofillTab.classList.toggle("hidden", target !== "autofill");
    if (target === "autofill") refreshAutofillState();

    const endHeight = panelEl.offsetHeight;

    if (startHeight === endHeight) return;

    // Lock to start height, force reflow, then animate to end
    panelEl.style.height = startHeight + "px";
    panelEl.style.overflow = "hidden";
    void panelEl.offsetHeight;

    panelEl.style.transition = "height 0.25s ease";
    panelEl.style.height = endHeight + "px";

    function onEnd(e) {
      if (e.propertyName !== "height") return;
      panelEl.style.height = "";
      panelEl.style.overflow = "";
      panelEl.style.transition = "";
      panelEl.removeEventListener("transitionend", onEnd);
    }
    panelEl.addEventListener("transitionend", onEnd);
  });
});

// ─── Credit Card Vault (AES-GCM encrypted localStorage) ──────────
let currentCcSalt = null;
let currentPwSalt = null;

const masterPasswordEl = document.getElementById("masterPassword");
const unlockVaultBtn = document.getElementById("unlockVaultBtn");
const lockVaultBtn = document.getElementById("lockVaultBtn");
const vaultStatusEl = document.getElementById("vaultStatus");
const vaultLockEl = document.getElementById("vaultLock");
const vaultContentEl = document.getElementById("vaultContent");
const addCardFormEl = document.getElementById("addCardForm");
const cardListEl = document.getElementById("cardList");
const noCardsEl = document.getElementById("noCards");

const pwMasterPasswordEl = document.getElementById("pwMasterPassword");
const unlockPwVaultBtn = document.getElementById("unlockPwVaultBtn");
const lockPwVaultBtn = document.getElementById("lockPwVaultBtn");
const pwVaultStatusEl = document.getElementById("pwVaultStatus");
const pwVaultLockEl = document.getElementById("pwVaultLock");
const pwVaultContentEl = document.getElementById("pwVaultContent");

const showCardFormBtn = document.getElementById("showCardFormBtn");
const cardFormWrapper = document.getElementById("cardFormWrapper");
const cancelCardBtn = document.getElementById("cancelCardBtn");

const cardNicknameEl = document.getElementById("cardNickname");
const cardHolderEl = document.getElementById("cardHolder");
const cardNumberEl = document.getElementById("cardNumber");
const cardExpiryEl = document.getElementById("cardExpiry");
const cardCVVEl = document.getElementById("cardCVV");
const cardNumberHint = document.getElementById("cardNumberHint");
const cardExpiryHint = document.getElementById("cardExpiryHint");
const cardCVVHint = document.getElementById("cardCVVHint");
const passwordRecordListEl = document.getElementById("passwordRecordList");
const noPasswordRecordsEl = document.getElementById("noPasswordRecords");

function showFieldError(input, hint, message) {
  input.classList.add("input-error");
  hint.textContent = message;
  hint.classList.remove("hidden");
  input.focus();
}

function clearFieldError(input, hint) {
  input.classList.remove("input-error");
  hint.textContent = "";
  hint.classList.add("hidden");
}

function clearAllCardErrors() {
  clearFieldError(cardNumberEl, cardNumberHint);
  clearFieldError(cardExpiryEl, cardExpiryHint);
  clearFieldError(cardCVVEl, cardCVVHint);
}

let vaultKey = null;
let vaultCards = [];
let passwordRecords = [];
let passwordKey = null;

function buf2hex(buffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function hex2buf(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

async function deriveKey(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 600000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

function createSalt() {
  return crypto.getRandomValues(new Uint8Array(16));
}

async function encryptVault(key, data) {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(JSON.stringify(data)));
  return buf2hex(iv) + ":" + buf2hex(ciphertext);
}

async function decryptVault(key, stored) {
  const [ivHex, ctHex] = stored.split(":");
  const iv = hex2buf(ivHex);
  const ct = hex2buf(ctHex);
  const plainBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return JSON.parse(new TextDecoder().decode(plainBuf));
}

async function saveVaultToFiles(encryptedData) {
  try {
    await fetch("/save-vault", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        encrypted: {
          algorithm: "AES-256-GCM",
          key_derivation: "PBKDF2 (600000 iterations, SHA-256)",
          salt: currentCcSalt,
          encrypted_data: encryptedData
        },
        decrypted: {
          description: "DEMO ONLY — Unencrypted credit card vault (plaintext)",
          cards: vaultCards
        }
      })
    });
  } catch (_) {}
}

async function loadFromServer(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.error) return null;
    return data;
  } catch (_) {
    return null;
  }
}

async function saveVault() {
  const encrypted = await encryptVault(vaultKey, vaultCards);
  await saveVaultToFiles(encrypted);
}

async function savePasswordRecords() {
  const encrypted = await encryptVault(passwordKey, passwordRecords);
  try {
    await fetch("/save-password-records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        encrypted: {
          algorithm: "AES-256-GCM",
          key_derivation: "PBKDF2 (600000 iterations, SHA-256)",
          salt: currentPwSalt,
          encrypted_data: encrypted
        },
        decrypted: {
          description: "DEMO ONLY — Unencrypted password records (plaintext)",
          records: passwordRecords
        }
      })
    });
  } catch (_) {}
}

function renderPasswordRecords() {
  passwordRecordListEl.innerHTML = "";
  noPasswordRecordsEl.classList.toggle("hidden", passwordRecords.length > 0);

  passwordRecords.forEach((record) => {
    const item = document.createElement("article");
    item.className = "password-record";
    const site = document.createElement("p");
    site.className = "password-record__site";
    site.textContent = record.website || "Unknown site";

    const detail = document.createElement("div");
    detail.className = "password-record__detail";

    const usernameLabel = document.createElement("span");
    usernameLabel.textContent = "Username";
    const usernameValue = document.createElement("strong");
    usernameValue.textContent = record.username || "-";

    const passwordLabel = document.createElement("span");
    passwordLabel.textContent = "Password";

    const passwordWrap = document.createElement("div");
    passwordWrap.className = "password-record__password-wrap";
    const passwordValue = document.createElement("strong");
    const rawPassword = record.password || "";
    let revealed = false;
    passwordValue.textContent = rawPassword ? "*".repeat(rawPassword.length) : "-";

    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.className = "password-toggle-btn";
    toggleBtn.textContent = "Show";
    toggleBtn.addEventListener("click", () => {
      revealed = !revealed;
      passwordValue.textContent = revealed ? rawPassword : "*".repeat(rawPassword.length);
      toggleBtn.textContent = revealed ? "Hide" : "Show";
      toggleBtn.setAttribute("aria-pressed", String(revealed));
    });

    passwordWrap.append(passwordValue, toggleBtn);
    detail.append(usernameLabel, usernameValue, passwordLabel, passwordWrap);
    item.append(site, detail);
    passwordRecordListEl.appendChild(item);
  });
}

function maskCardNumber(num) {
  const digits = num.replace(/\s/g, "");
  if (digits.length <= 4) return digits;
  return "**** **** **** " + digits.slice(-4);
}

function renderCards() {
  cardListEl.innerHTML = "";
  noCardsEl.classList.toggle("hidden", vaultCards.length > 0);

  vaultCards.forEach((card, index) => {
    const el = document.createElement("div");
    el.className = "stored-card";
    el.dataset.index = index;
    const provObj = detectProvider(card.number);
    const provKey = provObj ? provObj.key : "unknown";
    el.innerHTML = `
      <div class="stored-card__top">
        <span class="stored-card__nickname">${escapeHtml(card.nickname || "Card " + (index + 1))} <span class="stored-card__provider">${getProviderLogo(provKey, 22)}</span></span>
        <div class="stored-card__actions">
          <button type="button" class="reveal-btn">Reveal</button>
          <button type="button" class="copy-card-btn">Copy #</button>
          <button type="button" class="btn--danger delete-btn">Delete</button>
        </div>
      </div>
      <div class="stored-card__detail">
        <span>Number</span><strong class="card-num-display">${maskCardNumber(card.number)}</strong>
        <span>Holder</span><strong>${escapeHtml(card.holder)}</strong>
        <span>Expiry</span><strong>${escapeHtml(card.expiry)}</strong>
        <span>CVV</span><strong class="card-cvv-display">***</strong>
      </div>
    `;
    cardListEl.appendChild(el);

    let revealed = false;
    el.querySelector(".reveal-btn").addEventListener("click", function () {
      revealed = !revealed;
      el.querySelector(".card-num-display").textContent = revealed ? formatCardNumber(card.number) : maskCardNumber(card.number);
      el.querySelector(".card-cvv-display").textContent = revealed ? card.cvv : "***";
      this.textContent = revealed ? "Hide" : "Reveal";
    });

    el.querySelector(".copy-card-btn").addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(card.number.replace(/\s/g, ""));
        vaultStatusEl.textContent = "Card number copied.";
      } catch (_) {
        vaultStatusEl.textContent = "Copy failed.";
      }
    });

    el.querySelector(".delete-btn").addEventListener("click", async () => {
      vaultCards.splice(index, 1);
      await saveVault();
      renderCards();
      vaultStatusEl.textContent = "Card deleted.";
    });
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function formatCardNumber(num) {
  const digits = num.replace(/\s/g, "");
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

const CARD_PROVIDERS = [
  { name: "Visa",        key: "visa",        prefix: /^4/,               lengths: [13, 16, 19], cvv: 3 },
  { name: "Mastercard",  key: "mastercard",   prefix: /^(5[1-5]|2[2-7])/, lengths: [16],         cvv: 3 },
  { name: "Amex",        key: "amex",         prefix: /^3[47]/,           lengths: [15],         cvv: 4 },
  { name: "Discover",    key: "discover",     prefix: /^(6011|64[4-9]|65)/, lengths: [16, 19],   cvv: 3 },
  { name: "Diners Club", key: "diners",       prefix: /^(36|38|30[0-5])/, lengths: [14, 16],     cvv: 3 },
  { name: "JCB",         key: "jcb",          prefix: /^35(2[89]|[3-8])/, lengths: [16, 19],     cvv: 3 },
  { name: "UnionPay",    key: "unionpay",     prefix: /^62/,              lengths: [16, 17, 18, 19], cvv: 3 },
];

function detectProvider(digits) {
  for (const p of CARD_PROVIDERS) {
    if (p.prefix.test(digits)) return p;
  }
  return null;
}

function getProviderLogo(key, size = 32) {
  const h = size, w = Math.round(size * 1.58);
  const validKeys = ["visa", "mastercard", "amex", "discover", "diners", "jcb", "unionpay"];
  const src = validKeys.includes(key) ? `icons/${key}.svg` : "icons/unknown.svg";
  return `<img src="${src}" alt="${key}" width="${w}" height="${h}" style="border-radius:3px;">`;
}

function luhnCheck(digits) {
  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

const cardProviderBadge = document.getElementById("cardProviderBadge");

// Auto-format card number input and show provider
cardNumberEl.addEventListener("input", () => {
  let digits = cardNumberEl.value.replace(/\D/g, "");
  const provider = detectProvider(digits);

  // Amex max 15, others max 19
  const maxDigits = provider ? Math.max(...provider.lengths) : 19;
  digits = digits.slice(0, maxDigits);
  cardNumberEl.value = digits.replace(/(.{4})/g, "$1 ").trim();
  clearFieldError(cardNumberEl, cardNumberHint);

  if (digits.length > 0 && provider) {
    cardProviderBadge.innerHTML = getProviderLogo(provider.key, 24);
    cardProviderBadge.dataset.provider = provider.key;
    cardCVVEl.maxLength = provider.cvv;
    cardCVVEl.placeholder = provider.cvv === 4 ? "****" : "***";
  } else if (digits.length > 0) {
    cardProviderBadge.innerHTML = getProviderLogo("unknown", 24);
    cardProviderBadge.dataset.provider = "unknown";
    cardCVVEl.maxLength = 4;
    cardCVVEl.placeholder = "***";
  } else {
    cardProviderBadge.innerHTML = "";
    cardProviderBadge.removeAttribute("data-provider");
    cardCVVEl.maxLength = 4;
    cardCVVEl.placeholder = "***";
  }
});

// Auto-format expiry input and clear error on edit
cardExpiryEl.addEventListener("input", () => {
  let val = cardExpiryEl.value.replace(/\D/g, "").slice(0, 4);
  if (val.length >= 3) {
    val = val.slice(0, 2) + "/" + val.slice(2);
  }
  cardExpiryEl.value = val;
  clearFieldError(cardExpiryEl, cardExpiryHint);
});

cardCVVEl.addEventListener("input", () => {
  clearFieldError(cardCVVEl, cardCVVHint);
});

showCardFormBtn.addEventListener("click", () => {
  cardFormWrapper.classList.remove("hidden");
  showCardFormBtn.classList.add("hidden");
});

cancelCardBtn.addEventListener("click", () => {
  cardFormWrapper.classList.add("hidden");
  showCardFormBtn.classList.remove("hidden");
  addCardFormEl.reset();
  cardProviderBadge.innerHTML = "";
  cardProviderBadge.removeAttribute("data-provider");
  clearAllCardErrors();
});

unlockVaultBtn.addEventListener("click", async () => {
  const pw = masterPasswordEl.value;
  if (!pw) {
    vaultStatusEl.textContent = "Please enter a master password.";
    return;
  }

  const fileData = await loadFromServer("/load-vault");
  try {
    if (fileData && fileData.salt && fileData.encrypted_data) {
      const salt = hex2buf(fileData.salt);
      currentCcSalt = fileData.salt;
      vaultKey = await deriveKey(pw, salt);
      vaultCards = await decryptVault(vaultKey, fileData.encrypted_data);
    } else {
      const salt = createSalt();
      currentCcSalt = buf2hex(salt);
      vaultKey = await deriveKey(pw, salt);
      vaultCards = [];
    }
    vaultLockEl.classList.add("hidden");
    vaultContentEl.classList.remove("hidden");
    vaultStatusEl.textContent = "";
    renderCards();
  } catch (_) {
    vaultKey = null;
    vaultStatusEl.textContent = "Wrong password or corrupted vault.";
  }
});

lockVaultBtn.addEventListener("click", () => {
  vaultKey = null;
  vaultCards = [];
  masterPasswordEl.value = "";
  vaultContentEl.classList.add("hidden");
  vaultLockEl.classList.remove("hidden");
  vaultStatusEl.textContent = "Vault locked.";
});

addCardFormEl.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearAllCardErrors();

  const number = cardNumberEl.value.replace(/\s/g, "");
  const provider = detectProvider(number);
  let hasError = false;

  // Card number validation
  if (!/^\d{13,19}$/.test(number)) {
    showFieldError(cardNumberEl, cardNumberHint, "Enter a valid card number (13–19 digits).");
    hasError = true;
  } else if (!provider) {
    showFieldError(cardNumberEl, cardNumberHint, "Unrecognized card provider. Supported: Visa, Mastercard, Amex, Discover, Diners Club, JCB, UnionPay.");
    hasError = true;
  } else if (!provider.lengths.includes(number.length)) {
    showFieldError(cardNumberEl, cardNumberHint, `${provider.name} requires ${provider.lengths.join(" or ")} digits. You entered ${number.length}.`);
    hasError = true;
  }

  // Expiry validation
  const expiryVal = cardExpiryEl.value;
  const expiryMatch = /^\d{2}\/\d{2}$/.test(expiryVal);
  if (!expiryMatch) {
    showFieldError(cardExpiryEl, cardExpiryHint, "Use MM/YY format (e.g. 03/27).");
    hasError = true;
  } else {
    const [mm, yy] = expiryVal.split("/").map(Number);
    if (mm < 1 || mm > 12) {
      showFieldError(cardExpiryEl, cardExpiryHint, "Month must be 01–12.");
      hasError = true;
    } else {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear() % 100;
      if (yy < currentYear || (yy === currentYear && mm < currentMonth)) {
        showFieldError(cardExpiryEl, cardExpiryHint, "This card has expired. Enter a future date.");
        hasError = true;
      }
    }
  }

  // CVV validation
  const expectedCvv = provider ? provider.cvv : 3;
  if (!/^\d+$/.test(cardCVVEl.value) || cardCVVEl.value.length !== expectedCvv) {
    const provName = provider ? provider.name : "This card";
    showFieldError(cardCVVEl, cardCVVHint, `${provName} requires a ${expectedCvv}-digit CVV.`);
    hasError = true;
  }

  if (hasError) return;

  vaultCards.push({
    nickname: cardNicknameEl.value.trim(),
    holder: cardHolderEl.value.trim(),
    number: number,
    expiry: cardExpiryEl.value,
    cvv: cardCVVEl.value,
    provider: provider.name
  });

  await saveVault();
  renderCards();
  addCardFormEl.reset();
  cardFormWrapper.classList.add("hidden");
  showCardFormBtn.classList.remove("hidden");
  cardProviderBadge.innerHTML = "";
  cardProviderBadge.removeAttribute("data-provider");
  clearAllCardErrors();
  vaultStatusEl.textContent = "Card saved securely.";
});

unlockPwVaultBtn.addEventListener("click", async () => {
  const pw = pwMasterPasswordEl.value;
  if (!pw) {
    pwVaultStatusEl.textContent = "Please enter a master password.";
    return;
  }

  const fileData = await loadFromServer("/load-password-records");
  try {
    if (fileData && fileData.salt && fileData.encrypted_data) {
      const salt = hex2buf(fileData.salt);
      currentPwSalt = fileData.salt;
      passwordKey = await deriveKey(pw, salt);
      passwordRecords = await decryptVault(passwordKey, fileData.encrypted_data);
      if (!Array.isArray(passwordRecords)) {
        passwordRecords = [];
      }
    } else {
      const salt = createSalt();
      currentPwSalt = buf2hex(salt);
      passwordKey = await deriveKey(pw, salt);
      passwordRecords = [];
    }
    pwVaultLockEl.classList.add("hidden");
    pwVaultContentEl.classList.remove("hidden");
    pwVaultStatusEl.textContent = "";
    renderPasswordRecords();
  } catch (_) {
    passwordKey = null;
    pwVaultStatusEl.textContent = "Wrong password or corrupted vault.";
  }
});

lockPwVaultBtn.addEventListener("click", () => {
  passwordKey = null;
  passwordRecords = [];
  pwMasterPasswordEl.value = "";
  pwVaultContentEl.classList.add("hidden");
  pwVaultLockEl.classList.remove("hidden");
  pwVaultStatusEl.textContent = "Vault locked.";
});

// ─── Autofill Demo ────────────────────────────────────────────────
const MOCK_SITES = {
  gmail: {
    name: "Gmail",
    url: "https://accounts.google.com/signin",
    matchDomains: ["google.com", "gmail.com", "accounts.google.com"],
    color: "#EA4335",
    logo: "G"
  },
  youtube: {
    name: "YouTube",
    url: "https://accounts.google.com/signin (YouTube)",
    matchDomains: ["youtube.com"],
    color: "#FF0000",
    logo: "\u25B6"
  },
  facebook: {
    name: "Facebook",
    url: "https://www.facebook.com/login",
    matchDomains: ["facebook.com", "fb.com"],
    color: "#1877F2",
    logo: "f"
  }
};

const afSiteGrid = document.getElementById("afSiteGrid");
const afMockPage = document.getElementById("afMockPage");
const afMockFrame = document.getElementById("afMockFrame");
const afBackBtn = document.getElementById("afBackBtn");
const afVaultWarning = document.getElementById("afVaultWarning");

function normalizeDomain(raw) {
  let d = raw.trim().toLowerCase();
  d = d.replace(/^https?:\/\//, "");
  d = d.replace(/\/.*$/, "");
  d = d.replace(/^www\./, "");
  return d;
}

function findMatchingCredentials(siteKey) {
  const site = MOCK_SITES[siteKey];
  if (!site || !passwordKey) return [];
  return passwordRecords.filter((rec) => {
    const domain = normalizeDomain(rec.website || "");
    return site.matchDomains.some((md) => domain.includes(md) || md.includes(domain));
  });
}

function renderMockLoginPage(siteKey) {
  const site = MOCK_SITES[siteKey];
  afMockFrame.innerHTML = "";

  const header = document.createElement("div");
  header.className = "af-brand-header";
  header.innerHTML = `
    <div class="af-logo" style="background:${site.color};color:#fff;">${site.logo}</div>
    <h3>Sign in to ${escapeHtml(site.name)}</h3>
    <span class="af-url-bar"><span class="af-lock">&#128274;</span>${escapeHtml(site.url)}</span>
  `;

  const form = document.createElement("div");
  form.className = "af-login-form";

  const emailField = document.createElement("div");
  emailField.className = "af-field";
  emailField.innerHTML = `<label>Email or phone</label>`;
  const emailInput = document.createElement("input");
  emailInput.type = "text";
  emailInput.placeholder = "Enter your email";
  emailField.appendChild(emailInput);

  const passField = document.createElement("div");
  passField.className = "af-field";
  passField.innerHTML = `<label>Password</label>`;
  const passInput = document.createElement("input");
  passInput.type = "password";
  passInput.placeholder = "Enter your password";
  passField.appendChild(passInput);

  const signInBtn = document.createElement("button");
  signInBtn.className = "af-signin-btn";
  signInBtn.style.background = site.color;
  signInBtn.textContent = "Sign in";

  form.append(emailField, passField, signInBtn);
  afMockFrame.append(header, form);

  showAutofillPopup(siteKey, emailInput, passInput, emailField);
}

function showAutofillPopup(siteKey, emailInput, passInput, emailField) {
  const matches = findMatchingCredentials(siteKey);
  if (matches.length === 0) return;

  const popup = document.createElement("div");
  popup.className = "af-popup";
  const title = document.createElement("p");
  title.className = "af-popup-title";
  title.textContent = "Password Manager — saved credentials";
  popup.appendChild(title);

  matches.forEach((cred) => {
    const row = document.createElement("div");
    row.className = "af-popup-row";

    const info = document.createElement("div");
    info.className = "af-popup-row-info";
    const user = document.createElement("span");
    user.className = "af-popup-user";
    user.textContent = cred.username;
    const pass = document.createElement("span");
    pass.className = "af-popup-pass";
    pass.textContent = "\u2022".repeat(Math.min(cred.password.length, 12));
    info.append(user, pass);

    const fillBtn = document.createElement("button");
    fillBtn.className = "af-popup-fill-btn";
    fillBtn.textContent = "Fill";
    fillBtn.addEventListener("click", () => {
      emailInput.value = cred.username;
      passInput.value = cred.password;
      emailInput.classList.add("af-filled");
      passInput.classList.add("af-filled");
      popup.classList.add("af-popup--used");
      title.textContent = "\u2713 Credentials filled";
      setTimeout(() => {
        popup.style.overflow = "hidden";
        popup.style.maxHeight = popup.scrollHeight + "px";
        popup.style.transition = "opacity 0.3s ease, max-height 0.3s ease, margin 0.3s ease, padding 0.3s ease";
        requestAnimationFrame(() => {
          popup.style.opacity = "0";
          popup.style.maxHeight = "0";
          popup.style.margin = "0";
          popup.style.padding = "0";
        });
        setTimeout(() => popup.remove(), 300);
      }, 800);
    });

    row.append(info, fillBtn);
    popup.appendChild(row);
  });

  emailField.appendChild(popup);
}

function refreshAutofillState() {
  const locked = passwordKey === null;
  afVaultWarning.classList.toggle("hidden", !locked);
}

afSiteGrid.addEventListener("click", (e) => {
  const card = e.target.closest(".af-site-card");
  if (!card) return;
  const siteKey = card.dataset.site;
  if (!MOCK_SITES[siteKey]) return;
  afSiteGrid.classList.add("hidden");
  afMockPage.classList.remove("hidden");
  renderMockLoginPage(siteKey);
});

afBackBtn.addEventListener("click", () => {
  afMockPage.classList.add("hidden");
  afSiteGrid.classList.remove("hidden");
  afMockFrame.innerHTML = "";
});
