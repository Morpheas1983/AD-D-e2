/* ============================
   MODULE: Event Handlers (events.js)
   ============================ */
function login(requestedRole) {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!username) return toast('Please enter your username', 'error');
    if (!password) return toast('Please enter your password', 'error');

    const user = verifyCredentials(username, password);
    if (!user) return toast('Invalid username or password', 'error');

    if (requestedRole === 'dm' && user.role !== 'dm') {
        return toast('You do not have DM privileges', 'error');
    }

    State.currentUser = user;
    State.isDM = user.role === 'dm';
    State.view = user.role === 'dm' ? 'dm_view' : 'dashboard';
    Storage.save();
    render();
    toast(`Welcome, ${user.name}! (${user.role === 'dm' ? 'DM' : 'Player'})`);
}



function switchCampaign(campaignId) {
    const trimmed = campaignId ? campaignId.trim() : null;
    if (!trimmed) {
        State.campaignId = null;
    } else {
        State.campaignId = trimmed;
    }
    Storage.save();
    if (db && firebaseAuth && State.campaignId) {
        setupFirebaseListeners();
    }
    changeView('dashboard');
    if (State.campaignId) {
        toast(`Switched to campaign: ${State.campaignId}`);
    } else {
        toast(`Showing all characters.`);
    }
}

function changeCharacterCampaign(charId, newCampaignId) {
    if (!newCampaignId || !newCampaignId.trim()) return toast('Please enter or select a campaign', 'error');
    const char = State.characters.find(c => c.id === charId);
    if (!char) return toast('Character not found', 'error');
    const oldCampaign = char.campaignId || 'default';
    const newCampaign = newCampaignId.trim();
    char.campaignId = newCampaign;
    char.lastUpdated = Date.now();
    Storage.save();
    toast(`${char.name} moved from ${oldCampaign} to ${newCampaign}`);
    render();
}

function createCampaign(name) {
    if (!name || !name.trim()) return toast('Please enter a campaign name', 'error');
    const trimmed = name.trim();
    // Check if already exists
    const exists = State.characters.some(c => c.campaignId === trimmed);
    if (exists) {
        switchCampaign(trimmed);
        return;
    }
    // Create by switching to it
    State.campaignId = trimmed;
    Storage.save();
    if (db && firebaseAuth) {
        setupFirebaseListeners();
    }
    changeView('dashboard');
    toast(`Campaign '${trimmed}' created! Create your first character.`);
}

function logout() {
    firebaseListeners.forEach(ref => ref.off());
    firebaseListeners = [];
    State.currentUser = null;
    State.isDM = false;
    State.currentCharacter = null;
    changeView('login');
}

function changeView(view) {
    State.view = view;
    render();
}

function loadCharacter(id) {
    const char = State.characters.find(c => c.id === id);
    if (!char) return;
    if (!State.isDM && char.player !== State.currentUser) return toast('Access denied', 'error');
    State.currentCharacter = char;
    changeView('sheet');
}

function dmViewCharacter(id) {
    loadCharacter(id);
}

