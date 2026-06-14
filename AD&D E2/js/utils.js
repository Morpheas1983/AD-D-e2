/* ============================
   UTILITIES & STATE
   ============================ */
const $ = id => document.getElementById(id);

const State = {
    view: 'login',
    previousView: null,
    currentUser: null,
    currentUserName: null,
    isDM: false,
    currentCharacter: null,
    characters: [],
    creatures: [],
    customSpells: { wizard: [], priest: [] },
    campaign: null,
    campaignTab: 'story',
    campaignId: null,
    firebaseReady: false
};

function rollDie(sides) { return Math.floor(Math.random() * sides) + 1; }
function rollStats() {
    return Array(6).fill(0).map(() => {
        const rolls = Array(4).fill(0).map(() => rollDie(6));
        rolls.sort((a,b) => b-a).pop();
        return rolls.reduce((a,b) => a+b, 0);
    });
}
function getModifier(score) {
    if (score >= 18) return 2;
    if (score >= 16) return 1;
    if (score >= 13) return 0;
    if (score >= 9) return 0;
    if (score >= 6) return -1;
    if (score >= 4) return -2;
    return -3;
}
function formatMod(mod) { return mod >= 0 ? `+${mod}` : `${mod}`; }
function getTHAC0(className, level) {
    const cls = DB.classes[className];
    if (!cls) return 20;
    const entry = cls.thac0.find(t => t[0] === level);
    return entry ? entry[1] : (cls.thac0[cls.thac0.length-1]?.[1] || 20);
}
function getSave(className, level, saveType) {
    const cls = DB.classes[className];
    if (!cls) return 20;
    const saves = cls.saves[saveType];
    if (!saves) return 20;
    if (level <= 5) return saves[0];
    if (level <= 10) return saves[1];
    if (level <= 15) return saves[2];
    if (level <= 20) return saves[3];
    return saves[4];
}
function calcAC(char) {
    const dexMod = getModifier(char.stats?.dex || 10);
    let baseAC = 10;
    let totalAC = baseAC - dexMod;

    const armor = char.inventory?.find(i => i.equipped && i.type === 'armor');
    if (armor) {
        baseAC = armor.ac - (armor.bonusAC || 0);
        totalAC = baseAC - dexMod;
    }

    const shield = char.inventory?.find(i => i.equipped && i.type === 'shield');
    if (shield) {
        totalAC -= (shield.ac_bonus || 1) + (shield.bonusAC || 0);
    }

    // Rings, amulets, cloaks, and other protection items
    const otherProtection = char.inventory?.filter(i => 
        i.equipped && 
        i.type !== 'armor' && 
        i.type !== 'shield' && 
        i.type !== 'weapon' && 
        (i.bonusAC || 0) !== 0
    ) || [];
    otherProtection.forEach(item => {
        totalAC -= (item.bonusAC || 0);
    });

    return totalAC;
}

function getACBreakdown(char) {
    const dexMod = getModifier(char.stats?.dex || 10);
    const armor = char.inventory?.find(i => i.equipped && i.type === 'armor');
    const shield = char.inventory?.find(i => i.equipped && i.type === 'shield');
    const otherProtection = char.inventory?.filter(i => 
        i.equipped && 
        i.type !== 'armor' && 
        i.type !== 'shield' && 
        i.type !== 'weapon' && 
        (i.bonusAC || 0) !== 0
    ) || [];

    let parts = [`Base 10`];
    if (dexMod !== 0) {
        parts.push(`DEX ${formatMod(dexMod)}`);
    }
    if (armor) {
        const armorVal = armor.ac - (armor.bonusAC || 0);
        parts.push(`${armor.name} ${armorVal}`);
    }
    if (shield) {
        const shieldBonus = (shield.ac_bonus || 1) + (shield.bonusAC || 0);
        parts.push(`${shield.name} ${shieldBonus}`);
    }
    otherProtection.forEach(item => {
        parts.push(`${item.name} ${item.bonusAC}`);
    });
    return parts.join(' - ') + ' = ' + calcAC(char);
}


function calcTHAC0(char) {
    const base = getTHAC0(char.class, char.level);
    const strMod = getModifier(char.stats?.str || 10);
    const weapon = char.inventory?.find(i => i.equipped && i.type === 'weapon');
    const weaponBonus = weapon?.bonusAttack || 0;
    return base - weaponBonus - strMod;
}

