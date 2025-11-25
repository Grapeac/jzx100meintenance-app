// State
let records = [];
const PARTS = [
    { id: 'f-upper', name: 'フロント アッパーアーム' },
    { id: 'f-lower', name: 'フロント ロアアーム' },
    { id: 'f-knuckle', name: 'フロント ナックル' },
    { id: 'f-tension', name: 'フロント テンションロッド' },
    { id: 'f-coil', name: 'フロント 車高調' },
    { id: 'f-stab', name: 'フロント スタビリンク' },
    { id: 'r-upper', name: 'リア アッパーアーム' },
    { id: 'r-lower', name: 'リア ロアアーム' },
    { id: 'r-knuckle', name: 'リア ナックル' },
    { id: 'r-traction', name: 'リア トラクションロッド' },
    { id: 'r-coil', name: 'リア 車高調' },
    { id: 'r-stab', name: 'リア スタビリンク' }
];

// DOM Elements
const views = {
    dashboard: document.getElementById('view-dashboard'),
    history: document.getElementById('view-history'),
    settings: document.getElementById('view-settings')
};
const modal = document.getElementById('add-modal');
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
    }
}

function saveData() {
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

    // Modal Triggers
    document.getElementById('fab-add').addEventListener('click', () => openModal());
    document.getElementById('close-modal').addEventListener('click', () => closeModal());
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
    partsCheckboxesContainer.innerHTML = PARTS.map(p => `
        <label style="display: flex; align-items: center; gap: 8px; padding: 10px; background: var(--surface-highlight); border-radius: 8px; cursor: pointer; user-select: none; -webkit-user-select: none;">
            <input type="checkbox" name="parts" value="${p.id}" style="width: 20px; height: 20px; cursor: pointer; flex-shrink: 0;">
            <span style="font-size: 14px; flex: 1;">${p.name}</span>
        </label>
    `).join('');

    // Add click handlers to labels for better mobile support
    partsCheckboxesContainer.querySelectorAll('label').forEach(label => {
        label.addEventListener('click', (e) => {
            // If clicking on the label (not the checkbox itself), toggle the checkbox
            if (e.target.tagName === 'LABEL' || e.target.tagName === 'SPAN') {
                const checkbox = label.querySelector('input[type="checkbox"]');
                if (checkbox) {
                    checkbox.checked = !checkbox.checked;
                    e.preventDefault();
                }
            }
        });
    });
}

// Modal
function openModal(partIds = []) {
    // Highlight selected parts
    document.querySelectorAll('.part').forEach(el => el.classList.remove('selected'));

    // Clear all checkboxes
    document.querySelectorAll('input[name="parts"]').forEach(cb => cb.checked = false);

    // If partIds provided, check those boxes and highlight
    if (partIds.length > 0) {
        partIds.forEach(partId => {
            const checkbox = document.querySelector(`input[name="parts"][value="${partId}"]`);
            if (checkbox) checkbox.checked = true;

            // Highlight all parts with this partId (both left and right)
            document.querySelectorAll(`.part[onclick*="${partId}"]`).forEach(el => {
                el.classList.add('selected');
            });
            // Also highlight by ID
            const el = document.getElementById(`part-${partId}`);
            if (el) el.classList.add('selected');
        });
    }

    // Set default date
    document.getElementById('date-input').valueAsDate = new Date();

    modal.classList.add('open');
}

function closeModal() {
    modal.classList.remove('open');
    document.querySelectorAll('.part').forEach(el => el.classList.remove('selected'));
    form.reset();
}

// Form Handling
function setupForm() {
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
        closeModal();
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
    records.forEach(r => {
        // Handle both old (partId) and new (partIds) format
        const parts = r.partIds || [r.partId];
        parts.forEach(partId => {
            if (!latestStatus[partId]) {
                latestStatus[partId] = r.status;
            }
        });
    });

    // Apply classes to all parts (both left and right sides)
    Object.entries(latestStatus).forEach(([partId, status]) => {
        // Query all elements with onclick containing this partId
        document.querySelectorAll(`.part[onclick*="${partId}"]`).forEach(el => {
            el.setAttribute('class', `part status-${status}`);
        });
        // Also update by ID for left side
        const el = document.getElementById(`part-${partId}`);
        if (el) {
            el.setAttribute('class', `part status-${status}`);
        }
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

// Expose openModal for SVG clicks
window.handlePartClick = (partId) => {
    openModal([partId]);
};
