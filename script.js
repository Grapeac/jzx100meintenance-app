// State
let records = [];
const PARTS = [
    // Front Left
    { id: 'fl-upper', name: 'FL アッパーアーム', group: 'Front Left' },
    { id: 'fl-lower', name: 'FL ロアアーム', group: 'Front Left' },
    { id: 'fl-knuckle', name: 'FL ナックル', group: 'Front Left' },
    { id: 'fl-tension', name: 'FL テンションロッド', group: 'Front Left' },
    { id: 'fl-coil', name: 'FL 車高調', group: 'Front Left' },
    { id: 'fl-stab', name: 'FL スタビリンク', group: 'Front Left' },
    // Front Right
    { id: 'fr-upper', name: 'FR アッパーアーム', group: 'Front Right' },
    { id: 'fr-lower', name: 'FR ロアアーム', group: 'Front Right' },
    { id: 'fr-knuckle', name: 'FR ナックル', group: 'Front Right' },
    { id: 'fr-tension', name: 'FR テンションロッド', group: 'Front Right' },
    { id: 'fr-coil', name: 'FR 車高調', group: 'Front Right' },
    { id: 'fr-stab', name: 'FR スタビリンク', group: 'Front Right' },
    // Rear Left
    { id: 'rl-upper', name: 'RL アッパーアーム', group: 'Rear Left' },
    { id: 'rl-lower', name: 'RL ロアアーム', group: 'Rear Left' },
    { id: 'rl-knuckle', name: 'RL ナックル', group: 'Rear Left' },
    { id: 'rl-traction', name: 'RL トラクションロッド', group: 'Rear Left' },
    { id: 'rl-coil', name: 'RL 車高調', group: 'Rear Left' },
    { id: 'rl-stab', name: 'RL スタビリンク', group: 'Rear Left' },
    // Rear Right
    { id: 'rr-upper', name: 'RR アッパーアーム', group: 'Rear Right' },
    { id: 'rr-lower', name: 'RR ロアアーム', group: 'Rear Right' },
    { id: 'rr-knuckle', name: 'RR ナックル', group: 'Rear Right' },
    { id: 'rr-traction', name: 'RR トラクションロッド', group: 'Rear Right' },
    { id: 'rr-coil', name: 'RR 車高調', group: 'Rear Right' },
    { id: 'rr-stab', name: 'RR スタビリンク', group: 'Rear Right' }
];

// DOM Elements
const views = {
    dashboard: document.getElementById('view-dashboard'),
    add: document.getElementById('view-add'),
    history: document.getElementById('view-history'),
    settings: document.getElementById('view-settings')
};
const detailsModal = document.getElementById('details-modal');
const form = document.getElementById('add-form');
const partsCheckboxesContainer = document.getElementById('parts-checkboxes');

// Init
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupNavigation();
    setupForm();
    renderPartsCheckboxes();
    updateSuspensionStatus();
    renderHistory();
});

// Storage
function loadData() {
    const saved = localStorage.getItem('jzx100_logs');
    if (saved) {
        records = JSON.parse(saved);
        // Sort by date desc
        records.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
}

function saveData() {
    // Sort by date desc before saving
    records.sort((a, b) => new Date(b.date) - new Date(a.date));
    localStorage.setItem('jzx100_logs', JSON.stringify(records));
    updateSuspensionStatus();
    renderHistory();
}

// Navigation
function setupNavigation() {
    document.querySelectorAll('.tab-item').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const target = e.currentTarget.dataset.target;
            switchView(target);
        });
    });

    // Details Modal
    document.getElementById('close-details-modal').addEventListener('click', () => {
        detailsModal.classList.remove('open');
    });
}

function switchView(viewName) {
    // Update Tab UI
    document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-target="${viewName}"]`).classList.add('active');

    // Update View Visibility
    Object.values(views).forEach(el => el.classList.remove('active'));
    if (views[viewName]) views[viewName].classList.add('active');
}

// Render Parts Checkboxes
function renderPartsCheckboxes() {
    const groups = {
        'Front Left': [],
        'Front Right': [],
        'Rear Left': [],
        'Rear Right': []
    };

    PARTS.forEach(p => {
        if (groups[p.group]) {
            groups[p.group].push(p);
        }
    });

    let html = '';
    for (const [groupName, parts] of Object.entries(groups)) {
        html += `
            <div class="parts-group">
                <div class="parts-group-title">${groupName}</div>
                <div class="parts-grid">
                    ${parts.map(p => `
                        <label class="part-checkbox-item">
                            <input type="checkbox" name="parts" value="${p.id}">
                            <span>${p.name.split(' ').slice(1).join(' ')}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `;
    }
    partsCheckboxesContainer.innerHTML = html;
}