function getNextXP(className, level) {
    const cls = DB.classes[className];
    if (!cls) return 2000;
    return cls.xp_table[level] || 9999999;
}
function getXPForLevel(className, level) {
    const cls = DB.classes[className];
    if (!cls) return 0;
    return cls.xp_table[level-1] || 0;
}
function getExpectedProfs(className, level) {
    const cls = DB.classes[className];
    if (!cls) return { weapon: 2, nonweapon: 2 };
    const weaponExtra = Math.floor((level - 1) / cls.prof_advance.weapon);
    const nonweaponExtra = Math.floor((level - 1) / cls.prof_advance.nonweapon);
    return {
        weapon: cls.prof_slots.weapon + weaponExtra,
        nonweapon: cls.prof_slots.nonweapon + nonweaponExtra
    };
}

function getSpellSlots(className, level) {
    const cls = DB.classes[className];
    if (!cls || !cls.spell_slots) {
        console.log('getSpellSlots: no spell_slots for', className);
        return [];
    }
    const slots = cls.spell_slots;
    const numLevel = parseInt(level) || 1;
    let effectiveLevel = numLevel;
    if (slots.offset) {
        effectiveLevel = numLevel - slots.offset;
        if (effectiveLevel < 1) {
            console.log('getSpellSlots:', className, 'level', numLevel, 'offset', slots.offset, '-> no spells yet');
            return [];
        }
    }
    const idx = Math.min(effectiveLevel - 1, slots.table.length - 1);
    const result = slots.table[idx] || [];
    console.log('getSpellSlots:', className, 'level', numLevel, 'effective', effectiveLevel, 'idx', idx, 'result', JSON.stringify(result));
    return result;
}

function getCasterType(className) {
    const cls = DB.classes[className];
    if (!cls || !cls.spell_slots) return null;
    return cls.spell_slots.type;
}

function isGood(alignment) { return alignment && alignment.includes('Good'); }
function isEvil(alignment) { return alignment && alignment.includes('Evil'); }
function isLawful(alignment) { return alignment && alignment.includes('Lawful'); }
function isChaotic(alignment) { return alignment && alignment.includes('Chaotic'); }
function isNeutralAlignment(alignment) { return alignment === 'True Neutral' || (alignment && alignment.includes('Neutral') && !alignment.includes('Good') && !alignment.includes('Evil')); }

function getAvailableSchools(alignment) {
    const all = DB.wizard_schools;
    if (!alignment) return all;
    if (isGood(alignment)) return all.filter(s => s !== 'Necromancy');
    if (isEvil(alignment)) return all.filter(s => s !== 'Divination' && s !== 'Enchantment');
    return all;
}

function getAvailableSpheres(alignment) {
    const all = DB.priest_spheres;
    if (!alignment) return all;
    if (isGood(alignment)) return all.filter(s => !['Necromantic', 'Chaos'].includes(s));
    if (isEvil(alignment)) return all.filter(s => !['Healing', 'Sun', 'Guardian', 'Protection', 'Law'].includes(s));
    if (isLawful(alignment)) return all.filter(s => s !== 'Chaos');
    if (isChaotic(alignment)) return all.filter(s => s !== 'Law');
    return all;
}

function getMaxSpellsPerLevel(intScore) {
    if (intScore >= 19) return Infinity; // All spells
    if (intScore >= 18) return 18;
    if (intScore >= 17) return 14;
    if (intScore >= 15) return 11;
    if (intScore >= 13) return 9;
    if (intScore >= 10) return 7;
    if (intScore >= 9)  return 6;
    return 0; // Cannot learn spells
}

function getMaxSpellLevel(intScore) {
    if (intScore >= 18) return 9;
    if (intScore >= 16) return 8;
    if (intScore >= 14) return 7;
    if (intScore >= 12) return 6;
    if (intScore >= 10) return 5;
    if (intScore >= 9)  return 4;
    return 0;
}

function parseMonsterHD(hdString) {
    if (!hdString || hdString === 'Varies') return { count: 1, die: 8, bonus: 0, text: hdString };
    // Match patterns like "3", "1+2", "1-1", "3+3", "4-7", "7+7", "11+"
    const match = hdString.match(/^(\d+)(?:([+-])(\d+))?$/);
    if (!match) return { count: 1, die: 8, bonus: 0, text: hdString };
    const count = parseInt(match[1]);
    const operator = match[2] || '';
    const bonusVal = match[3] ? parseInt(match[3]) : 0;
    const bonus = operator === '+' ? bonusVal : operator === '-' ? -bonusVal : 0;
    return { count, die: 8, bonus, text: hdString };
}

function calculateMonsterHP(hdInfo, level) {
    const avg = (hdInfo.die + 1) / 2;
    const baseHP = Math.round(level * avg);
    const totalHP = baseHP + hdInfo.bonus;
    return { min: level + hdInfo.bonus, max: (level * hdInfo.die) + hdInfo.bonus, avg: totalHP, formula: `${level}d${hdInfo.die}${hdInfo.bonus >= 0 ? '+' + hdInfo.bonus : hdInfo.bonus}` };
}

