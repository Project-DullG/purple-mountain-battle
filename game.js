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
        maxUnlockedFloor: 1,
        pendingGold: 0,
        pendingExp: 0,
        inBattle: false
    },
    currentEnemy: null,
    equippedSkills: [null, null, null, null],
    relics: [],
    weaponLevel: 1,
    armorLevel: 1
};

// 유물 데이터
const relicsData = [
    { id: 'relic_sword', name: '고대의 검날', desc: '공격력 +10', effect: 'atk', value: 10 },
    { id: 'relic_shield', name: '수호의 방패', desc: '받는 피해 -10%', effect: 'def', value: 0.9 },
    { id: 'relic_ring', name: '마력의 반지', desc: '최대 MP +5', effect: 'mp', value: 5 },
    { id: 'relic_cloak', name: '그림자 망토', desc: '회피율 +10%', effect: 'dodge', value: 10 },
    { id: 'relic_amulet', name: '행운의 부적', desc: '크리티컬 +10%', effect: 'crit', value: 10 },
    { id: 'relic_boots', name: '신속의 장화', desc: '선제공격 확률 +20%', effect: 'first', value: 20 },
    { id: 'relic_crown', name: '왕의 왕관', desc: '경험치 획득 +20%', effect: 'exp', value: 1.2 },
    { id: 'relic_coin', name: '황금 동전', desc: '골드 획득 +20%', effect: 'gold', value: 1.2 }
];

// 스킬 데이터
const skillsData = {
    cat: [
        { id: 'cat_slash', name: '강타', mpCost: 2, damage: 25, type: 'active', desc: '25 데미지. 반격 받음' },
        { id: 'cat_fury', name: '연속베기', mpCost: 4, damage: 15, hits: 3, type: 'active', desc: '15 데미지 x3. 반격 1회' },
        { id: 'cat_rage', name: '광폭화', mpCost: 0, type: 'passive', effect: 'atkUp', value: 1.2, desc: '패시브: 공격력 20% 증가' }
    ],
    elf: [
        { id: 'elf_fire', name: '화염', mpCost: 3, damage: 30, type: 'active', desc: '30 데미지. 반격 받음' },
        { id: 'elf_heal', name: '치유', mpCost: 2, heal: 40, type: 'active', desc: 'HP 40 회복. 반격 없음' },
        { id: 'elf_mana', name: '마력증폭', mpCost: 0, type: 'passive', effect: 'mpUp', value: 3, desc: '패시브: 최대 MP +3' }
    ],
    dwarf: [
        { id: 'dwarf_guard', name: '방어', mpCost: 1, type: 'active', effect: 'guard', desc: '적 공격 유도 + 피해 70% 감소' },
        { id: 'dwarf_bash', name: '방패치기', mpCost: 2, damage: 15, type: 'active', effect: 'stun', desc: '15 데미지 + 적 1턴 스턴' },
        { id: 'dwarf_wall', name: '철벽', mpCost: 0, type: 'passive', effect: 'defUp', value: 0.85, desc: '패시브: 받는 피해 15% 감소' }
    ],
    human: [
        { id: 'human_snipe', name: '저격', mpCost: 2, damage: 20, type: 'active', effect: 'noCounter', desc: '20 데미지. 반격 없음!' },
        { id: 'human_double', name: '속사', mpCost: 3, damage: 12, type: 'active', hits: 2, desc: '12 데미지 x2. 반격 1회' },
        { id: 'human_focus', name: '집중', mpCost: 0, type: 'passive', effect: 'critUp', value: 0.15, desc: '패시브: 크리티컬 +15%' }
    ]
};

