// 게임 상태
const gameState = {
    // 플레이어 기본 정보
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
        stats: {
            str: 5,  // 힘 - 공격력
            dex: 5,  // 민첩 - 회피/크리티컬
            int: 5,  // 지능 - MP/스킬 위력
            luk: 5   // 행운 - 드랍률/크리티컬
        }
    },

    // 던전 진행 상태
    dungeon: {
        currentFloor: 1,
        maxUnlockedFloor: 1,
        pendingGold: 0,
        pendingExp: 0,
        inBattle: false
    },

    // 현재 적
    currentEnemy: null,

    // 장착 스킬
    equippedSkills: [null, null, null, null],

    // 보유 유물
    relics: [],

    // 무기 강화 레벨
    weaponLevel: 1
};

// 스킬 데이터
const skillsData = {
    cat: [
        { id: 'cat_slash', name: '강타', mpCost: 2, damage: 25, type: 'active', desc: '강력한 일격' },
        { id: 'cat_rage', name: '광폭화', mpCost: 0, type: 'passive', effect: 'atkUp', value: 1.2, desc: '공격력 20% 증가' }
    ],
    elf: [
        { id: 'elf_fire', name: '화염', mpCost: 3, damage: 30, type: 'active', desc: '마법 공격' },
        { id: 'elf_heal', name: '치유', mpCost: 2, heal: 20, type: 'active', desc: 'HP 20 회복' }
    ],
    dwarf: [
        { id: 'dwarf_guard', name: '방어', mpCost: 1, type: 'active', effect: 'guard', desc: '다음 반격 데미지 50% 감소' },
        { id: 'dwarf_wall', name: '철벽', mpCost: 0, type: 'passive', effect: 'defUp', value: 0.8, desc: '받는 피해 20% 감소' }
    ],
    human: [
        { id: 'human_snipe', name: '저격', mpCost: 2, damage: 20, type: 'active', effect: 'noCounter', desc: '반격 없이 공격' },
        { id: 'human_focus', name: '집중', mpCost: 0, type: 'passive', effect: 'critUp', value: 0.15, desc: '크리티컬 확률 15% 증가' }
    ]
};

