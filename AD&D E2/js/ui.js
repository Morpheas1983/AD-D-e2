/* ============================
   MODULE: UI Renderer (app.js)
   ============================ */
function render() {
    const app = $('app');
    app.innerHTML = '';
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
    }
}

function renderLogin(container) {
    container.innerHTML = `
        <div class="min-h-screen flex items-center justify-center p-4">
            <div class="parchment scroll-border p-8 max-w-md w-full text-center fade-in">
                <div class="mb-6">
                    <i class="fas fa-dungeon text-6xl text-amber-700 mb-4"></i>
                    <h1 class="fantasy-font text-3xl font-bold text-amber-900 mb-2">AD&D 2nd Edition</h1>
                    <p class="text-amber-700 text-sm">Character Sheet Manager</p>
                </div>
                <div class="space-y-3">
                    <div class="text-left">
                        <label class="text-xs font-bold text-amber-800">Username</label>
                        <input type="text" id="loginUsername" placeholder="Enter username..." 
                               class="input-fantasy w-full px-4 py-3 rounded text-lg">
                    </div>
                    <div class="text-left">
                        <label class="text-xs font-bold text-amber-800">Password</label>
                        <input type="password" id="loginPassword" placeholder="Enter password..." 
                               class="input-fantasy w-full px-4 py-3 rounded text-lg">
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <button onclick="login('player')" class="btn-fantasy px-4 py-3 rounded text-lg font-bold">
                            <i class="fas fa-user mr-2"></i>Player Login
                        </button>
                        <button onclick="login('dm')" class="btn-magic px-4 py-3 rounded text-lg font-bold">
                            <i class="fas fa-dragon mr-2"></i>DM Login
                        </button>
                    </div>
                </div>
                <div class="mt-4 p-3 bg-amber-100 rounded border border-amber-300 text-xs text-amber-800">
                    <p class="font-bold mb-1">Default Accounts:</p>
                    <p><strong>DM:</strong> username: <code>dm</code> / password: <code>password</code></p>
                    <p><strong>Player:</strong> username: <code>player1</code> / password: <code>password</code></p>
                    <p><strong>Player:</strong> username: <code>player2</code> / password: <code>password</code></p>
                </div>
            </div>
        </div>
    `;
}

