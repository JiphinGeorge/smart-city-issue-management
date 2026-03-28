// --- TAILWIND CONFIGURATION ---
function getTailwindConfig() {
    const isAdminTheme = window.location.pathname.includes('admin') || window.location.pathname.includes('analytics');
    let themeColors = { "primary": "#3b82f6", "background-light": "#f9fafb", "background-dark": "#111827" };
    if (isAdminTheme) themeColors = { "primary": "#ec5b13", "background-light": "#f8f6f6", "background-dark": "#221610" };

    return {
        darkMode: "class",
        theme: { extend: { colors: themeColors, fontFamily: { "display": ["Public Sans", "Inter", "sans-serif"] }, borderRadius: { "DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px" } } }
    };
}
tailwind.config = getTailwindConfig();

// --- GLOBAL STATE ---
let globalIssues = [];
let currentFilter = 'All'; // 'All', 'Pending', 'Resolved'
let searchQuery = '';

// --- API CALLS ---
async function fetchCityData() {
    try {
        const res = await fetch('/api/issues');
        return await res.json();
    } catch(err) {
        console.error("Fetch failed:", err);
        return null;
    }
}

async function resolveIssueAPI(id) {
    await fetch(`/api/issues/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Resolved' })
    });
    await initApp(); 
}

async function deleteIssueAPI(id) {
    if(!confirm("Are you sure you want to delete this issue?")) return;
    await fetch(`/api/issues/${id}`, { method: 'DELETE' });
    await initApp(); 
    if (window.location.pathname.includes('details')) {
        window.location.href = '/';
    }
}

async function createIssueAPI(issueData) {
    await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(issueData)
    });
    await initApp(); 
}

// --- NEW MODAL UI FUNCTION (WITH IMAGE UPLOAD) ---
function openNewIssueModal() {
    if (document.getElementById('custom-issue-modal')) return;

    const modalHtml = `
    <div id="custom-issue-modal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity overflow-y-auto">
        <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 overflow-hidden font-display animate-fade-in-up my-auto">
            
            <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <h3 class="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                    <span class="material-symbols-outlined text-primary">add_circle</span> 
                    Report New Incident
                </h3>
                <button type="button" id="close-modal-x" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>

            <form id="new-issue-form" class="p-6 flex flex-col gap-4">
                <div class="flex flex-col gap-1.5">
                    <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Issue Title</label>
                    <input type="text" id="modal-title" required class="form-input w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:border-primary focus:ring-primary dark:text-white" placeholder="E.g. Broken traffic light on 5th Ave">
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div class="flex flex-col gap-1.5">
                        <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Category</label>
                        <select id="modal-category" class="form-select w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:border-primary focus:ring-primary dark:text-white">
                            <option value="Road">Road & Transport</option>
                            <option value="Utilities">Public Utilities</option>
                            <option value="Waste">Sanitation & Waste</option>
                            <option value="Electric">Electric & Lighting</option>
                        </select>
                    </div>
                    <div class="flex flex-col gap-1.5">
                        <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Priority</label>
                        <select id="modal-priority" class="form-select w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:border-primary focus:ring-primary dark:text-white">
                            <option value="Low">Low</option>
                            <option value="Medium" selected>Medium</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                        </select>
                    </div>
                </div>

                <div class="flex flex-col gap-1.5">
                    <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Description</label>
                    <textarea id="modal-desc" required rows="2" class="form-textarea w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:border-primary focus:ring-primary dark:text-white" placeholder="Provide details about the issue..."></textarea>
                </div>

                <div class="flex flex-col gap-1.5">
                    <label class="text-sm font-semibold text-slate-700 dark:text-slate-300">Photo Evidence (Optional)</label>
                    <input type="file" id="modal-image-upload" accept="image/*" class="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all cursor-pointer">
                    <div id="modal-image-preview-container" class="hidden mt-2">
                        <img id="modal-image-preview" src="" alt="Preview" class="w-full h-32 object-cover rounded-xl border border-slate-200 dark:border-slate-700">
                    </div>
                </div>

                <div class="flex justify-end gap-3 mt-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button type="button" id="close-modal-btn" class="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                    <button type="submit" id="submit-modal-btn" class="px-6 py-2.5 rounded-xl text-sm font-bold bg-primary text-white hover:brightness-110 transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
                        <span class="material-symbols-outlined text-[18px]">send</span> Submit Report
                    </button>
                </div>
            </form>
        </div>
    </div>`;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = modalHtml;
    document.body.appendChild(wrapper.firstElementChild);

    const modalEl = document.getElementById('custom-issue-modal');

    const closeModal = () => modalEl.remove();
    document.getElementById('close-modal-x').addEventListener('click', closeModal);
    document.getElementById('close-modal-btn').addEventListener('click', closeModal);
    modalEl.addEventListener('click', (e) => { if (e.target === modalEl) closeModal(); });

    let uploadedImageBase64 = null;
    const fileInput = document.getElementById('modal-image-upload');
    const previewContainer = document.getElementById('modal-image-preview-container');
    const previewImage = document.getElementById('modal-image-preview');

    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                uploadedImageBase64 = event.target.result; 
                previewImage.src = uploadedImageBase64;
                previewContainer.classList.remove('hidden'); 
            };
            reader.readAsDataURL(file);
        }
    });

    document.getElementById('new-issue-form').addEventListener('submit', async (e) => {
        e.preventDefault(); 
        
        const submitBtn = document.getElementById('submit-modal-btn');
        submitBtn.innerHTML = `<span class="material-symbols-outlined animate-spin text-[18px]">sync</span> Submitting...`;
        submitBtn.disabled = true;

        const randomLat = (40.7128 + (Math.random() - 0.5) * 0.05).toFixed(4);
        const randomLng = (-74.0060 + (Math.random() - 0.5) * 0.05).toFixed(4);

        const newIssue = {
            title: document.getElementById('modal-title').value,
            category: document.getElementById('modal-category').value,
            priority: document.getElementById('modal-priority').value,
            description: document.getElementById('modal-desc').value,
            location: { lat: parseFloat(randomLat), lng: parseFloat(randomLng) },
            image: uploadedImageBase64 || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80'
        };

        await createIssueAPI(newIssue);
        closeModal();
    });
}

// --- RENDER FUNCTIONS ---
function renderStats() {
    const safeSet = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    
    const total = globalIssues.length;
    const pending = globalIssues.filter(i => i.status === 'Pending').length;
    const resolved = globalIssues.filter(i => i.status === 'Resolved').length;

    safeSet('stat-total', total);
    safeSet('stat-pending', pending);
    safeSet('stat-resolved', resolved);
    
    safeSet('admin-stat-active', pending);
    const rate = total > 0 ? ((resolved / total) * 100).toFixed(1) : 0;
    safeSet('admin-stat-rate', `${rate}%`);
}

function renderDashboardIssues() {
    const container = document.getElementById('dashboard-issues-list');
    if (!container) return;

    let filtered = globalIssues.filter(issue => {
        const matchesFilter = currentFilter === 'All' || issue.status === currentFilter;
        const matchesSearch = issue.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              issue.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    if (filtered.length === 0) {
        container.innerHTML = `<div class="p-8 text-center text-slate-500">No issues found matching your criteria.</div>`;
        return;
    }

    container.innerHTML = filtered.map(issue => `
        <div class="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-4">
            <div class="size-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                ${issue.image ? `<img src="${issue.image}" class="w-full h-full object-cover">` : (issue.category === 'Road' ? '🚧' : issue.category === 'Waste' ? '🗑️' : issue.category === 'Electric' ? '💡' : '📍')}
            </div>
            <div class="flex-1">
                <div class="flex flex-wrap items-center gap-2 mb-1">
                    <h3 class="font-bold text-slate-900 dark:text-white text-base">${issue.title}</h3>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600">${issue.category}</span>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${issue.priority === 'High' || issue.priority === 'Critical' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30' : 'bg-slate-100 text-slate-600'}">${issue.priority}</span>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${issue.status === 'Pending' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30'}">${issue.status}</span>
                </div>
                <p class="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-1">${issue.description}</p>
                <div class="flex items-center justify-between">
                    <span class="text-xs text-slate-400 flex items-center gap-1">
                        <span class="material-symbols-outlined text-[14px]">schedule</span> ${new Date(issue.timestamp).toLocaleDateString()}
                    </span>
                    <div class="flex gap-2">
                        <a href="/details?id=${issue.id}" class="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">View</a>
                        ${issue.status === 'Pending' ? `<button onclick="resolveIssueAPI('${issue.id}')" class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20">Resolve</button>` : ''}
                        <button onclick="deleteIssueAPI('${issue.id}')" class="text-xs font-semibold px-2 py-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"><span class="material-symbols-outlined text-[18px]">delete</span></button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function renderAdminTable() {
    const tbody = document.getElementById('admin-issues-table');
    if (!tbody) return;

    let filtered = globalIssues.filter(issue => {
        const matchesFilter = currentFilter === 'All' || issue.status === currentFilter;
        const matchesSearch = issue.title.toLowerCase().includes(searchQuery.toLowerCase()) || issue.id.includes(searchQuery);
        return matchesFilter && matchesSearch;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-slate-500">No issues found matching criteria.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(issue => `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
            <td class="px-6 py-4">
                <div class="flex flex-col">
                    <span class="text-sm font-medium text-slate-900 dark:text-slate-100">${issue.title}</span>
                    <span class="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><span class="material-symbols-outlined text-[12px]">location_on</span> ID: #${issue.id}</span>
                </div>
            </td>
            <td class="px-6 py-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">${issue.category}</span>
            </td>
            <td class="px-6 py-4">
                <span class="inline-flex items-center gap-1.5 text-xs font-semibold ${issue.priority === 'High' || issue.priority === 'Critical' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}">
                    <span class="size-1.5 rounded-full ${issue.priority === 'High' || issue.priority === 'Critical' ? 'bg-red-600 dark:bg-red-400' : 'bg-amber-600 dark:bg-amber-400'}"></span> ${issue.priority}
                </span>
            </td>
            <td class="px-6 py-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${issue.status === 'Resolved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'}">${issue.status}</span>
            </td>
            <td class="px-6 py-4 text-center">
                <span class="text-sm font-bold text-slate-700 dark:text-slate-300">${new Date(issue.timestamp).toLocaleDateString()}</span>
            </td>
            <td class="px-6 py-4 text-right">
                <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a href="/details?id=${issue.id}" class="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"><span class="material-symbols-outlined text-xl">visibility</span></a>
                    ${issue.status === 'Pending' ? `<button onclick="resolveIssueAPI('${issue.id}')" class="p-1.5 rounded-lg text-slate-400 hover:text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"><span class="material-symbols-outlined text-xl">check_circle</span></button>` : ''}
                    <button onclick="deleteIssueAPI('${issue.id}')" class="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"><span class="material-symbols-outlined text-xl">delete</span></button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderDetailsPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const issueId = urlParams.get('id');
    const issue = globalIssues.find(i => i.id === issueId);

    if (!issue) return;

    document.getElementById('detail-id').textContent = `Issue #${issue.id}`;
    document.getElementById('detail-title').textContent = issue.title;
    document.getElementById('detail-category').textContent = issue.category;
    document.getElementById('detail-priority').textContent = `${issue.priority} Priority`;
    document.getElementById('detail-status').textContent = issue.status;
    document.getElementById('detail-timestamp').textContent = `Reported on ${new Date(issue.timestamp).toLocaleString()}`;
    document.getElementById('detail-description').textContent = issue.description;
    
    if (issue.location) {
        document.getElementById('detail-lat').textContent = `${issue.location.lat}° N`;
        document.getElementById('detail-lng').textContent = `${issue.location.lng}° W`;
    }

    const detailImageEl = document.getElementById('detail-image');
    if (detailImageEl) {
        detailImageEl.style.backgroundImage = `url('${issue.image || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1200&q=80'}')`;
    }

    const resolveBtn = document.getElementById('btn-detail-resolve');
    const deleteBtn = document.getElementById('btn-detail-delete');

    if (resolveBtn) {
        const newResolveBtn = resolveBtn.cloneNode(true);
        resolveBtn.parentNode.replaceChild(newResolveBtn, resolveBtn);
        if (issue.status === 'Resolved') {
            newResolveBtn.disabled = true;
            newResolveBtn.classList.add('opacity-50', 'cursor-not-allowed');
            newResolveBtn.innerHTML = `<span class="material-symbols-outlined">check_circle</span> Already Resolved`;
        } else {
            newResolveBtn.addEventListener('click', async () => {
                newResolveBtn.innerHTML = `<span class="material-symbols-outlined animate-spin">sync</span> Resolving...`;
                await resolveIssueAPI(issue.id);
                window.location.reload(); 
            });
        }
    }

    if (deleteBtn) {
        const newDeleteBtn = deleteBtn.cloneNode(true);
        deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);
        newDeleteBtn.addEventListener('click', async () => await deleteIssueAPI(issue.id));
    }
}

function renderAnalyticsPage() {
    const total = globalIssues.length || 1; 

    const catCounts = globalIssues.reduce((acc, issue) => {
        acc[issue.category] = (acc[issue.category] || 0) + 1;
        return acc;
    }, {});

    const catContainer = document.getElementById('analytics-category-chart');
    if (catContainer) {
        const colors = ['bg-primary', 'bg-primary/80', 'bg-primary/60', 'bg-primary/40', 'bg-primary/20'];
        catContainer.innerHTML = Object.entries(catCounts)
            .sort((a, b) => b[1] - a[1]) 
            .map(([cat, count], idx) => {
                const pct = Math.round((count / total) * 100);
                return `
                <div class="space-y-2">
                    <div class="flex justify-between text-sm"><span class="text-slate-600 dark:text-slate-300">${cat}</span><span class="font-bold">${pct}%</span></div>
                    <div class="w-full bg-slate-100 dark:bg-primary/5 rounded-full h-2.5 overflow-hidden"><div class="${colors[idx % colors.length]} h-full rounded-full chart-bar transition-all duration-1000" style="width: ${pct}%;"></div></div>
                </div>`;
            }).join('');
    }

    const prioCounts = { "High": 0, "Medium": 0, "Low": 0, "Critical": 0 };
    globalIssues.forEach(issue => { if (prioCounts[issue.priority] !== undefined) prioCounts[issue.priority]++; });

    const prioContainer = document.getElementById('analytics-priority-chart');
    if (prioContainer) {
        const maxCount = Math.max(...Object.values(prioCounts)) || 1;
        const bgMap = { "Critical": "bg-rose-700", "High": "bg-rose-500", "Medium": "bg-amber-500", "Low": "bg-emerald-500" };

        prioContainer.innerHTML = `
            <div class="absolute inset-x-0 top-4 bottom-12 flex flex-col justify-between pointer-events-none opacity-10">
                <div class="border-t border-slate-500"></div><div class="border-t border-slate-500"></div><div class="border-t border-slate-500"></div><div class="border-t border-slate-500"></div>
            </div>
            ${['Critical', 'High', 'Medium', 'Low'].map((prio) => {
                const count = prioCounts[prio];
                const height = Math.max((count / maxCount) * 100, 5); 
                return `
                <div class="flex-1 flex flex-col items-center gap-3 h-full justify-end z-10">
                    <div class="w-full max-w-[60px] ${bgMap[prio]} rounded-t-lg relative group transition-all duration-1000" style="height: ${height}%;">
                        <div class="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-bold opacity-0 group-hover:opacity-100 bg-slate-800 text-white px-2 py-1 rounded">${count}</div>
                    </div>
                    <span class="text-xs font-medium text-slate-500 truncate">${prio}</span>
                </div>`;
            }).join('')}
        `;
    }
}

// --- EVENT LISTENERS & WIRING ---
function setupInteractivity() {
    // --- LOGIN PAGE LOGIC ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Stop page reload

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorBox = document.getElementById('login-error');
            const submitBtn = document.getElementById('btn-login-submit');

            // UI Loading state
            submitBtn.innerHTML = `<span class="material-symbols-outlined animate-spin text-[18px]">sync</span> Authenticating...`;
            errorBox.classList.add('hidden');

            try {
                // Send credentials to backend
                const res = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await res.json();

                if (res.ok && data.success) {
                    // Save role in local storage (optional, useful for hiding UI elements later)
                    localStorage.setItem('cityops_role', data.role);
                    localStorage.setItem('cityops_name', data.name);
                    
                    // Redirect the user to the URL the server told us to use!
                    window.location.href = data.redirectUrl;
                } else {
                    // Show error
                    errorBox.textContent = data.error || "Login failed.";
                    errorBox.classList.remove('hidden');
                    submitBtn.innerHTML = `Sign In <span class="material-symbols-outlined text-[18px]">arrow_forward</span>`;
                }
            } catch (err) {
                errorBox.textContent = "Server connection error.";
                errorBox.classList.remove('hidden');
                submitBtn.innerHTML = `Sign In <span class="material-symbols-outlined text-[18px]">arrow_forward</span>`;
            }
        });
    }

    // --- REGISTER PAGE LOGIC ---
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 

            const name = document.getElementById('full_name').value;
            const email = document.getElementById('email').value;
            const ward = document.getElementById('ward').value;
            const password = document.getElementById('password').value;
            
            const errorBox = document.getElementById('register-error');
            const submitBtn = document.getElementById('btn-register-submit');

            // UI Loading state
            submitBtn.innerHTML = `<span class="material-symbols-outlined animate-spin text-[18px]">sync</span> Creating...`;
            errorBox.classList.add('hidden');

            try {
                const res = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, ward, password })
                });
                
                const data = await res.json();

                if (res.ok && data.success) {
                    localStorage.setItem('cityops_role', data.role);
                    localStorage.setItem('cityops_name', data.name);
                    window.location.href = data.redirectUrl;
                } else {
                    errorBox.textContent = data.error || "Registration failed.";
                    errorBox.classList.remove('hidden');
                    submitBtn.textContent = "Create Account";
                }
            } catch (err) {
                errorBox.textContent = "Server connection error.";
                errorBox.classList.remove('hidden');
                submitBtn.textContent = "Create Account";
            }
        });
    }

    // Wire up custom Modal
    const dashNewIssueBtn = document.getElementById('btn-new-issue');
    if (dashNewIssueBtn) dashNewIssueBtn.addEventListener('click', openNewIssueModal);

    const adminNewIssueBtn = document.getElementById('btn-admin-new-issue');
    if (adminNewIssueBtn) adminNewIssueBtn.addEventListener('click', openNewIssueModal);

    // AI Suggestion System logic
    const aiBtn = document.getElementById('btn-ai-analyze');
    const aiTextArea = document.getElementById('ai-input');
    const aiImageUpload = document.getElementById('ai-image-upload');
    const aiPreviewContainer = document.getElementById('ai-image-preview-container');
    const aiPreviewImage = document.getElementById('ai-image-preview');

    let aiUploadedImageBase64 = null;

    if (aiImageUpload) {
        aiImageUpload.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    aiUploadedImageBase64 = event.target.result;
                    aiPreviewImage.src = aiUploadedImageBase64;
                    aiPreviewContainer.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    if (aiBtn && aiTextArea) {
        aiBtn.addEventListener('click', async () => {
            if(!aiTextArea.value.trim()) return alert("Please describe the issue first.");
            
            aiBtn.innerHTML = `<span class="material-symbols-outlined animate-spin text-[20px]">sync</span> Analyzing...`;
            
            const res = await fetch('/api/analyze', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ description: aiTextArea.value }) 
            });
            const suggestion = await res.json();
            
            aiBtn.innerHTML = `<span class="material-symbols-outlined text-[20px]">magic_button</span> Analyze & Categorize`;
            aiTextArea.value = ''; 
            if (aiImageUpload) aiImageUpload.value = ''; 
            if (aiPreviewContainer) aiPreviewContainer.classList.add('hidden'); 
            
            suggestion.location = { 
                lat: (40.7128 + (Math.random() - 0.5) * 0.05).toFixed(4), 
                lng: (-74.0060 + (Math.random() - 0.5) * 0.05).toFixed(4) 
            };
            
            suggestion.image = aiUploadedImageBase64 || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80';

            aiUploadedImageBase64 = null;

            await createIssueAPI(suggestion);
        });
    }

    // Search input
    const searchInput = document.querySelector('input[placeholder="Search issues..."]');
    if (searchInput) searchInput.addEventListener('input', (e) => { searchQuery = e.target.value; renderDashboardIssues(); });

    const adminSearch = document.getElementById('admin-search-input');
    if (adminSearch) adminSearch.addEventListener('input', (e) => { searchQuery = e.target.value; renderAdminTable(); });

    // Category filters
    const filterButtons = document.querySelectorAll('.bg-slate-100.dark\\:bg-slate-800.p-1 button, #admin-filter-container a');
    if (filterButtons.length > 0) {
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const isDashboard = e.currentTarget.tagName === 'BUTTON';
                
                if (isDashboard) {
                    filterButtons.forEach(b => b.className = "px-4 py-2 rounded-lg text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700");
                    e.target.className = "px-4 py-2 rounded-lg bg-white dark:bg-slate-900 shadow-sm text-sm font-semibold text-slate-900 dark:text-white";
                    currentFilter = e.target.textContent.includes("All") ? "All" : e.target.textContent;
                    renderDashboardIssues();
                } else {
                    filterButtons.forEach(b => b.className = "cursor-pointer flex items-center gap-2 border-b-2 border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 pb-3 pt-2 px-1 transition-colors");
                    e.currentTarget.className = "cursor-pointer flex items-center gap-2 border-b-2 border-primary text-primary pb-3 pt-2 px-1";
                    currentFilter = e.currentTarget.getAttribute('data-filter');
                    renderAdminTable();
                }
            });
        });
    }
}

