// 게임 상태
const gameState = {
    player: {
        level: 1,
        exp: 0,
        gold: 0,
        statPoints: 0,
        hp: 100,
        maxHp: 100,
        mp: 5,
        maxMp: 5,
        baseAtk: 10,
        potions: 0,
        stats: {
            str: 5,
            dex: 5,
            int: 5,
            luk: 5
        }
    },
    dungeon: {
        currentFloor: 1,
        highestFloor: 0,
        pendingGold: 0,
        pendingExp: 0,
        pendingStones: 0,
        inBattle: false
    },
    currentEnemy: null,
    equippedSkills: [null, null, null, null],
    skillCooldowns: {}, // 스킬 ID -> 남은 쿨타임
    activeBuffs: [], // { id, name, icon, turns, effect, value }
    tempRelics: [], // 던전 내 임시 유물
    weapons: {
        sword: 1,
        shield: 1,
        bow: 1,
        staff: 1
    },
    enhancementStones: 0,
    armorLevel: 1,
    gameMode: 'normal', // easy, normal, hard, infinite
    relicChoices: [], // 보스 클리어 후 선택 가능한 유물들 (3개)
    skillChoices: [], // 보스 클리어 후 선택 가능한 스킬들
    pendingNewRelic: null // 교체 대기 중인 유물
};

// 유물 데이터
const relicsData = [
    { id: 'relic_sword', name: '고대의 검날', desc: '공격력 +10', effect: 'atk', value: 10, icon: '⚔️' },
    { id: 'relic_shield', name: '수호의 방패', desc: '받는 피해 -10%', effect: 'def', value: 0.9, icon: '🛡️' },
    { id: 'relic_ring', name: '마력의 반지', desc: '최대 MP +5', effect: 'mp', value: 5, icon: '💍' },
    { id: 'relic_cloak', name: '그림자 망토', desc: '회피율 +10%', effect: 'dodge', value: 10, icon: '🧥' },
    { id: 'relic_amulet', name: '행운의 부적', desc: '크리티컬 +10%', effect: 'crit', value: 10, icon: '🔮' },
    { id: 'relic_boots', name: '신속의 장화', desc: '선제공격 확률 +20%', effect: 'first', value: 20, icon: '👢' },
    { id: 'relic_crown', name: '왕의 왕관', desc: '경험치 획득 +20%', effect: 'exp', value: 1.2, icon: '👑' },
    { id: 'relic_coin', name: '황금 동전', desc: '골드 획득 +20%', effect: 'gold', value: 1.2, icon: '🪙' }
];

// 스킬 데이터
// type: 'active'(액티브), 'buff'(버프), 'passive'(패시브)
// cooldown: 사용 후 쿨타임 (턴)
// buffEffect: 버프 효과 종류, buffValue: 버프 수치, buffTurns: 버프 지속 턴
const skillsData = {
    cat: [
        {
            id: 'cat_rage', name: '광폭화', mpCost: 2, type: 'buff', cooldown: 4,
            buffEffect: 'atkBoost', buffValue: 0.25, buffTurns: 3, buffIcon: '🔥',
            desc: '3턴간 가하는 피해 +25% (쿨 4턴)', char: '묘인'
        },
        {
            id: 'cat_slash', name: '폭렬참', mpCost: 3, damage: 35, type: 'active', cooldown: 2,
            desc: '35 데미지. 반격 받음 (쿨 2턴)', char: '묘인'
        },
        {
            id: 'cat_bleed', name: '피의 갈증', mpCost: 0, type: 'passive',
            effect: 'lifeSteal', value: 0.1,
            desc: '패시브: 공격 시 피해량의 10% HP 회복', char: '묘인'
        }
    ],
    elf: [
        {
            id: 'elf_focus', name: '정신 집중', mpCost: 1, type: 'buff', cooldown: 3,
            buffEffect: 'critBoost', buffValue: 20, buffTurns: 3, buffIcon: '🎯',
            desc: '3턴간 치명타 확률 +20% (쿨 3턴)', char: '엘프'
        },
        {
            id: 'elf_mana', name: '마나 순환', mpCost: 0, type: 'active', cooldown: 2,
            effect: 'mpRecover', value: 3,
            desc: 'MP 3 회복 (쿨 2턴)', char: '엘프'
        },
        {
            id: 'elf_nature', name: '자연의 축복', mpCost: 0, type: 'passive',
            effect: 'mpRegen', value: 1,
            desc: '패시브: 매 턴 MP 1 자동 회복', char: '엘프'
        }
    ],
    dwarf: [
        {
            id: 'dwarf_iron', name: '철벽 방어', mpCost: 2, type: 'buff', cooldown: 3,
            buffEffect: 'defBoost', buffValue: 0.3, buffTurns: 2, buffIcon: '🛡️',
            multiEffect: [
                { effect: 'defBoost', value: 0.3 },
                { effect: 'counterDef', value: 0.4 }
            ],
            desc: '2턴간 받는 피해 -30%, 반격 피해 -40% (쿨 3턴)', char: '드워프'
        },
        {
            id: 'dwarf_bash', name: '방패 강타', mpCost: 2, damage: 20, type: 'active', cooldown: 2,
            effect: 'stun',
            desc: '20 데미지 + 적 1턴 스턴 (쿨 2턴)', char: '드워프'
        },
        {
            id: 'dwarf_endure', name: '불굴', mpCost: 0, type: 'passive',
            effect: 'endure', value: 0.15,
            desc: '패시브: 받는 모든 피해 -15%', char: '드워프'
        }
    ],
    human: [
        {
            id: 'human_snipe', name: '정밀 사격', mpCost: 2, damage: 25, type: 'active', cooldown: 0,
            effect: 'noCounter',
            desc: '25 데미지. 반격 없음', char: '인간'
        },
        {
            id: 'human_evasion', name: '회피 기동', mpCost: 2, type: 'buff', cooldown: 3,
            buffEffect: 'dodgeBoost', buffValue: 25, buffTurns: 2, buffIcon: '💨',
            desc: '2턴간 회피율 +25% (쿨 3턴)', char: '인간'
        },
        {
            id: 'human_tactics', name: '전술적 우위', mpCost: 0, type: 'passive',
            effect: 'firstStrike', value: 1,
            desc: '패시브: 선제공격 카운터 +1 (늦게 옴)', char: '인간'
        }
    ]
};

// 모드별 설정
// enemyMult: 적 능력치 배율, rewardMult: 보상 배율
const modeSettings = {
    easy: { enemyMult: 0.5, rewardMult: 1, maxFloor: 100, name: '이지' },
    normal: { enemyMult: 5, rewardMult: 3, maxFloor: 100, name: '노말' },
    hard: { enemyMult: 30, rewardMult: 5, maxFloor: 100, name: '하드' },
    infinite: { enemyMult: 10, rewardMult: 4, maxFloor: Infinity, name: '무한' }
};

// 적 타입
const enemyTypes = [
    { id: 'power', name: '파워', icon: '💪', hpMult: 0.8, atkMult: 1.4, dodge: 0, crit: 5 },
    { id: 'tank', name: '탱커', icon: '🛡️', hpMult: 1.5, atkMult: 0.8, dodge: 0, crit: 0 },
    { id: 'lucky', name: '행운', icon: '🍀', hpMult: 0.9, atkMult: 1.0, dodge: 20, crit: 20 }
];

