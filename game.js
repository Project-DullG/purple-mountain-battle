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
    weaponLevel: 1
};

// 스킬 데이터 (설명 추가)
const skillsData = {
    cat: [
        { id: 'cat_slash', name: '강타', mpCost: 2, damage: 25, type: 'active', desc: '25 고정 데미지. 반격 받음' },
        { id: 'cat_bleed', name: '출혈', mpCost: 3, damage: 15, type: 'active', dot: 5, desc: '15 데미지 + 3턴간 5씩 추가' },
        { id: 'cat_rage', name: '광폭화', mpCost: 0, type: 'passive', effect: 'atkUp', value: 1.2, desc: '패시브: 공격력 20% 증가' }
    ],
    elf: [
        { id: 'elf_fire', name: '화염', mpCost: 3, damage: 30, type: 'active', desc: '30 마법 데미지. 반격 받음' },
        { id: 'elf_heal', name: '치유', mpCost: 2, heal: 30, type: 'active', desc: 'HP 30 회복. 반격 없음' },
        { id: 'elf_mana', name: '마력증폭', mpCost: 0, type: 'passive', effect: 'mpUp', value: 3, desc: '패시브: 최대 MP +3' }
    ],
    dwarf: [
        { id: 'dwarf_guard', name: '방어', mpCost: 1, type: 'active', effect: 'guard', desc: '이번 턴 받는 피해 70% 감소' },
        { id: 'dwarf_taunt', name: '도발', mpCost: 2, damage: 10, type: 'active', effect: 'weaken', desc: '10 데미지 + 적 공격력 20% 감소' },
        { id: 'dwarf_wall', name: '철벽', mpCost: 0, type: 'passive', effect: 'defUp', value: 0.85, desc: '패시브: 받는 피해 15% 감소' }
    ],
    human: [
        { id: 'human_snipe', name: '저격', mpCost: 2, damage: 20, type: 'active', effect: 'noCounter', desc: '20 데미지. 반격 없음!' },
        { id: 'human_double', name: '속사', mpCost: 3, damage: 12, type: 'active', hits: 2, desc: '12 데미지 x 2회. 반격 1회' },
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
        weakened: false
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
    let atk = gameState.player.baseAtk + (gameState.player.stats.str * 2) + (gameState.weaponLevel * 5);
    gameState.equippedSkills.forEach(skill => {
        if (skill?.type === 'passive' && skill.effect === 'atkUp') {
            atk *= skill.value;
        }
    });
    return Math.floor(atk);
}

function calculateDamageTaken(damage, guarding = false) {
    let finalDamage = damage;
    gameState.equippedSkills.forEach(skill => {
        if (skill?.type === 'passive' && skill.effect === 'defUp') {
            finalDamage *= skill.value;
        }
    });
    if (guarding) finalDamage *= 0.3;
    return Math.floor(finalDamage);
}

function getCritChance() {
    let chance = 0.05 + (gameState.player.stats.luk * 0.01);
    gameState.equippedSkills.forEach(skill => {
        if (skill?.type === 'passive' && skill.effect === 'critUp') {
            chance += skill.value;
        }
    });
    return Math.min(chance, 0.5);
}

function getMaxMp() {
    let mp = 5 + Math.floor(gameState.player.stats.int / 3);
    gameState.equippedSkills.forEach(skill => {
        if (skill?.type === 'passive' && skill.effect === 'mpUp') {
            mp += skill.value;
        }
    });
    return mp;
}

function getExpForLevel(level) {
    return 100 * level;
}

function checkLevelUp() {
    while (gameState.player.exp >= getExpForLevel(gameState.player.level)) {
        gameState.player.exp -= getExpForLevel(gameState.player.level);
        gameState.player.level++;
        gameState.player.statPoints += 3;
        gameState.player.maxHp += 10;
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

    document.getElementById('weapon-level').textContent = gameState.weaponLevel;
    document.getElementById('weapon-cost').textContent = gameState.weaponLevel * 100;

    // 상점 버튼 활성화
    const weaponCost = gameState.weaponLevel * 100;
    document.getElementById('btn-upgrade-weapon').disabled = gameState.player.gold < weaponCost;
    document.getElementById('btn-buy-potion').disabled = gameState.player.gold < 50;
}

function updateDungeonUI() {
    document.getElementById('current-floor').textContent = gameState.dungeon.currentFloor;
    document.getElementById('pending-gold').textContent = gameState.dungeon.pendingGold;
    document.getElementById('pending-exp').textContent = gameState.dungeon.pendingExp;
}

function updateBattleUI() {
    const enemy = gameState.currentEnemy;
    document.getElementById('enemy-name').textContent = enemy.name + (enemy.weakened ? ' (약화)' : '');
    document.getElementById('enemy-hp').textContent = Math.max(0, enemy.hp);
    document.getElementById('enemy-atk').textContent = Math.floor(enemy.weakened ? enemy.atk * 0.8 : enemy.atk);

    document.getElementById('battle-hp').textContent = gameState.player.hp;
    document.getElementById('battle-max-hp').textContent = gameState.player.maxHp;
    document.getElementById('battle-mp').textContent = gameState.player.mp;
    document.getElementById('battle-max-mp').textContent = gameState.player.maxMp;

    // HP/MP 바 업데이트
    const hpPercent = (gameState.player.hp / gameState.player.maxHp) * 100;
    const mpPercent = (gameState.player.mp / gameState.player.maxMp) * 100;
    document.getElementById('hp-bar').style.width = `${hpPercent}%`;
    document.getElementById('mp-bar').style.width = `${mpPercent}%`;

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

// 전투
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
    const isCrit = Math.random() < getCritChance();
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
    let enemyAtk = gameState.currentEnemy.atk;
    if (gameState.currentEnemy.weakened) enemyAtk *= 0.8;

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

    // 방어 스킬
    if (skill.effect === 'guard') {
        isGuarding = true;
        addBattleLog('방어 태세!');
        updateBattleUI();
        return;
    }

    // 힐 스킬
    if (skill.heal) {
        gameState.player.hp = Math.min(gameState.player.maxHp, gameState.player.hp + skill.heal);
        addBattleLog(`HP ${skill.heal} 회복!`);
        updateBattleUI();
        return;
    }

    // 공격 스킬
    if (skill.damage) {
        const hits = skill.hits || 1;
        let totalDamage = 0;

        for (let i = 0; i < hits; i++) {
            const isCrit = Math.random() < getCritChance();
            const damage = isCrit ? Math.floor(skill.damage * 1.5) : skill.damage;
            totalDamage += damage;
            gameState.currentEnemy.hp -= damage;
            addBattleLog(`${damage} 데미지${isCrit ? ' (크리티컬!)' : ''}`);
        }

        // 약화 효과
        if (skill.effect === 'weaken') {
            gameState.currentEnemy.weakened = true;
            addBattleLog('적 약화됨!');
        }

        if (gameState.currentEnemy.hp <= 0) {
            enemyDefeated();
        } else if (skill.effect !== 'noCounter') {
            enemyCounterAttack();
        }
    }

    updateBattleUI();
}

function enemyDefeated() {
    const enemy = gameState.currentEnemy;
    gameState.dungeon.inBattle = false;
    gameState.dungeon.pendingGold += enemy.goldReward;
    gameState.dungeon.pendingExp += enemy.expReward;

    addBattleLog(`${enemy.name} 처치!`);
    addBattleLog(`+${enemy.goldReward}G, +${enemy.expReward}EXP`);

    if (enemy.isBoss && gameState.dungeon.currentFloor >= gameState.dungeon.maxUnlockedFloor) {
        gameState.dungeon.maxUnlockedFloor = gameState.dungeon.currentFloor + 1;
        addBattleLog(`다음 층 해금!`);
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

        // 스킬 선택 시 설명 업데이트
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
    // 던전 입장
    document.getElementById('btn-dungeon').addEventListener('click', () => {
        gameState.dungeon.currentFloor = gameState.dungeon.maxUnlockedFloor;
        gameState.player.maxMp = getMaxMp();
        gameState.player.hp = gameState.player.maxHp;
        gameState.player.mp = gameState.player.maxMp;
        updateDungeonUI();
        showScreen('dungeon-screen');
        startBattle();
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
            updateVillageUI();
        }
    });

    document.getElementById('btn-buy-potion').addEventListener('click', () => {
        if (gameState.player.gold >= 50) {
            gameState.player.gold -= 50;
            gameState.player.potions++;
            updateVillageUI();
        }
    });

    // 전투
    document.getElementById('btn-attack').addEventListener('click', playerAttack);

    for (let i = 1; i <= 4; i++) {
        document.getElementById(`btn-skill-${i}`).addEventListener('click', () => useSkill(i - 1));
    }

    document.getElementById('btn-next-floor').addEventListener('click', nextFloor);
    document.getElementById('btn-return').addEventListener('click', () => returnToVillage(false));
    document.getElementById('btn-gameover-return').addEventListener('click', () => returnToVillage(true));
}

// 초기화
function initGame() {
    initSkillsUI();
    initEventListeners();
    updateVillageUI();
    updateSkillButtons();
    showScreen('village-screen');
}

document.addEventListener('DOMContentLoaded', initGame);
