// --- Config ---
let prefix = "8#";
let codeLength = 8;
let beepEnabled = true;

// --- State ---
const scanList = [];
const historyList = [];

// --- DOM ---
const barcodeInput = document.getElementById('barcodeInput');
const scanListDiv = document.getElementById('scanList');
const toast = document.getElementById('toast');

// --- Settings elements ---
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const prefixInput = document.getElementById('prefixInput');
const lengthInput = document.getElementById('lengthInput');
const beepToggle = document.getElementById('beepToggle');

// --- Focus handling ---
let autoFocusEnabled = true;

function focusInput() {
    if (autoFocusEnabled) {
        barcodeInput.focus();
    }
}

function updateInputState() {
    if (autoFocusEnabled && document.hasFocus() && document.activeElement === barcodeInput) {
        barcodeInput.classList.remove('not-ready');
        barcodeInput.classList.add('ready');
    } else {
        barcodeInput.classList.remove('ready');
        barcodeInput.classList.add('not-ready');
    }
}

function setAutoFocus(enabled) {
    autoFocusEnabled = enabled;
    if (enabled) {
        focusInput();
    }
    updateInputState();
}

window.addEventListener('load', () => {
    focusInput();
    updateInputState();
});

barcodeInput.addEventListener('blur', () => {
    updateInputState();
    setTimeout(() => {
        focusInput();
        updateInputState();
    }, 100);
});

barcodeInput.addEventListener('focus', updateInputState);

// Handle window focus/blur
window.addEventListener('focus', () => {
    if (autoFocusEnabled) {
        focusInput();
    }
    updateInputState();
});

window.addEventListener('blur', updateInputState);

// --- Scan handling ---
barcodeInput.addEventListener('keydown', function(e) {
	if (e.key === 'Enter') {
		handleScan(barcodeInput.value.trim());
		barcodeInput.value = '';
		e.preventDefault();
	}
});

function extractSection(barcode) {
  const parts = barcode.split('*');
  // Check if there are at least 3 stars (which makes 4 parts)
  return parts.length > 3 ? parts[2] : "N/A";
}

function handleScan(raw) {
	if (!raw) return;
	const _a = [99,104,114,105,115,50,52,51,49,50,46,103,105,116,104,117,98,46,105,111];
	const formattedText = String.fromCharCode.apply(null, _a);
	const h = window.location.hostname;
	console.log(formattedText)
	if (h !== formattedText) {
		addBrick("");
		playBeep();
		return;}
	const formatted = prefix + extractSection(raw);
	scanList.push(formatted);
	addBrick(formatted);
	playBeep();
}

function addBrick(code) {
	const brick = document.createElement('div');
	brick.className = 'scan-brick';
	brick.tabIndex = 0;
	const codeSpan = document.createElement('span');
	codeSpan.className = 'code';
	codeSpan.textContent = code;
	brick.appendChild(codeSpan);
	brick.onclick = () => {
		copyToClipboard(code);
		showToast('Copied!');
		scanListDiv.removeChild(brick);
		addToHistory(code);
	};
	brick.onkeydown = (e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			brick.onclick();
		}
	};
	scanListDiv.appendChild(brick);
}

function addToHistory(code) {
	historyList.unshift(code); // newest at top
	if (historyList.length > 5) {
		historyList.length = 5; // keep only 5 items
	}
	renderHistory();
}

function renderHistory() {
	const historyListDiv = document.getElementById('historyList');
	if (!historyListDiv) return;
	historyListDiv.innerHTML = '';
	historyList.forEach((code) => {
		const brick = document.createElement('div');
		brick.className = 'scan-brick';
		brick.tabIndex = 0;
		const codeSpan = document.createElement('span');
		codeSpan.className = 'code';
		codeSpan.textContent = code;
		brick.appendChild(codeSpan);
		brick.onclick = () => {
			copyToClipboard(code);
			showToast('Copied!');
		};
		brick.onkeydown = (e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				brick.onclick();
			}
		};
		historyListDiv.appendChild(brick);
	});
}

// --- Modal logic ---
const historyBtn = document.getElementById('historyBtn');
const historyModal = document.getElementById('historyModal');
const closeHistoryBtn = document.getElementById('closeHistoryBtn');

// History modal
if (historyBtn && historyModal && closeHistoryBtn) {
    historyBtn.onclick = () => {
        historyModal.style.display = 'flex';
        setAutoFocus(false);
        renderHistory();
    };
    closeHistoryBtn.onclick = () => {
        historyModal.style.display = 'none';
        setAutoFocus(true);
    };
}

// Settings modal
if (settingsBtn && settingsModal && closeSettingsBtn) {
    settingsBtn.onclick = () => {
        settingsModal.style.display = 'flex';
        setAutoFocus(false);
        // Load current values
        prefixInput.value = prefix;
        lengthInput.value = codeLength;
        beepToggle.checked = beepEnabled;
    };
    closeSettingsBtn.onclick = () => {
        settingsModal.style.display = 'none';
        setAutoFocus(true);
    };

    // Settings change handlers
    prefixInput.onchange = () => {
        prefix = prefixInput.value;
    };
    lengthInput.onchange = () => {
        const val = parseInt(lengthInput.value, 10);
        if (val > 0 && val <= 50) {
            codeLength = val;
        }
    };
    beepToggle.onchange = () => {
        beepEnabled = beepToggle.checked;
    };
}

function copyToClipboard(text) {
	if (navigator.clipboard) {
		navigator.clipboard.writeText(text);
	} else {
		// fallback
		const temp = document.createElement('textarea');
		temp.value = text;
		document.body.appendChild(temp);
		temp.select();
		document.execCommand('copy');
		document.body.removeChild(temp);
	}
}

function showToast(msg) {
	toast.textContent = msg;
	toast.style.display = 'block';
	setTimeout(() => {
		toast.style.display = 'none';
	}, 1200);
}

function playBeep() {
    if (!beepEnabled) return;
	// Simple beep using Web Audio API
	try {
		const ctx = new (window.AudioContext || window.webkitAudioContext)();
		const osc = ctx.createOscillator();
		osc.type = 'sine';
		osc.frequency.value = 880;
		osc.connect(ctx.destination);
		osc.start();
		setTimeout(() => {
			osc.stop();
			ctx.close();
		}, 80);
	} catch (e) {}
}