// 적 생성
function generateEnemy(floor) {
    const isBoss = floor % 10 === 0;
    const isMiniBoss = floor % 5 === 0 && !isBoss;
    const modeMult = modeSettings[gameState.gameMode].enemyMult;

    // 랜덤 타입 선택
    const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];

    const baseHp = 30 + floor * 10;
    const baseAtk = 5 + floor * 2;

    const tierMult = isBoss ? 3 : isMiniBoss ? 2 : 1;
    const atkTierMult = isBoss ? 2 : isMiniBoss ? 1.5 : 1;

    return {
        name: getEnemyName(floor, isBoss, isMiniBoss),
        type: type,
        hp: Math.floor(baseHp * tierMult * type.hpMult * modeMult),
        maxHp: Math.floor(baseHp * tierMult * type.hpMult * modeMult),
        atk: Math.floor(baseAtk * atkTierMult * type.atkMult * modeMult),
        dodge: type.dodge,
        crit: type.crit,
        goldReward: Math.floor((10 + floor * 5) * tierMult),
        expReward: Math.floor((20 + floor * 10) * tierMult),
        isBoss,
        isMiniBoss,
        stunned: false
    };
}

function getEnemyName(floor, isBoss, isMiniBoss) {
    const normalEnemies = ['고블린', '슬라임', '스켈레톤', '오크', '늑대'];
    const miniBosses = ['고블린 대장', '거대 슬라임', '해골 기사', '오크 전사', '늑대 대장'];
    const bosses = ['고블린 왕', '슬라임 킹', '리치', '오크 로드', '늑대 군주'];
    const tier = Math.floor((floor - 1) / 10) % 5;
    if (isBoss) return bosses[tier];
    if (isMiniBoss) return miniBosses[tier];
    return normalEnemies[tier];
}

// 스탯 계산
function getPlayerAtk() {
    let atk = gameState.player.baseAtk + (gameState.player.stats.str * 2);

    gameState.equippedSkills.forEach(skill => {
        if (skill?.type === 'passive' && skill.effect === 'atkUp') {
            atk *= skill.value;
        }
    });

    gameState.tempRelics.forEach(relic => {
        if (relic.effect === 'atk') atk += relic.value;
    });

    return Math.floor(atk);
}

function getWeaponBonus(character) {
    const weaponMap = {
        cat: 'sword',
        dwarf: 'shield',
        human: 'bow',
        elf: 'staff'
    };
    const weapon = weaponMap[character];
    return weapon ? gameState.weapons[weapon] * 5 : 0;
}

function getMaxHp() {
    return 100 + (gameState.player.level - 1) * 10 + (gameState.armorLevel - 1) * 20;
}

function getMaxMp() {
    let mp = 5 + Math.floor(gameState.player.stats.int / 3);

    gameState.equippedSkills.forEach(skill => {
        if (skill?.type === 'passive' && skill.effect === 'mpUp') {
            mp += skill.value;
        }
    });

    gameState.tempRelics.forEach(relic => {
        if (relic.effect === 'mp') mp += relic.value;
    });

    return mp;
}

function getDodgeChance() {
    let dodge = gameState.player.stats.dex * 1;

    gameState.tempRelics.forEach(relic => {
        if (relic.effect === 'dodge') dodge += relic.value;
    });

    // 버프 효과
    gameState.activeBuffs.forEach(buff => {
        if (buff.effect === 'dodgeBoost') dodge += buff.value;
    });

    return Math.min(dodge, 70);
}

function getCritChance() {
    let chance = 5 + (gameState.player.stats.luk * 1);

    gameState.equippedSkills.forEach(skill => {
        if (skill?.type === 'passive' && skill.effect === 'critUp') {
            chance += skill.value * 100;
        }
    });

    gameState.tempRelics.forEach(relic => {
        if (relic.effect === 'crit') chance += relic.value;
    });

    // 버프 효과
    gameState.activeBuffs.forEach(buff => {
        if (buff.effect === 'critBoost') chance += buff.value;
    });

    return Math.min(chance, 70);
}

// 가하는 피해 배율 (버프 포함)
function getDamageMultiplier() {
    let mult = 1.0;

    gameState.activeBuffs.forEach(buff => {
        if (buff.effect === 'atkBoost') mult += buff.value;
    });

    return mult;
}

// 받는 피해 감소 (패시브 + 버프)
function getDefenseMultiplier() {
    let mult = 1.0;

    // 패시브: 불굴 (드워프)
    gameState.equippedSkills.forEach(skill => {
        if (skill?.type === 'passive' && skill.effect === 'endure') {
            mult *= (1 - skill.value);
        }
    });

    // 버프 효과
    gameState.activeBuffs.forEach(buff => {
        if (buff.effect === 'defBoost') mult *= (1 - buff.value);
    });

    // 유물 효과
    gameState.tempRelics.forEach(relic => {
        if (relic.effect === 'def') mult *= relic.value;
    });

    return mult;
}

// 반격 피해 감소 (버프)
function getCounterDefenseMultiplier() {
    let mult = 1.0;

    gameState.activeBuffs.forEach(buff => {
        if (buff.effect === 'counterDef') mult *= (1 - buff.value);
    });

    return mult;
}

// 흡혈 효과 체크
function getLifeStealPercent() {
    let percent = 0;

    gameState.equippedSkills.forEach(skill => {
        if (skill?.type === 'passive' && skill.effect === 'lifeSteal') {
            percent += skill.value;
        }
    });

    return percent;
}

// 선제공격 보너스 체크
function getFirstStrikeBonus() {
    let bonus = 0;

    gameState.equippedSkills.forEach(skill => {
        if (skill?.type === 'passive' && skill.effect === 'firstStrike') {
            bonus += skill.value;
        }
    });

    return bonus;
}

function calculateDamageTaken(damage, guarding = false, isCounter = false) {
    let finalDamage = damage;

    // 방어 배율 적용
    finalDamage *= getDefenseMultiplier();

    // 반격일 경우 추가 감소
    if (isCounter) {
        finalDamage *= getCounterDefenseMultiplier();
    }

    if (guarding) finalDamage *= 0.3;

    return Math.floor(finalDamage);
}

// === 버프 시스템 ===
function applyBuff(skill) {
    // 기존 같은 버프 제거
    gameState.activeBuffs = gameState.activeBuffs.filter(b => b.id !== skill.id);

    if (skill.multiEffect) {
        // 다중 효과 버프
        skill.multiEffect.forEach(eff => {
            gameState.activeBuffs.push({
                id: skill.id + '_' + eff.effect,
                name: skill.name,
                icon: skill.buffIcon,
                turns: skill.buffTurns,
                effect: eff.effect,
                value: eff.value
            });
        });
    } else {
        gameState.activeBuffs.push({
            id: skill.id,
            name: skill.name,
            icon: skill.buffIcon,
            turns: skill.buffTurns,
            effect: skill.buffEffect,
            value: skill.buffValue
        });
    }

    addBattleLog(`${skill.buffIcon} ${skill.name} 발동! (${skill.buffTurns}턴)`);
}

function tickBuffs() {
    gameState.activeBuffs.forEach(buff => {
        buff.turns--;
    });

    const expired = gameState.activeBuffs.filter(b => b.turns <= 0);
    expired.forEach(buff => {
        addBattleLog(`${buff.icon} ${buff.name} 효과 종료`);
    });

    gameState.activeBuffs = gameState.activeBuffs.filter(b => b.turns > 0);
}

