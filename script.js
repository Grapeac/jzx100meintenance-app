// State
let records = [];
const PARTS = [
    { id: 'f-upper', name: 'Front Upper Arm' },
    { id: 'f-lower', name: 'Front Lower Arm' },
    { id: 'f-knuckle', name: 'Front Knuckle' },
    { id: 'f-tension', name: 'Front Tension Rod' },
    { id: 'f-coil', name: 'Front Coilover' },
    { id: 'f-stab', name: 'Front Stabilizer Link' },
    { id: 'r-upper', name: 'Rear Upper Arm' },
    { id: 'r-lower', name: 'Rear Lower Arm' },
    { id: 'r-knuckle', name: 'Rear Knuckle' },
    { id: 'r-traction', name: 'Rear Traction Rod' },
    { id: 'r-coil', name: 'Rear Coilover' },
    { id: 'r-stab', name: 'Rear Stabilizer Link' }
];

// DOM Elements
const views = {
    dashboard: document.getElementById('view-dashboard'),
    history: document.getElementById('view-history'),
    settings: document.getElementById('view-settings')
};
const modal = document.getElementById('add-modal');
const form = document.getElementById('add-form');
const partSelect = document.getElementById('part-select');

// Init
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupNavigation();
    setupForm();
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

// Modal
function openModal(partId = null) {
    // Populate Select
    partSelect.innerHTML = PARTS.map(p => 
        `<option value="${p.id}" ${partId === p.id ? 'selected' : ''}>${p.name}</option>`
    ).join('');
    
    // Set default date
    document.getElementById('date-input').valueAsDate = new Date();
    
    modal.classList.add('open');
}

function closeModal() {
    modal.classList.remove('open');
    form.reset();
}

// Form Handling
function setupForm() {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const newRecord = {
            id: Date.now().toString(),
            partId: partSelect.value,
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
    PARTS.forEach(p => {
        const el = document.getElementById(`part-${p.id}`);
        if (el) el.setAttribute('class', 'part status-unknown');
    });

    // Find latest status for each part
    const latestStatus = {};
    // Records are sorted new -> old, so we just take the first one we see for each part
    records.forEach(r => {
        if (!latestStatus[r.partId]) {
            latestStatus[r.partId] = r.status;
        }
    });

    // Apply classes
    Object.entries(latestStatus).forEach(([partId, status]) => {
        const el = document.getElementById(`part-${partId}`);
        if (el) {
            // Remove old classes
            el.setAttribute('class', `part status-${status}`);
        }
    });
}

// Logic: Render History
function renderHistory() {
    const list = document.getElementById('history-list');
    if (!records.length) {
        list.innerHTML = '<div style="text-align:center; padding:40px; color:var(--text-secondary)">No records yet.</div>';
        return;
    }

    list.innerHTML = records.map(r => {
        const partName = PARTS.find(p => p.id === r.partId)?.name || r.partId;
        return `
        <div class="list-item">
            <div>
                <div style="font-weight:600; margin-bottom:4px;">${partName}</div>
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
    openModal(partId);
};
