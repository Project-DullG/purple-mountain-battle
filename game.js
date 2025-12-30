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
        inBattle: false
    },
    currentEnemy: null,
    equippedSkills: [null, null, null, null],
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
    pendingRelic: null, // 보스 클리어 후 획득한 유물
    skillChoices: [] // 보스 클리어 후 선택 가능한 스킬들
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
const skillsData = {
    cat: [
        { id: 'cat_slash', name: '강타', mpCost: 2, damage: 25, type: 'active', desc: '25 데미지. 반격 받음', char: '묘인' },
        { id: 'cat_fury', name: '연속베기', mpCost: 4, damage: 15, hits: 3, type: 'active', desc: '15 데미지 x3. 반격 1회', char: '묘인' },
        { id: 'cat_rage', name: '광폭화', mpCost: 0, type: 'passive', effect: 'atkUp', value: 1.2, desc: '패시브: 공격력 20% 증가', char: '묘인' }
    ],
    elf: [
        { id: 'elf_fire', name: '화염', mpCost: 3, damage: 30, type: 'active', desc: '30 데미지. 반격 받음', char: '엘프' },
        { id: 'elf_heal', name: '치유', mpCost: 2, heal: 40, type: 'active', desc: 'HP 40 회복. 반격 없음', char: '엘프' },
        { id: 'elf_mana', name: '마력증폭', mpCost: 0, type: 'passive', effect: 'mpUp', value: 3, desc: '패시브: 최대 MP +3', char: '엘프' }
    ],
    dwarf: [
        { id: 'dwarf_guard', name: '방어', mpCost: 1, type: 'active', effect: 'guard', desc: '적 공격 유도 + 피해 70% 감소', char: '드워프' },
        { id: 'dwarf_bash', name: '방패치기', mpCost: 2, damage: 15, type: 'active', effect: 'stun', desc: '15 데미지 + 적 1턴 스턴', char: '드워프' },
        { id: 'dwarf_wall', name: '철벽', mpCost: 0, type: 'passive', effect: 'defUp', value: 0.85, desc: '패시브: 받는 피해 15% 감소', char: '드워프' }
    ],
    human: [
        { id: 'human_snipe', name: '저격', mpCost: 2, damage: 20, type: 'active', effect: 'noCounter', desc: '20 데미지. 반격 없음!', char: '인간' },
        { id: 'human_double', name: '속사', mpCost: 3, damage: 12, type: 'active', hits: 2, desc: '12 데미지 x2. 반격 1회', char: '인간' },
        { id: 'human_focus', name: '집중', mpCost: 0, type: 'passive', effect: 'critUp', value: 0.15, desc: '패시브: 크리티컬 +15%', char: '인간' }
    ]
};

// 모드별 설정
const modeSettings = {
    easy: { enemyMult: 0.8, maxFloor: 50, name: '이지' },
    normal: { enemyMult: 1.0, maxFloor: 50, name: '노말' },
    hard: { enemyMult: 1.3, maxFloor: 50, name: '하드' },
    infinite: { enemyMult: 1.0, maxFloor: Infinity, name: '무한' }
};

