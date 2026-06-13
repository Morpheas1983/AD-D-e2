/* ============================
   MODULE: App Render & Init
   ============================ */

function render() {
    const app = document.getElementById('app');
    if (!app) return;
    app.innerHTML = '';

    try {
        switch(State.view) {
            case 'login': renderLogin(app); break;
            case 'dashboard': renderDashboard(app); break;
            case 'create': renderCreate(app); break;
            case 'sheet': renderSheet(app); break;
            case 'inventory': renderInventory(app); break;
            case 'levelup': renderLevelUp(app); break;
            case 'dm_view': renderDMView(app); break;
            case 'bestiary': renderBestiary(app); break;
            case 'monsters': renderMonsters(app); break;
            case 'spells': renderSpells(app); break;
            case 'campaign': renderCampaign(app); break;
    case 'tactical': renderTacticalMap(app); break;
    case 'campaigns': renderCampaigns(app); break;
    case 'campaign_detail': renderCampaignDetail(app); break;
            case 'users': renderUsers(app); break;
            default: 
                console.warn('Unknown view:', State.view);
                renderLogin(app);
        }
    } catch (err) {
        console.error('Render error:', err);
        app.innerHTML = `
            <div class="min-h-screen p-8 text-center">
                <div class="parchment scroll-border p-6 max-w-lg mx-auto">
                    <i class="fas fa-exclamation-triangle text-4xl text-red-700 mb-4"></i>
                    <h2 class="fantasy-font text-xl text-red-900 mb-2">Something went wrong</h2>
                    <p class="text-amber-800 mb-4">Error: ${err.message}</p>
                    <p class="text-sm text-amber-700 mb-4">View: ${State.view || 'undefined'}</p>
                    <button onclick="changeView('login')" class="btn-galactic px-4 py-2 rounded">Back to Login</button>
                </div>
            </div>
        `;
    }
}

/* ============================
   Initialization
   ============================ */
try {
    Storage.load();
    Sync.init();
    render();
} catch (err) {
    console.error('App initialization error:', err);
    document.getElementById('app').innerHTML = `
        <div style="padding:20px; color:#dc2626; font-family:sans-serif;">
            <h2>Application Error</h2>
            <p><strong>Error:</strong> ${err.message}</p>
            <p><strong>Stack:</strong></p>
            <pre style="background:#f3f4f6; padding:10px; overflow:auto; font-size:12px;">${err.stack}</pre>
            <p style="margin-top:20px;"><strong>Troubleshooting:</strong></p>
            <ul>
                <li>Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)</li>
                <li>Check browser console (F12) for more details</li>
                <li>Ensure all files are extracted from the zip</li>
            </ul>
        </div>
    `;
}