function tickCooldowns() {
    Object.keys(gameState.skillCooldowns).forEach(skillId => {
        if (gameState.skillCooldowns[skillId] > 0) {
            gameState.skillCooldowns[skillId]--;
        }
    });
}

function applyCooldown(skill) {
    if (skill.cooldown && skill.cooldown > 0) {
        gameState.skillCooldowns[skill.id] = skill.cooldown;
    }
}

function isOnCooldown(skillId) {
    return gameState.skillCooldowns[skillId] > 0;
}

function getCooldown(skillId) {
    return gameState.skillCooldowns[skillId] || 0;
}

// MP 자동 회복 (엘프 패시브)
function tickMpRegen() {
    gameState.equippedSkills.forEach(skill => {
        if (skill?.type === 'passive' && skill.effect === 'mpRegen') {
            const regen = skill.value;
            gameState.player.mp = Math.min(gameState.player.maxMp, gameState.player.mp + regen);
            if (regen > 0) addBattleLog(`MP +${regen} (자연의 축복)`);
        }
    });
}

function getExpForLevel(level) {
    return 100 * level;
}

function checkLevelUp() {
    while (gameState.player.exp >= getExpForLevel(gameState.player.level)) {
        gameState.player.exp -= getExpForLevel(gameState.player.level);
        gameState.player.level++;
        gameState.player.statPoints += 3;
        gameState.player.maxHp = getMaxHp();
        addBattleLog(`레벨 업! Lv.${gameState.player.level} (+3 포인트)`);
    }
}

// 스킵 가능 층 계산
function getSkipFloor() {
    const highestBossCleared = Math.floor(gameState.dungeon.highestFloor / 10) * 10;
    if (highestBossCleared >= 10) {
        // 보스전 직전까지 (9, 19, 29...)
        return highestBossCleared - 1;
    }
    return 0;
}

// UI 업데이트
function updateVillageUI() {
    document.getElementById('player-level').textContent = gameState.player.level;
    document.getElementById('player-gold').textContent = gameState.player.gold;
    document.getElementById('player-exp').textContent = gameState.player.exp;
    document.getElementById('player-max-exp').textContent = getExpForLevel(gameState.player.level);

    document.getElementById('stat-points').textContent = gameState.player.statPoints;
    document.getElementById('stat-str').textContent = gameState.player.stats.str;
    document.getElementById('stat-dex').textContent = gameState.player.stats.dex;
    document.getElementById('stat-int').textContent = gameState.player.stats.int;
    document.getElementById('stat-luk').textContent = gameState.player.stats.luk;

    // 스킵 버튼 업데이트
    const skipFloor = getSkipFloor();
    const skipBtn = document.getElementById('btn-skip');
    const skipInfo = document.getElementById('skip-info');

    if (skipFloor > 0) {
        skipBtn.disabled = false;
        skipInfo.textContent = `${skipFloor}층까지 스킵 (최고 기록: ${gameState.dungeon.highestFloor}층)`;
    } else {
        skipBtn.disabled = true;
        skipInfo.textContent = '10층 보스 클리어 후 스킵 가능';
    }
}

function updateShopUI() {
    document.getElementById('shop-gold').textContent = gameState.player.gold;
    document.getElementById('shop-stones').textContent = gameState.enhancementStones;

    const weaponTypes = ['sword', 'shield', 'bow', 'staff'];
    weaponTypes.forEach(weapon => {
        const level = gameState.weapons[weapon];
        document.getElementById(`${weapon}-level`).textContent = level;
        document.getElementById(`${weapon}-bonus`).textContent = level * 5;
        document.querySelector(`.btn-upgrade[data-weapon="${weapon}"]`).disabled = gameState.enhancementStones < 1;
    });

    document.getElementById('armor-level').textContent = gameState.armorLevel;
    document.getElementById('armor-cost').textContent = gameState.armorLevel * 100;
    document.getElementById('potion-count').textContent = gameState.player.potions;

    const armorCost = gameState.armorLevel * 100;
    document.getElementById('btn-upgrade-armor').disabled = gameState.player.gold < armorCost;
    document.getElementById('btn-buy-potion').disabled = gameState.player.gold < 50;
}

function updateDungeonUI() {
    document.getElementById('current-floor').textContent = gameState.dungeon.currentFloor;
    document.getElementById('pending-gold').textContent = gameState.dungeon.pendingGold;
    document.getElementById('pending-exp').textContent = gameState.dungeon.pendingExp;
    document.getElementById('pending-stones').textContent = gameState.dungeon.pendingStones;
}

function updateBattleUI() {
    const enemy = gameState.currentEnemy;
    const typeIcon = enemy.type ? enemy.type.icon : '';
    document.getElementById('enemy-name').textContent = typeIcon + enemy.name + (enemy.stunned ? ' [스턴]' : '');
    document.getElementById('enemy-hp').textContent = Math.max(0, enemy.hp);
    document.getElementById('enemy-max-hp').textContent = enemy.maxHp;
    document.getElementById('enemy-atk').textContent = enemy.atk;
    document.getElementById('enemy-preempt-counter').textContent = enemyAttackCounter;

    // 선제공격 1턴 남았을 때 경고 표시
    const preemptDisplay = document.querySelector('.enemy-preempt-display');
    if (enemyAttackCounter <= 1) {
        preemptDisplay.classList.add('warning');
    } else {
        preemptDisplay.classList.remove('warning');
    }

    const enemyHpPercent = (Math.max(0, enemy.hp) / enemy.maxHp) * 100;
    document.getElementById('enemy-hp-bar').style.width = `${enemyHpPercent}%`;

    // 왼쪽 스탯 패널
    document.getElementById('panel-atk').textContent = getPlayerAtk();
    document.getElementById('panel-crit').textContent = getCritChance() + '%';
    document.getElementById('panel-dodge').textContent = getDodgeChance() + '%';
    document.getElementById('panel-relics').textContent = gameState.tempRelics.map(r => r.icon).join('');

    document.getElementById('battle-hp').textContent = gameState.player.hp;
    document.getElementById('battle-max-hp').textContent = gameState.player.maxHp;
    document.getElementById('battle-mp').textContent = gameState.player.mp;
    document.getElementById('battle-max-mp').textContent = gameState.player.maxMp;
    document.getElementById('battle-potions').textContent = gameState.player.potions;

    const hpPercent = (gameState.player.hp / gameState.player.maxHp) * 100;
    const mpPercent = (gameState.player.mp / gameState.player.maxMp) * 100;
    document.getElementById('hp-bar').style.width = `${hpPercent}%`;
    document.getElementById('mp-bar').style.width = `${mpPercent}%`;

    document.getElementById('btn-use-potion').disabled = gameState.player.potions <= 0 || !gameState.dungeon.inBattle;

    const dungeonScreen = document.getElementById('dungeon-screen');
    dungeonScreen.classList.remove('boss-fight', 'mini-boss-fight');
    if (enemy.isBoss) dungeonScreen.classList.add('boss-fight');
    else if (enemy.isMiniBoss) dungeonScreen.classList.add('mini-boss-fight');
}