function toast(msg, type='success') {
    const div = document.createElement('div');
    div.className = 'toast';
    div.innerHTML = `<i class="fas fa-${type==='error'?'exclamation-circle':'check-circle'} mr-2"></i>${msg}`;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

function castSpell(spellName, spellLevel) {
    const char = State.currentCharacter;
    if (!char) return;
    const slots = getSpellSlots(char.class, char.level);
    if (!slots[spellLevel - 1]) return toast('No slots for this spell level!', 'error');
    const totalSlots = slots[spellLevel - 1];
    char.usedSpellSlots = char.usedSpellSlots || {};
    const used = char.usedSpellSlots[spellLevel] || 0;
    if (used >= totalSlots) return toast('No spell slots remaining for Level ' + spellLevel + '! Rest to restore.', 'error');
    char.usedSpellSlots[spellLevel] = used + 1;
    char.lastUpdated = Date.now();
    Storage.save();
    toast(`Cast ${spellName}! ${totalSlots - used - 1} Level ${spellLevel} slot(s) remaining.`);
    render();
}

function restSpells() {
    const char = State.currentCharacter;
    if (!char) return;
    char.usedSpellSlots = {};
    char.lastUpdated = Date.now();
    Storage.save();
    toast('All spell slots restored after rest!');
    render();
}

function exportCampaign() {
    const data = {
        characters: State.characters,
        creatures: State.creatures,
        customSpells: State.customSpells,
        campaign: State.campaign,
        exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `adnd_campaign_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Campaign exported!');
}

function importCampaign() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (data.characters) State.characters = data.characters;
                if (data.creatures) State.creatures = data.creatures;
                if (data.customSpells) State.customSpells = data.customSpells;
                if (data.campaign) State.campaign = data.campaign;
                Storage.save();
                render();
                toast('Campaign imported successfully!');
            } catch (err) {
                toast('Invalid file format', 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

let createStep = 1;
let tempInventory = [];
let tempGold = 0;

function nextStep() {
    if (createStep === 1) {
        if (!$('charName').value.trim()) return toast('Please enter a character name', 'error');
    }
    if (createStep === 2) {
        if (!$('charClass').value) return toast('Please select a class', 'error');
        const cls = $('charClass').value;
        const isCaster = ['Mage','Specialist Wizard','Bard','Cleric','Druid','Paladin','Ranger'].includes(cls);
        if (isCaster) {
            const isWizard = ['Mage','Specialist Wizard','Bard'].includes(cls);
            if (isWizard) {
                const schools = Array.from(document.querySelectorAll('input[name="wizardSchool"]:checked')).map(cb => cb.value);
                if (schools.length === 0) return toast('Please select at least one school of magic', 'error');
            } else {
                const spheres = Array.from(document.querySelectorAll('input[name="priestSphere"]:checked')).map(cb => cb.value);
                if (spheres.length === 0) return toast('Please select at least one sphere of influence', 'error');
            }
        }
    }
    if (createStep === 3) {
        const race = $('charRace').value;
        const r = DB.races[race];
        const clsName = $('charClass').value;
        const cls = DB.classes[clsName];
        const stats = ['str','dex','con','int','wis','cha'];
        for (let s of stats) {
            const val = parseInt($('stat_'+s).value);
            const raceMin = r['min_'+s], raceMax = r['max_'+s];
            const classMin = cls?.requirements?.[s] || 0;
            if (val < raceMin || val > raceMax) return toast(`${s.toUpperCase()} must be between ${raceMin} and ${raceMax} for ${race}`, 'error');
            if (val < classMin) return toast(`${s.toUpperCase()} must be at least ${classMin} for ${clsName}`, 'error');
        }
    }
    createStep++;
    updateWizardUI();
}

function prevStep() {
    createStep--;
    const nextBtn = $('nextBtn');
    if (nextBtn) nextBtn.disabled = false;
    updateWizardUI();
}

function updateWizardUI() {
    document.querySelectorAll('.create-step').forEach(el => el.classList.add('hidden'));
    $(`step${createStep}`).classList.remove('hidden');
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.step) === createStep);
    });
    $('prevBtn').classList.toggle('hidden', createStep === 1);
    $('nextBtn').classList.toggle('hidden', createStep === 5);
    $('finishBtn').classList.toggle('hidden', createStep !== 5);
    if (createStep === 2) updateClassOptions();
    if (createStep === 3) updateStatPreview();
    if (createStep === 5) {
        updateGoldDisplay();
        updateCreateHPDisplay();
    }
}

function updateRacePreview() {
    const race = $('charRace').value;
    const r = DB.races[race];
    $('racePreview').innerHTML = `
        <strong>${race}</strong><br>
        STR: ${r.min_str}-${r.max_str} | DEX: ${r.min_dex}-${r.max_dex} | CON: ${r.min_con}-${r.max_con}<br>
        INT: ${r.min_int}-${r.max_int} | WIS: ${r.min_wis}-${r.max_wis} | CHA: ${r.min_cha}-${r.max_cha}<br>
        <em>${r.special}</em><br>
        Infravision: ${r.infravision}' | Size: ${r.size}
    `;
}

function rollCharacterStats() {
    const rolls = rollStats();
    ['str','dex','con','int','wis','cha'].forEach((s, i) => {
        $('stat_'+s).value = rolls[i];
    });
    updateStatPreview();
    toast('Stats rolled!');
}

function updateStatPreview() {
    const race = $('charRace').value;
    const r = DB.races[race];
    const clsName = $('charClass')?.value;
    const cls = clsName ? DB.classes[clsName] : null;
    let html = '<strong>Modifiers:</strong> ';
    let allValid = true;
    let invalidMsgs = [];

    ['str','dex','con','int','wis','cha'].forEach(s => {
        const val = parseInt($('stat_'+s).value) || 10;
        const mod = getModifier(val);
        const raceMin = r['min_'+s], raceMax = r['max_'+s];
        const classMin = cls?.requirements?.[s] || 0;
        const raceValid = val >= raceMin && val <= raceMax;
        const classValid = val >= classMin;
        const valid = raceValid && classValid;

        const box = $(`stat_${s}`).closest('.stat-box');
        if (valid) box.classList.remove('invalid');
        else box.classList.add('invalid');

        $(`mod_${s}`).textContent = formatMod(mod);
        $(`mod_${s}`).style.color = valid ? (mod >= 0 ? '#166534' : '#991b1b') : '#dc2626';
        html += `${s.toUpperCase()}:${formatMod(mod)} `;

        if (!valid) {
            allValid = false;
            if (!raceValid) invalidMsgs.push(`${s.toUpperCase()} must be ${raceMin}-${raceMax} for ${race}`);
            else if (!classValid) invalidMsgs.push(`${s.toUpperCase()} must be ≥${classMin} for ${clsName}`);
        }
    });

    $('statPreview').innerHTML = html;
    const validationDiv = $('statValidation');
    if (validationDiv) {
        if (!allValid) {
            validationDiv.innerHTML = '<span style="color:#dc2626"><i class="fas fa-exclamation-circle mr-1"></i>' + invalidMsgs.join(' | ') + '</span>';
        } else {
            validationDiv.innerHTML = '<span style="color:#166534"><i class="fas fa-check-circle mr-1"></i>Stats meet all requirements</span>';
        }
    }

    const nextBtn = $('nextBtn');
    if (createStep === 3 && nextBtn) {
        nextBtn.disabled = !allValid;
    }
}

function updateClassList() {
    const race = $('charRace').value;
    const r = DB.races[race];
    const select = $('charClass');
    select.innerHTML = '<option value="">Select Class...</option>' + 
        r.classes.map(c => `<option value="${c}">${c}</option>`).join('');
}

function updateClassOptions() {
    const cls = $('charClass').value;
    const kitSelect = $('charKit');
    const preview = $('classPreview');
    if (!cls) {
        kitSelect.innerHTML = '<option value="None">None</option>';
        preview.innerHTML = '';
        return;
    }
    const kits = DB.kits[cls] || [{name:'None', source:'PHB', desc:'Standard ' + cls}];
    kitSelect.innerHTML = kits.map(k => `<option value="${k.name}">${k.name} (${k.source})</option>`).join('');
    const c = DB.classes[cls];
    preview.innerHTML = `
        <strong>${cls}</strong><br>
        Hit Die: d${c.hd} | THAC0: ${c.thac0[0][1]} at 1st<br>
        Weapon Proficiency Slots: ${c.prof_slots.weapon} | Non-Weapon: ${c.prof_slots.nonweapon}<br>
        Prime Requisite: ${c.prime_req} | Alignment: ${c.alignment.join(', ')}
    `;
    initProficiencySelectors();
    updateCreateHPDisplay();
    updateSchoolSphereSelection();
}

function updateCreateHPDisplay() {
    const cls = $('charClass').value;
    const hpDiv = $('createHPDie');
    if (!cls || !hpDiv) return;
    const c = DB.classes[cls];
    const conMod = getModifier(parseInt($('stat_con')?.value) || 10);
    hpDiv.innerHTML = `d${c.hd} + CON ${formatMod(conMod)}`;
}

function rollCreateHP() {
    const cls = $('charClass').value;
    if (!cls) return;
    const c = DB.classes[cls];
    const conMod = getModifier(parseInt($('stat_con')?.value) || 10);
    const roll = Math.max(1, rollDie(c.hd) + conMod);
    $('createHP').value = roll;
    toast(`Rolled ${roll} HP!`);
}

function initProficiencySelectors() {
    const cls = $('charClass').value;
    if (!cls) return;
    const c = DB.classes[cls];
    const wpDiv = $('weaponProfs');
    if (wpDiv) {
        wpDiv.innerHTML = DB.weapon_proficiencies.map(p => `
            <label class="flex items-center gap-2 cursor-pointer p-1 hover:bg-amber-200 rounded">
                <input type="checkbox" name="wp" value="${p}" class="accent-amber-700">
                <span class="text-sm">${p}</span>
            </label>
        `).join('');
    }
    const nwpDiv = $('nonweaponProfs');
    if (nwpDiv) {
        nwpDiv.innerHTML = DB.nonweapon_proficiencies.map(p => `
            <label class="flex items-center gap-2 cursor-pointer p-1 hover:bg-amber-200 rounded">
                <input type="checkbox" name="nwp" value="${p.name}" class="accent-amber-700">
                <span class="text-sm">${p.name} (${p.ability}${formatMod(p.mod)})</span>
            </label>
        `).join('');
    }
}

function rollStartingGold() {
    const cls = $('charClass').value;
    let gold = 0;
    if (['Fighter','Paladin','Ranger'].includes(cls)) gold = rollDie(6)*10 + rollDie(6)*10 + rollDie(6)*10 + rollDie(6)*10 + rollDie(6)*10;
    else if (['Mage','Specialist Wizard'].includes(cls)) gold = rollDie(4)*10 + rollDie(4)*10 + rollDie(4)*10 + rollDie(4)*10;
    else if (['Cleric','Druid'].includes(cls)) gold = rollDie(6)*10 + rollDie(6)*10 + rollDie(6)*10;
    else if (['Thief','Bard'].includes(cls)) gold = rollDie(6)*10 + rollDie(6)*10 + rollDie(6)*10;
    $('charGold').value = gold;
    tempGold = gold;
    updateGoldDisplay();
}

function addToInventory(type, name) {
    const item = type === 'weapon' ? DB.weapons.find(w => w.name === name) :
                 type === 'armor' ? DB.armor.find(a => a.name === name) :
                 DB.gear.find(g => g.name === name);
    if (!item) return;
    if (tempGold < item.cost) return toast('Not enough gold!', 'error');
    tempGold -= item.cost;
    tempInventory.push({...item, type, qty: 1, equipped: false});
    updateGoldDisplay();
    toast(`Added ${name}`);
}

function updateGoldDisplay() {
    const goldInput = $('charGold');
    if (goldInput) tempGold = parseInt(goldInput.value) || 0;
    const remaining = $('goldRemaining');
    if (remaining) remaining.textContent = tempGold;
    const invDiv = $('startingInventory');
    if (invDiv) {
        invDiv.innerHTML = tempInventory.map(i => `
            <div class="flex justify-between">
                <span>${i.name}</span>
                <span class="text-xs">${i.weight} lbs</span>
            </div>
        `).join('');
    }
}

function finishCreation() {
    const name = $('charName').value.trim();
    const race = $('charRace').value;
    const cls = $('charClass').value;
    const kit = $('charKit').value;
    const alignment = $('charAlignment').value;
    const stats = {};
    ['str','dex','con','int','wis','cha'].forEach(s => {
        stats[s] = parseInt($('stat_'+s).value) || 10;
    });
    const maxHp = parseInt($('createHP').value) || 1;
    const weaponProfs = Array.from(document.querySelectorAll('input[name="wp"]:checked')).map(cb => cb.value);
    const nonweaponProfs = Array.from(document.querySelectorAll('input[name="nwp"]:checked')).map(cb => cb.value);
    const selectedSchools = Array.from(document.querySelectorAll('input[name="wizardSchool"]:checked')).map(cb => cb.value);
    const selectedSpheres = Array.from(document.querySelectorAll('input[name="priestSphere"]:checked')).map(cb => cb.value);

    const char = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        name, player: State.currentUser, race, class: cls, kit: kit || 'None', alignment,
        level: 1, xp: 0, stats, hp: maxHp, maxHp,
        age: $('charAge').value, height: $('charHeight').value, weight: $('charWeight').value,
        hair: $('charHair').value, eyes: $('charEyes').value, deity: $('charDeity').value,
        background: $('charBackground').value,
        weaponProfs, nonweaponProfs,
        selectedSchools: selectedSchools.length ? selectedSchools : [],
        selectedSpheres: selectedSpheres.length ? selectedSpheres : [],
        inventory: tempInventory.map(i => ({...i, equipped: i.type === 'armor'})),
        wealth: { pp:0, gp: tempGold, ep:0, sp:0, cp:0 },
        thiefSkills: {}, knownSpells: [], preparedSpells: [], usedSpellSlots: {},
        campaignId: State.campaignId || 'default',
        lastUpdated: Date.now()
    };
    if (cls === 'Thief' || cls === 'Bard') {
        DB.thieving_skills.forEach(s => char.thiefSkills[s.name] = s.base);
    }
    State.characters.push(char);
    Storage.save();
    tempInventory = [];
    tempGold = 0;
    createStep = 1;
    toast('Character created successfully!');
    changeView('dashboard');
}

function adjustHP(amount) {
    const char = State.currentCharacter;
    if (!char) return;
    char.hp = Math.max(0, Math.min(char.maxHp, char.hp + amount));
    Storage.save();
    render();
}

function adjustHPFromInput() {
    const input = $('hpAdjust');
    const val = parseInt(input.value) || 0;
    if (val === 0) return;
    adjustHP(val);
    input.value = 0;
}

function addXP() {
    const input = $('xpAdd');
    const val = parseInt(input.value) || 0;
    if (val <= 0) return;
    State.currentCharacter.xp = (State.currentCharacter.xp || 0) + val;
    input.value = '';
    Storage.save();
    render();
    toast(`Added ${val} XP!`);
}

function updateWealth(type, val) {
    State.currentCharacter.wealth = State.currentCharacter.wealth || {};
    State.currentCharacter.wealth[type] = parseInt(val) || 0;
    Storage.save();
}

function saveCharacter() {
    Storage.save();
    toast('Character saved!');
}

function recalcHPForLevel() {
    const char = State.currentCharacter;
    const newLevel = parseInt($('editLevelValue').value) || char.level;
    const cls = DB.classes[char.class];
    const conMod = getModifier(char.stats?.con || 10);
    let total = 0;
    for (let i = 1; i <= newLevel; i++) {
        total += Math.max(1, rollDie(cls.hd) + conMod);
    }
    $('editHPValue').value = total;
    toast(`Calculated ${total} HP for level ${newLevel}`);
}

function confirmEditLevel() {
    const char = State.currentCharacter;
    const newLevel = parseInt($('editLevelValue').value);
    if (newLevel < 1 || newLevel > 20) return toast('Level must be between 1 and 20', 'error');
    const newHP = parseInt($('editHPValue').value);
    if (newHP < 1) return toast('HP must be at least 1', 'error');

    char.level = newLevel;
    char.xp = getXPForLevel(char.class, newLevel);
    char.maxHp = newHP;
    char.hp = Math.min(char.hp, char.maxHp);
    char.lastUpdated = Date.now();

    Storage.save();
    closeModal();
    render();
    toast(`Level updated to ${newLevel}, HP set to ${newHP}!`);
}

function addProfFromModal(type) {
    const char = State.currentCharacter;
    const select = $(type === 'weapon' ? 'addWP' : 'addNWP');
    const val = select.value;
    if (!val) return;

    if (type === 'weapon') {
        char.weaponProfs = char.weaponProfs || [];
        char.weaponProfs.push(val);
    } else {
        char.nonweaponProfs = char.nonweaponProfs || [];
        char.nonweaponProfs.push(val);
    }
    Storage.save();
    showManageProfsModal();
    toast(`Added ${val}`);
}

function removeProfFromModal(type, idx) {
    const char = State.currentCharacter;
    if (type === 'weapon') {
        char.weaponProfs.splice(idx, 1);
    } else {
        char.nonweaponProfs.splice(idx, 1);
    }
    Storage.save();
    showManageProfsModal();
    toast('Proficiency removed');
}

function addItemToChar(name, type) {
    const item = type === 'weapon' ? DB.weapons.find(w => w.name === name) :
                 type === 'armor' ? DB.armor.find(a => a.name === name) :
                 DB.gear.find(g => g.name === name);
    if (!item) return;
    State.currentCharacter.inventory = State.currentCharacter.inventory || [];
    State.currentCharacter.inventory.push({...item, type, qty: 1, equipped: false});
    Storage.save();
    render();
    toast(`Added ${name}`);
}

function addCustomItem() {
    const name = $('customItemName').value.trim();
    if (!name) return toast('Please enter an item name', 'error');
    const type = $('customItemType').value;
    const qty = parseInt($('customItemQty').value) || 1;
    const weight = parseFloat($('customItemWeight').value) || 0;
    const cost = parseFloat($('customItemCost').value) || 0;
    const special = $('customItemSpecial').value.trim();
    const notes = $('customItemNotes').value.trim();
    
    const item = { name, type, qty, weight, cost, equipped: false, notes: notes || undefined, special: special || undefined };
    
    if (type === 'weapon') {
        item.damage_sm = $('customItemDamageSM').value || '1d6';
        item.damage_l = $('customItemDamageL').value || '1d8';
        item.damage = item.damage_sm;
        item.bonusAttack = parseInt($('customItemAtk').value) || undefined;
        item.bonusDamage = parseInt($('customItemDmg').value) || undefined;
    }
    if (type === 'armor') {
        item.ac = parseInt($('customItemAC').value) || 10;
        item.bonusAC = parseInt($('customItemACBonus').value) || undefined;
    }
    if (type === 'shield') {
        item.ac_bonus = 1;
        item.bonusAC = parseInt($('customItemACBonus').value) || undefined;
    }
    if (type === 'gear' || type === 'misc') {
        item.bonusAC = parseInt($('customItemACBonus').value) || undefined;
    }
    
    if (item.bonusAttack === 0) delete item.bonusAttack;
    if (item.bonusDamage === 0) delete item.bonusDamage;
    if (item.bonusAC === 0) delete item.bonusAC;
    if (item.special === '') delete item.special;
    if (item.notes === '') delete item.notes;
    
    State.currentCharacter.inventory = State.currentCharacter.inventory || [];
    State.currentCharacter.inventory.push(item);
    Storage.save();
    closeModal();
    render();
    toast(`Added ${name}`);
}

function updateItemQty(idx, val) {
    State.currentCharacter.inventory[idx].qty = Math.max(1, parseInt(val) || 1);
    Storage.save();
    render();
}

function toggleEquip(idx) {
    const item = State.currentCharacter.inventory[idx];
    item.equipped = !item.equipped;
    if (item.equipped && (item.type === 'armor' || item.type === 'shield')) {
        State.currentCharacter.inventory.forEach((i, iidx) => {
            if (iidx !== idx && i.type === item.type) i.equipped = false;
        });
    }
    Storage.save();
    render();
}

function removeItem(idx) {
    if (!confirm('Remove this item?')) return;
    State.currentCharacter.inventory.splice(idx, 1);
    Storage.save();
    render();
}

function toggleLearnSpell(spellName) {
    const char = State.currentCharacter;
    char.knownSpells = char.knownSpells || [];
    const idx = char.knownSpells.indexOf(spellName);
    if (idx > -1) {
        char.knownSpells.splice(idx, 1);
        const prepIdx = char.preparedSpells.indexOf(spellName);
        if (prepIdx > -1) char.preparedSpells.splice(prepIdx, 1);
        toast(`Forgot ${spellName}`);
    } else {
        // Check wizard INT-based spell learning limits
        const isWizard = ['Mage','Specialist Wizard','Bard'].includes(char.class);
        if (isWizard) {
            const availableSpells = getAvailableSpells(char);
            const spell = availableSpells.find(s => s.name === spellName);
            if (!spell) return toast('Spell not found in library', 'error');

            const intScore = char.stats?.int || 10;
            const maxPerLevel = getMaxSpellsPerLevel(intScore);
            const maxLevelByInt = getMaxSpellLevel(intScore);

            // Check max spell level by INT
            if (maxLevelByInt !== null && spell.level > maxLevelByInt) {
                return toast(`Your INT (${intScore}) is too low to learn Level ${spell.level} spells. Max level: ${maxLevelByInt}.`, 'error');
            }

            // Check max spells per level
            if (maxPerLevel !== Infinity) {
                const knownAtLevel = char.knownSpells.filter(name => {
                    const sp = availableSpells.find(s => s.name === name);
                    return sp && sp.level === spell.level;
                }).length;
                if (knownAtLevel >= maxPerLevel) {
                    return toast(`Cannot learn more Level ${spell.level} spells! Max ${maxPerLevel} per level (INT ${intScore}).`, 'error');
                }
            }
        }
        char.knownSpells.push(spellName);
        toast(`Learned ${spellName}`);
    }
    Storage.save();
    render();
}

function togglePrepareSpell(spellName) {
    const char = State.currentCharacter;
    char.preparedSpells = char.preparedSpells || [];
    const idx = char.preparedSpells.indexOf(spellName);
    if (idx > -1) {
        char.preparedSpells.splice(idx, 1);
        toast(`Unprepared ${spellName}`);
    } else {
        char.preparedSpells.push(spellName);
        toast(`Prepared ${spellName}`);
    }
    Storage.save();
    render();
}

function saveCustomSpell() {
    const name = $('spellName').value.trim();
    if (!name) return toast('Spell name required', 'error');
    const char = State.currentCharacter;
    const isWizard = ['Mage','Specialist Wizard','Bard'].includes(char.class);
    const spell = {
        name,
        level: parseInt($('spellLevel').value) || 1,
        [isWizard ? 'school' : 'sphere']: $('spellSchool').value.trim() || 'Unknown',
        range: $('spellRange').value.trim(),
        duration: $('spellDuration').value.trim(),
        aoe: $('spellAOE').value.trim(),
        components: $('spellComponents').value.trim(),
        casting_time: $('spellCastTime').value.trim(),
        save: $('spellSave').value.trim(),
        desc: $('spellDesc').value.trim()
    };
    if (isWizard) {
        State.customSpells.wizard = State.customSpells.wizard || [];
        State.customSpells.wizard.push(spell);
    } else {
        State.customSpells.priest = State.customSpells.priest || [];
        State.customSpells.priest.push(spell);
    }
    Storage.save();
    closeModal();
    render();
    toast(`Added ${name} to spell library!`);
}

function adjustCreatureHP(id, amount) {
    const c = State.creatures.find(x => x.id === id);
    if (!c) return;
    c.hp = Math.max(0, Math.min(c.maxHp, c.hp + amount));
    Storage.save();
    render();
}

function removeCreature(id) {
    if (!confirm('Delete this creature?')) return;
    State.creatures = State.creatures.filter(c => c.id !== id);
    Storage.save();
    render();
}

function saveCreature(id) {
    const name = $('cName').value.trim();
    if (!name) return toast('Name required', 'error');
    const data = {
        id: id || Date.now().toString(36)+Math.random().toString(36).substr(2),
        lastUpdated: Date.now(),
        name,
        type: $('cType').value.trim(),
        hp: parseInt($('cHP').value) || 1,
        maxHp: parseInt($('cMaxHP').value) || 1,
        ac: parseInt($('cAC').value) || 10,
        thac0: parseInt($('cTHAC0').value) || 20,
        weapons: $('cWeapons').value.split(',').map(s => {
            const parts = s.trim().split(':');
            return parts.length === 2 ? {name: parts[0].trim(), damage: parts[1].trim()} : null;
        }).filter(Boolean),
        notes: $('cNotes').value.trim()
    };
    if (id) {
        const idx = State.creatures.findIndex(c => c.id === id);
        if (idx > -1) State.creatures[idx] = data;
    } else {
        State.creatures.push(data);
    }
    Storage.save();
    closeModal();
    render();
    toast(id ? 'Creature updated' : 'Creature added');
}

function rollLevelUpHP() {
    const char = State.currentCharacter;
    const cls = DB.classes[char.class];
    const conMod = getModifier(char.stats?.con || 10);
    const roll = Math.max(1, rollDie(cls.hd) + conMod);
    $('levelUpHP').value = roll;
    toast(`Rolled ${roll} HP!`);
}

function confirmLevelUp() {
    const char = State.currentCharacter;
    const hpGain = parseInt($('levelUpHP').value) || 1;
    char.level = (char.level || 1) + 1;
    char.maxHp = (char.maxHp || 0) + hpGain;
    char.hp = char.maxHp;
    char.lastUpdated = Date.now();

    const newWP = $('newWeaponProf')?.value;
    const newNWP = $('newNonweaponProf')?.value;
    if (newWP) {
        char.weaponProfs = char.weaponProfs || [];
        char.weaponProfs.push(newWP);
    }
    if (newNWP) {
        char.nonweaponProfs = char.nonweaponProfs || [];
        char.nonweaponProfs.push(newNWP);
    }
    if (char.class === 'Thief' || char.class === 'Bard') {
        DB.thieving_skills.forEach(s => {
            char.thiefSkills[s.name] = (char.thiefSkills[s.name] || s.base) + Math.floor(Math.random() * 6) + 1;
        });
    }
    Storage.save();
    toast(`Level up! ${char.name} is now level ${char.level}!`);
    changeView('sheet');
}

function setCampaignTab(tab) {
    State.campaignTab = tab;
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        const btnTab = btn.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
        if (btnTab === tab) btn.classList.add('active');
    });
    renderCampaignTab(tab);
}

function saveCampaignStory() {
    State.campaign = State.campaign || {};
    State.campaign.story = $('campaignStory').value;
    Storage.save();
    toast('Campaign story saved!');
}

function saveDMNotes() {
    State.campaign = State.campaign || {};
    State.campaign.dmNotes = $('dmNotesArea').value;
    Storage.save();
    toast('DM notes saved!');
}

function savePartyNotes() {
    State.campaign = State.campaign || {};
    State.campaign.partyNotes = $('partyNotesArea').value;
    Storage.save();
    toast('Party notes saved!');
}

function saveMyNotes() {
    State.campaign = State.campaign || {};
    State.campaign.playerNotes = State.campaign.playerNotes || {};
    State.campaign.playerNotes[State.currentUser] = $('myNotesArea').value;
    Storage.save();
    toast('Personal notes saved!');
}

function showAddSessionModal() {
    $('modalContainer').innerHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="p-6">
                    <h2 class="fantasy-font text-xl font-bold text-amber-900 mb-4">Add Session Entry</h2>
                    <div class="space-y-3">
                        <div>
                            <label class="block text-sm font-bold text-amber-900 mb-1">Session Title</label>
                            <input type="text" id="sessionTitle" class="input-fantasy w-full px-3 py-2" placeholder="e.g., The Dungeon of Shadows">
                        </div>
                        <div>
                            <label class="block text-sm font-bold text-amber-900 mb-1">Date</label>
                            <input type="date" id="sessionDate" class="input-fantasy w-full px-3 py-2" value="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <div>
                            <label class="block text-sm font-bold text-amber-900 mb-1">What Happened?</label>
                            <textarea id="sessionContent" class="input-fantasy w-full px-3 py-2 h-32 resize-none" placeholder="Describe the events of the session..."></textarea>
                        </div>
                    </div>
                    <div class="flex justify-end gap-2 mt-4">
                        <button onclick="closeModal()" class="btn-galactic px-4 py-2 rounded">Cancel</button>
                        <button onclick="addSessionEntry()" class="btn-fantasy px-4 py-2 rounded">Add Entry</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function addSessionEntry() {
    const title = $('sessionTitle').value.trim();
    const date = $('sessionDate').value;
    const content = $('sessionContent').value.trim();
    if (!title) return toast('Title required', 'error');
    
    State.campaign = State.campaign || {};
    State.campaign.sessions = State.campaign.sessions || [];
    State.campaign.sessions.push({ title, date, content });
    Storage.save();
    closeModal();
    renderCampaignTab('log');
    toast('Session added!');
}

function deleteSession(idx) {
    if (!confirm('Delete this session entry?')) return;
    State.campaign.sessions.splice(idx, 1);
    Storage.save();
    renderCampaignTab('log');
}

function updateSchoolSphereSelection() {
    const cls = $('charClass').value;
    const alignment = $('charAlignment').value;
    const container = $('schoolSphereSelection');
    const content = $('schoolSphereContent');

    if (!cls || !container || !content) return;

    const isWizard = ['Mage', 'Specialist Wizard', 'Bard'].includes(cls);
    const isPriest = ['Cleric', 'Druid', 'Paladin', 'Ranger'].includes(cls);

    if (!isWizard && !isPriest) {
        container.classList.add('hidden');
        return;
    }

    container.classList.remove('hidden');

    if (isWizard) {
        const schools = getAvailableSchools(alignment);
        const isSpecialist = cls === 'Specialist Wizard';
        const kit = $('charKit')?.value;
        const kitSchool = kit && kit !== 'None' ? kit : null;

        if (isSpecialist && kitSchool) {
            content.innerHTML = `
                <p class="text-xs text-amber-700 mb-2">Your specialty school is determined by your kit: <strong>${kitSchool}</strong>.</p>
                <input type="hidden" name="wizardSchool" value="${kitSchool}">
            `;
            return;
        }

        content.innerHTML = `
            <p class="text-xs text-amber-700 mb-2">${isSpecialist ? 'Select your specialty school (choose a kit first):' : 'Select the schools of magic you have access to:'}</p>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
                ${schools.map(s => `
                    <label class="flex items-center gap-2 cursor-pointer p-2 hover:bg-amber-200 rounded">
                        <input type="${isSpecialist ? 'radio' : 'checkbox'}" name="wizardSchool" value="${s}" class="accent-amber-700">
                        <span class="text-sm">${s}</span>
                    </label>
                `).join('')}
            </div>
        `;
    } else {
        const spheres = getAvailableSpheres(alignment);
        content.innerHTML = `
            <p class="text-xs text-amber-700 mb-2">Select the spheres of influence you have access to:</p>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
                ${spheres.map(s => `
                    <label class="flex items-center gap-2 cursor-pointer p-2 hover:bg-amber-200 rounded">
                        <input type="checkbox" name="priestSphere" value="${s}" class="accent-amber-700">
                        <span class="text-sm">${s}</span>
                    </label>
                `).join('')}
            </div>
        `;
    }
}

function confirmChangeClass() {
    const char = State.currentCharacter;
    const newClass = document.querySelector('input[name="newClass"]:checked')?.value;
    if (!newClass || newClass === char.class) {
        closeModal();
        return;
    }

    char.class = newClass;
    char.kit = 'None';
    char.knownSpells = [];
    char.preparedSpells = [];
    char.usedSpellSlots = {};
    char.selectedSchools = [];
    char.selectedSpheres = [];

    if (newClass === 'Thief' || newClass === 'Bard') {
        char.thiefSkills = {};
        DB.thieving_skills.forEach(s => char.thiefSkills[s.name] = s.base);
    } else {
        char.thiefSkills = {};
    }

    char.lastUpdated = Date.now();
    Storage.save();
    closeModal();
    render();
    toast(`Class changed to ${newClass}!`);
}

function deleteCharacter() {
    const char = State.currentCharacter;
    if (!char) return;

    const idx = State.characters.findIndex(c => c.id === char.id);
    if (idx > -1) {
        State.characters.splice(idx, 1);
        State.currentCharacter = null;
        Storage.save();
        closeModal();
        changeView('dashboard');
        toast(`Character "${char.name}" has been deleted.`, 'success');
    }
}

function searchMonsters() {
    const input = document.getElementById('monsterSearchInput');
    if (input) {
        State.monsterSearch = input.value;
        render();
    }
}

function clearMonsterSearch() {
    State.monsterSearch = '';
    render();
}

/* ============================
   TACTICAL MAP HANDLERS
   ============================ */

function setMapTool(tool) {
    State.mapTool = tool;
    State.mapDragging = false;
    State.mapSelectedToken = null;
    render();
}

function addToken(type, name, color) {
    const map = State.tacticalMap || { gridSize: 50, tokens: [], terrain: [], width: 20, height: 15 };
    const token = {
        id: Date.now() + Math.random(),
        type: type,
        name: name,
        color: color,
        x: Math.floor(map.width / 2),
        y: Math.floor(map.height / 2),
        size: 1
    };
    map.tokens.push(token);
    State.tacticalMap = map;
    drawTacticalMap();
    toast(`${name} added to map`);
}

function addCustomToken() {
    const name = document.getElementById('customTokenName')?.value;
    const type = document.getElementById('customTokenType')?.value || 'monster';
    if (!name) return toast('Enter a token name', 'error');
    const colors = { monster: '#6b7280', player: '#3b82f6', npc: '#f59e0b', object: '#9ca3af' };
    addToken(type, name, colors[type] || '#6b7280');
}

function clearMap() {
    if (!confirm('Clear all tokens and terrain?')) return;
    State.tacticalMap = { gridSize: 50, tokens: [], terrain: [], width: 20, height: 15 };
    drawTacticalMap();
    toast('Map cleared');
}

function saveMap() {
    Storage.save();
    toast('Map saved');
}

function getCanvasCoords(evt) {
    const canvas = document.getElementById('tacticalCanvas');
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (evt.clientX - rect.left) * scaleX,
        y: (evt.clientY - rect.top) * scaleY
    };
}

function getGridSquare(x, y, gridSize) {
    return { x: Math.floor(x / gridSize), y: Math.floor(y / gridSize) };
}

function handleMapMouseDown(evt) {
    const map = State.tacticalMap || { gridSize: 50, tokens: [], terrain: [] };
    const coords = getCanvasCoords(evt);
    if (!coords) return;
    const grid = getGridSquare(coords.x, coords.y, map.gridSize);
    const tool = State.mapTool || 'select';

    if (evt.button === 2 || evt.shiftKey) {
        // Right-click or shift+click: try to grab token
        const token = map.tokens.find(t => t.x === grid.x && t.y === grid.y);
        if (token) {
            State.mapDragging = true;
            State.draggedToken = token;
            State.dragOffset = { x: coords.x - (token.x * map.gridSize), y: coords.y - (token.y * map.gridSize) };
        }
        return;
    }

    if (tool === 'select') {
        const token = map.tokens.find(t => t.x === grid.x && t.y === grid.y);
        if (token) {
            if (State.mapSelectedToken && State.mapSelectedToken.id !== token.id) {
                // Calculate distance between two selected tokens
                const dist = calculateGridDistance(State.mapSelectedToken, token);
                document.getElementById('distanceInfo').innerHTML = `
                    <div class="text-amber-900">
                        <div class="font-bold">${State.mapSelectedToken.name} → ${token.name}</div>
                        <div class="text-lg font-bold">${dist.squares} squares</div>
                        <div class="text-xs">${dist.feet} feet • ${dist.diagonal} diagonal steps</div>
                    </div>
                `;
            }
            State.mapSelectedToken = token;
            document.getElementById('tokenInfo').innerHTML = `
                <div class="text-amber-900">
                    <div class="font-bold">${token.name}</div>
                    <div class="text-xs">Type: ${token.type} • Position: (${token.x}, ${token.y})</div>
                    <div class="text-xs mt-1">Right-click and drag to move. Shift+click to delete.</div>
                </div>
            `;
        } else {
            State.mapSelectedToken = null;
            document.getElementById('tokenInfo').innerHTML = '<p class="italic text-amber-600">Click a token to see details</p>';
            document.getElementById('distanceInfo').innerHTML = '<p class="italic text-amber-600">Select two tokens to calculate distance</p>';
        }
    } else if (tool === 'erase') {
        // Remove terrain at this square
        map.terrain = map.terrain.filter(t => !(t.x === grid.x && t.y === grid.y));
        // Remove token at this square
        map.tokens = map.tokens.filter(t => !(t.x === grid.x && t.y === grid.y));
        State.tacticalMap = map;
        drawTacticalMap();
    } else {
        // Draw terrain
        const terrainTypes = { wall: '#5c4033', door: '#8b6914', water: '#1e40af', difficult: '#92400e' };
        map.terrain = map.terrain.filter(t => !(t.x === grid.x && t.y === grid.y));
        map.terrain.push({ x: grid.x, y: grid.y, type: tool, color: terrainTypes[tool] || '#5c4033' });
        State.tacticalMap = map;
        drawTacticalMap();
    }
}

function handleMapMouseMove(evt) {
    if (!State.mapDragging || !State.draggedToken) return;
    const map = State.tacticalMap || { gridSize: 50 };
    const coords = getCanvasCoords(evt);
    if (!coords) return;
    const grid = getGridSquare(coords.x, coords.y, map.gridSize);
    State.draggedToken.x = Math.max(0, Math.min(grid.x, map.width - 1));
    State.draggedToken.y = Math.max(0, Math.min(grid.y, map.height - 1));
    drawTacticalMap();
}

function handleMapMouseUp(evt) {
    if (State.mapDragging && State.draggedToken) {
        toast(`${State.draggedToken.name} moved to (${State.draggedToken.x}, ${State.draggedToken.y})`);
        Storage.save();
    }
    State.mapDragging = false;
    State.draggedToken = null;
}

function calculateGridDistance(tokenA, tokenB) {
    const dx = Math.abs(tokenA.x - tokenB.x);
    const dy = Math.abs(tokenA.y - tokenB.y);
    const minDist = Math.min(dx, dy);
    const maxDist = Math.max(dx, dy);
    // AD&D 2e: diagonal = 1.5 squares
    const squares = maxDist + Math.floor(minDist / 2);
    const feet = squares * 5;
    return { squares, feet, diagonal: minDist };
}

function drawTacticalMap() {
    const canvas = document.getElementById('tacticalCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const map = State.tacticalMap || { gridSize: 50, tokens: [], terrain: [], width: 20, height: 15 };
    const gs = map.gridSize;

    // Clear
    ctx.fillStyle = '#f5e6c8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#d4a574';
    ctx.lineWidth = 1;
    for (let x = 0; x <= map.width; x++) {
        ctx.beginPath();
        ctx.moveTo(x * gs, 0);
        ctx.lineTo(x * gs, map.height * gs);
        ctx.stroke();
    }
    for (let y = 0; y <= map.height; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * gs);
        ctx.lineTo(map.width * gs, y * gs);
        ctx.stroke();
    }

    // Draw terrain
    map.terrain.forEach(t => {
        ctx.fillStyle = t.color || '#5c4033';
        ctx.fillRect(t.x * gs + 1, t.y * gs + 1, gs - 2, gs - 2);
        // Draw terrain icon
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = `${gs * 0.4}px FontAwesome`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const icons = { wall: '\uf0c8', door: '\uf6aa', water: '\uf773', difficult: '\uf6fc' };
        ctx.fillText(icons[t.type] || '', t.x * gs + gs/2, t.y * gs + gs/2);
    });

    // Draw tokens
    map.tokens.forEach(t => {
        const cx = t.x * gs + gs / 2;
        const cy = t.y * gs + gs / 2;
        const radius = gs * 0.4;

        // Token circle
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = t.color || '#6b7280';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Selection highlight
        if (State.mapSelectedToken && State.mapSelectedToken.id === t.id) {
            ctx.beginPath();
            ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2);
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        // Label
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${gs * 0.22}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(t.name.substring(0, 3), cx, cy);
    });

    // Draw distance line if two tokens selected
    if (State.mapSelectedToken) {
        const t = State.mapSelectedToken;
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(t.x * gs + gs/2, t.y * gs + gs/2, gs * 0.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }
}

/* ============================
   CAMPAIGN HANDLERS
   ============================ */

function searchCampaigns() {
    const input = document.getElementById('campaignSearchInput');
    if (input) {
        State.campaignSearch = input.value;
        render();
    }
}

function clearCampaignSearch() {
    State.campaignSearch = '';
    render();
}

function selectCampaign(code) {
    const campaign = (DB.campaigns || []).find(c => c.code === code);
    if (!campaign) return;
    State.selectedCampaign = campaign;
    toast(`Campaign selected: ${campaign.title}`);
    Storage.save();
}

function createNewUser() {
    const username = document.getElementById('newUsername').value.trim();
    const password = document.getElementById('newPassword').value;
    const name = document.getElementById('newName').value.trim();
    const role = document.getElementById('newRole').value;

    const result = createUser(username, password, role, name);
    if (result.success) {
        toast(result.message, 'success');
        // Clear form
        document.getElementById('newUsername').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('newName').value = '';
        render();
    } else {
        toast(result.message, 'error');
    }
}

function deleteUserAccount(username) {
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) return;
    const result = deleteUser(username);
    if (result.success) {
        toast(result.message, 'success');
        render();
    } else {
        toast(result.message, 'error');
    }
}