function calculateMonsterTHAC0(baseTHAC0, baseLevel, newLevel) {
    return Math.max(1, baseTHAC0 - (newLevel - baseLevel));
}

function calculateMonsterXP(baseXP, baseLevel, newLevel) {
    if (baseLevel <= 0) return baseXP;
    return Math.round(baseXP * (newLevel / baseLevel));
}

function scaleSpecialAttack(special, baseLevel, newLevel) {
    if (!special || baseLevel <= 0 || newLevel === baseLevel) return special;
    const ratio = newLevel / baseLevel;
    // Scale patterns like "3d8" in breath weapons, "1d6+1/HD", "2d4+1/HD"
    let scaled = special;
    // Scale explicit /HD patterns
    scaled = scaled.replace(/(\d+d\d+([+-]\d+)?)\/HD/gi, (match, dmg) => {
        const scaledDmg = scaleDamageString(dmg, ratio);
        return scaledDmg + '/HD';
    });
    // Scale breath weapon damage that includes HD reference
    scaled = scaled.replace(/(\d+d\d+([+-]\d+)?)\s*fire/gi, (match, dmg) => {
        if (special.includes('breath') || special.includes('fire')) {
            const scaledDmg = scaleDamageString(dmg, ratio);
            return scaledDmg + ' fire';
        }
        return match;
    });
    return scaled;
}

function scaleDamageString(dmg, ratio) {
    // Parse "2d8+1" or "3d6"
    const match = dmg.match(/^(\d+)d(\d+)([+-]?\d+)?$/);
    if (!match) return dmg;
    const count = Math.max(1, Math.round(parseInt(match[1]) * ratio));
    const die = parseInt(match[2]);
    const bonus = match[3] ? parseInt(match[3]) : 0;
    const scaledBonus = Math.round(bonus * ratio);
    if (scaledBonus === 0) return `${count}d${die}`;
    return `${count}d${die}${scaledBonus >= 0 ? '+' + scaledBonus : scaledBonus}`;
}

function getMonsterSavesByHD(level) {
    if (level <= 1) return "14/16/15/17/17";
    if (level <= 2) return "13/15/14/16/16";
    if (level <= 3) return "12/14/13/15/15";
    if (level <= 4) return "11/13/12/14/14";
    if (level <= 5) return "10/12/11/13/13";
    if (level <= 6) return "9/11/10/12/12";
    if (level <= 7) return "8/10/9/11/11";
    if (level <= 8) return "7/9/8/10/10";
    if (level <= 9) return "6/8/7/9/9";
    if (level <= 10) return "5/7/6/8/8";
    if (level <= 11) return "4/6/5/7/7";
    if (level <= 12) return "3/5/4/6/6";
    return "2/4/3/5/5";
}

function hashPassword(password) {
    // Simple consistent hash - not cryptographically secure but works for this app
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    // Make it look like a hash and be consistent
    const hashStr = Math.abs(hash).toString(16).padStart(8, '0');
    // Double-hash for more entropy
    let hash2 = 0;
    for (let i = 0; i < hashStr.length; i++) {
        hash2 = ((hash2 << 5) - hash2) + hashStr.charCodeAt(i);
        hash2 = hash2 & hash2;
    }
    return hashStr + Math.abs(hash2).toString(16).padStart(8, '0');
}

function verifyCredentials(username, password) {
    const user = (DB.users || []).find(u => u.username === username);
    if (!user) return null;
    const hash = hashPassword(password);
    if (user.passwordHash === hash) return user;
    return null;
}

function isDM() {
    return State.isDM === true;
}

function isPlayer() {
    return State.currentUser && !State.isDM;
}

function canAccessDMFeatures() {
    return State.isDM === true;
}

function getCurrentUserName() {
    return State.currentUserName || State.currentUser || 'Guest';
}

function createUser(username, password, role, name) {
    if (!username || !password) return { success: false, message: 'Username and password required' };
    if ((DB.users || []).find(u => u.username === username)) {
        return { success: false, message: 'Username already exists' };
    }
    if (!['dm', 'player'].includes(role)) {
        return { success: false, message: 'Role must be dm or player' };
    }
    const user = {
        username: username,
        passwordHash: hashPassword(password),
        role: role,
        name: name || username
    };
    DB.users = DB.users || [];
    DB.users.push(user);
    
    localStorage.setItem('adnd2e_users', JSON.stringify(DB.users));
    
    return { success: true, message: `User ${username} created successfully` };
}

function deleteUser(username) {
    const idx = (DB.users || []).findIndex(u => u.username === username);
    if (idx === -1) return { success: false, message: 'User not found' };
    DB.users.splice(idx, 1);
    
    localStorage.setItem('adnd2e_users', JSON.stringify(DB.users));
    
    return { success: true, message: `User ${username} deleted` };
}