function addBattleLog(message) {
    const log = document.getElementById('battle-log');
    const p = document.createElement('p');
    p.textContent = message;
    log.appendChild(p);
    log.scrollTop = log.scrollHeight;
}

function clearBattleLog() {
    document.getElementById('battle-log').innerHTML = '';
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(screenId).classList.remove('hidden');
}

// 전투 시스템
let isGuarding = false;
let hasActed = false; // 행동 여부 (도주 가능 여부)
let enemyAttackCounter = 0; // 적 선제공격까지 남은 턴

function getRandomAttackCounter() {
    const base = Math.floor(Math.random() * 4) + 3; // 3-6
    const bonus = getFirstStrikeBonus(); // 인간 패시브
    return base + bonus;
}

function startBattle() {
    gameState.currentEnemy = generateEnemy(gameState.dungeon.currentFloor);
    gameState.dungeon.inBattle = true;
    isGuarding = false;
    hasActed = false;
    enemyAttackCounter = getRandomAttackCounter();
    clearBattleLog();

    // 도주 버튼 활성화
    document.getElementById('btn-return').disabled = false;

    const floorType = gameState.currentEnemy.isBoss ? '보스' : gameState.currentEnemy.isMiniBoss ? '중간보스' : '';
    addBattleLog(`${gameState.dungeon.currentFloor}층 - ${gameState.currentEnemy.name} ${floorType ? `[${floorType}]` : ''}`);
    addBattleLog(`선제공격까지 ${enemyAttackCounter}턴`);

    // 활성 버프 표시
    if (gameState.activeBuffs.length > 0) {
        const buffIcons = gameState.activeBuffs.map(b => b.icon).join('');
        addBattleLog(`활성 버프: ${buffIcons}`);
    }

    updateBattleUI();
    updateDungeonUI();
    updateSkillButtons();
}

// 행동 시 도주 불가
function disableFlee() {
    if (!hasActed) {
        hasActed = true;
        document.getElementById('btn-return').disabled = true;
    }
}

// 적 선제공격 처리
function checkEnemyPreemptiveAttack() {
    enemyAttackCounter--;

    if (enemyAttackCounter <= 0) {
        addBattleLog(`⚠️ 적 선제공격!`);
        enemyPreemptiveAttack();
        enemyAttackCounter = getRandomAttackCounter();
        addBattleLog(`다음 선제공격까지 ${enemyAttackCounter}턴`);

        if (gameState.player.hp <= 0) {
            return true; // 플레이어 사망
        }
    }
    return false;
}

function enemyPreemptiveAttack() {
    if (gameState.currentEnemy.stunned) {
        addBattleLog(`${gameState.currentEnemy.name}은(는) 스턴 상태! 선제공격 실패`);
        gameState.currentEnemy.stunned = false;
        return;
    }

    const enemyAtk = gameState.currentEnemy.atk;
    const enemyCrit = gameState.currentEnemy.crit || 0;
    const isCrit = Math.random() * 100 < enemyCrit;
    const isDodge = Math.random() * 100 < getDodgeChance();

    let baseDamage = isCrit ? Math.floor(enemyAtk * 1.3) : enemyAtk;
    if (isDodge) baseDamage = Math.floor(baseDamage * 0.5);
    const damage = calculateDamageTaken(baseDamage, false);

    gameState.player.hp -= damage;
    const logParts = [`선제공격! ${damage} 피해`];
    if (isCrit) logParts.push('(크리티컬!)');
    if (isDodge) logParts.push('(회피!)');
    addBattleLog(logParts.join(' '));

    if (gameState.player.hp <= 0) {
        playerDefeated();
    }
    updateBattleUI();
}

function playerAttack() {
    if (!gameState.dungeon.inBattle) return;
    disableFlee();

    // 적 선제공격 체크
    if (checkEnemyPreemptiveAttack()) return;

    // 턴 시작 처리
    processPlayerTurn();

    const playerAtk = getPlayerAtk();
    const damageMultiplier = getDamageMultiplier();
    const isCrit = Math.random() * 100 < getCritChance();
    const isEnemyDodge = gameState.currentEnemy.dodge && Math.random() * 100 < gameState.currentEnemy.dodge;

    let damage = Math.floor(playerAtk * damageMultiplier);
    if (isCrit) damage = Math.floor(damage * 1.3);
    if (isEnemyDodge) damage = Math.floor(damage * 0.5);

    gameState.currentEnemy.hp -= damage;
    const logParts = [`공격! ${damage} 데미지`];
    if (isCrit) logParts.push('(크리티컬!)');
    if (isEnemyDodge) logParts.push('(적 회피!)');
    addBattleLog(logParts.join(' '));

    // 흡혈 효과
    applyLifeSteal(damage);

    if (gameState.currentEnemy.hp <= 0) {
        enemyDefeated();
    } else {
        enemyCounterAttack();
    }
    updateBattleUI();
}

// 턴 처리 (쿨타임 감소, MP 재생 등)
function processPlayerTurn() {
    tickCooldowns();
    tickMpRegen();
}

// 흡혈 효과
function applyLifeSteal(damage) {
    const lifeSteal = getLifeStealPercent();
    if (lifeSteal > 0) {
        const heal = Math.floor(damage * lifeSteal);
        if (heal > 0) {
            gameState.player.hp = Math.min(gameState.player.maxHp, gameState.player.hp + heal);
            addBattleLog(`HP +${heal} (흡혈)`);
        }
    }
}

function enemyCounterAttack() {
    if (gameState.currentEnemy.stunned) {
        addBattleLog(`${gameState.currentEnemy.name}은(는) 스턴 상태!`);
        gameState.currentEnemy.stunned = false;
        endPlayerTurn();
        return;
    }

    const enemyAtk = gameState.currentEnemy.atk;
    const enemyCrit = gameState.currentEnemy.crit || 0;
    const isCrit = Math.random() * 100 < enemyCrit;
    const isDodge = Math.random() * 100 < getDodgeChance();

    let baseDamage = isCrit ? Math.floor(enemyAtk * 1.3) : enemyAtk;
    if (isDodge) baseDamage = Math.floor(baseDamage * 0.5);
    const damage = calculateDamageTaken(baseDamage, isGuarding, true); // isCounter = true

    gameState.player.hp -= damage;
    const logParts = [`반격! ${damage} 피해`];
    if (isCrit) logParts.push('(크리티컬!)');
    if (isDodge) logParts.push('(회피!)');
    if (isGuarding) logParts.push('(방어!)');
    addBattleLog(logParts.join(' '));
    isGuarding = false;

    endPlayerTurn();

    if (gameState.player.hp <= 0) {
        playerDefeated();
    }
}

// 턴 종료 처리 (버프 틱)
function endPlayerTurn() {
    tickBuffs();
    updateSkillButtons();
}

