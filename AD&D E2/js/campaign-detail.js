/* campaign-detail.js - Campaign Story Reader */
function renderCampaignDetail(container) {
    const campaign = State.selectedCampaign;
    if (!campaign) return changeView('campaigns');

    const linkedStory = linkifyStory(campaign.fullStory || campaign.description || 'No story available.');

    container.innerHTML = `
        <div class="min-h-screen p-4">
            <div class="max-w-4xl mx-auto">
                <div class="parchment scroll-border p-4 mb-4 fade-in">
                    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                        <div class="flex items-center gap-3">
                            <button onclick="changeView('campaigns')" class="btn-galactic px-3 py-2 rounded text-sm">
                                <i class="fas fa-arrow-left"></i> Back to Campaigns
                            </button>
                            <h1 class="fantasy-font text-2xl font-bold text-amber-900">${campaign.title}</h1>
                        </div>
                        <div class="flex gap-2">
                            <span class="text-xs bg-amber-200 text-amber-900 px-2 py-1 rounded">${campaign.code}</span>
                            <span class="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded border border-amber-300">${campaign.setting}</span>
                        </div>
                    </div>
                </div>

                <div class="parchment scroll-border p-6 mb-4 fade-in">
                    <div class="flex justify-between items-center mb-4">
                        <div class="flex gap-2 text-sm text-amber-800">
                            <span><i class="fas fa-layer-group mr-1"></i><strong>Levels:</strong> ${campaign.levels}</span>
                            <span><i class="fas fa-tag mr-1"></i><strong>Type:</strong> ${campaign.type}</span>
                        </div>
                        <button onclick="selectCampaign('${campaign.code.replace(/'/g, "\\'")}')" class="btn-fantasy px-4 py-2 rounded text-sm">
                            <i class="fas fa-check mr-1"></i>Use This Campaign
                        </button>
                    </div>

                    <div class="section-header"><i class="fas fa-book-open"></i>Full Campaign Story</div>
                    <div class="text-sm text-amber-900 leading-relaxed space-y-4 parchment p-4 rounded border border-amber-300" style="min-height: 300px;">
                        ${linkedStory}
                    </div>
                    <p class="text-xs text-amber-700 mt-3 italic">
                        <i class="fas fa-mouse-pointer mr-1"></i>Click on any highlighted monster, NPC, or location name to view its details in a popup.
                    </p>
                </div>

                <div class="parchment scroll-border p-4 fade-in">
                    <div class="section-header"><i class="fas fa-dragon"></i>Featured Monsters</div>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                        ${(() => {
                            const storyText = (campaign.fullStory || campaign.description || '').toLowerCase();
                            const featured = Object.keys(DB.monsters || {}).filter(m => storyText.includes(m.toLowerCase())).slice(0, 8);
                            if (featured.length === 0) return '<p class="text-amber-700 italic col-span-full">No specific monsters featured in this campaign summary.</p>';
                            return featured.map(m => {
                                const mon = DB.monsters[m];
                                return `
                                    <div class="p-2 bg-amber-100 rounded border border-amber-300 cursor-pointer hover:bg-amber-200 transition-colors" onclick="showMonsterDetail('${m.replace(/'/g, "\\'")}')">
                                        <div class="font-bold text-amber-900 text-sm">${m}</div>
                                        <div class="text-xs text-amber-700">AC ${mon.ac} &middot; HD ${mon.hd}</div>
                                        <div class="text-xs text-amber-600">${mon.category}</div>
                                    </div>
                                `;
                            }).join('');
                        })()}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function linkifyStory(text) {
    if (!text) return '<p class="italic text-amber-600">No story available.</p>';
    
    const monsters = Object.keys(DB.monsters || {});
    const npcs = Object.keys(DB.npcs || {});
    const locations = Object.keys(DB.locations || {});
    
    let html = escapeHtml(text);
    html = html.split(/\n\n+/).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
    
    monsters.forEach(m => {
        const regex = new RegExp('\\b' + escapeRegex(m) + '\\b', 'gi');
        html = html.replace(regex, `<span class="story-link monster-link" onclick="showMonsterDetail('${m.replace(/'/g, "\\'")}')">${m}</span>`);
    });
    
    npcs.forEach(n => {
        const regex = new RegExp('\\b' + escapeRegex(n) + '\\b', 'gi');
        html = html.replace(regex, `<span class="story-link npc-link" onclick="showNPCDetail('${n.replace(/'/g, "\\'")}')">${n}</span>`);
    });
    
    locations.forEach(l => {
        const regex = new RegExp('\\b' + escapeRegex(l) + '\\b', 'gi');
        html = html.replace(regex, `<span class="story-link location-link" onclick="showLocationDetail('${l.replace(/'/g, "\\'")}')">${l}</span>`);
    });
    
    return html;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function showMonsterDetail(name) {
    const mon = DB.monsters && DB.monsters[name];
    if (!mon) {
        toast(`Monster "${name}" not found in bestiary.`, 'error');
        return;
    }
    
    const hdMatch = mon.hd.match(/(\d+)(?:d(\d+))?/i);
    let hpRange = mon.hp || 'Varies';
    if (hdMatch) {
        const num = parseInt(hdMatch[1]);
        const die = parseInt(hdMatch[2] || 8);
        hpRange = `${num}-${num * die} (avg ${Math.floor(num * (die + 1) / 2)})`;
    }
    
    document.getElementById('modalContainer').innerHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal-content wide" onclick="event.stopPropagation()">
                <div class="p-6">
                    <div class="flex justify-between items-start mb-4">
                        <h2 class="fantasy-font text-2xl font-bold text-amber-900">${name}</h2>
                        <span class="text-xs bg-amber-200 text-amber-900 px-2 py-1 rounded">${mon.category || 'Monster'}</span>
                    </div>
                    
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <div class="bg-amber-100 rounded p-2 text-center">
                            <div class="text-xs text-amber-700">AC</div>
                            <div class="font-bold text-amber-900 text-lg">${mon.ac}</div>
                        </div>
                        <div class="bg-amber-100 rounded p-2 text-center">
                            <div class="text-xs text-amber-700">HD</div>
                            <div class="font-bold text-amber-900 text-lg">${mon.hd}</div>
                        </div>
                        <div class="bg-amber-100 rounded p-2 text-center">
                            <div class="text-xs text-amber-700">HP</div>
                            <div class="font-bold text-amber-900 text-lg">${hpRange}</div>
                        </div>
                        <div class="bg-amber-100 rounded p-2 text-center">
                            <div class="text-xs text-amber-700">THAC0</div>
                            <div class="font-bold text-amber-900 text-lg">${mon.thac0 || getTHAC0FromHD(mon.hd)}</div>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                        <div class="bg-amber-50 rounded p-2">
                            <div class="text-xs text-amber-700">Damage</div>
                            <div class="font-bold text-amber-900">${mon.damage || 'Varies'}</div>
                        </div>
                        <div class="bg-amber-50 rounded p-2">
                            <div class="text-xs text-amber-700">Movement</div>
                            <div class="font-bold text-amber-900">${mon.movement || '12"'}</div>
                        </div>
                        <div class="bg-amber-50 rounded p-2">
                            <div class="text-xs text-amber-700">Size</div>
                            <div class="font-bold text-amber-900">${mon.size || 'M'}</div>
                        </div>
                        <div class="bg-amber-50 rounded p-2">
                            <div class="text-xs text-amber-700">Alignment</div>
                            <div class="font-bold text-amber-900">${mon.alignment || 'Neutral'}</div>
                        </div>
                        <div class="bg-amber-50 rounded p-2">
                            <div class="text-xs text-amber-700">Intelligence</div>
                            <div class="font-bold text-amber-900">${mon.intelligence || 'Average'}</div>
                        </div>
                        <div class="bg-amber-50 rounded p-2">
                            <div class="text-xs text-amber-700">Rarity</div>
                            <div class="font-bold text-amber-900">${mon.rarity || 'Common'}</div>
                        </div>
                    </div>
                    
                    <div class="mb-4">
                        <div class="section-header text-sm"><i class="fas fa-shield-alt"></i>Saving Throws</div>
                        <div class="grid grid-cols-5 gap-2 text-center text-xs mt-2">
                            <div class="bg-amber-100 rounded p-1"><div class="text-amber-700">PPDM</div><div class="font-bold">${mon.saves?.ppdm || 'Varies'}</div></div>
                            <div class="bg-amber-100 rounded p-1"><div class="text-amber-700">RSW</div><div class="font-bold">${mon.saves?.rsw || 'Varies'}</div></div>
                            <div class="bg-amber-100 rounded p-1"><div class="text-amber-700">PP</div><div class="font-bold">${mon.saves?.pp || 'Varies'}</div></div>
                            <div class="bg-amber-100 rounded p-1"><div class="text-amber-700">BW</div><div class="font-bold">${mon.saves?.bw || 'Varies'}</div></div>
                            <div class="bg-amber-100 rounded p-1"><div class="text-amber-700">SP</div><div class="font-bold">${mon.saves?.sp || 'Varies'}</div></div>
                        </div>
                    </div>
                    
                    <div class="mb-4">
                        <div class="section-header text-sm"><i class="fas fa-comment"></i>Description</div>
                        <p class="text-sm text-amber-800 mt-2 leading-relaxed">${mon.description || 'No description available.'}</p>
                    </div>
                    
                    <div class="mb-4">
                        <div class="section-header text-sm"><i class="fas fa-magic"></i>Special Abilities</div>
                        <p class="text-sm text-amber-800 mt-2">${mon.special || 'None'}</p>
                    </div>
                    
                    <div class="flex justify-between items-center mt-4 pt-4 border-t border-amber-300">
                        <div class="text-xs text-amber-600">
                            <i class="fas fa-dice mr-1"></i>Encounter Chance: ${mon.encounterChance || 'Common (65%)'}
                        </div>
                        <button onclick="closeModal()" class="btn-galactic px-4 py-2 rounded">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function showNPCDetail(name) {
    const npc = DB.npcs && DB.npcs[name];
    if (!npc) {
        toast(`NPC "${name}" not found.`, 'error');
        return;
    }
    document.getElementById('modalContainer').innerHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="p-6">
                    <h2 class="fantasy-font text-xl font-bold text-amber-900 mb-2">${name}</h2>
                    <p class="text-sm text-amber-700 mb-1">${npc.race || 'Human'} ${npc.class || 'Commoner'} &middot; Level ${npc.level || 1}</p>
                    <p class="text-sm text-amber-800 mt-3">${npc.description || 'No description available.'}</p>
                    <div class="mt-4 flex justify-end">
                        <button onclick="closeModal()" class="btn-galactic px-4 py-2 rounded">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function showLocationDetail(name) {
    const loc = DB.locations && DB.locations[name];
    if (!loc) {
        toast(`Location "${name}" not found.`, 'error');
        return;
    }
    document.getElementById('modalContainer').innerHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="p-6">
                    <h2 class="fantasy-font text-xl font-bold text-amber-900 mb-2">${name}</h2>
                    <p class="text-sm text-amber-700 mb-1">${loc.type || 'Location'}</p>
                    <p class="text-sm text-amber-800 mt-3">${loc.description || 'No description available.'}</p>
                    <div class="mt-4 flex justify-end">
                        <button onclick="closeModal()" class="btn-galactic px-4 py-2 rounded">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getTHAC0FromHD(hd) {
    if (!hd) return 20;
    const match = hd.match(/(\d+)/);
    if (!match) return 20;
    const num = parseInt(match[1]);
    if (num <= 1) return 19;
    if (num <= 2) return 18;
    if (num <= 3) return 17;
    if (num <= 4) return 16;
    if (num <= 5) return 15;
    if (num <= 6) return 14;
    if (num <= 7) return 13;
    if (num <= 8) return 12;
    if (num <= 9) return 11;
    if (num <= 10) return 10;
    if (num <= 12) return 9;
    if (num <= 14) return 8;
    return 7;
}

function render() { renderCampaignDetail(document.getElementById('app')); }

initApp();
if (!State.currentUser) {
    changeView('login');
} else if (!State.selectedCampaign) {
    changeView('campaigns');
} else {
    renderCampaignDetail(document.getElementById('app'));
}