// 적 생성
function generateEnemy(floor) {
    const isBoss = floor % 10 === 0;
    const isMiniBoss = floor % 5 === 0 && !isBoss;

    const baseHp = 30 + floor * 10;
    const baseAtk = 5 + floor * 2;

    return {
        name: getEnemyName(floor, isBoss, isMiniBoss),
        hp: Math.floor(isBoss ? baseHp * 3 : isMiniBoss ? baseHp * 2 : baseHp),
        maxHp: Math.floor(isBoss ? baseHp * 3 : isMiniBoss ? baseHp * 2 : baseHp),
        atk: Math.floor(isBoss ? baseAtk * 2 : isMiniBoss ? baseAtk * 1.5 : baseAtk),
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

// 스탯 계산 (유물 효과 포함)
function getPlayerAtk() {
    let atk = gameState.player.baseAtk + (gameState.player.stats.str * 2) + (gameState.weaponLevel * 5);

    // 패시브 효과
    gameState.equippedSkills.forEach(skill => {
        if (skill?.type === 'passive' && skill.effect === 'atkUp') {
            atk *= skill.value;
        }
    });

    // 유물 효과
    gameState.relics.forEach(relic => {
        if (relic.effect === 'atk') atk += relic.value;
    });

    return Math.floor(atk);
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

    gameState.relics.forEach(relic => {
        if (relic.effect === 'mp') mp += relic.value;
    });

    return mp;
}

function getDodgeChance() {
    let dodge = gameState.player.stats.dex * 1;

    gameState.relics.forEach(relic => {
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

    gameState.relics.forEach(relic => {
        if (relic.effect === 'crit') chance += relic.value;
    });

    return Math.min(chance, 50);
}

function calculateDamageTaken(damage, guarding = false) {
    let finalDamage = damage;

    // 패시브 효과
    gameState.equippedSkills.forEach(skill => {
        if (skill?.type === 'passive' && skill.effect === 'defUp') {
            finalDamage *= skill.value;
        }
    });

    // 유물 효과
    gameState.relics.forEach(relic => {
        if (relic.effect === 'def') finalDamage *= relic.value;
    });

    // 방어 스킬
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

// UI 업데이트
function updateVillageUI() {
    document.getElementById('player-level').textContent = gameState.player.level;
    document.getElementById('player-gold').textContent = gameState.player.gold;
    document.getElementById('player-exp').textContent = gameState.player.exp;
    document.getElementById('player-max-exp').textContent = getExpForLevel(gameState.player.level);
    document.getElementById('unlocked-floor').textContent = gameState.dungeon.maxUnlockedFloor;
    document.getElementById('start-floor').textContent = gameState.dungeon.maxUnlockedFloor;

    document.getElementById('stat-points').textContent = gameState.player.statPoints;
    document.getElementById('stat-str').textContent = gameState.player.stats.str;
    document.getElementById('stat-dex').textContent = gameState.player.stats.dex;
    document.getElementById('stat-int').textContent = gameState.player.stats.int;
    document.getElementById('stat-luk').textContent = gameState.player.stats.luk;
}

function updateShopUI() {
    document.getElementById('shop-gold').textContent = gameState.player.gold;
    document.getElementById('weapon-level').textContent = gameState.weaponLevel;
    document.getElementById('weapon-cost').textContent = gameState.weaponLevel * 100;
    document.getElementById('armor-level').textContent = gameState.armorLevel;
    document.getElementById('armor-cost').textContent = gameState.armorLevel * 100;
    document.getElementById('potion-count').textContent = gameState.player.potions;

    const weaponCost = gameState.weaponLevel * 100;
    const armorCost = gameState.armorLevel * 100;
    document.getElementById('btn-upgrade-weapon').disabled = gameState.player.gold < weaponCost;
    document.getElementById('btn-upgrade-armor').disabled = gameState.player.gold < armorCost;
    document.getElementById('btn-buy-potion').disabled = gameState.player.gold < 50;
}

function updateInventoryUI() {
    document.getElementById('relic-count').textContent = gameState.relics.length;

    const relicList = document.getElementById('relic-list');
    if (gameState.relics.length === 0) {
        relicList.innerHTML = '<p class="empty-msg">보유한 유물이 없습니다.<br>보스 처치 시 낮은 확률로 획득!</p>';
    } else {
        relicList.innerHTML = gameState.relics.map(relic => `
            <div class="relic-item">
                <div class="relic-name">${relic.name}</div>
                <div class="relic-desc">${relic.desc}</div>
            </div>
        `).join('');
    }

    // 능력치 요약
    document.getElementById('total-atk').textContent = getPlayerAtk();
    document.getElementById('total-hp').textContent = getMaxHp();
    document.getElementById('total-mp').textContent = getMaxMp();
    document.getElementById('total-crit').textContent = getCritChance();
    document.getElementById('total-dodge').textContent = getDodgeChance();
}

function updateDungeonUI() {
    document.getElementById('current-floor').textContent = gameState.dungeon.currentFloor;
    document.getElementById('pending-gold').textContent = gameState.dungeon.pendingGold;
    document.getElementById('pending-exp').textContent = gameState.dungeon.pendingExp;
}

function updateBattleUI() {
    const enemy = gameState.currentEnemy;
    document.getElementById('enemy-name').textContent = enemy.name + (enemy.stunned ? ' [스턴]' : '');
    document.getElementById('enemy-hp').textContent = Math.max(0, enemy.hp);
    document.getElementById('enemy-atk').textContent = enemy.atk;

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
    // 스턴 상태면 공격 안 함
    if (gameState.currentEnemy.stunned) {
        addBattleLog(`${gameState.currentEnemy.name}은(는) 스턴 상태!`);
        gameState.currentEnemy.stunned = false;
        return;
    }

    // 회피 체크
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

    gameState.player.mp -= skill.mpCost;
    addBattleLog(`[${skill.name}] 사용!`);

    // 방어 스킬 - 적이 공격하고 그 데미지 감소
    if (skill.effect === 'guard') {
        isGuarding = true;
        addBattleLog('방어 태세!');
        enemyCounterAttack();
        updateBattleUI();
        return;
    }

    // 힐 스킬 - 반격 없음
    if (skill.heal) {
        gameState.player.hp = Math.min(gameState.player.maxHp, gameState.player.hp + skill.heal);
        addBattleLog(`HP ${skill.heal} 회복!`);
        updateBattleUI();
        return;
    }

    // 공격 스킬
    if (skill.damage) {
        const hits = skill.hits || 1;

        for (let i = 0; i < hits; i++) {
            const isCrit = Math.random() * 100 < getCritChance();
            const damage = isCrit ? Math.floor(skill.damage * 1.5) : skill.damage;
            gameState.currentEnemy.hp -= damage;
            addBattleLog(`${damage} 데미지${isCrit ? ' (크리티컬!)' : ''}`);
        }

        // 스턴 효과
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

    // 골드/경험치 보상 (유물 효과 적용)
    let goldReward = enemy.goldReward;
    let expReward = enemy.expReward;

    gameState.relics.forEach(relic => {
        if (relic.effect === 'gold') goldReward = Math.floor(goldReward * relic.value);
        if (relic.effect === 'exp') expReward = Math.floor(expReward * relic.value);
    });

    gameState.dungeon.pendingGold += goldReward;
    gameState.dungeon.pendingExp += expReward;

    addBattleLog(`${enemy.name} 처치!`);
    addBattleLog(`+${goldReward}G, +${expReward}EXP`);

    // 보스 유물 드랍
    if (enemy.isBoss) {
        if (gameState.dungeon.currentFloor >= gameState.dungeon.maxUnlockedFloor) {
            gameState.dungeon.maxUnlockedFloor = gameState.dungeon.currentFloor + 1;
            addBattleLog(`다음 층 해금!`);
        }

        // 30% 확률로 유물 드랍
        if (Math.random() < 0.3) {
            const availableRelics = relicsData.filter(r => !gameState.relics.find(owned => owned.id === r.id));
            if (availableRelics.length > 0) {
                const newRelic = availableRelics[Math.floor(Math.random() * availableRelics.length)];
                gameState.relics.push(newRelic);
                addBattleLog(`유물 획득: ${newRelic.name}!`);
            }
        }
    }

    updateDungeonUI();
    document.getElementById('battle-actions').classList.add('hidden');
    document.getElementById('floor-clear-actions').classList.remove('hidden');
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

    gameState.dungeon.pendingGold = 0;
    gameState.dungeon.pendingExp = 0;
    gameState.dungeon.currentFloor = gameState.dungeon.maxUnlockedFloor;

    // HP/MP 회복
    gameState.player.maxHp = getMaxHp();
    gameState.player.maxMp = getMaxMp();
    gameState.player.hp = gameState.player.maxHp;
    gameState.player.mp = gameState.player.maxMp;

    updateVillageUI();
    showScreen('village-screen');
}

function nextFloor() {
    gameState.dungeon.currentFloor++;
    updateDungeonUI();
    startBattle();
}

// 스킬 UI
function initSkillsUI() {
    Object.keys(skillsData).forEach(character => {
        const select = document.querySelector(`.skill-select[data-character="${character}"]`);
        select.innerHTML = '<option value="">-</option>';
        skillsData[character].forEach(skill => {
            const option = document.createElement('option');
            option.value = skill.id;
            const typeLabel = skill.type === 'passive' ? '[P]' : `MP${skill.mpCost}`;
            option.textContent = `${skill.name} (${typeLabel})`;
            select.appendChild(option);
        });

        select.addEventListener('change', () => {
            const skillId = select.value;
            const descEl = document.getElementById(`skill-desc-${character}`);
            if (skillId) {
                const skill = skillsData[character].find(s => s.id === skillId);
                descEl.textContent = skill.desc;
            } else {
                descEl.textContent = '스킬을 선택하세요';
            }
            saveSkillSelection();
        });
    });
}

function saveSkillSelection() {
    const characters = ['cat', 'elf', 'dwarf', 'human'];
    characters.forEach((char, index) => {
        const select = document.querySelector(`.skill-select[data-character="${char}"]`);
        const skillId = select.value;
        if (skillId) {
            gameState.equippedSkills[index] = skillsData[char].find(s => s.id === skillId);
        } else {
            gameState.equippedSkills[index] = null;
        }
    });
    updateSkillButtons();
}

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
    // 메인 메뉴
    document.getElementById('btn-dungeon').addEventListener('click', () => {
        gameState.dungeon.currentFloor = gameState.dungeon.maxUnlockedFloor;
        gameState.player.maxHp = getMaxHp();
        gameState.player.maxMp = getMaxMp();
        gameState.player.hp = gameState.player.maxHp;
        gameState.player.mp = gameState.player.maxMp;
        updateDungeonUI();
        showScreen('dungeon-screen');
        startBattle();
    });

    document.getElementById('btn-shop').addEventListener('click', () => {
        updateShopUI();
        showScreen('shop-screen');
    });

    document.getElementById('btn-inventory').addEventListener('click', () => {
        updateInventoryUI();
        showScreen('inventory-screen');
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

    // 상점
    document.getElementById('btn-upgrade-weapon').addEventListener('click', () => {
        const cost = gameState.weaponLevel * 100;
        if (gameState.player.gold >= cost) {
            gameState.player.gold -= cost;
            gameState.weaponLevel++;
            updateShopUI();
        }
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

    document.getElementById('btn-inventory-back').addEventListener('click', () => {
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
}

// 초기화
function initGame() {
    gameState.player.maxHp = getMaxHp();
    gameState.player.maxMp = getMaxMp();
    gameState.player.hp = gameState.player.maxHp;
    gameState.player.mp = gameState.player.maxMp;

    initSkillsUI();
    initEventListeners();
    updateVillageUI();
    updateSkillButtons();
    showScreen('village-screen');
}

document.addEventListener('DOMContentLoaded', initGame);