function useSkill(slotIndex) {
    const skill = gameState.equippedSkills[slotIndex];
    if (!skill || skill.type === 'passive') return;
    if (!gameState.dungeon.inBattle) return;

    // 쿨타임 체크
    if (isOnCooldown(skill.id)) {
        addBattleLog(`쿨타임 ${getCooldown(skill.id)}턴 남음!`);
        return;
    }

    if (gameState.player.mp < skill.mpCost) {
        addBattleLog('MP 부족!');
        return;
    }
    disableFlee();

    // 적 선제공격 체크
    if (checkEnemyPreemptiveAttack()) return;

    // 턴 시작 처리
    processPlayerTurn();

    // 캐릭터 및 무기 보너스 찾기
    const characters = ['cat', 'elf', 'dwarf', 'human'];
    let skillCharacter = null;
    for (const char of characters) {
        if (skillsData[char].some(s => s.id === skill.id)) {
            skillCharacter = char;
            break;
        }
    }

    gameState.player.mp -= skill.mpCost;
    const weaponBonus = getWeaponBonus(skillCharacter);

    // 쿨타임 적용
    applyCooldown(skill);

    addBattleLog(`[${skill.name}] 사용!`);

    // === 버프 스킬 ===
    if (skill.type === 'buff') {
        applyBuff(skill);
        endPlayerTurn();
        updateBattleUI();
        return;
    }

    // === MP 회복 스킬 ===
    if (skill.effect === 'mpRecover') {
        const recoverAmount = Math.floor(skill.value * (1 + weaponBonus / 100));
        gameState.player.mp = Math.min(gameState.player.maxMp, gameState.player.mp + recoverAmount);
        addBattleLog(`MP +${recoverAmount} 회복!`);
        endPlayerTurn();
        updateBattleUI();
        return;
    }

    // === 데미지 스킬 ===
    if (skill.damage) {
        const hits = skill.hits || 1;
        const damageMultiplier = getDamageMultiplier();
        let totalDamage = 0;

        for (let i = 0; i < hits; i++) {
            const isCrit = Math.random() * 100 < getCritChance();
            const isEnemyDodge = gameState.currentEnemy.dodge && Math.random() * 100 < gameState.currentEnemy.dodge;

            let baseDamage = Math.floor(skill.damage * (1 + weaponBonus / 100) * damageMultiplier);
            if (isCrit) baseDamage = Math.floor(baseDamage * 1.3);
            if (isEnemyDodge) baseDamage = Math.floor(baseDamage * 0.5);

            gameState.currentEnemy.hp -= baseDamage;
            totalDamage += baseDamage;

            const logParts = [`${baseDamage} 데미지`];
            if (isCrit) logParts.push('(크리티컬!)');
            if (isEnemyDodge) logParts.push('(적 회피!)');
            addBattleLog(logParts.join(' '));
        }

        // 흡혈 효과
        applyLifeSteal(totalDamage);

        // 스턴 효과
        if (skill.effect === 'stun') {
            gameState.currentEnemy.stunned = true;
            addBattleLog('적 스턴!');
        }

        if (gameState.currentEnemy.hp <= 0) {
            enemyDefeated();
        } else if (skill.effect === 'noCounter') {
            // 반격 없음
            endPlayerTurn();
        } else {
            enemyCounterAttack();
        }
    }

    updateBattleUI();
}

function usePotion() {
    if (gameState.player.potions <= 0 || !gameState.dungeon.inBattle) return;
    disableFlee();

    // 적 선제공격 체크
    if (checkEnemyPreemptiveAttack()) return;

    // 턴 처리
    processPlayerTurn();

    gameState.player.potions--;
    const healAmount = 50;
    gameState.player.hp = Math.min(gameState.player.maxHp, gameState.player.hp + healAmount);
    addBattleLog(`포션 사용! HP ${healAmount} 회복`);

    endPlayerTurn();
    updateBattleUI();
}

function enemyDefeated() {
    const enemy = gameState.currentEnemy;
    gameState.dungeon.inBattle = false;

    // 모드별 보상 배율 적용
    const rewardMult = modeSettings[gameState.gameMode].rewardMult;
    let goldReward = Math.floor(enemy.goldReward * rewardMult);
    let expReward = Math.floor(enemy.expReward * rewardMult);

    // 유물 효과 추가 적용
    gameState.tempRelics.forEach(relic => {
        if (relic.effect === 'gold') goldReward = Math.floor(goldReward * relic.value);
        if (relic.effect === 'exp') expReward = Math.floor(expReward * relic.value);
    });

    gameState.dungeon.pendingGold += goldReward;
    gameState.dungeon.pendingExp += expReward;

    addBattleLog(`${enemy.name} 처치!`);
    addBattleLog(`+${goldReward}G, +${expReward}EXP`);

    // 강화석 드랍 (하드 모드에서 더 많이)
    let stoneDropChance = enemy.isBoss ? 1.0 : enemy.isMiniBoss ? 0.5 : 0.3;
    let stoneAmount = enemy.isBoss ? 3 : enemy.isMiniBoss ? 2 : 1;
    if (gameState.gameMode === 'hard') stoneAmount *= 2;
    if (gameState.gameMode === 'normal') stoneAmount = Math.ceil(stoneAmount * 1.5);

    if (Math.random() < stoneDropChance) {
        gameState.dungeon.pendingStones += stoneAmount;
        addBattleLog(`강화석 +${stoneAmount}개 획득!`);
    }

    // 최고 기록 갱신
    if (gameState.dungeon.currentFloor > gameState.dungeon.highestFloor) {
        gameState.dungeon.highestFloor = gameState.dungeon.currentFloor;
    }

    // 보스 클리어 처리
    if (enemy.isBoss) {
        handleBossClear();
        return;
    }

    updateDungeonUI();

    // 바로 다음 층 이동
    gameState.dungeon.currentFloor++;
    startBattle();
}

function handleBossClear() {
    const maxFloor = modeSettings[gameState.gameMode].maxFloor;

    // 게임 클리어 체크 (무한모드가 아닌 경우)
    if (gameState.dungeon.currentFloor >= maxFloor) {
        handleGameClear();
        return;
    }

    // 유물 선택지 생성 (3개)
    generateRelicChoices();

    // 스킬 선택지 생성 (휴식 후 사용)
    generateSkillChoices();

    // 보스 클리어 화면 표시
    showBossClearScreen();
}

// 유물 선택지 3개 생성
function generateRelicChoices() {
    const availableRelics = relicsData.filter(r => !gameState.tempRelics.find(owned => owned.id === r.id));

    gameState.relicChoices = [];
    while (gameState.relicChoices.length < 3 && availableRelics.length > 0) {
        const idx = Math.floor(Math.random() * availableRelics.length);
        gameState.relicChoices.push(availableRelics.splice(idx, 1)[0]);
    }
}

function generateSkillChoices() {
    const allSkills = [];
    Object.keys(skillsData).forEach(char => {
        skillsData[char].forEach(skill => {
            // 이미 장착한 스킬은 제외
            if (!gameState.equippedSkills.find(s => s && s.id === skill.id)) {
                allSkills.push({ ...skill, character: char });
            }
        });
    });

    // 랜덤으로 3개 선택
    gameState.skillChoices = [];
    while (gameState.skillChoices.length < 3 && allSkills.length > 0) {
        const idx = Math.floor(Math.random() * allSkills.length);
        gameState.skillChoices.push(allSkills.splice(idx, 1)[0]);
    }
}

// 던전 시작 시 기본 스킬 4개 지급 (각 캐릭터의 고정 액티브 스킬)
function generateStartingSkills() {
    // 고정 시작 스킬: 각 캐릭터의 액티브 스킬
    return [
        { ...skillsData.cat[1], character: 'cat' },      // 폭렬참 (35 데미지)
        { ...skillsData.elf[1], character: 'elf' },      // 마나 순환 (MP 회복)
        { ...skillsData.dwarf[1], character: 'dwarf' },  // 방패 강타 (스턴)
        { ...skillsData.human[0], character: 'human' }   // 정밀 사격 (반격없음)
    ];
}