// 적 생성
function generateEnemy(floor) {
    const isBoss = floor % 10 === 0;
    const isMiniBoss = floor % 5 === 0 && !isBoss;
    const modeMult = modeSettings[gameState.gameMode].enemyMult;

    const baseHp = 30 + floor * 10;
    const baseAtk = 5 + floor * 2;

    return {
        name: getEnemyName(floor, isBoss, isMiniBoss),
        hp: Math.floor((isBoss ? baseHp * 3 : isMiniBoss ? baseHp * 2 : baseHp) * modeMult),
        maxHp: Math.floor((isBoss ? baseHp * 3 : isMiniBoss ? baseHp * 2 : baseHp) * modeMult),
        atk: Math.floor((isBoss ? baseAtk * 2 : isMiniBoss ? baseAtk * 1.5 : baseAtk) * modeMult),
        goldReward: Math.floor((10 + floor * 5) * (isBoss ? 3 : isMiniBoss ? 2 : 1)),
        expReward: Math.floor((20 + floor * 10) * (isBoss ? 3 : isMiniBoss ? 2 : 1)),
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

    return Math.min(dodge, 50);
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

    return Math.min(chance, 50);
}

function calculateDamageTaken(damage, guarding = false) {
    let finalDamage = damage;

    gameState.equippedSkills.forEach(skill => {
        if (skill?.type === 'passive' && skill.effect === 'defUp') {
            finalDamage *= skill.value;
        }
    });

    gameState.tempRelics.forEach(relic => {
        if (relic.effect === 'def') finalDamage *= relic.value;
    });

    if (guarding) finalDamage *= 0.3;

    return Math.floor(finalDamage);
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
    document.getElementById('current-mode').textContent = modeSettings[gameState.gameMode].name;

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

    // 유물 표시
    const relicsContainer = document.getElementById('current-relics');
    const relicIcons = document.getElementById('relic-icons');

    if (gameState.tempRelics.length > 0) {
        relicsContainer.classList.remove('hidden');
        relicIcons.textContent = gameState.tempRelics.map(r => r.icon).join(' ');
    } else {
        relicsContainer.classList.add('hidden');
    }
}

function updateBattleUI() {
    const enemy = gameState.currentEnemy;
    document.getElementById('enemy-name').textContent = enemy.name + (enemy.stunned ? ' [스턴]' : '');
    document.getElementById('enemy-hp').textContent = Math.max(0, enemy.hp);
    document.getElementById('enemy-max-hp').textContent = enemy.maxHp;
    document.getElementById('enemy-atk').textContent = enemy.atk;

    const enemyHpPercent = (Math.max(0, enemy.hp) / enemy.maxHp) * 100;
    document.getElementById('enemy-hp-bar').style.width = `${enemyHpPercent}%`;

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

function startBattle() {
    gameState.currentEnemy = generateEnemy(gameState.dungeon.currentFloor);
    gameState.dungeon.inBattle = true;
    isGuarding = false;
    clearBattleLog();

    const floorType = gameState.currentEnemy.isBoss ? '보스' : gameState.currentEnemy.isMiniBoss ? '중간보스' : '';
    addBattleLog(`${gameState.dungeon.currentFloor}층 - ${gameState.currentEnemy.name} ${floorType ? `[${floorType}]` : ''}`);

    updateBattleUI();
    updateDungeonUI();
    document.getElementById('battle-actions').classList.remove('hidden');
    document.getElementById('floor-clear-actions').classList.add('hidden');
}

function playerAttack() {
    if (!gameState.dungeon.inBattle) return;

    const playerAtk = getPlayerAtk();
    const isCrit = Math.random() * 100 < getCritChance();
    const damage = isCrit ? Math.floor(playerAtk * 1.5) : playerAtk;

    gameState.currentEnemy.hp -= damage;
    addBattleLog(`공격! ${damage} 데미지${isCrit ? ' (크리티컬!)' : ''}`);

    if (gameState.currentEnemy.hp <= 0) {
        enemyDefeated();
    } else {
        enemyCounterAttack();
    }
    updateBattleUI();
}

function enemyCounterAttack() {
    if (gameState.currentEnemy.stunned) {
        addBattleLog(`${gameState.currentEnemy.name}은(는) 스턴 상태!`);
        gameState.currentEnemy.stunned = false;
        return;
    }

    if (Math.random() * 100 < getDodgeChance()) {
        addBattleLog('회피 성공!');
        isGuarding = false;
        return;
    }

    const enemyAtk = gameState.currentEnemy.atk;
    const damage = calculateDamageTaken(enemyAtk, isGuarding);
    gameState.player.hp -= damage;
    addBattleLog(`반격! ${damage} 피해${isGuarding ? ' (방어!)' : ''}`);
    isGuarding = false;

    if (gameState.player.hp <= 0) {
        playerDefeated();
    }
}

function useSkill(slotIndex) {
    const skill = gameState.equippedSkills[slotIndex];
    if (!skill || skill.type === 'passive') return;
    if (!gameState.dungeon.inBattle) return;

    if (gameState.player.mp < skill.mpCost) {
        addBattleLog('MP 부족!');
        return;
    }

    const characters = ['cat', 'elf', 'dwarf', 'human'];
    let skillCharacter = null;
    for (const char of characters) {
        if (skillsData[char].some(s => s.id === skill.id)) {
            skillCharacter = char;
            break;
        }
    }

    gameState.player.mp -= skill.mpCost;
    addBattleLog(`[${skill.name}] 사용!`);

    if (skill.effect === 'guard') {
        isGuarding = true;
        addBattleLog('방어 태세!');
        enemyCounterAttack();
        updateBattleUI();
        return;
    }

    if (skill.heal) {
        const weaponBonus = getWeaponBonus(skillCharacter);
        const healAmount = Math.floor(skill.heal * (1 + weaponBonus / 100));
        gameState.player.hp = Math.min(gameState.player.maxHp, gameState.player.hp + healAmount);
        addBattleLog(`HP ${healAmount} 회복!`);
        updateBattleUI();
        return;
    }

    if (skill.damage) {
        const hits = skill.hits || 1;
        const weaponBonus = getWeaponBonus(skillCharacter);

        for (let i = 0; i < hits; i++) {
            const isCrit = Math.random() * 100 < getCritChance();
            const baseDamage = Math.floor(skill.damage * (1 + weaponBonus / 100));
            const damage = isCrit ? Math.floor(baseDamage * 1.5) : baseDamage;
            gameState.currentEnemy.hp -= damage;
            addBattleLog(`${damage} 데미지${isCrit ? ' (크리티컬!)' : ''}`);
        }

        if (skill.effect === 'stun') {
            gameState.currentEnemy.stunned = true;
            addBattleLog('적 스턴!');
        }

        if (gameState.currentEnemy.hp <= 0) {
            enemyDefeated();
        } else if (skill.effect !== 'noCounter') {
            enemyCounterAttack();
        }
    }

    updateBattleUI();
}

function usePotion() {
    if (gameState.player.potions <= 0 || !gameState.dungeon.inBattle) return;

    gameState.player.potions--;
    const healAmount = 50;
    gameState.player.hp = Math.min(gameState.player.maxHp, gameState.player.hp + healAmount);
    addBattleLog(`포션 사용! HP ${healAmount} 회복`);
    updateBattleUI();
}

function enemyDefeated() {
    const enemy = gameState.currentEnemy;
    gameState.dungeon.inBattle = false;

    let goldReward = enemy.goldReward;
    let expReward = enemy.expReward;

    gameState.tempRelics.forEach(relic => {
        if (relic.effect === 'gold') goldReward = Math.floor(goldReward * relic.value);
        if (relic.effect === 'exp') expReward = Math.floor(expReward * relic.value);
    });

    gameState.dungeon.pendingGold += goldReward;
    gameState.dungeon.pendingExp += expReward;

    addBattleLog(`${enemy.name} 처치!`);
    addBattleLog(`+${goldReward}G, +${expReward}EXP`);

    // 강화석 드랍
    let stoneDropChance = enemy.isBoss ? 1.0 : enemy.isMiniBoss ? 0.5 : 0.3;
    let stoneAmount = enemy.isBoss ? 3 : enemy.isMiniBoss ? 2 : 1;

    if (Math.random() < stoneDropChance) {
        gameState.enhancementStones += stoneAmount;
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
    document.getElementById('battle-actions').classList.add('hidden');
    document.getElementById('floor-clear-actions').classList.remove('hidden');

    // 전투 종료 후에만 복귀 가능
    document.getElementById('btn-return').disabled = false;
}

function handleBossClear() {
    const maxFloor = modeSettings[gameState.gameMode].maxFloor;

    // 게임 클리어 체크 (무한모드가 아닌 경우)
    if (gameState.dungeon.currentFloor >= maxFloor) {
        handleGameClear();
        return;
    }

    // 유물 드랍 (최대 4개까지)
    gameState.pendingRelic = null;
    if (gameState.tempRelics.length < 4 && Math.random() < 0.3) {
        const availableRelics = relicsData.filter(r => !gameState.tempRelics.find(owned => owned.id === r.id));
        if (availableRelics.length > 0) {
            gameState.pendingRelic = availableRelics[Math.floor(Math.random() * availableRelics.length)];
        }
    }

    // 스킬 선택지 생성
    generateSkillChoices();

    // 보스 클리어 화면 표시
    showBossClearScreen();
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

function showBossClearScreen() {
    // 유물 표시
    const relicReward = document.getElementById('relic-reward');
    if (gameState.pendingRelic) {
        relicReward.classList.remove('hidden');
        document.getElementById('new-relic-name').textContent = gameState.pendingRelic.icon + ' ' + gameState.pendingRelic.name;
        document.getElementById('new-relic-desc').textContent = gameState.pendingRelic.desc;
        gameState.tempRelics.push(gameState.pendingRelic);
    } else {
        relicReward.classList.add('hidden');
    }

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
        btn.addEventListener('click', () => selectSkill(skill));
        skillGrid.appendChild(btn);
    });

    showScreen('boss-clear-screen');
}

function selectSkill(skill) {
    // 빈 슬롯 찾기
    let emptySlot = gameState.equippedSkills.findIndex(s => s === null);

    if (emptySlot === -1) {
        // 빈 슬롯이 없으면 가장 오래된 스킬 교체
        emptySlot = 0;
    }

    gameState.equippedSkills[emptySlot] = skill;
    updateSkillButtons();

    // MP 회복
    gameState.player.maxMp = getMaxMp();
    gameState.player.mp = gameState.player.maxMp;

    // 다음 층으로
    gameState.dungeon.currentFloor++;
    showScreen('dungeon-screen');
    startBattle();
}

function restAndContinue() {
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
    checkLevelUp();

    document.getElementById('clear-mode').textContent = modeSettings[gameState.gameMode].name;
    document.getElementById('clear-floor').textContent = gameState.dungeon.currentFloor;
    document.getElementById('clear-gold').textContent = gameState.dungeon.pendingGold;
    document.getElementById('clear-exp').textContent = gameState.dungeon.pendingExp;

    showScreen('clear-screen');
}

function playerDefeated() {
    gameState.dungeon.inBattle = false;

    const halfGold = Math.floor(gameState.dungeon.pendingGold / 2);
    const halfExp = Math.floor(gameState.dungeon.pendingExp / 2);

    document.getElementById('death-gold').textContent = halfGold;
    document.getElementById('death-exp').textContent = halfExp;

    gameState.player.gold += halfGold;
    gameState.player.exp += halfExp;
    checkLevelUp();

    showScreen('gameover-screen');
}

function returnToVillage(fromDeath = false) {
    if (!fromDeath) {
        gameState.player.gold += gameState.dungeon.pendingGold;
        gameState.player.exp += gameState.dungeon.pendingExp;
        checkLevelUp();
    }

    // 던전 상태 초기화
    gameState.dungeon.pendingGold = 0;
    gameState.dungeon.pendingExp = 0;
    gameState.dungeon.currentFloor = 1;
    gameState.tempRelics = []; // 유물 초기화
    gameState.equippedSkills = [null, null, null, null]; // 스킬 초기화

    // HP/MP 회복
    gameState.player.maxHp = getMaxHp();
    gameState.player.maxMp = getMaxMp();
    gameState.player.hp = gameState.player.maxHp;
    gameState.player.mp = gameState.player.maxMp;

    updateVillageUI();
    updateSkillButtons();
    showScreen('village-screen');
}

function nextFloor() {
    // 복귀 버튼 비활성화
    document.getElementById('btn-return').disabled = true;

    gameState.dungeon.currentFloor++;
    updateDungeonUI();
    startBattle();
}

// 스킬 UI
function updateSkillButtons() {
    for (let i = 0; i < 4; i++) {
        const btn = document.getElementById(`btn-skill-${i + 1}`);
        const skill = gameState.equippedSkills[i];
        if (skill && skill.type === 'active') {
            btn.textContent = `${skill.name} (${skill.mpCost})`;
            btn.title = skill.desc;
            btn.disabled = false;
        } else if (skill && skill.type === 'passive') {
            btn.textContent = `${skill.name} [P]`;
            btn.title = skill.desc;
            btn.disabled = true;
        } else {
            btn.textContent = '-';
            btn.title = '';
            btn.disabled = true;
        }
    }
}

// 이벤트
function initEventListeners() {
    // 모드 선택
    document.querySelectorAll('.btn-mode').forEach(btn => {
        btn.addEventListener('click', () => {
            gameState.gameMode = btn.dataset.mode;
            updateVillageUI();
            showScreen('village-screen');
        });
    });

    // 던전 입장
    document.getElementById('btn-dungeon').addEventListener('click', () => {
        gameState.dungeon.currentFloor = 1;
        gameState.tempRelics = [];
        gameState.equippedSkills = [null, null, null, null];
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
        gameState.equippedSkills = [null, null, null, null];
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

    document.getElementById('btn-use-potion').addEventListener('click', usePotion);

    document.getElementById('btn-next-floor').addEventListener('click', nextFloor);
    document.getElementById('btn-return').addEventListener('click', () => returnToVillage(false));
    document.getElementById('btn-gameover-return').addEventListener('click', () => returnToVillage(true));
    document.getElementById('btn-clear-return').addEventListener('click', () => returnToVillage(false));

    // 보스 클리어 화면
    document.getElementById('btn-rest').addEventListener('click', restAndContinue);
}

// 초기화
function initGame() {
    gameState.player.maxHp = getMaxHp();
    gameState.player.maxMp = getMaxMp();
    gameState.player.hp = gameState.player.maxHp;
    gameState.player.mp = gameState.player.maxMp;

    initEventListeners();
    updateSkillButtons();
    showScreen('mode-screen');
}

document.addEventListener('DOMContentLoaded', initGame);