function enforceSecurityAndUI() {
    const role = localStorage.getItem('cityops_role');
    const name = localStorage.getItem('cityops_name') || 'Citizen';
    const path = window.location.pathname;
    const isAuthPage = path.includes('login') || path.includes('register');

    if (!role && !isAuthPage) {
        window.location.href = '/login';
        return false;
    }
    if (role !== 'admin' && (path.includes('admin') || path.includes('analytics'))) {
        window.location.href = '/';
        return false;
    }
    if (role && isAuthPage) {
        window.location.href = role === 'admin' ? '/admin' : '/';
        return false;
    }

    if (!isAuthPage) {
        if (role !== 'admin') {
            const adminLinks = document.querySelectorAll('a[href="/admin"], a[href="/analytics"]');
            adminLinks.forEach(link => link.style.display = 'none');
        }

        const nameSpans = document.querySelectorAll('.text-sm.font-bold.text-slate-900.dark\\\\:text-slate-100');
        nameSpans.forEach(span => {
            if(span.textContent === 'Alex Rivers' || span.textContent.includes('Alex')) span.textContent = name;
        });

        const avatars = document.querySelectorAll('div[data-alt*="User avatar"], div[data-alt*="User profile"]');
        avatars.forEach(avatar => {
            avatar.style.cursor = 'pointer';
            avatar.title = `Logout (${name})`;
            avatar.addEventListener('click', () => {
                if(confirm('Are you sure you want to log out?')) {
                    localStorage.removeItem('cityops_role');
                    localStorage.removeItem('cityops_name');
                    window.location.href = '/login';
                }
            });
        });
        
        const buttons = document.querySelectorAll('button');
        buttons.forEach(btn => {
            if (btn.textContent.includes('Export Data') || btn.textContent.includes('Export CSV')) {
                btn.addEventListener('click', () => {
                    if(!globalIssues.length) return alert("No data to export.");
                    const headers = ['ID', 'Title', 'Category', 'Priority', 'Status', 'Date'];
                    const csvLines = [headers.join(',')];
                    globalIssues.forEach(i => {
                        csvLines.push(`${i.id},"${i.title.replace(/"/g, '""')}",${i.category},${i.priority},${i.status},${new Date(i.timestamp).toLocaleDateString()}`);
                    });
                    const blob = new Blob([csvLines.join('\\n')], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url; a.download = 'cityops_export.csv';
                    a.click(); URL.revokeObjectURL(url);
                });
            }
            if(btn.textContent.includes('Open Full Map View')) {
                btn.addEventListener('click', () => alert("Map View is currently loading background tiles. (Prototype feature)"));
            }
        });
        
        document.querySelectorAll('a[href="#"]').forEach(a => a.addEventListener('click', e => {
            if(e.currentTarget.textContent.includes('Forgot')) {
                alert("Please contact your CityOps administrator to reset your password.");
            }
            e.preventDefault();
        }));
    }
    return true;
}

// --- INITIALIZATION ---
async function initApp() {
    if (!enforceSecurityAndUI()) return;

    const data = await fetchCityData();
    if (data) {
        globalIssues = data.issues ? data.issues : data;
        
        renderStats(); 
        
        const path = window.location.pathname;
        if (path === '/' || path === '/index.html') renderDashboardIssues();
        else if (path.includes('admin')) renderAdminTable();
        else if (path.includes('details')) renderDetailsPage();
        else if (path.includes('analytics')) renderAnalyticsPage();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initApp();
    setupInteractivity();
});