function showBossClearScreen() {
    // 확인 버튼 섹션만 표시, 나머지는 숨김
    document.getElementById('boss-confirm-section').classList.remove('hidden');
    document.getElementById('relic-choice-section').classList.add('hidden');
    document.getElementById('skill-rest-section').classList.add('hidden');
    document.getElementById('relic-replace-section').classList.add('hidden');

    showScreen('boss-clear-screen');
}

function showBossRewardChoices() {
    // 확인 버튼 숨기고 선택지 표시
    document.getElementById('boss-confirm-section').classList.add('hidden');
    document.getElementById('relic-choice-section').classList.remove('hidden');
    document.getElementById('skill-rest-section').classList.remove('hidden');

    // 스킬 선택지 표시
    const skillGrid = document.getElementById('skill-choice-grid');
    skillGrid.innerHTML = '';

    gameState.skillChoices.forEach(skill => {
        const btn = document.createElement('button');
        btn.className = 'skill-choice-btn';
        btn.innerHTML = `
            <div class="skill-choice-name">${skill.name} ${skill.type === 'passive' ? '[패시브]' : `(MP ${skill.mpCost})`}</div>
            <div class="skill-choice-char">${skill.char}</div>
            <div class="skill-choice-desc">${skill.desc}</div>
        `;
        btn.addEventListener('click', () => selectSkillAndContinue(skill));
        skillGrid.appendChild(btn);
    });

    // 유물 선택지 표시 (3개)
    const relicGrid = document.getElementById('relic-choice-grid');
    relicGrid.innerHTML = '';

    // 교체 섹션 숨김
    document.getElementById('relic-replace-section').classList.add('hidden');

    // 유물 4개 보유 시 교체 가능 메시지
    const isFull = gameState.tempRelics.length >= 4;
    document.getElementById('relic-choice-desc').textContent = isFull
        ? '유물 4개 보유 중 - 선택 시 교체할 유물을 선택합니다'
        : '3개 중 하나를 선택하세요 (최대 4개 보유)';

    if (gameState.relicChoices.length > 0) {
        gameState.relicChoices.forEach(relic => {
            const btn = document.createElement('button');
            btn.className = 'relic-choice-btn';
            btn.innerHTML = `
                <div class="relic-icon">${relic.icon}</div>
                <div class="relic-name">${relic.name}</div>
                <div class="relic-desc">${relic.desc}</div>
            `;
            btn.addEventListener('click', () => selectRelic(relic));
            relicGrid.appendChild(btn);
        });
    } else {
        relicGrid.innerHTML = '<p class="no-relic-msg">획득 가능한 유물이 없습니다</p>';
    }
}

// 유물 선택
function selectRelic(relic) {
    // 4개 미만이면 바로 추가
    if (gameState.tempRelics.length < 4) {
        gameState.tempRelics.push(relic);

        // MP 회복
        gameState.player.maxMp = getMaxMp();
        gameState.player.mp = gameState.player.maxMp;

        // 다음 층으로
        gameState.dungeon.currentFloor++;
        showScreen('dungeon-screen');
        startBattle();
    } else {
        // 4개 이상이면 교체 화면 표시
        gameState.pendingNewRelic = relic;
        showRelicReplaceScreen();
    }
}

// 유물 교체 화면 표시
function showRelicReplaceScreen() {
    document.getElementById('relic-choice-section').classList.add('hidden');
    document.getElementById('skill-rest-section').classList.add('hidden');
    document.getElementById('relic-replace-section').classList.remove('hidden');

    const replaceGrid = document.getElementById('relic-replace-grid');
    replaceGrid.innerHTML = '';

    gameState.tempRelics.forEach((relic, index) => {
        const btn = document.createElement('button');
        btn.className = 'relic-replace-btn';
        btn.innerHTML = `
            <div class="relic-icon">${relic.icon}</div>
            <div class="relic-name">${relic.name}</div>
        `;
        btn.addEventListener('click', () => replaceRelic(index));
        replaceGrid.appendChild(btn);
    });
}

// 유물 교체 실행
function replaceRelic(index) {
    // 기존 유물 교체
    gameState.tempRelics[index] = gameState.pendingNewRelic;
    gameState.pendingNewRelic = null;

    // MP 회복
    gameState.player.maxMp = getMaxMp();
    gameState.player.mp = gameState.player.maxMp;

    // 다음 층으로
    gameState.dungeon.currentFloor++;
    showScreen('dungeon-screen');
    startBattle();
}

// 유물 교체 취소
function cancelRelicReplace() {
    gameState.pendingNewRelic = null;
    document.getElementById('relic-replace-section').classList.add('hidden');
    document.getElementById('relic-choice-section').classList.remove('hidden');
    document.getElementById('skill-rest-section').classList.remove('hidden');
}

function selectSkill(skill) {
    // 같은 캐릭터의 스킬 슬롯 찾아서 교체
    const characterOrder = ['cat', 'elf', 'dwarf', 'human'];
    const slotIndex = characterOrder.indexOf(skill.character);

    if (slotIndex !== -1) {
        gameState.equippedSkills[slotIndex] = skill;
    } else {
        // 캐릭터를 찾지 못하면 빈 슬롯 또는 첫 번째 슬롯에
        const emptySlot = gameState.equippedSkills.findIndex(s => s === null);
        gameState.equippedSkills[emptySlot !== -1 ? emptySlot : 0] = skill;
    }

    updateSkillButtons();

    // MP 회복
    gameState.player.maxMp = getMaxMp();
    gameState.player.mp = gameState.player.maxMp;

    // 다음 층으로
    gameState.dungeon.currentFloor++;
    showScreen('dungeon-screen');
    startBattle();
}

// 스킬 선택 + HP 30% 회복 후 다음 층으로
function selectSkillAndContinue(skill) {
    // HP 30% 회복
    const healAmount = Math.floor(gameState.player.maxHp * 0.3);
    gameState.player.hp = Math.min(gameState.player.maxHp, gameState.player.hp + healAmount);

    // MP 회복
    gameState.player.maxMp = getMaxMp();
    gameState.player.mp = gameState.player.maxMp;

    // 같은 캐릭터의 스킬 슬롯 찾아서 교체
    const characterOrder = ['cat', 'elf', 'dwarf', 'human'];
    const slotIndex = characterOrder.indexOf(skill.character);

    if (slotIndex !== -1) {
        gameState.equippedSkills[slotIndex] = skill;
    } else {
        const emptySlot = gameState.equippedSkills.findIndex(s => s === null);
        gameState.equippedSkills[emptySlot !== -1 ? emptySlot : 0] = skill;
    }

    updateSkillButtons();

    // 다음 층으로
    gameState.dungeon.currentFloor++;
    showScreen('dungeon-screen');
    startBattle();
}

// 스킬 유지 + HP 30% 회복 후 다음 층으로
function skipSkillAndContinue() {
    // HP 30% 회복
    const healAmount = Math.floor(gameState.player.maxHp * 0.3);
    gameState.player.hp = Math.min(gameState.player.maxHp, gameState.player.hp + healAmount);

    // MP 회복
    gameState.player.maxMp = getMaxMp();
    gameState.player.mp = gameState.player.maxMp;

    // 다음 층으로
    gameState.dungeon.currentFloor++;
    showScreen('dungeon-screen');
    startBattle();
}

