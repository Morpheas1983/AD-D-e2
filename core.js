/* ============================
   UTILITIES & STATE
   ============================ */
const $ = id => document.getElementById(id);

const State = {
    view: 'login',
    currentUser: null,
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