function renderDashboard(container) {
    const hasCampaignFilter = !!State.campaignId;
    const campaignChars = hasCampaignFilter 
        ? State.characters.filter(c => c.campaignId === State.campaignId)
        : State.characters;
    const myChars = State.isDM ? campaignChars : campaignChars.filter(c => c.player === State.currentUser);

    // For player campaign switcher: only show campaigns this player has characters in
    const playerCampaigns = State.isDM 
        ? [...new Set(State.characters.map(c => c.campaignId).filter(Boolean))]
        : [...new Set(State.characters.filter(c => c.player === State.currentUser).map(c => c.campaignId).filter(Boolean))];

    container.innerHTML = `
        <div class="min-h-screen p-4">
            <div class="max-w-6xl mx-auto">
                <div class="parchment scroll-border p-6 mb-6 fade-in">
                    <div class="flex justify-between items-center flex-wrap gap-4">
                        <div class="flex items-center gap-3">
                            <i class="fas fa-dragon text-3xl text-amber-700"></i>
                            <div>
                                <h1 class="fantasy-font text-2xl font-bold text-amber-900">AD&D 2e Character Manager</h1>
                                <p class="text-sm text-amber-800">${State.isDM ? 'Dungeon Master View' : `Player: ${State.currentUser}`}${State.campaignId ? ` | Campaign: <span class="font-bold text-amber-900">${State.campaignId}</span>` : ' | <span class="font-bold text-amber-900">All Characters</span>'}</p>
                            </div>
                        </div>
                        <div class="flex gap-2 flex-wrap items-center">
                            <span id="firebaseStatus" class="text-xs px-2 py-1 rounded bg-amber-100 text-amber-800 border border-amber-300 mr-1">
                                <i class="fas fa-wifi mr-1"></i>Connecting...
                            </span>
                            <div class="flex items-center gap-2 border-r border-amber-300 pr-2 mr-1">
                                <span class="text-xs text-amber-800 font-bold">View:</span>
                                <select id="campaignSwitcher" onchange="switchCampaign(this.value)" class="input-fantasy text-xs px-2 py-1" style="min-width:140px">
                                    <option value="" ${!State.campaignId ? 'selected' : ''}>All Characters</option>
                                    ${playerCampaigns.filter(id => id !== 'default').map(cid => `<option value="${cid}" ${State.campaignId === cid ? 'selected' : ''}>${cid}</option>`).join('')}
                                    ${State.campaignId && !playerCampaigns.includes(State.campaignId) && State.campaignId !== 'default' ? `<option value="${State.campaignId}" selected>${State.campaignId}</option>` : ''}
                                    <option value="default" ${State.campaignId === 'default' ? 'selected' : ''}>Solo Play</option>
                                </select>
                                ${State.isDM ? `
                                    <input type="text" id="newCampaignInput" placeholder="New campaign..." class="input-fantasy text-xs px-2 py-1" style="width:100px" onkeydown="if(event.key==='Enter'){createCampaign($('newCampaignInput').value);}">
                                    <button onclick="createCampaign($('newCampaignInput').value)" class="btn-fantasy px-2 py-1 rounded text-xs" title="Create Campaign"><i class="fas fa-plus"></i></button>
                                ` : ''}
                            </div>
                            ${State.isDM ? `
                                <button onclick="changeView('dm_view')" class="btn-fantasy px-4 py-2 rounded text-sm">
                                    <i class="fas fa-users mr-1"></i>Party View
                                </button>
                            ` : ''}
                            <button onclick="changeView('campaign')" class="btn-fantasy px-4 py-2 rounded text-sm">
                                <i class="fas fa-book mr-1"></i>Campaign
                            </button>
                            <button onclick="changeView('tactical')" class="btn-fantasy px-4 py-2 rounded text-sm">
                                <i class="fas fa-chess-board mr-1"></i>Tactical Map
                            </button>
                            <button onclick="changeView('create')" class="btn-fantasy px-4 py-2 rounded text-sm">
                                <i class="fas fa-plus mr-1"></i>New Character
                            </button>
                            <button onclick="exportCampaign()" class="btn-galactic px-4 py-2 rounded text-sm">
                                <i class="fas fa-download mr-1"></i>Export
                            </button>
                            <button onclick="importCampaign()" class="btn-galactic px-4 py-2 rounded text-sm">
                                <i class="fas fa-upload mr-1"></i>Import
                            </button>
                            <button onclick="logout()" class="btn-galactic px-4 py-2 rounded text-sm">
                                <i class="fas fa-sign-out-alt mr-1"></i>Logout
                            </button>
                        </div>
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${myChars.length === 0 ? `
                        <div class="col-span-full parchment scroll-border p-8 text-center">
                            <i class="fas fa-scroll text-4xl text-amber-700 mb-3"></i>
                            <p class="fantasy-font text-lg text-amber-900">${hasCampaignFilter ? 'No characters in this campaign' : 'No characters found'}</p>
                            <p class="text-amber-800 text-sm mt-2">${hasCampaignFilter ? 'Switch to All Characters or create a new character.' : 'Create your first character to begin your adventure!'}</p>
                        </div>
                    ` : myChars.map(char => `
                        <div class="parchment scroll-border p-4 cursor-pointer hover:shadow-xl transition-all duration-300 fade-in" 
                             onclick="loadCharacter('${char.id}')">
                            <div class="flex justify-between items-start mb-3">
                                <div>
                                    <h3 class="fantasy-font text-lg font-bold text-amber-900">${char.name || 'Unnamed'}</h3>
                                    <p class="text-sm text-amber-800">${char.race} ${char.kit !== 'None' ? char.kit : char.class}</p>
                                    <p class="text-xs text-amber-700">${char.alignment || ''}</p>
                                </div>
                                <div class="text-right">
                                    <div class="text-2xl font-bold text-amber-900 fantasy-font">${char.level || 1}</div>
                                    <div class="text-xs text-amber-700">Level</div>
                                </div>
                            </div>
                            <div class="grid grid-cols-3 gap-2 mb-3">
                                <div class="text-center bg-amber-100 rounded p-1">
                                    <div class="text-xs text-amber-800">HP</div>
                                    <div class="font-bold text-amber-900">${char.hp}/${char.maxHp}</div>
                                </div>
                                <div class="text-center bg-amber-100 rounded p-1">
                                    <div class="text-xs text-amber-800">AC</div>
                                    <div class="font-bold text-amber-900">${calcAC(char)}</div>
                                </div>
                                <div class="text-center bg-amber-100 rounded p-1">
                                    <div class="text-xs text-amber-800">THAC0</div>
                                    <div class="font-bold text-amber-900">${getTHAC0(char.class, char.level)}</div>
                                </div>
                            </div>
                            <div class="hp-bar mb-1">
                                <div class="hp-fill" style="width: ${((char.hp || 0)/(char.maxHp || 1))*100}%"></div>
                            </div>
                            <div class="xp-bar">
                                <div class="xp-fill" style="width: ${Math.min(((char.xp || 0)/getNextXP(char.class, char.level || 1))*100, 100)}%"></div>
                            </div>
                            <div class="flex justify-between text-xs text-amber-700 mt-1">
                                <span>XP: ${char.xp || 0}</span>
                                <span>Next: ${getNextXP(char.class, char.level || 1)}</span>
                            </div>
                            <div class="mt-2 flex justify-between items-center">
                                ${char.campaignId && char.campaignId !== 'default' ? `<span class="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded border border-amber-300"><i class="fas fa-campground mr-1"></i>${char.campaignId}</span>` : ''}
                                ${State.isDM ? `<span class="text-xs text-amber-600">${char.player}</span>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    setTimeout(updateConnectionStatus, 0);
}function renderCreate(container) {
    container.innerHTML = `
        <div class="min-h-screen p-4">
            <div class="max-w-4xl mx-auto">
                <div class="parchment scroll-border p-6 mb-4 fade-in">
                    <div class="flex justify-between items-center">
                        <h1 class="fantasy-font text-2xl font-bold text-amber-900">
                            <i class="fas fa-hat-wizard mr-2 text-amber-700"></i>Create Character
                        </h1>
                        <button onclick="changeView('dashboard')" class="btn-galactic px-4 py-2 rounded text-sm">
                            <i class="fas fa-arrow-left mr-1"></i>Back
                        </button>
                    </div>
                </div>
                <div id="createWizard" class="parchment scroll-border p-6 fade-in">
                    <div class="flex gap-1 mb-6 border-b-2 border-amber-300 pb-2 overflow-x-auto">
                        <button class="tab-btn active" data-step="1">1. Basics</button>
                        <button class="tab-btn" data-step="2">2. Class & Kit</button>
                        <button class="tab-btn" data-step="3">3. Stats</button>
                        <button class="tab-btn" data-step="4">4. Details</button>
                        <button class="tab-btn" data-step="5">5. HP & Equipment</button>
                    </div>
                    <div id="step1" class="create-step">
                        <div class="grid-2 gap-4">
                            <div>
                                <label class="block text-sm font-bold text-amber-900 mb-1">Character Name</label>
                                <input type="text" id="charName" class="input-fantasy w-full px-3 py-2" placeholder="Enter name...">
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-amber-900 mb-1">Player Name</label>
                                <input type="text" id="charPlayer" class="input-fantasy w-full px-3 py-2" value="${State.currentUser}" readonly>
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-amber-900 mb-1">Race</label>
                                <select id="charRace" class="input-fantasy w-full px-3 py-2" onchange="updateRacePreview()">
                                    ${Object.keys(DB.races).map(r => `<option value="${r}">${r}</option>`).join('')}
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-amber-900 mb-1">Alignment</label>
                                <select id="charAlignment" class="input-fantasy w-full px-3 py-2" onchange="updateSchoolSphereSelection()">
                                    ${DB.alignments.map(a => `<option value="${a}">${a}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                        <div id="racePreview" class="mt-4 p-3 bg-amber-100 rounded border border-amber-300 text-sm text-amber-900"></div>
                    </div>
                    <div id="step2" class="create-step hidden">
                        <div class="grid-2 gap-4 mb-4">
                            <div>
                                <label class="block text-sm font-bold text-amber-900 mb-1">Class</label>
                                <select id="charClass" class="input-fantasy w-full px-3 py-2" onchange="updateClassOptions()">
                                    <option value="">Select Class...</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-amber-900 mb-1">Kit</label>
                                <select id="charKit" class="input-fantasy w-full px-3 py-2" onchange="updateSchoolSphereSelection()">
                                    <option value="None">None</option>
                                </select>
                            </div>
                        </div>
                        <div id="classPreview" class="p-3 bg-amber-100 rounded border border-amber-300 text-sm mb-4"></div>
                        <div id="schoolSphereSelection" class="hidden mb-4">
                            <div class="section-header"><i class="fas fa-hat-wizard"></i>Magic Schools / Spheres</div>
                            <div id="schoolSphereContent" class="p-3 bg-amber-100 rounded border border-amber-300 text-sm"></div>
                        </div>
                        <div class="section-header"><i class="fas fa-shield-alt"></i>Proficiencies</div>
                        <div class="grid-2 gap-4">
                            <div>
                                <label class="block text-sm font-bold text-amber-900 mb-1">Weapon Proficiencies</label>
                                <div id="weaponProfs" class="space-y-2 max-h-48 overflow-y-auto p-2 border border-amber-300 rounded bg-amber-50"></div>
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-amber-900 mb-1">Non-Weapon Proficiencies</label>
                                <div id="nonweaponProfs" class="space-y-2 max-h-48 overflow-y-auto p-2 border border-amber-300 rounded bg-amber-50"></div>
                            </div>
                        </div>
                    </div>
                    <div id="step3" class="create-step hidden">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="fantasy-font text-lg text-amber-900">Ability Scores</h3>
                            <button onclick="rollCharacterStats()" class="btn-fantasy px-4 py-2 rounded text-sm">
                                <i class="fas fa-dice-d20 mr-1"></i>Roll Stats
                            </button>
                        </div>
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                            ${['str','dex','con','int','wis','cha'].map(stat => `
                                <div class="stat-box p-3">
                                    <div class="stat-label">${stat.toUpperCase()}</div>
                                    <input type="number" id="stat_${stat}" class="stat-value bg-transparent border-none text-center w-full" 
                                           value="10" min="3" max="19" onchange="updateStatPreview()">
                                    <div id="mod_${stat}" class="stat-mod">+0</div>
                                </div>
                            `).join('')}
                        </div>
                        <div id="statValidation" class="mb-2 text-sm font-bold"></div><div id="statPreview" class="p-3 bg-amber-100 rounded border border-amber-300 text-sm"></div>
                    </div>
                    <div id="step4" class="create-step hidden">
                        <div class="grid-2 gap-4">
                            <div>
                                <label class="block text-sm font-bold text-amber-900 mb-1">Age</label>
                                <input type="number" id="charAge" class="input-fantasy w-full px-3 py-2" value="20">
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-amber-900 mb-1">Height</label>
                                <input type="text" id="charHeight" class="input-fantasy w-full px-3 py-2" placeholder="5'10">
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-amber-900 mb-1">Weight</label>
                                <input type="text" id="charWeight" class="input-fantasy w-full px-3 py-2" placeholder="160 lbs">
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-amber-900 mb-1">Hair Color</label>
                                <input type="text" id="charHair" class="input-fantasy w-full px-3 py-2" placeholder="Brown">
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-amber-900 mb-1">Eye Color</label>
                                <input type="text" id="charEyes" class="input-fantasy w-full px-3 py-2" placeholder="Blue">
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-amber-900 mb-1">Deity</label>
                                <input type="text" id="charDeity" class="input-fantasy w-full px-3 py-2" placeholder="">
                            </div>
                        </div>
                        <div class="mt-4">
                            <label class="block text-sm font-bold text-amber-900 mb-1">Background / Personality</label>
                            <textarea id="charBackground" class="input-fantasy w-full px-3 py-2 h-24 resize-none" placeholder="Describe your character..."></textarea>
                        </div>
                    </div>
                    <div id="step5" class="create-step hidden">
                        <div class="section-header"><i class="fas fa-heart"></i>Starting Hit Points</div>
                        <div class="grid-2 gap-4 mb-4">
                            <div>
                                <label class="block text-sm font-bold text-amber-900 mb-1">Hit Die</label>
                                <div id="createHPDie" class="p-3 bg-amber-100 rounded border border-amber-300 text-center font-bold text-amber-900 fantasy-font">Select a class first</div>
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-amber-900 mb-1">Starting HP</label>
                                <div class="flex gap-2">
                                    <input type="number" id="createHP" class="input-fantasy w-full px-3 py-2 text-center text-lg font-bold" value="1" min="1">
                                    <button onclick="rollCreateHP()" class="btn-fantasy px-4 py-2 rounded" title="Roll HP">
                                        <i class="fas fa-dice"></i>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div class="section-header"><i class="fas fa-coins"></i>Starting Gold & Equipment</div>
                        <div class="flex gap-4 mb-4 items-center">
                            <div class="flex-1">
                                <label class="block text-sm font-bold text-amber-900 mb-1">Starting Gold (gp)</label>
                                <input type="number" id="charGold" class="input-fantasy w-full px-3 py-2" value="0">
                            </div>
                            <button onclick="rollStartingGold()" class="btn-fantasy px-4 py-2 rounded mt-6">
                                <i class="fas fa-dice mr-1"></i>Roll
                            </button>
                        </div>
                        <div class="grid-2 gap-4">
                            <div>
                                <label class="block text-sm font-bold text-amber-900 mb-1">Weapons</label>
                                <div class="max-h-48 overflow-y-auto border border-amber-300 rounded bg-amber-50 p-2">
                                    ${DB.weapons.map(w => `
                                        <div class="flex justify-between items-center p-1 hover:bg-amber-200 cursor-pointer" onclick="addToInventory('weapon', '${w.name}')">
                                            <span class="text-sm">${w.name}</span>
                                            <span class="text-xs text-amber-700">${w.cost}gp</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-amber-900 mb-1">Armor & Gear</label>
                                <div class="max-h-48 overflow-y-auto border border-amber-300 rounded bg-amber-50 p-2">
                                    ${DB.armor.map(a => `
                                        <div class="flex justify-between items-center p-1 hover:bg-amber-200 cursor-pointer" onclick="addToInventory('armor', '${a.name}')">
                                            <span class="text-sm">${a.name}</span>
                                            <span class="text-xs text-amber-700">${a.cost}gp</span>
                                        </div>
                                    `).join('')}
                                    <div class="border-t border-amber-300 my-1"></div>
                                    ${DB.gear.map(g => `
                                        <div class="flex justify-between items-center p-1 hover:bg-amber-200 cursor-pointer" onclick="addToInventory('gear', '${g.name}')">
                                            <span class="text-sm">${g.name}</span>
                                            <span class="text-xs text-amber-700">${g.cost}gp</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                        <div class="mt-4 p-3 bg-amber-100 rounded border border-amber-300">
                            <div class="flex justify-between items-center mb-2">
                                <span class="font-bold text-amber-900">Selected Items:</span>
                                <span class="text-sm text-amber-700">Gold Remaining: <span id="goldRemaining" class="font-bold">0</span> gp</span>
                            </div>
                            <div id="startingInventory" class="text-sm space-y-1"></div>
                        </div>
                    </div>
                    <div class="flex justify-between mt-6 pt-4 border-t-2 border-amber-300">
                        <button id="prevBtn" onclick="prevStep()" class="btn-galactic px-6 py-2 rounded hidden">
                            <i class="fas fa-arrow-left mr-1"></i>Previous
                        </button>
                        <div class="flex-1"></div>
                        <button id="nextBtn" onclick="nextStep()" class="btn-fantasy px-6 py-2 rounded">
                            Next<i class="fas fa-arrow-right ml-1"></i>
                        </button>
                        <button id="finishBtn" onclick="finishCreation()" class="btn-fantasy px-6 py-2 rounded hidden">
                            <i class="fas fa-check mr-1"></i>Create Character
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    setTimeout(() => {
        updateRacePreview();
        updateClassList();
        updateStatPreview();
        initProficiencySelectors();
        updateCreateHPDisplay();
    }, 0);
}

function renderEquippedGear(char) {
    const weapons = char.inventory?.filter(i => i.equipped && i.type === 'weapon') || [];
    const armor = char.inventory?.find(i => i.equipped && i.type === 'armor');
    const shield = char.inventory?.find(i => i.equipped && i.type === 'shield');
    const otherProtection = char.inventory?.filter(i => 
        i.equipped && 
        i.type !== 'armor' && 
        i.type !== 'shield' && 
        i.type !== 'weapon' && 
        (i.bonusAC || 0) !== 0
    ) || [];
    const strMod = getModifier(char.stats?.str || 10);
    const dexMod = getModifier(char.stats?.dex || 10);
    const thac0 = getTHAC0(char.class, char.level);

    let html = '<div class="grid-2 gap-3">';

    // WEAPONS - show ALL equipped weapons
    if (weapons.length > 0) {
        weapons.forEach((weapon, idx) => {
            const effTHAC0 = thac0 - (weapon.bonusAttack || 0) - strMod;
            const effDmgMod = strMod + (weapon.bonusDamage || 0);
            const dmgText = effDmgMod > 0 ? `+${effDmgMod}` : (effDmgMod < 0 ? `${effDmgMod}` : '');
            html += `
                <div class="bg-amber-100 rounded p-3 border border-amber-300">
                    <div class="text-xs text-amber-700 uppercase tracking-wide">Equipped Weapon${weapons.length > 1 ? ' #' + (idx+1) : ''}</div>
                    <div class="font-bold text-amber-900 text-lg">${weapon.name}</div>
                    <div class="text-sm mt-1">
                        <span class="font-bold">Effective THAC0:</span> ${effTHAC0} 
                        <span class="text-xs text-amber-600">(Base ${thac0} - Atk ${weapon.bonusAttack||0} - Str ${strMod})</span>
                    </div>
                    <div class="text-sm">
                        <span class="font-bold">Damage:</span> ${weapon.damage || weapon.damage_sm || '?'} ${dmgText}
                    </div>
                    ${weapon.special ? `<div class="text-xs text-blue-700 mt-1 font-italic"><i class="fas fa-star mr-1"></i>${weapon.special}</div>` : ''}
                </div>`;
        });
    } else {
        html += `
            <div class="bg-amber-100 rounded p-3 border border-amber-300 opacity-70">
                <div class="text-xs text-amber-700 uppercase tracking-wide">Equipped Weapon</div>
                <div class="text-sm text-amber-800 italic">No weapon equipped</div>
                <div class="text-sm">Unarmed damage: 1d2 ${formatMod(strMod)}</div>
            </div>`;
    }

    // PROTECTION - show all protection items and total AC
    if (armor || shield || otherProtection.length > 0) {
        let acHtml = '';
        let totalReduction = 0;

        if (armor) {
            const armorVal = armor.ac - (armor.bonusAC || 0);
            acHtml += `<div class="mb-1">
                <div class="font-bold text-amber-900">${armor.name}</div>
                <div class="text-xs text-amber-700">Base AC ${armor.ac}${armor.bonusAC ? ` <span class="item-bonus">- ${armor.bonusAC}</span>` : ''} = Effective ${armorVal}</div>
            </div>`;
            totalReduction += (10 - armorVal);
        }
        if (shield) {
            const shieldBonus = (shield.ac_bonus || 1) + (shield.bonusAC || 0);
            acHtml += `<div class="mb-1">
                <div class="font-bold text-amber-900">${shield.name}</div>
                <div class="text-xs text-amber-700">AC Bonus: ${shieldBonus}</div>
            </div>`;
            totalReduction += shieldBonus;
        }
        otherProtection.forEach(item => {
            acHtml += `<div class="mb-1">
                <div class="font-bold text-amber-900">${item.name}</div>
                <div class="text-xs text-amber-700">AC Bonus: ${item.bonusAC}</div>
            </div>`;
            totalReduction += item.bonusAC;
        });
        if (dexMod !== 0) {
            acHtml += `<div class="text-xs text-amber-700"><span class="font-bold">DEX Modifier:</span> ${formatMod(dexMod)}</div>`;
        }

        html += `
            <div class="bg-amber-100 rounded p-3 border border-amber-300">
                <div class="text-xs text-amber-700 uppercase tracking-wide">Equipped Protection</div>
                <div class="mt-2 space-y-1">${acHtml}</div>
                <div class="border-t border-amber-300 mt-2 pt-2 text-sm font-bold">
                    Total AC: ${calcAC(char)}
                </div>
                <div class="text-xs text-amber-600 mt-1">Base 10 - ${totalReduction + dexMod} protection = ${calcAC(char)}</div>
            </div>`;
    } else {
        html += `
            <div class="bg-amber-100 rounded p-3 border border-amber-300 opacity-70">
                <div class="text-xs text-amber-700 uppercase tracking-wide">Equipped Protection</div>
                <div class="text-sm text-amber-800 italic">No armor or shield</div>
                <div class="text-sm">Base AC 10 - DEX ${formatMod(dexMod)} = ${calcAC(char)}</div>
            </div>`;
    }
    html += '</div>';
    return html;
}

function renderSheet(container) {
    const char = State.currentCharacter;
    if (!char) return changeView('dashboard');
    const stats = char.stats || {};
    const mods = {
        str: getModifier(stats.str || 10), dex: getModifier(stats.dex || 10), con: getModifier(stats.con || 10),
        int: getModifier(stats.int || 10), wis: getModifier(stats.wis || 10), cha: getModifier(stats.cha || 10)
    };
    const isCaster = ['Mage','Specialist Wizard','Cleric','Druid','Paladin','Ranger','Bard'].includes(char.class);
    const expected = getExpectedProfs(char.class, char.level);
    const wpCount = (char.weaponProfs || []).length;
    const nwpCount = (char.nonweaponProfs || []).length;

    container.innerHTML = `
        <div class="min-h-screen p-4">
            <div class="max-w-6xl mx-auto">
                <div class="parchment scroll-border p-4 mb-4 fade-in">
                    <div class="flex justify-between items-center flex-wrap gap-2">
                        <div class="flex items-center gap-3">
                            <button onclick="changeView('dashboard')" class="btn-galactic px-3 py-2 rounded text-sm">
                                <i class="fas fa-arrow-left"></i>
                            </button>
                            <div>
                                <h1 class="fantasy-font text-2xl font-bold text-amber-900">${char.name}</h1>
                                <p class="text-sm text-amber-800">${char.race} ${char.kit !== 'None' ? char.kit : char.class} • ${char.alignment} • Level ${char.level}</p>
                                ${char.campaignId && char.campaignId !== 'default' ? `<p class="text-xs text-amber-700 mt-1"><i class="fas fa-campground mr-1"></i>Campaign: <span class="font-bold text-amber-900">${char.campaignId}</span> <button onclick="switchCampaign('${char.campaignId}'); changeView('dashboard');" class="text-blue-700 hover:text-blue-900 underline ml-1 cursor-pointer">Switch to this campaign</button></p>` : '<p class="text-xs text-amber-700 mt-1">Not assigned to a campaign</p>'}
                            <div class="mt-2 flex items-center gap-2">
                                <span class="text-xs text-amber-800">Move to:</span>
                                <select id="moveCampaign" class="input-fantasy text-xs px-2 py-1" style="min-width:120px">
                                    <option value="">-- Select --</option>
                                    <option value="default">Solo Play</option>
                                    ${[...new Set(State.characters.map(c => c.campaignId).filter(Boolean))].filter(id => id !== 'default' && id !== char.campaignId).map(cid => `<option value="${cid}">${cid}</option>`).join('')}
                                </select>
                                <input type="text" id="newCampaignMove" placeholder="New..." class="input-fantasy text-xs px-2 py-1" style="width:80px" onkeydown="if(event.key==='Enter'){changeCharacterCampaign('${char.id}', this.value);this.value='';}">
                                <button onclick="changeCharacterCampaign('${char.id}', $('moveCampaign').value || $('newCampaignMove').value)" class="btn-fantasy px-2 py-1 rounded text-xs" title="Move"><i class="fas fa-exchange-alt"></i></button>
                            </div>
                            </div>
                        </div>
                        <div class="flex gap-2 flex-wrap">
                            <button onclick="changeView('campaign')" class="btn-fantasy px-3 py-2 rounded text-sm">
                                <i class="fas fa-book mr-1"></i>Campaign
                            </button>
                            ${isCaster ? `
                                <button onclick="changeView('spells')" class="btn-magic px-3 py-2 rounded text-sm">
                                    <i class="fas fa-hat-wizard mr-1"></i>Spells
                                </button>
                            ` : ''}
                            <button onclick="changeView('inventory')" class="btn-fantasy px-3 py-2 rounded text-sm">
                                <i class="fas fa-backpack mr-1"></i>Inventory
                            </button>
                            <button onclick="changeView('levelup')" class="btn-fantasy px-3 py-2 rounded text-sm">
                                <i class="fas fa-level-up-alt mr-1"></i>Level Up
                            </button>
                            <button onclick="showManageProfsModal()" class="btn-galactic px-3 py-2 rounded text-sm">
                                <i class="fas fa-shield-alt mr-1"></i>Profs
                            </button>
                            <button onclick="showEditLevelModal()" class="btn-galactic px-3 py-2 rounded text-sm">
                                <i class="fas fa-edit mr-1"></i>Edit Level
                            </button>
                            <button onclick="showChangeClassModal()" class="btn-galactic px-3 py-2 rounded text-sm">
                                <i class="fas fa-exchange-alt mr-1"></i>Change Class
                            </button>
                            <button onclick="saveCharacter()" class="btn-galactic px-3 py-2 rounded text-sm">
                                <i class="fas fa-save mr-1"></i>Save
                            </button>
                            <button onclick="showDeleteConfirmModal()" class="btn-danger px-3 py-2 rounded text-sm">
                                <i class="fas fa-trash mr-1"></i>Delete
                            </button>
                        </div>
                    </div>
                </div>
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div class="lg:col-span-1 space-y-4">
                        <div class="parchment scroll-border p-4 fade-in">
                            <div class="section-header"><i class="fas fa-dumbbell"></i>Ability Scores</div>
                            <div class="grid grid-cols-2 gap-3">
                                ${['str','dex','con','int','wis','cha'].map(s => `
                                    <div class="stat-box p-2">
                                        <div class="stat-label">${s.toUpperCase()}</div>
                                        <div class="stat-value">${stats[s] || 10}</div>
                                        <div class="stat-mod">${formatMod(mods[s])}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        <div class="parchment scroll-border p-4 fade-in">
                            <div class="section-header"><i class="fas fa-heart"></i>Hit Points</div>
                            <div class="flex items-center gap-4 mb-2">
                                <div class="flex-1">
                                    <div class="flex justify-between text-sm mb-1">
                                        <span class="text-amber-900 font-bold">HP: ${char.hp}/${char.maxHp}</span>
                                        <span class="text-amber-700">${Math.round((char.hp/char.maxHp)*100)}%</span>
                                    </div>
                                    <div class="hp-bar">
                                        <div class="hp-fill" style="width: ${Math.max(0, Math.min(100, (char.hp/char.maxHp)*100))}%"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="flex gap-2 mt-3 items-center flex-wrap">
                                <button onclick="adjustHP(-1)" class="btn-galactic px-3 py-1 rounded text-xs">-1</button>
                                <button onclick="adjustHP(-5)" class="btn-galactic px-3 py-1 rounded text-xs">-5</button>
                                <input type="number" id="hpAdjust" class="input-fantasy w-16 px-2 py-1 text-center text-sm" value="0" placeholder="Amt">
                                <button onclick="adjustHPFromInput()" class="btn-fantasy px-2 py-1 rounded text-xs" title="Apply Custom"><i class="fas fa-check"></i></button>
                                <button onclick="adjustHP(5)" class="btn-fantasy px-3 py-1 rounded text-xs">+5</button>
                                <button onclick="adjustHP(1)" class="btn-fantasy px-3 py-1 rounded text-xs">+1</button>
                            </div>
                        </div>
                        <div class="parchment scroll-border p-4 fade-in">
                            <div class="section-header"><i class="fas fa-star"></i>Experience</div>
                            <div class="flex justify-between text-sm mb-1">
                                <span class="text-amber-900">Level ${char.level}</span>
                                <span class="text-amber-700">${char.xp} / ${getNextXP(char.class, char.level)} XP</span>
                            </div>
                            <div class="xp-bar mb-2">
                                <div class="xp-fill" style="width: ${Math.min(((char.xp || 0)/getNextXP(char.class, char.level || 1))*100, 100)}%"></div>
                            </div>
                            <div class="flex gap-2">
                                <input type="number" id="xpAdd" class="input-fantasy flex-1 px-3 py-2 text-sm" placeholder="Add XP...">
                                <button onclick="addXP()" class="btn-fantasy px-4 py-2 rounded text-sm">Add</button>
                            </div>
                        </div>
                        <div class="parchment scroll-border p-4 fade-in">
                            <div class="section-header"><i class="fas fa-coins"></i>Wealth</div>
                            <div class="grid grid-cols-2 gap-2 text-sm">
                                <div class="flex justify-between bg-amber-100 rounded p-2">
                                    <span>PP:</span><input type="number" class="bg-transparent w-16 text-right font-bold" value="${char.wealth?.pp || 0}" onchange="updateWealth('pp', this.value)">
                                </div>
                                <div class="flex justify-between bg-amber-100 rounded p-2">
                                    <span>GP:</span><input type="number" class="bg-transparent w-16 text-right font-bold" value="${char.wealth?.gp || 0}" onchange="updateWealth('gp', this.value)">
                                </div>
                                <div class="flex justify-between bg-amber-100 rounded p-2">
                                    <span>EP:</span><input type="number" class="bg-transparent w-16 text-right font-bold" value="${char.wealth?.ep || 0}" onchange="updateWealth('ep', this.value)">
                                </div>
                                <div class="flex justify-between bg-amber-100 rounded p-2">
                                    <span>SP:</span><input type="number" class="bg-transparent w-16 text-right font-bold" value="${char.wealth?.sp || 0}" onchange="updateWealth('sp', this.value)">
                                </div>
                                <div class="flex justify-between bg-amber-100 rounded p-2">
                                    <span>CP:</span><input type="number" class="bg-transparent w-16 text-right font-bold" value="${char.wealth?.cp || 0}" onchange="updateWealth('cp', this.value)">
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="lg:col-span-2 space-y-4">
                        <div class="parchment scroll-border p-4 fade-in">
                            <div class="section-header"><i class="fas fa-shield-alt"></i>Combat</div>
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div class="saving-throw-box">
                                    <div class="value">${calcAC(char)}</div>
                                    <div class="label">Armor Class</div>
                                    <div class="text-xs text-amber-600 mt-1" style="line-height:1.2">${getACBreakdown(char)}</div>
                                </div>
                                <div class="saving-throw-box">
                                    <div class="value">${calcTHAC0(char)}</div>
                                    <div class="label">THAC0</div>
                                </div>
                                <div class="saving-throw-box">
                                    <div class="value">${mods.str}</div>
                                    <div class="label">Hit Mod</div>
                                </div>
                                <div class="saving-throw-box">
                                    <div class="value">${mods.dex}</div>
                                    <div class="label">Init Mod</div>
                                </div>
                            </div>
                        </div>

                        <div class="parchment scroll-border p-4 fade-in">
                            <div class="section-header"><i class="fas fa-hand-fist"></i>Active Combat Gear</div>
                            ${renderEquippedGear(char)}
                        </div>
                        ${isCaster ? `
                        <div class="parchment scroll-border p-4 fade-in">
                            <div class="section-header"><i class="fas fa-hat-wizard"></i>Spell Slots</div>
                            <div class="flex justify-between items-center mb-2">
                                <span class="text-xs text-amber-700">${char.class} Level ${char.level} (${getCasterType(char.class) === 'wizard' ? 'Wizard' : 'Priest'} casting)</span>
                                <button onclick="restSpells()" class="btn-magic px-3 py-1 rounded text-xs" title="Restore all spell slots after rest">
                                    <i class="fas fa-bed mr-1"></i>Rest & Restore
                                </button>
                            </div>
                            <div class="space-y-3">
                                ${getSpellSlots(char.class, char.level).map((slots, idx) => {
                                    const level = idx + 1;
                                    const used = (char.usedSpellSlots || {})[level] || 0;
                                    const available = slots - used;
                                    const pct = slots > 0 ? (available / slots) * 100 : 0;
                                    const levelSpells = (char.preparedSpells || []).filter(name => {
                                        const allSpells = getAvailableSpells(char);
                                        const sp = allSpells.find(s => s.name === name);
                                        return sp && sp.level === level;
                                    });
                                    return `
                                        <div class="bg-amber-100 rounded border border-amber-300 p-2">
                                            <div class="flex items-center gap-3 mb-2">
                                                <div class="text-center min-w-[60px]">
                                                    <div class="text-xs text-amber-700 font-bold">Level ${level}</div>
                                                    <div class="text-lg font-bold ${available === 0 ? 'text-red-700' : 'text-amber-900'}">${available} <span class="text-xs font-normal">of ${slots}</span></div>
                                                    <div class="text-xs text-amber-600">${used > 0 ? used + ' used' : 'Ready'}</div>
                                                    <div class="hp-bar mt-1" style="height:4px">
                                                        <div class="hp-fill" style="width: ${pct}%; ${available === 0 ? 'background:#991b1b' : 'background:linear-gradient(90deg, #d4af37, #fbbf24)'}"></div>
                                                    </div>
                                                </div>
                                                <div class="flex-1">
                                                    ${levelSpells.length === 0 ? '<span class="text-xs text-amber-600 italic">No prepared spells</span>' : ''}
                                                    <div class="flex flex-wrap gap-1">
                                                        ${levelSpells.map(name => `
                                                            <button onclick="castSpell('${name}', ${level})" 
                                                                class="btn-fantasy px-2 py-1 rounded text-xs ${available === 0 ? 'opacity-50 cursor-not-allowed' : ''}" 
                                                                ${available === 0 ? 'disabled' : ''}
                                                                title="Cast ${name}">
                                                                <i class="fas fa-fire mr-1"></i>${name}
                                                            </button>
                                                        `).join('')}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                            ${!getSpellSlots(char.class, char.level).length ? '<p class="text-xs text-amber-700 italic mt-2">No spell slots at this level yet.</p>' : ''}
                        </div>
                        ` : ''}

                        <div class="parchment scroll-border p-4 fade-in">
                            <div class="section-header"><i class="fas fa-dice-d20"></i>Saving Throws</div>
                            <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
                                ${['ppdm','rsw','pp','bw','sp'].map(s => `
                                    <div class="saving-throw-box">
                                        <div class="value">${getSave(char.class, char.level, s)}</div>
                                        <div class="label">${s.toUpperCase()}</div>
                                    </div>
                                `).join('')}
                            </div>
                            <div class="text-xs text-amber-700 mt-2 text-center">
                                PPDM = Paralyze/Poison/Death Magic | RSW = Rod/Staff/Wand | PP = Petrification/Polymorph | BW = Breath Weapon | SP = Spell
                            </div>
                        </div>
                        <div class="parchment scroll-border p-4 fade-in">
                            <div class="section-header"><i class="fas fa-fist-raised"></i>Proficiencies</div>
                            <div class="grid-2 gap-4">
                                <div>
                                    <div class="flex justify-between items-center mb-2">
                                        <h4 class="font-bold text-amber-900 text-sm">Weapon Profs</h4>
                                        <span class="text-xs ${wpCount > expected.weapon ? 'text-red-600' : (wpCount < expected.weapon ? 'text-amber-600' : 'text-green-600')}">${wpCount} / ${expected.weapon} expected</span>
                                    </div>
                                    <div class="flex flex-wrap gap-1">
                                        ${(char.weaponProfs || []).map(p => `<span class="prof-tag">${p}</span>`).join('') || '<span class="text-amber-700 text-sm italic">None selected</span>'}
                                    </div>
                                </div>
                                <div>
                                    <div class="flex justify-between items-center mb-2">
                                        <h4 class="font-bold text-amber-900 text-sm">Non-Weapon Profs</h4>
                                        <span class="text-xs ${nwpCount > expected.nonweapon ? 'text-red-600' : (nwpCount < expected.nonweapon ? 'text-amber-600' : 'text-green-600')}">${nwpCount} / ${expected.nonweapon} expected</span>
                                    </div>
                                    <div class="flex flex-wrap gap-1">
                                        ${(char.nonweaponProfs || []).map(p => `<span class="prof-tag">${p}</span>`).join('') || '<span class="text-amber-700 text-sm italic">None selected</span>'}
                                    </div>
                                </div>
                            </div>
                        </div>
                        ${char.class === 'Thief' || char.class === 'Bard' ? `
                        <div class="parchment scroll-border p-4 fade-in">
                            <div class="section-header"><i class="fas fa-mask"></i>Thieving Skills</div>
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                                ${DB.thieving_skills.map(s => `
                                    <div class="saving-throw-box">
                                        <div class="value">${(char.thiefSkills?.[s.name] || s.base)}%</div>
                                        <div class="label">${s.name}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        ` : ''}
                        ${(char.selectedSchools && char.selectedSchools.length) || (char.selectedSpheres && char.selectedSpheres.length) ? `
                        <div class="parchment scroll-border p-4 fade-in">
                            <div class="section-header"><i class="fas fa-hat-wizard"></i>Magic ${char.selectedSchools && char.selectedSchools.length ? 'Schools' : 'Spheres'}</div>
                            <div class="flex flex-wrap gap-1">
                                ${(char.selectedSchools || []).map(s => `<span class="prof-tag">${s}</span>`).join('')}
                                ${(char.selectedSpheres || []).map(s => `<span class="prof-tag">${s}</span>`).join('')}
                            </div>
                        </div>
                        ` : ''}
                        <div class="parchment scroll-border p-4 fade-in">
                            <div class="section-header"><i class="fas fa-scroll"></i>Character Details</div>
                            <div class="grid-2 gap-4 text-sm">
                                <div><strong>Age:</strong> ${char.age || '?'}</div>
                                <div><strong>Height:</strong> ${char.height || '?'}</div>
                                <div><strong>Weight:</strong> ${char.weight || '?'}</div>
                                <div><strong>Hair:</strong> ${char.hair || '?'}</div>
                                <div><strong>Eyes:</strong> ${char.eyes || '?'}</div>
                                <div><strong>Deity:</strong> ${char.deity || 'None'}</div>
                            </div>
                            <div class="mt-3 p-3 bg-amber-100 rounded text-sm text-amber-900">
                                <strong>Background:</strong><br>
                                ${char.background || 'No background written yet.'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderInventory(container) {
    const char = State.currentCharacter;
    if (!char) return changeView('dashboard');
    const items = char.inventory || [];
    const totalWeight = items.reduce((sum, i) => sum + ((i.weight || 0) * (i.qty || 1)), 0);
    const equippedArmor = items.find(i => i.equipped && i.type === 'armor');
    const equippedShield = items.find(i => i.equipped && i.type === 'shield');
    const equippedWeapons = items.filter(i => i.equipped && i.type === 'weapon');

    container.innerHTML = `
        <div class="min-h-screen p-4">
            <div class="max-w-5xl mx-auto">
                <div class="parchment scroll-border p-4 mb-4 fade-in">
                    <div class="flex justify-between items-center flex-wrap gap-2">
                        <div class="flex items-center gap-3">
                            <button onclick="changeView('sheet')" class="btn-galactic px-3 py-2 rounded text-sm">
                                <i class="fas fa-arrow-left"></i> Back to Sheet
                            </button>
                            <h1 class="fantasy-font text-2xl font-bold text-amber-900">${char.name}'s Inventory</h1>
                        </div>
                        <div class="flex gap-2 items-center">
                            <span class="text-sm text-amber-800">Total Weight: <strong>${totalWeight.toFixed(1)}</strong> lbs</span>
                            <button onclick="showAddItemModal()" class="btn-fantasy px-4 py-2 rounded text-sm">
                                <i class="fas fa-plus mr-1"></i>Add Item
                            </button>
                        </div>
                    </div>
                </div>
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div class="lg:col-span-2 parchment scroll-border p-4 fade-in">
                        <div class="section-header"><i class="fas fa-list"></i>All Items</div>
                        <div class="overflow-x-auto">
                            <table class="w-full text-sm">
                                <thead>
                                    <tr class="border-b-2 border-amber-400">
                                        <th class="text-left p-2 text-amber-900">Item</th>
                                        <th class="text-center p-2 text-amber-900">Qty</th>
                                        <th class="text-center p-2 text-amber-900">Wt</th>
                                        <th class="text-center p-2 text-amber-900">Cost</th>
                                        <th class="text-center p-2 text-amber-900">Eq</th>
                                        <th class="text-center p-2 text-amber-900">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${items.length === 0 ? `<tr><td colspan="6" class="text-center p-4 text-amber-700 italic">Inventory is empty</td></tr>` : ''}
                                    ${items.map((item, idx) => `
                                        <tr class="inventory-row border-b border-amber-200">
                                            <td class="p-2">
                                                <div class="font-bold text-amber-900">${item.name}</div>
                                                <div class="text-xs text-amber-700">
                                                    ${item.type}${item.damage ? ` • ${item.damage}${item.bonusDamage ? '+'+item.bonusDamage : ''}` : ''}${item.ac ? ` • AC ${item.ac}` : ''}
                                                    ${item.bonusAttack ? ` • <span class="item-bonus">Atk +${item.bonusAttack}</span>` : ''}
                                                    ${item.bonusDamage ? ` • <span class="item-bonus">Dmg +${item.bonusDamage}</span>` : ''}
                                                    ${item.bonusAC ? ` • <span class="item-bonus">AC +${item.bonusAC}</span>` : ''}
                                                </div>
                                                ${item.special ? `<div class="item-special text-xs">${item.special}</div>` : ''}
                                            </td>
                                            <td class="p-2 text-center">
                                                <input type="number" class="input-fantasy w-12 text-center py-1" value="${item.qty || 1}" 
                                                       onchange="updateItemQty(${idx}, this.value)">
                                            </td>
                                            <td class="p-2 text-center text-amber-800">${(item.weight || 0) * (item.qty || 1)}</td>
                                            <td class="p-2 text-center text-amber-800">${item.cost || 0}gp</td>
                                            <td class="p-2 text-center">
                                                <input type="checkbox" ${item.equipped ? 'checked' : ''} onchange="toggleEquip(${idx})" 
                                                       class="w-4 h-4 accent-amber-700">
                                            </td>
                                            <td class="p-2 text-center">
                                                <button onclick="showEditItemModal(${idx})" class="text-blue-700 hover:text-blue-900 mr-2" title="Edit Item">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button onclick="removeItem(${idx})" class="text-red-700 hover:text-red-900" title="Remove Item">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="space-y-4">
                        <div class="parchment scroll-border p-4 fade-in">
                            <div class="section-header"><i class="fas fa-user-shield"></i>Equipped</div>
                            <div class="space-y-2 text-sm">
                                <div class="bg-amber-100 rounded p-2">
                                    <div class="text-xs text-amber-700">Armor</div>
                                    <div class="font-bold text-amber-900">${equippedArmor ? equippedArmor.name : 'None'}</div>
                                    ${equippedArmor ? `<div class="text-xs">AC ${equippedArmor.ac}${equippedArmor.bonusAC ? ` + ${equippedArmor.bonusAC}` : ''}</div>` : ''}
                                </div>
                                <div class="bg-amber-100 rounded p-2">
                                    <div class="text-xs text-amber-700">Shield</div>
                                    <div class="font-bold text-amber-900">${equippedShield ? equippedShield.name : 'None'}</div>
                                    ${equippedShield && equippedShield.bonusAC ? `<div class="text-xs">AC +${equippedShield.bonusAC}</div>` : ''}
                                </div>
                                <div class="bg-amber-100 rounded p-2">
                                    <div class="text-xs text-amber-700">Weapons</div>
                                    ${equippedWeapons.length ? equippedWeapons.map(w => `
                                        <div class="font-bold text-amber-900">${w.name}</div>
                                        ${w.bonusAttack || w.bonusDamage ? `<div class="text-xs">Atk ${w.bonusAttack ? '+'+w.bonusAttack : '0'}/Dmg ${w.bonusDamage ? '+'+w.bonusDamage : '0'}</div>` : ''}
                                    `).join('') : '<div class="text-amber-700 italic">None</div>'}
                                </div>
                            </div>
                        </div>
                        <div class="parchment scroll-border p-4 fade-in">
                            <div class="section-header"><i class="fas fa-shopping-cart"></i>Quick Add</div>
                            <div class="space-y-2 max-h-96 overflow-y-auto">
                                <div class="text-xs font-bold text-amber-800 border-b border-amber-300 pb-1">Weapons (${DB.weapons.length})</div>
                                ${DB.weapons.map(w => `
                                    <button onclick="addItemToChar('${w.name}', 'weapon')" class="w-full text-left text-sm p-2 hover:bg-amber-200 rounded flex justify-between">
                                        <span>${w.name}</span><span class="text-xs text-amber-700">${w.cost}gp</span>
                                    </button>
                                `).join('')}
                                <div class="text-xs font-bold text-amber-800 border-b border-amber-300 pb-1 mt-2">Armor (${DB.armor.length})</div>
                                ${DB.armor.map(a => `
                                    <button onclick="addItemToChar('${a.name}', 'armor')" class="w-full text-left text-sm p-2 hover:bg-amber-200 rounded flex justify-between">
                                        <span>${a.name}</span><span class="text-xs text-amber-700">${a.cost}gp</span>
                                    </button>
                                `).join('')}
                                <div class="text-xs font-bold text-amber-800 border-b border-amber-300 pb-1 mt-2">Gear (${DB.gear.length})</div>
                                ${DB.gear.map(g => `
                                    <button onclick="addItemToChar('${g.name}', 'gear')" class="w-full text-left text-sm p-2 hover:bg-amber-200 rounded flex justify-between">
                                        <span>${g.name}</span><span class="text-xs text-amber-700">${g.cost}gp</span>
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderSpells(container) {
    const char = State.currentCharacter;
    if (!char) return changeView('dashboard');
    const availableSpells = getAvailableSpells(char);
    const knownSpells = char.knownSpells || [];
    const preparedSpells = char.preparedSpells || [];
    const isCaster = ['Mage','Specialist Wizard','Cleric','Druid','Paladin','Ranger','Bard'].includes(char.class);
    const isWizard = ['Mage','Specialist Wizard','Bard'].includes(char.class);
    const isPriest = ['Cleric','Druid','Paladin','Ranger'].includes(char.class);
    const slots = getSpellSlots(char.class, char.level);
    const maxSpellLevel = slots.length; // highest level this caster can cast

    // Filter spells to only those the caster can actually cast at their level
    const castableSpells = availableSpells.filter(s => s.level <= maxSpellLevel);

    // Group by spell level
    const spellsByLevel = {};
    castableSpells.forEach(s => {
        if (!spellsByLevel[s.level]) spellsByLevel[s.level] = [];
        spellsByLevel[s.level].push(s);
    });

    // Sort spells within each level by name
    Object.keys(spellsByLevel).forEach(lvl => {
        spellsByLevel[lvl].sort((a, b) => a.name.localeCompare(b.name));
    });

    const levelOrder = Object.keys(spellsByLevel).map(Number).sort((a, b) => a - b);

    // Wizard INT-based max spells per level
    const intScore = char.stats?.int || 10;
    const maxSpellsPerLevel = isWizard ? getMaxSpellsPerLevel(intScore) : null;
    const maxSpellLevelByInt = isWizard ? getMaxSpellLevel(intScore) : null;

    // Count known spells per level
    const knownByLevel = {};
    knownSpells.forEach(name => {
        const sp = availableSpells.find(s => s.name === name);
        if (sp) {
            knownByLevel[sp.level] = (knownByLevel[sp.level] || 0) + 1;
        }
    });

    container.innerHTML = `
        <div class="min-h-screen p-4">
            <div class="max-w-5xl mx-auto">
                <div class="parchment scroll-border p-4 mb-4 fade-in">
                    <div class="flex justify-between items-center flex-wrap gap-2">
                        <div class="flex items-center gap-3">
                            <button onclick="changeView('sheet')" class="btn-galactic px-3 py-2 rounded text-sm">
                                <i class="fas fa-arrow-left"></i> Back to Sheet
                            </button>
                            <h1 class="fantasy-font text-2xl font-bold text-amber-900">${char.name}'s Spells</h1>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="showAddSpellModal()" class="btn-magic px-3 py-2 rounded text-sm">
                                <i class="fas fa-plus mr-1"></i>Add Spell
                            </button>
                            <span class="text-sm text-amber-800">Known: ${knownSpells.length} | Prepared: ${preparedSpells.length}</span>
                        </div>
                    </div>
                </div>
                ${isCaster ? `
                <div class="parchment scroll-border p-4 mb-4 fade-in">
                    <div class="section-header"><i class="fas fa-hat-wizard"></i>Spell Slots</div>
                    <div class="flex justify-between items-center mb-3">
                        <span class="text-sm text-amber-800">${char.class} Level ${char.level} • Spellcasting: ${getCasterType(char.class) === 'wizard' ? 'Wizard' : 'Priest'}${DB.classes[char.class]?.spell_slots?.offset ? ` • Effective Caster Level ${Math.max(1, char.level - DB.classes[char.class].spell_slots.offset)}` : ''}</span>
                        <button onclick="restSpells()" class="btn-magic px-4 py-2 rounded text-sm">
                            <i class="fas fa-bed mr-1"></i>Rest & Restore All Slots
                        </button>
                    </div>
                    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-3">
                        ${slots.map((slotCount, idx) => {
                            const level = idx + 1;
                            const used = (char.usedSpellSlots || {})[level] || 0;
                            const available = slotCount - used;
                            const pct = slotCount > 0 ? (available / slotCount) * 100 : 0;
                            return `
                                <div class="bg-amber-100 rounded p-2 border border-amber-300 text-center ${available === 0 ? 'opacity-60' : ''}">
                                    <div class="text-xs text-amber-700 font-bold">Level ${level}</div>
                                    <div class="text-xl font-bold ${available === 0 ? 'text-red-700' : 'text-amber-900'}">${available}/${slotCount}</div>
                                    <div class="text-xs text-amber-600">${used > 0 ? used + ' cast' : 'Ready'}</div>
                                    <div class="hp-bar mt-1" style="height:4px">
                                        <div class="hp-fill" style="width: ${pct}%; ${available === 0 ? 'background:#991b1b' : 'background:linear-gradient(90deg, #d4af37, #fbbf24)'}"></div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    ${!slots.length ? '<p class="text-xs text-amber-700 italic">No spell slots available at this character level. Level up to gain spell slots.</p>' : ''}
                </div>
                ` : ''}
                ${isWizard && maxSpellsPerLevel !== null ? `
                <div class="parchment scroll-border p-4 mb-4 fade-in">
                    <div class="section-header"><i class="fas fa-brain"></i>Spell Learning Capacity (INT ${intScore})</div>
                    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                        ${levelOrder.map(lvl => {
                            const known = knownByLevel[lvl] || 0;
                            const max = maxSpellsPerLevel === Infinity ? '∞' : maxSpellsPerLevel;
                            const atMax = maxSpellsPerLevel !== Infinity && known >= maxSpellsPerLevel;
                            const overIntLimit = maxSpellLevelByInt !== null && lvl > maxSpellLevelByInt;
                            return `
                                <div class="bg-amber-100 rounded p-2 border border-amber-300 text-center ${atMax ? 'border-red-500 bg-red-50' : ''} ${overIntLimit ? 'opacity-50' : ''}">
                                    <div class="text-xs text-amber-700 font-bold">Level ${lvl}</div>
                                    <div class="text-lg font-bold ${atMax ? 'text-red-700' : 'text-amber-900'}">${known} / ${max}</div>
                                    <div class="text-xs text-amber-600">${atMax ? 'MAX REACHED' : (overIntLimit ? 'INT too low' : 'Can learn')}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    <p class="text-xs text-amber-700 mt-2">
                        <i class="fas fa-info-circle mr-1"></i>
                        ${maxSpellsPerLevel === Infinity 
                            ? `With INT ${intScore}, you can learn all spells of any level you can cast.` 
                            : `With INT ${intScore}, you can learn up to ${maxSpellsPerLevel} spells per spell level. Max spell level: ${maxSpellLevelByInt}.`}
                    </p>
                </div>
                ` : ''}
                <div class="parchment scroll-border p-4 mb-4 fade-in">
                    <div class="section-header"><i class="fas fa-book"></i>Known Spells</div>
                    ${knownSpells.length === 0 ? '<p class="text-amber-700 italic text-sm">No spells known yet. Click on spells below to learn them.</p>' : ''}
                    <div class="flex flex-wrap gap-2 mb-4">
                        ${knownSpells.map(spellName => {
                            const spell = availableSpells.find(s => s.name === spellName);
                            const isPrepared = preparedSpells.includes(spellName);
                            return spell ? `
                                <div class="spell-card ${isPrepared ? 'selected' : ''} flex items-center gap-2 relative" 
                                     onclick="togglePrepareSpell('${spell.name}')">
                                    <span class="spell-name">${spell.name}</span>
                                    <span class="spell-level-badge">${spell.level}</span>
                                    <span class="school-badge">${spell.school || spell.sphere}</span>
                                    ${isPrepared ? '<i class="fas fa-check-circle text-blue-400"></i>' : ''}
                                    ${isPrepared ? `<button onclick="event.stopPropagation(); castSpell('${spell.name}', ${spell.level})" class="ml-auto btn-fantasy px-2 py-1 rounded text-xs" title="Cast Spell"><i class="fas fa-fire"></i> Cast</button>` : ''}
                                </div>
                            ` : '';
                        }).join('')}
                    </div>
                </div>
                <div class="parchment scroll-border p-4 fade-in">
                    <div class="section-header"><i class="fas fa-scroll"></i>Spell Library</div>
                    <p class="text-sm text-amber-700 mb-3">
                        Showing spells up to Level ${maxSpellLevel} (your current casting limit). 
                        Click a spell to learn it. Click a known spell to prepare/unprepare it. 
                        <i class="fas fa-info-circle"></i> for details.
                        ${isWizard && maxSpellsPerLevel !== Infinity ? `<br><span class="text-red-700 font-bold"><i class="fas fa-exclamation-triangle mr-1"></i>You cannot learn more than ${maxSpellsPerLevel} spells per level due to your INT score.</span>` : ''}
                    </p>
                    ${levelOrder.length === 0 ? '<p class="text-amber-700 italic">No spells available for this character at their current level.</p>' : ''}
                    ${levelOrder.map(level => {
                        const spells = spellsByLevel[level];
                        const knownCount = knownByLevel[level] || 0;
                        const atMax = isWizard && maxSpellsPerLevel !== Infinity && knownCount >= maxSpellsPerLevel;
                        const overInt = isWizard && maxSpellLevelByInt !== null && level > maxSpellLevelByInt;
                        return `
                        <div class="mb-6">
                            <h3 class="fantasy-font text-xl text-amber-900 mb-3 border-b-2 border-amber-400 pb-1 flex items-center justify-between">
                                <span class="flex items-center gap-2">
                                    <i class="fas fa-hat-wizard"></i>
                                    Spell Level ${level}
                                </span>
                                <span class="text-sm ${atMax ? 'text-red-700 font-bold' : 'text-amber-700'}">
                                    ${knownCount} known ${isWizard && maxSpellsPerLevel !== Infinity ? `/ ${maxSpellsPerLevel} max` : ''}
                                    ${overInt ? '<span class="text-red-700 ml-2"><i class="fas fa-ban"></i> INT limit</span>' : ''}
                                </span>
                            </h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                                ${spells.map(spell => {
                                    const isKnown = knownSpells.includes(spell.name);
                                    const spellBlocked = isWizard && !isKnown && maxSpellsPerLevel !== Infinity && knownCount >= maxSpellsPerLevel;
                                    const intBlocked = isWizard && !isKnown && maxSpellLevelByInt !== null && level > maxSpellLevelByInt;
                                    const blocked = spellBlocked || intBlocked;
                                    return `
                                    <div class="spell-card ${isKnown ? 'selected' : ''} ${blocked ? 'opacity-50 cursor-not-allowed' : ''} flex items-center justify-between" 
                                         ${blocked ? '' : `onclick="toggleLearnSpell('${spell.name}')`}">
                                        <div class="flex items-center gap-2 flex-1 min-w-0">
                                            <span class="spell-name truncate">${spell.name}</span>
                                            <span class="school-badge">${spell.school || spell.sphere}</span>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            ${blocked ? `<span class="text-xs text-red-700 font-bold" title="${intBlocked ? 'INT too low for this level' : 'Max spells reached for this level'}"><i class="fas fa-lock"></i></span>` : ''}
                                            <button onclick="event.stopPropagation(); showSpellDetail('${spell.name}')" 
                                                    class="text-blue-600 hover:text-blue-800 px-2">
                                                <i class="fas fa-info-circle"></i>
                                            </button>
                                        </div>
                                    </div>
                                `;
                                }).join('')}
                            </div>
                        </div>
                    `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
}function renderLevelUp(container) {
    const char = State.currentCharacter;
    if (!char) return changeView('dashboard');
    const nextLevel = (char.level || 1) + 1;
    const nextXP = getNextXP(char.class, char.level || 1);
    const canLevel = (char.xp || 0) >= nextXP;
    const cls = DB.classes[char.class];
    const hd = cls ? cls.hd : 6;
    const conMod = getModifier(char.stats?.con || 10);

    const knownWP = char.weaponProfs || [];
    const knownNWP = char.nonweaponProfs || [];
    const availableWP = DB.weapon_proficiencies.filter(p => !knownWP.includes(p));
    const availableNWP = DB.nonweapon_proficiencies.filter(p => !knownNWP.includes(p.name));

    container.innerHTML = `
        <div class="min-h-screen p-4">
            <div class="max-w-2xl mx-auto">
                <div class="parchment scroll-border p-4 mb-4 fade-in">
                    <div class="flex justify-between items-center">
                        <button onclick="changeView('sheet')" class="btn-galactic px-3 py-2 rounded text-sm">
                            <i class="fas fa-arrow-left"></i> Back
                        </button>
                        <h1 class="fantasy-font text-2xl font-bold text-amber-900">Level Up</h1>
                        <div></div>
                    </div>
                </div>
                <div class="parchment scroll-border p-6 fade-in text-center">
                    <div class="mb-6">
                        <div class="text-6xl mb-2">${char.level} <i class="fas fa-arrow-right text-amber-600"></i> ${nextLevel}</div>
                        <p class="fantasy-font text-xl text-amber-800">${char.name}</p>
                    </div>
                    <div class="mb-6 p-4 bg-amber-100 rounded border border-amber-300">
                        <div class="flex justify-between text-sm mb-2">
                            <span>Current XP: ${char.xp}</span>
                            <span>Required: ${nextXP}</span>
                        </div>
                        <div class="xp-bar">
                            <div class="xp-fill" style="width: ${Math.min(((char.xp || 0)/nextXP)*100, 100)}%"></div>
                        </div>
                        ${!canLevel ? `<p class="text-red-700 font-bold mt-2">Not enough XP to level up!</p>` : ''}
                    </div>
                    ${canLevel ? `
                        <div class="grid-2 gap-4 mb-6 text-left">
                            <div class="p-4 bg-amber-50 rounded border border-amber-300">
                                <div class="text-sm text-amber-700 mb-1">Hit Die</div>
                                <div class="text-2xl font-bold text-amber-900 fantasy-font">1d${hd}</div>
                                <div class="text-xs text-amber-600">+ CON mod (${formatMod(conMod)})</div>
                            </div>
                            <div class="p-4 bg-amber-50 rounded border border-amber-300">
                                <label class="block text-sm text-amber-700 mb-1">HP Gained</label>
                                <div class="flex gap-2">
                                    <input type="number" id="levelUpHP" class="input-fantasy w-full px-3 py-2 text-center text-2xl font-bold" 
                                           value="${Math.max(1, rollDie(hd) + conMod)}" min="1">
                                    <button onclick="rollLevelUpHP()" class="btn-fantasy px-3 py-2 rounded" title="Roll HP">
                                        <i class="fas fa-dice"></i>
                                    </button>
                                </div>
                                <div class="text-xs text-amber-600 mt-1">Min 1 HP per level</div>
                            </div>
                        </div>
                        <div class="mb-6 text-left">
                            <h3 class="fantasy-font text-lg text-amber-900 mb-3">New Proficiencies</h3>
                            <p class="text-xs text-amber-700 mb-2">Already known proficiencies are hidden from selection.</p>
                            <div class="grid-2 gap-4">
                                <div>
                                    <label class="block text-sm font-bold text-amber-900 mb-1">Weapon Proficiency</label>
                                    <select id="newWeaponProf" class="input-fantasy w-full px-3 py-2">
                                        <option value="">Select...</option>
                                        ${availableWP.map(p => `<option value="${p}">${p}</option>`).join('')}
                                    </select>
                                    ${availableWP.length === 0 ? '<p class="text-xs text-red-600 mt-1">All weapon proficiencies already known!</p>' : ''}
                                </div>
                                <div>
                                    <label class="block text-sm font-bold text-amber-900 mb-1">Non-Weapon Proficiency</label>
                                    <select id="newNonweaponProf" class="input-fantasy w-full px-3 py-2">
                                        <option value="">Select...</option>
                                        ${availableNWP.map(p => `<option value="${p.name}">${p.name} (${p.ability})</option>`).join('')}
                                    </select>
                                    ${availableNWP.length === 0 ? '<p class="text-xs text-red-600 mt-1">All non-weapon proficiencies already known!</p>' : ''}
                                </div>
                            </div>
                        </div>
                        <button onclick="confirmLevelUp()" class="btn-fantasy px-8 py-3 rounded text-lg font-bold">
                            <i class="fas fa-level-up-alt mr-2"></i>Confirm Level Up
                        </button>
                    ` : `
                        <div class="p-4 bg-amber-100 rounded border border-amber-300">
                            <p class="text-amber-900">You need ${nextXP - (char.xp || 0)} more XP to reach level ${nextLevel}.</p>
                            <p class="text-sm text-amber-700 mt-2">Go on more adventures!</p>
                        </div>
                    `}
                </div>
            </div>
        </div>
    `;
}

function renderCampaign(container) {
    const isDM = State.isDM;
    const campaign = State.campaign || {};
    const activeTab = State.campaignTab || 'story';
    
    container.innerHTML = `
        <div class="min-h-screen p-4">
            <div class="max-w-5xl mx-auto">
                <div class="parchment scroll-border p-4 mb-4 fade-in">
                    <div class="flex justify-between items-center flex-wrap gap-2">
                        <div class="flex items-center gap-3">
                            <button onclick="changeView('dashboard')" class="btn-galactic px-3 py-2 rounded text-sm">
                                <i class="fas fa-arrow-left"></i>
                            </button>
                            <h1 class="fantasy-font text-2xl font-bold text-amber-900">Campaign Journal</h1>
                        </div>
                        <div class="flex items-center gap-2">
                            <span id="firebaseStatus" class="text-xs px-2 py-1 rounded bg-amber-100 text-amber-800 border border-amber-300">
                                <i class="fas fa-wifi mr-1"></i>...
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="parchment scroll-border p-4 fade-in">
                    <div class="flex gap-1 mb-4 border-b-2 border-amber-300 pb-2 overflow-x-auto">
                        <button class="tab-btn ${activeTab==='story'?'active':''}" onclick="setCampaignTab('story')">
                            <i class="fas fa-book-open mr-1"></i>Story
                        </button>
                        <button class="tab-btn ${activeTab==='log'?'active':''}" onclick="setCampaignTab('log')">
                            <i class="fas fa-scroll mr-1"></i>Session Log
                        </button>
                        ${isDM ? `
                        <button class="tab-btn ${activeTab==='dmnotes'?'active':''}" onclick="setCampaignTab('dmnotes')">
                            <i class="fas fa-eye-slash mr-1"></i>DM Notes
                        </button>
                        ` : ''}
                        <button class="tab-btn ${activeTab==='party'?'active':''}" onclick="setCampaignTab('party')">
                            <i class="fas fa-users mr-1"></i>Party Notes
                        </button>
                        <button class="tab-btn ${activeTab==='mynotes'?'active':''}" onclick="setCampaignTab('mynotes')">
                            <i class="fas fa-user-secret mr-1"></i>My Notes
                        </button>
                    </div>
                    
                    <div id="campaignTabContent"></div>
                </div>
            </div>
        </div>
    `;
    
    setTimeout(() => renderCampaignTab(activeTab), 0);
}

function renderCampaignTab(tab) {
    const content = $('campaignTabContent');
    const campaign = State.campaign || {};
    const isDM = State.isDM;
    
    if (tab === 'story') {
        content.innerHTML = `
            <div class="space-y-4">
                <div class="flex justify-between items-center">
                    <h2 class="fantasy-font text-xl font-bold text-amber-900">Campaign Story</h2>
                    ${isDM ? `<button onclick="saveCampaignStory()" class="btn-fantasy px-4 py-2 rounded text-sm"><i class="fas fa-save mr-1"></i>Save</button>` : ''}
                </div>
                <textarea id="campaignStory" class="input-fantasy w-full px-4 py-3 h-96 resize-none font-serif text-amber-900 leading-relaxed" 
                    ${isDM ? '' : 'readonly'}>${campaign.story || ''}</textarea>
                ${!isDM ? '<p class="text-xs text-amber-700 italic mt-2"><i class="fas fa-lock mr-1"></i>Only the DM can edit the campaign story.</p>' : ''}
            </div>
        `;
    }
    else if (tab === 'log') {
        const sessions = campaign.sessions || [];
        content.innerHTML = `
            <div class="space-y-4">
                <div class="flex justify-between items-center">
                    <h2 class="fantasy-font text-xl font-bold text-amber-900">Session Log</h2>
                    ${isDM ? `<button onclick="showAddSessionModal()" class="btn-fantasy px-4 py-2 rounded text-sm"><i class="fas fa-plus mr-1"></i>Add Entry</button>` : ''}
                </div>
                <div class="space-y-3">
                    ${sessions.length === 0 ? '<p class="text-amber-700 italic text-center py-8">No sessions recorded yet. The DM can add session summaries here.</p>' : ''}
                    ${sessions.slice().reverse().map((s, i) => `
                        <div class="bg-amber-50 rounded border border-amber-300 p-4">
                            <div class="flex justify-between items-start mb-2">
                                <h3 class="font-bold text-amber-900 text-lg">${s.title || 'Untitled Session'}</h3>
                                <span class="text-xs text-amber-700 bg-amber-200 px-2 py-1 rounded">${s.date || 'Unknown date'}</span>
                            </div>
                            <p class="text-sm text-amber-800 whitespace-pre-wrap leading-relaxed">${s.content || ''}</p>
                            ${isDM ? `<button onclick="deleteSession(${sessions.length - 1 - i})" class="text-red-700 text-xs mt-2 hover:underline"><i class="fas fa-trash mr-1"></i>Delete</button>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    else if (tab === 'dmnotes' && isDM) {
        content.innerHTML = `
            <div class="space-y-4">
                <div class="flex justify-between items-center">
                    <h2 class="fantasy-font text-xl font-bold text-amber-900"><i class="fas fa-eye-slash mr-2"></i>DM Secret Notes</h2>
                    <button onclick="saveDMNotes()" class="btn-fantasy px-4 py-2 rounded text-sm"><i class="fas fa-save mr-1"></i>Save</button>
                </div>
                <textarea id="dmNotesArea" class="input-fantasy w-full px-4 py-3 h-96 resize-none leading-relaxed">${campaign.dmNotes || ''}</textarea>
            </div>
        `;
    }
    else if (tab === 'party') {
        content.innerHTML = `
            <div class="space-y-4">
                <div class="flex justify-between items-center">
                    <h2 class="fantasy-font text-xl font-bold text-amber-900">Party Notes</h2>
                    <button onclick="savePartyNotes()" class="btn-fantasy px-4 py-2 rounded text-sm"><i class="fas fa-save mr-1"></i>Save</button>
                </div>
                <p class="text-sm text-amber-700">These notes are shared with the whole party. Everyone can edit and they sync in real-time.</p>
                <textarea id="partyNotesArea" class="input-fantasy w-full px-4 py-3 h-96 resize-none leading-relaxed">${campaign.partyNotes || ''}</textarea>
            </div>
        `;
    }
    else if (tab === 'mynotes') {
        const myNotes = (campaign.playerNotes || {})[State.currentUser] || '';
        content.innerHTML = `
            <div class="space-y-4">
                <div class="flex justify-between items-center">
                    <h2 class="fantasy-font text-xl font-bold text-amber-900">My Personal Notes</h2>
                    <button onclick="saveMyNotes()" class="btn-fantasy px-4 py-2 rounded text-sm"><i class="fas fa-save mr-1"></i>Save</button>
                </div>
                <p class="text-sm text-amber-700">Only you can see these notes. They are tied to your login name.</p>
                <textarea id="myNotesArea" class="input-fantasy w-full px-4 py-3 h-96 resize-none leading-relaxed">${myNotes}</textarea>
            </div>
        `;
    }
    setTimeout(updateConnectionStatus, 0);
}

function renderDMView(container) {
    const hasCampaignFilter = !!State.campaignId;
    const allChars = State.characters || []; const campaignChars = hasCampaignFilter ? allChars.filter(c => c.campaignId === State.campaignId) : allChars;
    container.innerHTML = `
        <div class="min-h-screen p-4">
            <div class="max-w-6xl mx-auto">
                <div class="parchment scroll-border p-4 mb-4 fade-in">
                    <div class="flex justify-between items-center">
                        <div class="flex items-center gap-3">
                            <button onclick="changeView('dashboard')" class="btn-galactic px-3 py-2 rounded text-sm">
                                <i class="fas fa-arrow-left"></i>
                            </button>
                            <h1 class="fantasy-font text-2xl font-bold text-amber-900">
                                <i class="fas fa-dungeon mr-2 text-amber-700"></i>DM Party View
                            </h1>
                        </div>
                        <div class="flex gap-2">
                            <div class="text-xs text-amber-800 flex items-center mr-2 border-r border-amber-300 pr-2">
                                <span class="font-bold mr-1">Campaign:</span> ${State.campaignId || 'default'}
                            </div>
                            <button onclick="changeView('campaign')" class="btn-fantasy px-4 py-2 rounded text-sm">
                                <i class="fas fa-book mr-1"></i>Campaign
                            </button>
                            <button onclick="changeView('bestiary')" class="btn-fantasy px-4 py-2 rounded text-sm">
                                <i class="fas fa-paw mr-1"></i>Bestiary
                            </button>
                            <button onclick="changeView('monsters')" class="btn-fantasy px-4 py-2 rounded text-sm">
                                <i class="fas fa-dragon mr-1"></i>Monsters
                            </button>
                            <button onclick="changeView('tactical')" class="btn-fantasy px-4 py-2 rounded text-sm">
                                <i class="fas fa-chess-board mr-1"></i>Tactical Map
                            </button>
                            <button onclick="changeView('campaigns')" class="btn-fantasy px-4 py-2 rounded text-sm">
                                <i class="fas fa-scroll mr-1"></i>Campaigns
                            </button>
                            <button onclick="changeView('users')" class="btn-fantasy px-4 py-2 rounded text-sm">
                                <i class="fas fa-users-cog mr-1"></i>Users
                            </button>
                            <div class="text-sm text-amber-800 flex items-center">
                                ${campaignChars.length} Characters | ${new Set(campaignChars.map(c => c.player)).size} Players
                            </div>
                        </div>
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${campaignChars.length === 0 ? `
                        <div class="col-span-full parchment scroll-border p-8 text-center">
                            <i class="fas fa-scroll text-4xl text-amber-700 mb-3"></i>
                            <p class="fantasy-font text-lg text-amber-900">No characters in this campaign</p>
                        </div>
                    ` : campaignChars.map(char => `
                        <div class="parchment scroll-border p-4 fade-in cursor-pointer" onclick="dmViewCharacter('${char.id}')">
                            <div class="flex justify-between items-start mb-2">
                                <div>
                                    <h3 class="fantasy-font font-bold text-amber-900">${char.name}</h3>
                                    <p class="text-xs text-amber-700">${char.player} • ${char.race} ${char.class}</p>
                                </div>
                                <div class="text-right">
                                    <div class="text-xl font-bold text-amber-900 fantasy-font">${char.level}</div>
                                    <div class="text-xs text-amber-700">Lvl</div>
                                </div>
                            </div>
                            <div class="grid grid-cols-3 gap-2 mb-2 text-center text-xs">
                                <div class="bg-amber-100 rounded p-1">
                                    <div class="text-amber-800">HP</div>
                                    <div class="font-bold text-amber-900">${char.hp}/${char.maxHp}</div>
                                </div>
                                <div class="bg-amber-100 rounded p-1">
                                    <div class="text-amber-800">AC</div>
                                    <div class="font-bold text-amber-900">${calcAC(char)}</div>
                                </div>
                                <div class="bg-amber-100 rounded p-1">
                                    <div class="text-amber-800">THAC0</div>
                                    <div class="font-bold text-amber-900">${getTHAC0(char.class, char.level)}</div>
                                </div>
                            </div>
                            <div class="hp-bar mb-1">
                                <div class="hp-fill" style="width: ${Math.max(0, Math.min(100, (char.hp/char.maxHp)*100))}%"></div>
                            </div>
                            <div class="flex justify-between text-xs text-amber-700 mt-2">
                                <span>STR:${char.stats?.str||10} DEX:${char.stats?.dex||10} CON:${char.stats?.con||10}</span>
                                <span>XP: ${char.xp}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function renderBestiary(container) {
    container.innerHTML = `
        <div class="min-h-screen p-4">
            <div class="max-w-6xl mx-auto">
                <div class="parchment scroll-border p-4 mb-4 fade-in">
                    <div class="flex justify-between items-center">
                        <button onclick="changeView('dm_view')" class="btn-galactic px-3 py-2 rounded text-sm">
                            <i class="fas fa-arrow-left"></i> Back to DM View
                        </button>
                        <h1 class="fantasy-font text-2xl font-bold text-amber-900">Bestiary & Encounters</h1>
                        <button onclick="showCreatureModal()" class="btn-fantasy px-4 py-2 rounded text-sm">
                            <i class="fas fa-plus mr-1"></i>Add Creature
                        </button>
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${State.creatures.length === 0 ? `
                        <div class="col-span-full parchment scroll-border p-8 text-center">
                            <i class="fas fa-paw text-4xl text-amber-700 mb-3"></i>
                            <p class="fantasy-font text-lg text-amber-900">No creatures yet</p>
                            <p class="text-amber-800 text-sm mt-2">Add monsters and NPCs to track during combat!</p>
                        </div>
                    ` : State.creatures.map(c => `
                        <div class="creature-card p-4 fade-in relative">
                            <div class="flex justify-between items-start mb-2">
                                <div>
                                    <h3 class="fantasy-font font-bold text-amber-900">${c.name}</h3>
                                    <p class="text-xs text-amber-700">${c.type || 'Creature'}</p>
                                </div>
                                <div class="text-right">
                                    <div class="text-xl font-bold text-amber-900 fantasy-font">AC ${c.ac}</div>
                                    <div class="text-xs text-amber-700">THAC0 ${c.thac0}</div>
                                </div>
                            </div>
                            <div class="mb-2">
                                <div class="flex justify-between text-sm mb-1">
                                    <span>HP: ${c.hp}/${c.maxHp}</span>
                                    <span>${Math.round((c.hp/c.maxHp)*100)}%</span>
                                </div>
                                <div class="hp-bar">
                                    <div class="hp-fill" style="width: ${Math.max(0, Math.min(100, (c.hp/c.maxHp)*100))}%"></div>
                                </div>
                            </div>
                            <div class="text-xs text-amber-800 mb-2">
                                ${c.weapons?.length ? `Weapons: ${c.weapons.map(w=>w.name).join(', ')}` : 'No weapons'}
                            </div>
                            <div class="flex gap-2 mt-2">
                                <button onclick="adjustCreatureHP('${c.id}', -1)" class="btn-galactic px-2 py-1 rounded text-xs">-1</button>
                                <button onclick="adjustCreatureHP('${c.id}', -5)" class="btn-galactic px-2 py-1 rounded text-xs">-5</button>
                                <button onclick="adjustCreatureHP('${c.id}', 5)" class="btn-fantasy px-2 py-1 rounded text-xs">+5</button>
                                <button onclick="adjustCreatureHP('${c.id}', 1)" class="btn-fantasy px-2 py-1 rounded text-xs">+1</button>
                                <div class="flex-1"></div>
                                <button onclick="showCreatureModal('${c.id}')" class="btn-galactic px-2 py-1 rounded text-xs"><i class="fas fa-edit"></i></button>
                                <button onclick="removeCreature('${c.id}')" class="btn-danger px-2 py-1 rounded text-xs"><i class="fas fa-trash"></i></button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function renderMonsters(container) {
    const monsters = DB.monsters || {};
    const monsterList = Object.entries(monsters).map(([name, data]) => ({ name, ...data }));
    const categories = [...new Set(monsterList.map(m => m.category))].sort();
    const searchTerm = (State.monsterSearch || '').toLowerCase();
    const selectedCategory = State.monsterCategory || 'All';

    let filtered = monsterList;
    if (selectedCategory !== 'All') {
        filtered = filtered.filter(m => m.category === selectedCategory);
    }
    if (searchTerm) {
        filtered = filtered.filter(m => m.name.toLowerCase().includes(searchTerm));
    }

    filtered.sort((a, b) => a.name.localeCompare(b.name));

    container.innerHTML = `
        <div class="min-h-screen p-4">
            <div class="max-w-6xl mx-auto">
                <div class="parchment scroll-border p-4 mb-4 fade-in">
                    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                        <div class="flex items-center gap-3">
                            <button onclick="changeView('dm_view')" class="btn-galactic px-3 py-2 rounded text-sm">
                                <i class="fas fa-arrow-left"></i> Back to DM View
                            </button>
                            <h1 class="fantasy-font text-2xl font-bold text-amber-900">
                                <i class="fas fa-dragon mr-2 text-amber-700"></i>AD&D 2e Bestiary
                            </h1>
                        </div>
                        <div class="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                            <select onchange="State.monsterCategory=this.value; render();" class="input-fantasy px-3 py-2 rounded text-sm">
                                <option value="All">All Categories</option>
                                ${categories.map(c => `<option value="${c}" ${selectedCategory===c?'selected':''}>${c}</option>`).join('')}
                            </select>
                            <div class="flex gap-2">
                                <input type="text" id="monsterSearchInput" placeholder="Search monsters..." 
                                       value="${State.monsterSearch||''}" 
                                       onkeydown="if(event.key==='Enter'){searchMonsters();}"
                                       class="input-fantasy px-3 py-2 rounded text-sm w-full md:w-64">
                                <button onclick="searchMonsters()" class="btn-fantasy px-3 py-2 rounded text-sm">
                                    <i class="fas fa-search mr-1"></i>Search
                                </button>
                                ${State.monsterSearch ? `<button onclick="clearMonsterSearch()" class="btn-galactic px-3 py-2 rounded text-sm"><i class="fas fa-times"></i></button>` : ''}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="parchment scroll-border p-3 mb-4 fade-in">
                    <div class="text-sm text-amber-800">
                        <span class="font-bold">${filtered.length}</span> of <span class="font-bold">${monsterList.length}</span> monsters
                        ${selectedCategory !== 'All' ? ` • Category: <span class="font-bold">${selectedCategory}</span>` : ''}
                        ${searchTerm ? ` • Search: "<span class="font-bold">${State.monsterSearch}</span>"` : ''}
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    ${filtered.length === 0 ? `
                        <div class="col-span-full parchment scroll-border p-8 text-center">
                            <i class="fas fa-search text-4xl text-amber-700 mb-3"></i>
                            <p class="fantasy-font text-lg text-amber-900">No monsters found</p>
                        </div>
                    ` : filtered.map(m => `
                        <div class="parchment scroll-border p-3 fade-in hover:shadow-lg transition-shadow cursor-pointer" onclick="showMonsterDetail('${m.name.replace(/'/g, "\'")}')">
                            <div class="flex justify-between items-start mb-2">
                                <h3 class="fantasy-font font-bold text-amber-900 text-sm leading-tight">${m.name}</h3>
                                <span class="text-xs bg-amber-200 text-amber-900 px-2 py-1 rounded">${m.category}</span>
                            </div>
                            <div class="flex gap-1 mb-2">
                                <span class="text-xs bg-amber-50 text-amber-800 px-2 py-1 rounded border border-amber-200">${m.frequency}</span>
                                <span class="text-xs bg-amber-50 text-amber-800 px-2 py-1 rounded border border-amber-200">${m.encounter} encounter</span>
                            </div>
                            <div class="grid grid-cols-2 gap-1 text-xs mb-2">
                                <div class="bg-amber-100 rounded p-1 text-center">
                                    <div class="text-amber-700">AC</div>
                                    <div class="font-bold text-amber-900">${m.ac}</div>
                                </div>
                                <div class="bg-amber-100 rounded p-1 text-center">
                                    <div class="text-amber-700">HD</div>
                                    <div class="font-bold text-amber-900">${m.hd}</div>
                                    <div class="text-xs text-amber-600">${(() => { const h = parseMonsterHD(m.hd); return `${h.count}d${h.die}${h.bonus >= 0 ? '+' + h.bonus : h.bonus}`; })()}</div>
                                </div>
                                <div class="bg-amber-100 rounded p-1 text-center">
                                    <div class="text-amber-700">THAC0</div>
                                    <div class="font-bold text-amber-900">${m.thac0}</div>
                                </div>
                                <div class="bg-amber-100 rounded p-1 text-center">
                                    <div class="text-amber-700">XP</div>
                                    <div class="font-bold text-amber-900">${m.xp.toLocaleString()}</div>
                                </div>
                            </div>
                            <div class="text-xs text-amber-800 mb-1">
                                <span class="font-bold">Size:</span> ${m.size} • <span class="font-bold">Source:</span> ${m.source}
                            </div>
                            <div class="text-xs text-amber-700 truncate">
                                <span class="font-bold">Damage:</span> ${m.damage}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function renderTacticalMap(container) {
    const mapData = State.tacticalMap || { gridSize: 50, tokens: [], terrain: [], width: 20, height: 15 };
    State.tacticalMap = mapData;

    container.innerHTML = `
        <div class="min-h-screen p-4">
            <div class="max-w-7xl mx-auto">
                <div class="parchment scroll-border p-4 mb-4 fade-in">
                    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                        <div class="flex items-center gap-3">
                            <button onclick="changeView('dm_view')" class="btn-galactic px-3 py-2 rounded text-sm">
                                <i class="fas fa-arrow-left"></i> Back
                            </button>
                            <h1 class="fantasy-font text-2xl font-bold text-amber-900">
                                <i class="fas fa-chess-board mr-2 text-amber-700"></i>Tactical Battle Map
                            </h1>
                        </div>
                        <div class="flex flex-wrap gap-2">
                            <button onclick="setMapTool('select')" class="btn-tool px-3 py-2 rounded text-sm ${State.mapTool==='select'?'btn-fantasy':'btn-galactic'}">
                                <i class="fas fa-mouse-pointer mr-1"></i>Select
                            </button>
                            <button onclick="setMapTool('move')" class="btn-tool px-3 py-2 rounded text-sm ${State.mapTool==='move'?'btn-fantasy':'btn-galactic'}">
                                <i class="fas fa-arrows-alt mr-1"></i>Move
                            </button>
                            <button onclick="setMapTool('wall')" class="btn-tool px-3 py-2 rounded text-sm ${State.mapTool==='wall'?'btn-fantasy':'btn-galactic'}">
                                <i class="fas fa-square mr-1"></i>Wall
                            </button>
                            <button onclick="setMapTool('door')" class="btn-tool px-3 py-2 rounded text-sm ${State.mapTool==='door'?'btn-fantasy':'btn-galactic'}">
                                <i class="fas fa-dungeon mr-1"></i>Door
                            </button>
                            <button onclick="setMapTool('water')" class="btn-tool px-3 py-2 rounded text-sm ${State.mapTool==='water'?'btn-fantasy':'btn-galactic'}">
                                <i class="fas fa-water mr-1"></i>Water
                            </button>
                            <button onclick="setMapTool('difficult')" class="btn-tool px-3 py-2 rounded text-sm ${State.mapTool==='difficult'?'btn-fantasy':'btn-galactic'}">
                                <i class="fas fa-mountain mr-1"></i>Difficult
                            </button>
                            <button onclick="setMapTool('erase')" class="btn-tool px-3 py-2 rounded text-sm ${State.mapTool==='erase'?'btn-fantasy':'btn-galactic'}">
                                <i class="fas fa-eraser mr-1"></i>Erase
                            </button>
                            ${State.isDM ? `
                            <button onclick="clearMap()" class="btn-danger px-3 py-2 rounded text-sm">
                                <i class="fas fa-trash mr-1"></i>Clear
                            </button>
                            <button onclick="saveMap()" class="btn-magic px-3 py-2 rounded text-sm">
                                <i class="fas fa-save mr-1"></i>Save
                            </button>
                            ` : ''}
                        </div>
                    </div>
                </div>

                <div class="flex flex-col lg:flex-row gap-4">
                    <!-- Canvas -->
                    <div class="flex-1">
                        <div class="parchment scroll-border p-2 fade-in">
                            <canvas id="tacticalCanvas" width="1000" height="750" 
                                    class="w-full border-2 border-amber-400 rounded cursor-crosshair"
                                    onmousedown="handleMapMouseDown(event)"
                                    onmousemove="handleMapMouseMove(event)"
                                    onmouseup="handleMapMouseUp(event)"
                                    oncontextmenu="return false">
                            </canvas>
                        </div>
                        <div class="parchment scroll-border p-3 mt-2 fade-in">
                            <div class="text-sm text-amber-800">
                                <span class="font-bold">Grid:</span> ${mapData.gridSize}px • 
                                <span class="font-bold">Size:</span> ${mapData.width}×${mapData.height} squares • 
                                <span class="font-bold">Scale:</span> 1 square = 5 feet
                            </div>
                            <div class="text-xs text-amber-700 mt-1">
                                <i class="fas fa-info-circle mr-1"></i>
                                ${State.isDM 
                                    ? 'Select tool: click tokens to select. Move tool: click and drag to move tokens. Right-click also drags. Left-click draws terrain when a terrain tool is active.' 
                                    : 'Right-click and drag your character token to move. You can only move player tokens (blue circles). Click a token to see details and distance.'}
                            </div>
                        </div>
                    </div>

                    <!-- Sidebar -->
                    <div class="w-full lg:w-80 space-y-3">
                        <!-- Token Palette -->
                        <div class="parchment scroll-border p-3 fade-in">
                            <div class="section-header"><i class="fas fa-chess"></i>Token Palette</div>
                            <div class="space-y-2">
                                ${!State.isDM ? '<p class="text-xs text-amber-700 italic">Only the DM can add tokens. You can move any blue player token.</p>' : ''}
                                <div>
                                    <label class="text-xs font-bold text-amber-800">Players</label>
                                    <div class="flex flex-wrap gap-1 mt-1">
                                        <button onclick="addToken('player', 'PC 1', '#3b82f6')" class="w-8 h-8 rounded-full bg-blue-500 text-white text-xs font-bold" title="PC 1">P1</button>
                                        <button onclick="addToken('player', 'PC 2', '#10b981')" class="w-8 h-8 rounded-full bg-green-500 text-white text-xs font-bold" title="PC 2">P2</button>
                                        <button onclick="addToken('player', 'PC 3', '#f59e0b')" class="w-8 h-8 rounded-full bg-amber-500 text-white text-xs font-bold" title="PC 3">P3</button>
                                        <button onclick="addToken('player', 'PC 4', '#ef4444')" class="w-8 h-8 rounded-full bg-red-500 text-white text-xs font-bold" title="PC 4">P4</button>
                                        <button onclick="addToken('player', 'PC 5', '#8b5cf6')" class="w-8 h-8 rounded-full bg-purple-500 text-white text-xs font-bold" title="PC 5">P5</button>
                                        <button onclick="addToken('player', 'PC 6', '#ec4899')" class="w-8 h-8 rounded-full bg-pink-500 text-white text-xs font-bold" title="PC 6">P6</button>
                                    </div>
                                </div>
                                <div>
                                    <label class="text-xs font-bold text-amber-800">Quick Monsters</label>
                                    <div class="flex flex-wrap gap-1 mt-1">
                                        <button onclick="addToken('monster', 'Goblin', '#6b7280')" class="px-2 py-1 rounded bg-gray-500 text-white text-xs">Goblin</button>
                                        <button onclick="addToken('monster', 'Orc', '#6b7280')" class="px-2 py-1 rounded bg-gray-500 text-white text-xs">Orc</button>
                                        <button onclick="addToken('monster', 'Skeleton', '#6b7280')" class="px-2 py-1 rounded bg-gray-500 text-white text-xs">Skeleton</button>
                                        <button onclick="addToken('monster', 'Zombie', '#6b7280')" class="px-2 py-1 rounded bg-gray-500 text-white text-xs">Zombie</button>
                                        <button onclick="addToken('monster', 'Ogre', '#6b7280')" class="px-2 py-1 rounded bg-gray-500 text-white text-xs">Ogre</button>
                                        <button onclick="addToken('monster', 'Dragon', '#6b7280')" class="px-2 py-1 rounded bg-gray-500 text-white text-xs">Dragon</button>
                                    </div>
                                </div>
                                ${State.isDM ? `
                                <div>
                                    <label class="text-xs font-bold text-amber-800">Custom Token</label>
                                    <div class="flex gap-1 mt-1">
                                        <input type="text" id="customTokenName" placeholder="Name" class="input-fantasy px-2 py-1 rounded text-xs flex-1">
                                        <select id="customTokenType" class="input-fantasy px-2 py-1 rounded text-xs">
                                            <option value="monster">Monster</option>
                                            <option value="player">Player</option>
                                            <option value="npc">NPC</option>
                                            <option value="object">Object</option>
                                        </select>
                                        <button onclick="addCustomToken()" class="btn-fantasy px-2 py-1 rounded text-xs">Add</button>
                                    </div>
                                </div>
                                ` : ''}
                            </div>
                        </div>

                        <!-- Selected Token Info -->
                        <div class="parchment scroll-border p-3 fade-in">
                            <div class="section-header"><i class="fas fa-info-circle"></i>Selected Token</div>
                            <div id="tokenInfo" class="text-sm text-amber-800">
                                <p class="italic text-amber-600">Click a token to see details</p>
                            </div>
                        </div>

                        <!-- Distance Calculator -->
                        <div class="parchment scroll-border p-3 fade-in">
                            <div class="section-header"><i class="fas fa-ruler"></i>Distance</div>
                            <div id="distanceInfo" class="text-sm text-amber-800">
                                <p class="italic text-amber-600">Select two tokens to calculate distance</p>
                            </div>
                        </div>

                        <!-- Movement -->
                        <div class="parchment scroll-border p-3 fade-in">
                            <div class="section-header"><i class="fas fa-running"></i>Movement</div>
                            <div class="text-xs text-amber-700 space-y-1">
                                <div><span class="font-bold">Normal:</span> 1 square = 5 ft</div>
                                <div><span class="font-bold">Difficult:</span> 2 squares = 5 ft</div>
                                <div><span class="font-bold">Diagonal:</span> 1.5 squares = 5 ft</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Draw the map after a short delay to ensure canvas is in DOM
    setTimeout(() => drawTacticalMap(), 100);
}

function renderCampaignDetail(container) {
    const campaign = State.selectedCampaign;
    if (!campaign) return changeView('campaigns');

    const linkedStory = linkifyStory(campaign.fullStory || campaign.description || 'No story available.');

    container.innerHTML = `
        <div class="min-h-screen p-4">
            <div class="max-w-4xl mx-auto">
                <div class="parchment scroll-border p-4 mb-4 fade-in">
                    <div class="flex justify-between items-center">
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
                        <button onclick="selectCampaign('${campaign.code.replace(/'/g, "\'")}')" class="btn-fantasy px-4 py-2 rounded text-sm">
                            <i class="fas fa-check mr-1"></i>Use This Campaign
                        </button>
                    </div>

                    <div class="section-header"><i class="fas fa-book-open"></i>Full Campaign Story</div>
                    <div class="text-sm text-amber-900 leading-relaxed space-y-4 parchment p-4 rounded border border-amber-300" style="min-height: 300px;">
                        ${linkedStory}
                    </div>
                    <p class="text-xs text-amber-700 mt-3 italic">
                        <i class="fas fa-mouse-pointer mr-1"></i>Click on any highlighted monster name to view its stats and details.
                    </p>
                </div>

                <div class="parchment scroll-border p-4 fade-in">
                    <div class="section-header"><i class="fas fa-dragon"></i>Featured Monsters</div>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                        ${(() => {
                            const storyText = (campaign.fullStory || campaign.description || '').toLowerCase();
                            const featured = Object.keys(DB.monsters).filter(m => storyText.includes(m.toLowerCase())).slice(0, 8);
                            if (featured.length === 0) return '<p class="text-amber-700 italic col-span-full">No specific monsters featured in this campaign summary.</p>';
                            return featured.map(m => {
                                const mon = DB.monsters[m];
                                return `
                                    <div class="p-2 bg-amber-100 rounded border border-amber-300 cursor-pointer hover:bg-amber-200 transition-colors" onclick="showMonsterDetail('${m.replace(/'/g, "\'")}')">
                                        <div class="font-bold text-amber-900 text-sm">${m}</div>
                                        <div class="text-xs text-amber-700">AC ${mon.ac} • HD ${mon.hd}</div>
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

function renderCampaigns(container) {
    const campaigns = DB.campaigns || [];
    const searchTerm = (State.campaignSearch || '').toLowerCase();
    const selectedSetting = State.campaignSetting || 'All';
    const settings = ['All', ...new Set(campaigns.map(c => c.setting))].sort();

    let filtered = campaigns;
    if (selectedSetting !== 'All') {
        filtered = filtered.filter(c => c.setting === selectedSetting);
    }
    if (searchTerm) {
        filtered = filtered.filter(c => 
            c.title.toLowerCase().includes(searchTerm) || 
            c.description.toLowerCase().includes(searchTerm) ||
            c.code.toLowerCase().includes(searchTerm)
        );
    }

    container.innerHTML = `
        <div class="min-h-screen p-4">
            <div class="max-w-6xl mx-auto">
                <div class="parchment scroll-border p-4 mb-4 fade-in">
                    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                        <div class="flex items-center gap-3">
                            <button onclick="changeView('dm_view')" class="btn-galactic px-3 py-2 rounded text-sm">
                                <i class="fas fa-arrow-left"></i> Back to DM View
                            </button>
                            <h1 class="fantasy-font text-2xl font-bold text-amber-900">
                                <i class="fas fa-scroll mr-2 text-amber-700"></i>AD&D 2e Campaigns
                            </h1>
                        </div>
                        <div class="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                            <select onchange="State.campaignSetting=this.value; render();" class="input-fantasy px-3 py-2 rounded text-sm">
                                ${settings.map(s => `<option value="${s}" ${selectedSetting===s?'selected':''}>${s}</option>`).join('')}
                            </select>
                            <div class="flex gap-2">
                                <input type="text" id="campaignSearchInput" placeholder="Search campaigns..." 
                                       value="${State.campaignSearch||''}" 
                                       onkeydown="if(event.key==='Enter'){searchCampaigns();}"
                                       class="input-fantasy px-3 py-2 rounded text-sm w-full md:w-64">
                                <button onclick="searchCampaigns()" class="btn-fantasy px-3 py-2 rounded text-sm">
                                    <i class="fas fa-search mr-1"></i>Search
                                </button>
                                ${State.campaignSearch ? `<button onclick="clearCampaignSearch()" class="btn-galactic px-3 py-2 rounded text-sm"><i class="fas fa-times"></i></button>` : ''}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="parchment scroll-border p-3 mb-4 fade-in">
                    <div class="text-sm text-amber-800">
                        <span class="font-bold">${filtered.length}</span> of <span class="font-bold">${campaigns.length}</span> campaigns
                        ${selectedSetting !== 'All' ? ` • Setting: <span class="font-bold">${selectedSetting}</span>` : ''}
                        ${searchTerm ? ` • Search: "<span class="font-bold">${State.campaignSearch}</span>"` : ''}
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    ${filtered.length === 0 ? `
                        <div class="col-span-full parchment scroll-border p-8 text-center">
                            <i class="fas fa-search text-4xl text-amber-700 mb-3"></i>
                            <p class="fantasy-font text-lg text-amber-900">No campaigns found</p>
                        </div>
                    ` : filtered.map(c => `
                        <div class="parchment scroll-border p-4 fade-in hover:shadow-lg transition-shadow">
                            <div class="flex justify-between items-start mb-2">
                                <span class="text-xs bg-amber-200 text-amber-900 px-2 py-1 rounded">${c.code}</span>
                                <span class="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded border border-amber-300">${c.setting}</span>
                            </div>
                            <h3 class="fantasy-font font-bold text-amber-900 text-sm mb-1">${c.title}</h3>
                            <div class="flex gap-2 mb-2 text-xs">
                                <span class="text-amber-700"><i class="fas fa-layer-group mr-1"></i>${c.levels}</span>
                                <span class="text-amber-700"><i class="fas fa-tag mr-1"></i>${c.type}</span>
                            </div>
                            <p class="text-xs text-amber-800 leading-relaxed mb-3">${c.description}</p>
                            <div class="flex gap-2">
                                <button onclick="State.selectedCampaign = {code: '${c.code}', title: '${c.title.replace(/'/g, "\'")}', setting: '${c.setting}', levels: '${c.levels}', type: '${c.type}', description: '${c.description.replace(/'/g, "\'")}', fullStory: '${(c.fullStory || c.description).replace(/'/g, "\'")}'}; changeView('campaign_detail');" class="btn-fantasy px-3 py-1 rounded text-xs flex-1">
                                    <i class="fas fa-book-open mr-1"></i>Read Story
                                </button>
                                <button onclick="selectCampaign('${c.code.replace(/'/g, "\'")}')" class="btn-galactic px-3 py-1 rounded text-xs">
                                    <i class="fas fa-check"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function renderUsers(container) {
    if (!isDM()) {
        container.innerHTML = `
            <div class="min-h-screen p-8 text-center">
                <div class="parchment scroll-border p-6 max-w-lg mx-auto">
                    <i class="fas fa-lock text-4xl text-red-700 mb-4"></i>
                    <h2 class="fantasy-font text-xl text-red-900 mb-2">Access Denied</h2>
                    <p class="text-amber-800">Only the Dungeon Master can manage users.</p>
                    <button onclick="changeView('dashboard')" class="btn-galactic px-4 py-2 rounded mt-4">Back to Dashboard</button>
                </div>
            </div>
        `;
        return;
    }

    const users = listUsers();

    container.innerHTML = `
        <div class="min-h-screen p-4">
            <div class="max-w-4xl mx-auto">
                <div class="parchment scroll-border p-4 mb-4 fade-in">
                    <div class="flex justify-between items-center">
                        <div class="flex items-center gap-3">
                            <button onclick="changeView('dm_view')" class="btn-galactic px-3 py-2 rounded text-sm">
                                <i class="fas fa-arrow-left"></i> Back
                            </button>
                            <h1 class="fantasy-font text-2xl font-bold text-amber-900">
                                <i class="fas fa-users-cog mr-2 text-amber-700"></i>User Management
                            </h1>
                        </div>
                    </div>
                </div>

                <!-- Create User Form -->
                <div class="parchment scroll-border p-4 mb-4 fade-in">
                    <div class="section-header"><i class="fas fa-user-plus"></i>Create New User</div>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
                        <input type="text" id="newUsername" placeholder="Username" class="input-fantasy px-3 py-2 rounded text-sm">
                        <input type="password" id="newPassword" placeholder="Password" class="input-fantasy px-3 py-2 rounded text-sm">
                        <input type="text" id="newName" placeholder="Display Name" class="input-fantasy px-3 py-2 rounded text-sm">
                        <select id="newRole" class="input-fantasy px-3 py-2 rounded text-sm">
                            <option value="player">Player</option>
                            <option value="dm">DM</option>
                        </select>
                    </div>
                    <button onclick="createNewUser()" class="btn-fantasy px-4 py-2 rounded text-sm mt-3">
                        <i class="fas fa-plus mr-1"></i>Create User
                    </button>
                </div>

                <!-- User List -->
                <div class="parchment scroll-border p-4 fade-in">
                    <div class="section-header"><i class="fas fa-users"></i>All Users (${users.length})</div>
                    <div class="space-y-2 mt-3">
                        ${users.length === 0 ? '<p class="text-amber-700 italic">No users found.</p>' : ''}
                        ${users.map(u => `
                            <div class="flex justify-between items-center p-3 bg-amber-100 rounded border border-amber-300">
                                <div class="flex items-center gap-3">
                                    <span class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${u.role === 'dm' ? 'bg-red-600' : 'bg-blue-600'}">
                                        ${u.role === 'dm' ? 'DM' : 'PC'}
                                    </span>
                                    <div>
                                        <div class="font-bold text-amber-900">${u.name}</div>
                                        <div class="text-xs text-amber-700">@${u.username} • ${u.role}</div>
                                    </div>
                                </div>
                                ${u.username !== 'dm' ? `
                                <button onclick="deleteUserAccount('${u.username}')" class="btn-danger px-3 py-1 rounded text-xs">
                                    <i class="fas fa-trash mr-1"></i>Delete
                                </button>
                                ` : '<span class="text-xs text-amber-600 italic">Protected</span>'}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
}