function handleGameClear() {
    gameState.player.gold += gameState.dungeon.pendingGold;
    gameState.player.exp += gameState.dungeon.pendingExp;
    gameState.enhancementStones += gameState.dungeon.pendingStones;
    checkLevelUp();

    document.getElementById('clear-mode').textContent = modeSettings[gameState.gameMode].name;
    document.getElementById('clear-floor').textContent = gameState.dungeon.currentFloor;
    document.getElementById('clear-gold').textContent = gameState.dungeon.pendingGold;
    document.getElementById('clear-exp').textContent = gameState.dungeon.pendingExp;
    document.getElementById('clear-stones').textContent = gameState.dungeon.pendingStones;

    showScreen('clear-screen');
}

function playerDefeated() {
    gameState.dungeon.inBattle = false;

    const halfGold = Math.floor(gameState.dungeon.pendingGold / 2);
    const halfExp = Math.floor(gameState.dungeon.pendingExp / 2);
    const halfStones = Math.floor(gameState.dungeon.pendingStones / 2);

    document.getElementById('death-gold').textContent = halfGold;
    document.getElementById('death-exp').textContent = halfExp;
    document.getElementById('death-stones').textContent = halfStones;

    gameState.player.gold += halfGold;
    gameState.player.exp += halfExp;
    checkLevelUp();

    showScreen('gameover-screen');
}

function returnToVillage(fromDeath = false) {
    if (!fromDeath) {
        gameState.player.gold += gameState.dungeon.pendingGold;
        gameState.player.exp += gameState.dungeon.pendingExp;
        gameState.enhancementStones += gameState.dungeon.pendingStones;
        checkLevelUp();
    } else {
        // 사망 시에도 강화석은 50%만 획득
        gameState.enhancementStones += Math.floor(gameState.dungeon.pendingStones / 2);
    }

    // 던전 상태 초기화
    gameState.dungeon.pendingGold = 0;
    gameState.dungeon.pendingExp = 0;
    gameState.dungeon.pendingStones = 0;
    gameState.dungeon.currentFloor = 1;
    gameState.tempRelics = []; // 유물 초기화
    gameState.equippedSkills = [null, null, null, null]; // 스킬 초기화
    gameState.activeBuffs = []; // 버프 초기화
    gameState.skillCooldowns = {}; // 쿨타임 초기화

    // HP/MP 회복
    gameState.player.maxHp = getMaxHp();
    gameState.player.maxMp = getMaxMp();
    gameState.player.hp = gameState.player.maxHp;
    gameState.player.mp = gameState.player.maxMp;

    updateVillageUI();
    updateSkillButtons();
    showScreen('village-screen');
}

// 스킬 UI
function updateSkillButtons() {
    for (let i = 0; i < 4; i++) {
        const btn = document.getElementById(`btn-skill-${i + 1}`);
        const skill = gameState.equippedSkills[i];

        if (!skill) {
            btn.textContent = '-';
            btn.title = '';
            btn.disabled = true;
            btn.classList.remove('on-cooldown');
            continue;
        }

        // 상세 툴팁 생성
        const charNames = { cat: '묘인', elf: '엘프', dwarf: '드워프', human: '인간' };
        const charName = charNames[skill.character] || skill.char || '';
        const cooldown = getCooldown(skill.id);

        if (skill.type === 'passive') {
            btn.textContent = `${skill.name} [P]`;
            btn.title = `[${charName}] ${skill.name}\n${skill.desc}`;
            btn.disabled = true;
            btn.classList.remove('on-cooldown');
        } else {
            // active 또는 buff 스킬
            const mpText = skill.mpCost > 0 ? `MP ${skill.mpCost}` : 'MP 0';
            const cdText = skill.cooldown > 0 ? `쿨타임 ${skill.cooldown}턴` : '쿨타임 없음';

            if (cooldown > 0) {
                btn.textContent = `${skill.name} (${cooldown})`;
                btn.title = `[${charName}] ${skill.name}\n${mpText} | ${cdText}\n\n${skill.desc}\n\n⏳ 남은 쿨타임: ${cooldown}턴`;
                btn.disabled = true;
                btn.classList.add('on-cooldown');
            } else {
                btn.textContent = `${skill.name} (${skill.mpCost})`;
                btn.title = `[${charName}] ${skill.name}\n${mpText} | ${cdText}\n\n${skill.desc}`;
                btn.disabled = false;
                btn.classList.remove('on-cooldown');
            }
        }
    }

    // 버프 표시 업데이트
    updateBuffDisplay();

    // 상세 정보 패널이 열려있으면 업데이트
    const panel = document.getElementById('info-panel');
    if (panel && !panel.classList.contains('hidden')) {
        updateInfoPanel();
    }
}

// 상세 정보 패널 토글
function toggleInfoPanel() {
    const panel = document.getElementById('info-panel');
    const btn = document.getElementById('btn-info-toggle');

    if (panel.classList.contains('hidden')) {
        updateInfoPanel();
        panel.classList.remove('hidden');
        btn.classList.add('active');
        btn.textContent = '정보 닫기';
    } else {
        panel.classList.add('hidden');
        btn.classList.remove('active');
        btn.textContent = '상세 정보';
    }
}

function updateInfoPanel() {
    const panel = document.getElementById('info-panel');
    const charNames = { cat: '묘인', elf: '엘프', dwarf: '드워프', human: '인간' };

    let html = '';

    // 스킬 정보 섹션
    html += '<div class="info-section-title">🗡️ 스킬</div>';

    let skillHtml = '';
    for (let i = 0; i < 4; i++) {
        const skill = gameState.equippedSkills[i];
        if (!skill) continue;

        const charName = charNames[skill.character] || skill.char || '';
        const cooldown = getCooldown(skill.id);

        let typeClass = '';
        let typeText = '';
        if (skill.type === 'passive') {
            typeClass = 'passive';
            typeText = '패시브';
        } else if (skill.type === 'buff') {
            typeClass = 'buff';
            typeText = '버프';
        } else {
            typeText = '액티브';
        }

        const mpText = skill.type !== 'passive' ? `MP ${skill.mpCost}` : '';
        const cdText = skill.cooldown > 0 ? `쿨타임 ${skill.cooldown}턴` : '';
        const metaText = [mpText, cdText].filter(t => t).join(' | ');

        skillHtml += `
            <div class="skill-info-item">
                <div class="skill-info-header">
                    <span class="skill-info-name">${charName} - ${skill.name}</span>
                    <span class="skill-info-type ${typeClass}">${typeText}</span>
                </div>
                ${metaText ? `<div class="skill-info-meta">${metaText}</div>` : ''}
                <div class="skill-info-desc">${skill.desc}</div>
                ${cooldown > 0 ? `<div class="skill-info-cooldown">⏳ 남은 쿨타임: ${cooldown}턴</div>` : ''}
            </div>
        `;
    }
    html += skillHtml || '<p class="no-info-msg">장착된 스킬이 없습니다</p>';

    // 유물 정보 섹션
    html += '<div class="info-section-title">✨ 유물</div>';

    if (gameState.tempRelics.length > 0) {
        gameState.tempRelics.forEach(relic => {
            html += `
                <div class="relic-info-item">
                    <span class="relic-info-icon">${relic.icon}</span>
                    <div class="relic-info-content">
                        <div class="relic-info-name">${relic.name}</div>
                        <div class="relic-info-desc">${relic.desc}</div>
                    </div>
                </div>
            `;
        });
    } else {
        html += '<p class="no-info-msg">보유한 유물이 없습니다</p>';
    }

    panel.innerHTML = html;
}