// 적 데이터 생성
function generateEnemy(floor) {
    const isBoss = floor % 10 === 0;
    const isMiniBoss = floor % 5 === 0 && !isBoss;

    const baseHp = 30 + floor * 10;
    const baseAtk = 5 + floor * 2;

    let enemy = {
        name: getEnemyName(floor, isBoss, isMiniBoss),
        hp: isBoss ? baseHp * 3 : isMiniBoss ? baseHp * 2 : baseHp,
        maxHp: isBoss ? baseHp * 3 : isMiniBoss ? baseHp * 2 : baseHp,
        atk: isBoss ? baseAtk * 2 : isMiniBoss ? baseAtk * 1.5 : baseAtk,
        goldReward: Math.floor((10 + floor * 5) * (isBoss ? 3 : isMiniBoss ? 2 : 1)),
        expReward: Math.floor((20 + floor * 10) * (isBoss ? 3 : isMiniBoss ? 2 : 1)),
        isBoss,
        isMiniBoss
    };

    return enemy;
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

// 플레이어 공격력 계산
function getPlayerAtk() {
    let atk = gameState.player.baseAtk + (gameState.player.stats.str * 2) + (gameState.weaponLevel * 5);

    // 패시브 효과 적용
    gameState.equippedSkills.forEach(skill => {
        if (skill && skill.type === 'passive' && skill.effect === 'atkUp') {
            atk *= skill.value;
        }
    });

    return Math.floor(atk);
}

// 받는 피해 계산
function calculateDamageTaken(damage) {
    let finalDamage = damage;

    // 패시브 효과 적용
    gameState.equippedSkills.forEach(skill => {
        if (skill && skill.type === 'passive' && skill.effect === 'defUp') {
            finalDamage *= skill.value;
        }
    });

    return Math.floor(finalDamage);
}

// 크리티컬 확률 계산
function getCritChance() {
    let chance = 0.05 + (gameState.player.stats.luk * 0.01);

    gameState.equippedSkills.forEach(skill => {
        if (skill && skill.type === 'passive' && skill.effect === 'critUp') {
            chance += skill.value;
        }
    });

    return Math.min(chance, 0.5);
}

// 경험치 테이블
function getExpForLevel(level) {
    return 100 * level;
}

// 레벨업 체크
function checkLevelUp() {
    while (gameState.player.exp >= getExpForLevel(gameState.player.level)) {
        gameState.player.exp -= getExpForLevel(gameState.player.level);
        gameState.player.level++;
        gameState.player.statPoints += 3;
        gameState.player.maxHp += 10;
        gameState.player.maxMp += 1;
        addBattleLog(`레벨 업! Lv.${gameState.player.level}`);
    }
}

// UI 업데이트 함수들
function updateVillageUI() {
    document.getElementById('player-level').textContent = gameState.player.level;
    document.getElementById('player-gold').textContent = gameState.player.gold;
    document.getElementById('player-exp').textContent = gameState.player.exp;
    document.getElementById('player-max-exp').textContent = getExpForLevel(gameState.player.level);
}

function updateStatsUI() {
    document.getElementById('stat-points').textContent = gameState.player.statPoints;
    document.getElementById('stat-str').textContent = gameState.player.stats.str;
    document.getElementById('stat-dex').textContent = gameState.player.stats.dex;
    document.getElementById('stat-int').textContent = gameState.player.stats.int;
    document.getElementById('stat-luk').textContent = gameState.player.stats.luk;
}

function updateDungeonUI() {
    document.getElementById('current-floor').textContent = gameState.dungeon.currentFloor;
    document.getElementById('pending-gold').textContent = gameState.dungeon.pendingGold;
    document.getElementById('pending-exp').textContent = gameState.dungeon.pendingExp;
}

function updateBattleUI() {
    const enemy = gameState.currentEnemy;
    document.getElementById('enemy-name').textContent = enemy.name;
    document.getElementById('enemy-hp').textContent = Math.max(0, enemy.hp);
    document.getElementById('enemy-atk').textContent = enemy.atk;

    document.getElementById('battle-hp').textContent = gameState.player.hp;
    document.getElementById('battle-max-hp').textContent = gameState.player.maxHp;
    document.getElementById('battle-mp').textContent = gameState.player.mp;
    document.getElementById('battle-max-mp').textContent = gameState.player.maxMp;

    // 보스/미니보스 스타일
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

// 화면 전환
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(screenId).classList.remove('hidden');
}

// 전투 시작
function startBattle() {
    gameState.currentEnemy = generateEnemy(gameState.dungeon.currentFloor);
    gameState.dungeon.inBattle = true;
    clearBattleLog();
    addBattleLog(`${gameState.currentEnemy.name} 등장!`);
    updateBattleUI();

    document.getElementById('battle-actions').classList.remove('hidden');
    document.getElementById('floor-clear-actions').classList.add('hidden');
}

// 공격 처리
function playerAttack() {
    if (!gameState.dungeon.inBattle) return;

    const playerAtk = getPlayerAtk();
    const isCrit = Math.random() < getCritChance();
    const damage = isCrit ? Math.floor(playerAtk * 1.5) : playerAtk;

    gameState.currentEnemy.hp -= damage;
    addBattleLog(`${isCrit ? '크리티컬! ' : ''}${damage} 데미지!`);

    if (gameState.currentEnemy.hp <= 0) {
        enemyDefeated();
    } else {
        enemyCounterAttack();
    }

    updateBattleUI();
}

// 적 반격
function enemyCounterAttack() {
    const damage = calculateDamageTaken(gameState.currentEnemy.atk);
    gameState.player.hp -= damage;
    addBattleLog(`반격! ${damage} 피해를 받았다.`);

    if (gameState.player.hp <= 0) {
        playerDefeated();
    }
}

// 스킬 사용
function useSkill(slotIndex) {
    const skill = gameState.equippedSkills[slotIndex];
    if (!skill || skill.type === 'passive') return;
    if (gameState.player.mp < skill.mpCost) {
        addBattleLog('MP가 부족합니다!');
        return;
    }

    gameState.player.mp -= skill.mpCost;
    addBattleLog(`${skill.name} 사용!`);

    if (skill.damage) {
        const isCrit = Math.random() < getCritChance();
        const damage = isCrit ? Math.floor(skill.damage * 1.5) : skill.damage;
        gameState.currentEnemy.hp -= damage;
        addBattleLog(`${isCrit ? '크리티컬! ' : ''}${damage} 데미지!`);

        if (gameState.currentEnemy.hp <= 0) {
            enemyDefeated();
        } else if (skill.effect !== 'noCounter') {
            enemyCounterAttack();
        }
    }

    if (skill.heal) {
        gameState.player.hp = Math.min(gameState.player.maxHp, gameState.player.hp + skill.heal);
        addBattleLog(`HP ${skill.heal} 회복!`);
    }

    if (skill.effect === 'guard') {
        // 방어 효과는 별도 처리 필요
        addBattleLog('방어 태세!');
    }

    updateBattleUI();
}

// 적 처치
function enemyDefeated() {
    const enemy = gameState.currentEnemy;
    gameState.dungeon.inBattle = false;
    gameState.dungeon.pendingGold += enemy.goldReward;
    gameState.dungeon.pendingExp += enemy.expReward;

    addBattleLog(`${enemy.name} 처치!`);
    addBattleLog(`+${enemy.goldReward} 골드, +${enemy.expReward} 경험치`);

    // 체크포인트 해금
    if (enemy.isBoss && gameState.dungeon.currentFloor > gameState.dungeon.maxUnlockedFloor) {
        gameState.dungeon.maxUnlockedFloor = gameState.dungeon.currentFloor;
        addBattleLog(`${gameState.dungeon.currentFloor}층 해금!`);
    }

    updateDungeonUI();

    document.getElementById('battle-actions').classList.add('hidden');
    document.getElementById('floor-clear-actions').classList.remove('hidden');
}

// 플레이어 패배
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

// 마을 복귀
function returnToVillage(fromDeath = false) {
    if (!fromDeath) {
        gameState.player.gold += gameState.dungeon.pendingGold;
        gameState.player.exp += gameState.dungeon.pendingExp;
        checkLevelUp();
    }

    // 상태 초기화
    gameState.dungeon.pendingGold = 0;
    gameState.dungeon.pendingExp = 0;
    gameState.dungeon.currentFloor = gameState.dungeon.maxUnlockedFloor;
    gameState.player.hp = gameState.player.maxHp;
    gameState.player.mp = gameState.player.maxMp;

    updateVillageUI();
    showScreen('village-screen');
}

// 다음 층 진행
function nextFloor() {
    gameState.dungeon.currentFloor++;
    updateDungeonUI();
    startBattle();
}

// 스킬 UI 초기화
function initSkillsUI() {
    Object.keys(skillsData).forEach(character => {
        const select = document.querySelector(`.skill-select[data-character="${character}"]`);
        select.innerHTML = '<option value="">선택 안함</option>';
        skillsData[character].forEach(skill => {
            const option = document.createElement('option');
            option.value = skill.id;
            option.textContent = `${skill.name} ${skill.type === 'passive' ? '(패시브)' : `(MP: ${skill.mpCost})`}`;
            select.appendChild(option);
        });
    });
}

// 스킬 버튼 업데이트
function updateSkillButtons() {
    for (let i = 0; i < 4; i++) {
        const btn = document.getElementById(`btn-skill-${i + 1}`);
        const skill = gameState.equippedSkills[i];
        if (skill && skill.type === 'active') {
            btn.textContent = `${skill.name} (${skill.mpCost})`;
            btn.disabled = false;
        } else if (skill && skill.type === 'passive') {
            btn.textContent = `${skill.name} (패시브)`;
            btn.disabled = true;
        } else {
            btn.textContent = '-';
            btn.disabled = true;
        }
    }
}

// 이벤트 리스너 설정
function initEventListeners() {
    // 마을 메뉴
    document.getElementById('btn-dungeon').addEventListener('click', () => {
        gameState.dungeon.currentFloor = gameState.dungeon.maxUnlockedFloor || 1;
        updateDungeonUI();
        showScreen('dungeon-screen');
        startBattle();
    });

    document.getElementById('btn-shop').addEventListener('click', () => {
        showScreen('shop-screen');
    });

    document.getElementById('btn-stats').addEventListener('click', () => {
        updateStatsUI();
        showScreen('stats-screen');
    });

    document.getElementById('btn-skills').addEventListener('click', () => {
        showScreen('skills-screen');
    });

    // 돌아가기 버튼들
    document.getElementById('btn-shop-back').addEventListener('click', () => {
        showScreen('village-screen');
    });

    document.getElementById('btn-stats-back').addEventListener('click', () => {
        showScreen('village-screen');
    });

    document.getElementById('btn-skills-back').addEventListener('click', () => {
        // 스킬 저장
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
        showScreen('village-screen');
    });

    // 스탯 올리기
    document.querySelectorAll('.btn-stat-up').forEach(btn => {
        btn.addEventListener('click', () => {
            if (gameState.player.statPoints > 0) {
                const stat = btn.dataset.stat;
                gameState.player.stats[stat]++;
                gameState.player.statPoints--;
                updateStatsUI();
            }
        });
    });

    // 전투 버튼
    document.getElementById('btn-attack').addEventListener('click', playerAttack);

    for (let i = 1; i <= 4; i++) {
        document.getElementById(`btn-skill-${i}`).addEventListener('click', () => {
            useSkill(i - 1);
        });
    }

    document.getElementById('btn-next-floor').addEventListener('click', nextFloor);
    document.getElementById('btn-return').addEventListener('click', () => returnToVillage(false));
    document.getElementById('btn-gameover-return').addEventListener('click', () => returnToVillage(true));
}

// 게임 초기화
function initGame() {
    initSkillsUI();
    initEventListeners();
    updateVillageUI();
    updateSkillButtons();
    showScreen('village-screen');
}

// 게임 시작
document.addEventListener('DOMContentLoaded', initGame);