// Garage Interaction (Read Only)
function showPartDetails(partId) {
    const part = PARTS.find(p => p.id === partId);
    if (!part) return;

    // Find latest record for this part
    let latestRecord = null;
    // Search backwards
    for (let i = 0; i < records.length; i++) {
        const r = records[i];
        const parts = r.partIds || [r.partId];
        if (parts.includes(partId)) {
            latestRecord = r;
            break;
        }
    }

    const titleEl = document.getElementById('details-title');
    const contentEl = document.getElementById('details-content');

    titleEl.textContent = part.name;

    if (latestRecord) {
        const statusText = latestRecord.status === 'good' ? '良好' :
            latestRecord.status === 'check' ? '要確認' : '要交換';
        const statusColor = latestRecord.status === 'good' ? 'var(--success-color)' :
            latestRecord.status === 'check' ? 'var(--warning-color)' : 'var(--danger-color)';

        contentEl.innerHTML = `
            <div style="margin-bottom: 16px;">
                <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">状態</div>
                <div style="font-size: 18px; font-weight: 600; color: ${statusColor};">${statusText}</div>
            </div>
            <div style="margin-bottom: 16px;">
                <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">最終更新日</div>
                <div style="font-size: 16px;">${latestRecord.date}</div>
            </div>
            ${latestRecord.manufacturer ? `
            <div style="margin-bottom: 16px;">
                <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">メーカー</div>
                <div style="font-size: 16px;">${latestRecord.manufacturer}</div>
            </div>` : ''}
            ${latestRecord.partName ? `
            <div style="margin-bottom: 16px;">
                <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">パーツ名</div>
                <div style="font-size: 16px;">${latestRecord.partName}</div>
            </div>` : ''}
            ${latestRecord.note ? `
            <div style="margin-bottom: 16px;">
                <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">メモ</div>
                <div style="font-size: 16px; white-space: pre-wrap;">${latestRecord.note}</div>
            </div>` : ''}
             <div style="margin-bottom: 16px;">
                <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">費用</div>
                <div style="font-size: 16px;">¥${latestRecord.cost.toLocaleString()}</div>
            </div>
        `;
    } else {
        contentEl.innerHTML = `
            <div style="padding: 20px 0; text-align: center; color: var(--text-secondary);">
                記録がありません
            </div>
        `;
    }

    detailsModal.classList.add('open');
}

// Form Handling
function setupForm() {
    // Set default date
    // Set default date to today (Local)
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    document.getElementById('date-input').value = `${yyyy}-${mm}-${dd}`;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Get selected parts
        const selectedParts = Array.from(document.querySelectorAll('input[name="parts"]:checked'))
            .map(cb => cb.value);

        if (selectedParts.length === 0) {
            alert('少なくとも1つのパーツを選択してください。');
            return;
        }

        const newRecord = {
            id: Date.now().toString(),
            partIds: selectedParts,
            manufacturer: document.getElementById('manufacturer-input').value.trim(),
            partName: document.getElementById('partname-input').value.trim(),
            date: document.getElementById('date-input').value,
            status: document.querySelector('input[name="status"]:checked').value,
            cost: parseInt(document.getElementById('cost-input').value) || 0,
            note: document.getElementById('note-input').value
        };

        records.unshift(newRecord); // Add to top
        saveData();

        // Reset form
        form.reset();
        // Reset form
        form.reset();
        // Reset date to today
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        document.getElementById('date-input').value = `${yyyy}-${mm}-${dd}`;

        // Switch to history view to show result
        switchView('history');
    });
}

// Logic: Update Graphic
function updateSuspensionStatus() {
    // Reset all to unknown
    document.querySelectorAll('.part').forEach(el => {
        el.setAttribute('class', 'part status-unknown');
    });

    // Find latest status for each part
    const latestStatus = {};
    // Iterate backwards (oldest to newest) to let newer records overwrite
    // Actually records is sorted newest first, so we should iterate in reverse or just use a map that doesn't overwrite if exists
    // But wait, records is unshift (newest first). So we should iterate from end to start OR just iterate start to end and only set if not set.

    // Let's iterate from newest (index 0) to oldest. First find wins.
    records.forEach(r => {
        const parts = r.partIds || [r.partId];
        parts.forEach(partId => {
            if (!latestStatus[partId]) {
                latestStatus[partId] = r.status;
            }
        });
    });

    // Apply classes to all parts
    Object.entries(latestStatus).forEach(([partId, status]) => {
        const el = document.getElementById(`part-${partId}`);
        if (el) el.setAttribute('class', `part status-${status}`);
    });
}

// Logic: Render History
function renderHistory() {
    const list = document.getElementById('history-list');
    if (!records.length) {
        list.innerHTML = '<div style="text-align:center; padding:40px; color:var(--text-secondary)">記録がありません。</div>';
        return;
    }

    list.innerHTML = records.map(r => {
        // Handle both old and new format
        const parts = r.partIds || [r.partId];
        const partNames = parts.map(id => PARTS.find(p => p.id === id)?.name || id).join(', ');

        // Build display name
        let displayName = '';
        if (r.partName) {
            displayName = r.partName;
        } else {
            displayName = partNames;
        }

        if (r.manufacturer) {
            displayName += ` (${r.manufacturer})`;
        }

        return `
        <div class="list-item">
            <div>
                <div style="font-weight:600; margin-bottom:4px;">${displayName}</div>
                <div style="font-size:12px; color:var(--text-secondary)">${r.date} • ¥${r.cost.toLocaleString()}</div>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
                <span style="
                    width:10px; height:10px; border-radius:50%; 
                    background-color: var(--${r.status === 'good' ? 'success' : r.status === 'check' ? 'warning' : 'danger'}-color)
                "></span>
            </div>
        </div>
        `;
    }).join('');

    // Update Total Cost
    const total = records.reduce((sum, r) => sum + r.cost, 0);
    document.getElementById('total-cost').textContent = `¥${total.toLocaleString()}`;
}

// Expose showPartDetails for SVG clicks
window.handlePartClick = (partId) => {
    showPartDetails(partId);
};