function updateBuffDisplay() {
    const buffDisplay = document.getElementById('buff-display');
    if (!buffDisplay) return;

    if (gameState.activeBuffs.length === 0) {
        buffDisplay.innerHTML = '';
        return;
    }

    // 버프 효과 설명
    const effectDescriptions = {
        atkBoost: (v) => `공격력 +${Math.round(v * 100)}%`,
        critBoost: (v) => `치명타 +${v}%`,
        defBoost: (v) => `받는 피해 -${Math.round(v * 100)}%`,
        counterDef: (v) => `반격 피해 -${Math.round(v * 100)}%`,
        dodgeBoost: (v) => `회피율 +${v}%`
    };

    // 같은 이름의 버프는 한 번만 표시 (효과들을 모아서)
    const buffGroups = {};
    gameState.activeBuffs.forEach(buff => {
        if (!buffGroups[buff.name]) {
            buffGroups[buff.name] = {
                name: buff.name,
                icon: buff.icon,
                turns: buff.turns,
                effects: []
            };
        }
        const desc = effectDescriptions[buff.effect];
        if (desc) {
            buffGroups[buff.name].effects.push(desc(buff.value));
        }
    });

    buffDisplay.innerHTML = Object.values(buffGroups).map(b => {
        const effectText = b.effects.join(', ');
        const tooltip = `${b.name}\n${effectText}\n남은 턴: ${b.turns}`;
        return `<span class="buff-icon" title="${tooltip}">${b.icon}${b.turns}</span>`;
    }).join('');
}

// 모드 설명 텍스트
const modeDescriptions = {
    easy: '적 x0.5 / 보상 x1 / 입문용',
    normal: '적 x5 / 보상 x3 / 성장 필요',
    hard: '적 x30 / 보상 x5 / 고성장 필수',
    infinite: '적 x10 / 보상 x4 / 무한 도전'
};

// 이벤트
function initEventListeners() {
    // 모드 선택 (마을에서)
    document.querySelectorAll('.btn-mode-select').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.btn-mode-select').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            gameState.gameMode = btn.dataset.mode;
            document.getElementById('mode-desc-text').textContent = modeDescriptions[gameState.gameMode];
        });
    });

    // 던전 입장
    document.getElementById('btn-dungeon').addEventListener('click', () => {
        gameState.dungeon.currentFloor = 1;
        gameState.tempRelics = [];
        gameState.equippedSkills = generateStartingSkills(); // 기본 스킬 4개 지급
        gameState.activeBuffs = []; // 버프 초기화
        gameState.skillCooldowns = {}; // 쿨타임 초기화
        gameState.player.maxHp = getMaxHp();
        gameState.player.maxMp = getMaxMp();
        gameState.player.hp = gameState.player.maxHp;
        gameState.player.mp = gameState.player.maxMp;
        updateDungeonUI();
        updateSkillButtons();
        showScreen('dungeon-screen');
        startBattle();
    });

    // 스킵 입장
    document.getElementById('btn-skip').addEventListener('click', () => {
        const skipFloor = getSkipFloor();
        if (skipFloor <= 0) return;

        gameState.dungeon.currentFloor = skipFloor;
        gameState.tempRelics = [];
        gameState.equippedSkills = generateStartingSkills(); // 기본 스킬 4개 지급
        gameState.activeBuffs = []; // 버프 초기화
        gameState.skillCooldowns = {}; // 쿨타임 초기화
        gameState.player.maxHp = getMaxHp();
        gameState.player.maxMp = getMaxMp();
        gameState.player.hp = Math.floor(gameState.player.maxHp * 0.5); // 50% HP
        gameState.player.mp = gameState.player.maxMp;
        updateDungeonUI();
        updateSkillButtons();
        showScreen('dungeon-screen');
        startBattle();
    });

    document.getElementById('btn-shop').addEventListener('click', () => {
        updateShopUI();
        showScreen('shop-screen');
    });

    // 스탯 올리기
    document.querySelectorAll('.btn-stat-up').forEach(btn => {
        btn.addEventListener('click', () => {
            if (gameState.player.statPoints > 0) {
                const stat = btn.dataset.stat;
                gameState.player.stats[stat]++;
                gameState.player.statPoints--;
                updateVillageUI();
            }
        });
    });

    // 상점 - 4종 무기 강화
    document.querySelectorAll('.btn-upgrade[data-weapon]').forEach(btn => {
        btn.addEventListener('click', () => {
            const weapon = btn.dataset.weapon;
            if (gameState.enhancementStones >= 1) {
                gameState.enhancementStones--;
                gameState.weapons[weapon]++;
                updateShopUI();
            }
        });
    });

    document.getElementById('btn-upgrade-armor').addEventListener('click', () => {
        const cost = gameState.armorLevel * 100;
        if (gameState.player.gold >= cost) {
            gameState.player.gold -= cost;
            gameState.armorLevel++;
            gameState.player.maxHp = getMaxHp();
            updateShopUI();
        }
    });

    document.getElementById('btn-buy-potion').addEventListener('click', () => {
        if (gameState.player.gold >= 50) {
            gameState.player.gold -= 50;
            gameState.player.potions++;
            updateShopUI();
        }
    });

    document.getElementById('btn-shop-back').addEventListener('click', () => {
        updateVillageUI();
        showScreen('village-screen');
    });

    // 전투
    document.getElementById('btn-attack').addEventListener('click', playerAttack);

    for (let i = 1; i <= 4; i++) {
        document.getElementById(`btn-skill-${i}`).addEventListener('click', () => useSkill(i - 1));
    }

    // 상세 정보 버튼
    document.getElementById('btn-info-toggle').addEventListener('click', toggleInfoPanel);

    document.getElementById('btn-use-potion').addEventListener('click', usePotion);

    document.getElementById('btn-return').addEventListener('click', () => returnToVillage(false));
    document.getElementById('btn-gameover-return').addEventListener('click', () => returnToVillage(true));
    document.getElementById('btn-clear-return').addEventListener('click', () => returnToVillage(false));

    // 보스 클리어 화면
    document.getElementById('btn-boss-confirm').addEventListener('click', showBossRewardChoices);
    document.getElementById('btn-skip-skill').addEventListener('click', skipSkillAndContinue);
    document.getElementById('btn-cancel-relic').addEventListener('click', cancelRelicReplace);
}

// 초기화
function initGame() {
    gameState.player.maxHp = getMaxHp();
    gameState.player.maxMp = getMaxMp();
    gameState.player.hp = gameState.player.maxHp;
    gameState.player.mp = gameState.player.maxMp;
    gameState.gameMode = 'easy'; // 기본 모드

    initEventListeners();
    updateSkillButtons();
    updateVillageUI();
    showScreen('village-screen');
}

document.addEventListener('DOMContentLoaded', initGame);