function listUsers() {
    return (DB.users || []).map(u => ({ username: u.username, role: u.role, name: u.name }));
}

function isDM() {
    return State.isDM === true;
}

function isPlayer() {
    return State.currentUser && !State.isDM;
}

function canAccessDMFeatures() {
    return State.isDM === true;
}

function getCurrentUserName() {
    return State.currentUserName || State.currentUser || 'Guest';
}

function linkifyStory(text) {
    let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const names = Object.keys(DB.monsters).sort((a, b) => b.length - a.length);
    names.forEach(name => {
        const safeName = name.replace(/'/g, "\'");
        const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(^|[^\w])${escaped}([^\w]|$)`, 'g');
        html = html.replace(regex, (match, before, after) => {
            return `${before}<span class="cursor-pointer text-blue-700 underline hover:text-blue-900" onclick="showMonsterDetail('${safeName}')">${name}</span>${after}`;
        });
    });
    return html;
}

function getMapList() {
    try {
        const raw = localStorage.getItem('adnd2e_maps');
        return raw ? JSON.parse(raw) : [];
    } catch(e) { return []; }
}

function saveMapList(maps) {
    localStorage.setItem('adnd2e_maps', JSON.stringify(maps));
}

function getActiveMapId() {
    return localStorage.getItem('adnd2e_activeMapId') || null;
}

function setActiveMapId(id) {
    if (id) localStorage.setItem('adnd2e_activeMapId', id);
    else localStorage.removeItem('adnd2e_activeMapId');
}

/* ============================
   NAVIGATION & AUTH
   ============================ */
const VIEW_MAP = {
    'login': 'login.html', 'dashboard': 'dashboard.html', 'create': 'create.html',
    'sheet': 'sheet.html', 'inventory': 'inventory.html', 'levelup': 'levelup.html',
    'dm_view': 'dm.html', 'bestiary': 'bestiary.html', 'monsters': 'monsters.html',
    'spells': 'spells.html', 'campaign': 'campaign.html', 'tactical': 'tactical.html',
    'campaigns': 'campaigns.html', 'campaign_detail': 'campaign-detail.html',
    'users': 'users.html'
};

function changeView(view) {
    const target = VIEW_MAP[view];
    if (target) window.location.href = target;
    else console.warn('Unknown view:', view);
}

function goBack() {
    if (window.history.length > 1) history.back();
    else changeView('login');
}

function requireAuth() {
    if (!State.currentUser) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

function requireDM() {
    if (!requireAuth()) return false;
    if (!State.isDM) {
        window.location.href = 'dashboard.html';
        return false;
    }
    return true;
}

function initApp() {
    try {
        const savedUsers = localStorage.getItem('adnd2e_users');
        if (savedUsers) {
            try { DB.users = JSON.parse(savedUsers); } catch(e) {}
        }
        Storage.load();
        Sync.init();
    } catch (err) {
        console.error('App initialization error:', err);
    }
}

function toast(msg, type='success') {
    const div = document.createElement('div');
    div.className = 'toast';
    div.innerHTML = `<i class="fas fa-${type==='error'?'exclamation-circle':'check-circle'} mr-2"></i>${msg}`;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

function logout() {
    firebaseListeners.forEach(ref => ref.off());
    firebaseListeners = [];
    State.currentUser = null;
    State.currentUserName = null;
    State.isDM = false;
    State.currentCharacter = null;
    localStorage.removeItem('adnd2e_currentUser');
    localStorage.removeItem('adnd2e_currentUserName');
    localStorage.removeItem('adnd2e_isDM');
    localStorage.removeItem('adnd2e_currentCharacter');
    changeView('login');
}

function loadCharacter(id) {
    const char = State.characters.find(c => c.id === id);
    if (!char) return;
    if (!State.isDM && char.player !== State.currentUser) return toast('Access denied', 'error');
    State.currentCharacter = char;
	Storage.save();
    changeView('sheet');
}

function dmViewCharacter(id) {
    loadCharacter(id);
}

function switchCampaign(campaignId) {
    const trimmed = campaignId ? campaignId.trim() : null;
    State.campaignId = trimmed || null;
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

function createCampaign(name) {
    if (!name || !name.trim()) return toast('Please enter a campaign name', 'error');
    const trimmed = name.trim();
    const exists = State.characters.some(c => c.campaignId === trimmed);
    if (exists) {
        switchCampaign(trimmed);
        return;
    }
    State.campaignId = trimmed;
    Storage.save();
    if (db && firebaseAuth) {
        setupFirebaseListeners();
    }
    changeView('dashboard');
    toast(`Campaign '${trimmed}' created! Create your first character.`);
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
                toast('Campaign imported successfully!');
                changeView('dashboard');
            } catch (err) {
                toast('Invalid file format', 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}
