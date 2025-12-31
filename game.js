// 게임 상태
const gameState = {
    player: {
        level: 1,
        exp: 0,
        gold: 0,
        statPoints: 5,
        hp: 100,
        maxHp: 100,
        mp: 5,
        maxMp: 5,
        baseAtk: 5,
        stats: {
            str: 0,
            dex: 0,
            int: 0,
            vit: 0,
            luk: 0
        }
    },
    dungeon: {
        currentFloor: 1,
        highestFloor: 0,
        infiniteHighestFloor: 0,  // 무한의 전장 최고 기록
        pendingGold: 0,
        pendingExp: 0,
        pendingStones: 0,
        pendingOriginStones: 0,
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
    originStones: 0,
    statPointsPurchased: 0,  // 구매한 스탯 포인트 수 (비용 증가용)
    originEnhancement: 0,  // 근원 강화 레벨 (유물 효과 +5% per level, max 20 = 100%)
    // 부적 구매 횟수 (비용 증가용)
    talismanPurchases: {
        exp: 0,           // 경험치 부적 구매 횟수
        gold: 0,          // 골드 부적 구매 횟수
        stone: 0,         // 강화석 구매 횟수
        origin: 0         // 근원석 구매 횟수
    },
    // 퍼센트 강화 (골드 사용, 각 최대 100% = 2배)
    percentBonus: {
        atk: 0,      // 공격력 +%
        hp: 0,       // 체력 +%
        crit: 0,     // 치명타 확률 +%
        critDmg: 0,  // 치명타 데미지 +%
        dodge: 0,    // 회피율 +%
        def: 0       // 피해 감소 +%
    },
    gameMode: 'normal', // easy, normal, hard, infinite
    relicChoices: [], // 보스 클리어 후 선택 가능한 유물들 (3개)
    skillChoices: [], // 보스 클리어 후 선택 가능한 스킬들
    pendingNewRelic: null, // 교체 대기 중인 유물
    skipMode: false, // 스킵 모드 (중간보스/보스전만 진행)
    skipTargetFloor: 0, // 스킵 목표 층
    tagCombineMode: false, // 태그 합성 모드
    selectedForCombine: [], // 합성을 위해 선택된 유물 인덱스들
    ignoreEnemyDodge: false, // 다음 공격 시 적 회피 무시 (그림자 도약)
    beastInstinctBonus: 0, // 야수의 본능 치명타 보너스
    skillCounterReduction: 0 // 스킬로 인한 반격 피해 감소 (방패 강타)
};

// 유물 데이터
// 등급: common(일반), rare(희귀), epic(영웅), legendary(전설)
const relicsData = [
    // ========== 일반 등급 (5% 수준, 디버프 25%) ==========
    // 공격 (8개): 공격력, 치명타, 치명타피해, 첫공격, 보스피해, 추가공격, 흡혈, 처형
    { id: 'relic_atk_c', name: '녹슨 검', desc: '공격력 +5%', effect: 'atkMult', value: 0.05, icon: '⚔️', rarity: 'common', tag: '공격' },
    { id: 'relic_crit_c', name: '날카로운 눈', desc: '치명타 확률 +5%', effect: 'crit', value: 5, icon: '⚔️', rarity: 'common', tag: '공격' },
    { id: 'relic_critdmg_c', name: '이빨 목걸이', desc: '치명타 피해 +10%', effect: 'critDmg', value: 10, icon: '⚔️', rarity: 'common', tag: '공격' },
    { id: 'relic_firstHit_c', name: '기습의 단검', desc: '첫 공격 피해 +10%', effect: 'firstHit', value: 0.10, icon: '⚔️', rarity: 'common', tag: '공격' },
    { id: 'relic_bossKiller_c', name: '사냥꾼의 눈', desc: '보스에게 피해 +10%', effect: 'bossKiller', value: 0.10, icon: '⚔️', rarity: 'common', tag: '공격' },
    { id: 'relic_multiHit_c', name: '연속의 팔찌', desc: '7% 확률로 추가 공격', effect: 'multiHit', value: 0.07, icon: '⚔️', rarity: 'common', tag: '공격' },
    { id: 'relic_lifesteal_c', name: '흡혈 이빨', desc: '25% 확률로 피해의 5% 흡혈', effect: 'lifeSteal', value: 0.25, icon: '⚔️', rarity: 'common', tag: '공격' },
    { id: 'relic_execute_c', name: '사형집행인', desc: '적 HP 30% 이하 시 피해 +10%', effect: 'execute', value: 0.10, icon: '⚔️', rarity: 'common', tag: '공격' },
    // 방어 (8개): 체력, 피해감소, 회피, 반사, 힘, 민첩, 활력, 처치회복
    { id: 'relic_hp_c', name: '생명의 구슬', desc: '최대 체력 +5%', effect: 'hpMult', value: 0.05, icon: '🛡️', rarity: 'common', tag: '방어' },
    { id: 'relic_def_c', name: '가죽 조끼', desc: '받는 피해 -2.5%', effect: 'def', value: 0.975, icon: '🛡️', rarity: 'common', tag: '방어' },
    { id: 'relic_dodge_c', name: '깃털 장식', desc: '회피율 +5%', effect: 'dodge', value: 5, icon: '🛡️', rarity: 'common', tag: '방어' },
    { id: 'relic_reflect_c', name: '가시 갑옷', desc: '받은 피해의 5% 반사', effect: 'reflect', value: 0.05, icon: '🛡️', rarity: 'common', tag: '방어' },
    { id: 'relic_str_c', name: '힘의 반지', desc: '힘 +5%', effect: 'strMult', value: 0.05, icon: '🛡️', rarity: 'common', tag: '방어' },
    { id: 'relic_dex_c', name: '민첩의 반지', desc: '민첩 +5%', effect: 'dexMult', value: 0.05, icon: '🛡️', rarity: 'common', tag: '방어' },
    { id: 'relic_vit_c', name: '활력의 반지', desc: '활력 +5%', effect: 'vitMult', value: 0.05, icon: '🛡️', rarity: 'common', tag: '방어' },
    { id: 'relic_killHeal_c', name: '수확의 부적', desc: '처치 시 HP 2% 회복', effect: 'killHeal', value: 0.02, icon: '🛡️', rarity: 'common', tag: '방어' },
    // 특수 (8개): 보상, 지능, 행운, 처치MP, 출혈, 쇠약, 스턴, 빙결
    { id: 'relic_reward_c', name: '보물 주머니', desc: '골드/경험치 +5%', effect: 'reward', value: 1.05, icon: '✨', rarity: 'common', tag: '특수' },
    { id: 'relic_int_c', name: '지능의 반지', desc: '지능 +5%', effect: 'intMult', value: 0.05, icon: '✨', rarity: 'common', tag: '특수' },
    { id: 'relic_luk_c', name: '행운의 반지', desc: '행운 +5%', effect: 'lukMult', value: 0.05, icon: '✨', rarity: 'common', tag: '특수' },
    { id: 'relic_killmana_c', name: '마나 이빨', desc: '처치 시 MP 5% 회복', effect: 'killMana', value: 0.05, icon: '✨', rarity: 'common', tag: '특수' },
    { id: 'relic_bleed_c', name: '톱니', desc: '공격 시 25% 출혈 부여', effect: 'bleed', value: 0.25, icon: '✨', rarity: 'common', tag: '특수' },
    { id: 'relic_weaken_c', name: '쇠약의 부적', desc: '공격 시 25% 쇠약 부여', effect: 'weaken', value: 0.25, icon: '✨', rarity: 'common', tag: '특수' },
    { id: 'relic_stun_c', name: '망치 조각', desc: '공격 시 25% 스턴 부여', effect: 'stun', value: 0.25, icon: '✨', rarity: 'common', tag: '특수' },
    { id: 'relic_freeze_c', name: '얼음 조각', desc: '공격 시 25% 빙결 부여', effect: 'freeze', value: 0.25, icon: '✨', rarity: 'common', tag: '특수' },

    // ========== 희귀 등급 (10% 수준, 디버프 50%) ==========
    // 공격 (8개)
    { id: 'relic_atk_r', name: '강철 검', desc: '공격력 +10%', effect: 'atkMult', value: 0.10, icon: '⚔️', rarity: 'rare', tag: '공격' },
    { id: 'relic_crit_r', name: '행운의 부적', desc: '치명타 확률 +10%', effect: 'crit', value: 10, icon: '⚔️', rarity: 'rare', tag: '공격' },
    { id: 'relic_critdmg_r', name: '파괴의 송곳니', desc: '치명타 피해 +20%', effect: 'critDmg', value: 20, icon: '⚔️', rarity: 'rare', tag: '공격' },
    { id: 'relic_firstHit_r', name: '암습의 단검', desc: '첫 공격 피해 +20%', effect: 'firstHit', value: 0.20, icon: '⚔️', rarity: 'rare', tag: '공격' },
    { id: 'relic_bossKiller_r', name: '사냥꾼의 표식', desc: '보스에게 피해 +20%', effect: 'bossKiller', value: 0.20, icon: '⚔️', rarity: 'rare', tag: '공격' },
    { id: 'relic_multiHit_r', name: '연쇄의 고리', desc: '16% 확률로 추가 공격', effect: 'multiHit', value: 0.16, icon: '⚔️', rarity: 'rare', tag: '공격' },
    { id: 'relic_lifesteal_r', name: '흡혈의 송곳니', desc: '50% 확률로 피해의 5% 흡혈', effect: 'lifeSteal', value: 0.50, icon: '⚔️', rarity: 'rare', tag: '공격' },
    { id: 'relic_execute_r', name: '처형인의 검', desc: '적 HP 30% 이하 시 피해 +20%', effect: 'execute', value: 0.20, icon: '⚔️', rarity: 'rare', tag: '공격' },
    // 방어 (8개)
    { id: 'relic_hp_r', name: '생명의 목걸이', desc: '최대 체력 +10%', effect: 'hpMult', value: 0.10, icon: '🛡️', rarity: 'rare', tag: '방어' },
    { id: 'relic_def_r', name: '수호의 방패', desc: '받는 피해 -6%', effect: 'def', value: 0.94, icon: '🛡️', rarity: 'rare', tag: '방어' },
    { id: 'relic_dodge_r', name: '그림자 망토', desc: '회피율 +10%', effect: 'dodge', value: 10, icon: '🛡️', rarity: 'rare', tag: '방어' },
    { id: 'relic_reflect_r', name: '가시 방패', desc: '받은 피해의 10% 반사', effect: 'reflect', value: 0.10, icon: '🛡️', rarity: 'rare', tag: '방어' },
    { id: 'relic_str_r', name: '힘의 팔찌', desc: '힘 +10%', effect: 'strMult', value: 0.10, icon: '🛡️', rarity: 'rare', tag: '방어' },
    { id: 'relic_dex_r', name: '민첩의 귀걸이', desc: '민첩 +10%', effect: 'dexMult', value: 0.10, icon: '🛡️', rarity: 'rare', tag: '방어' },
    { id: 'relic_vit_r', name: '활력의 벨트', desc: '활력 +10%', effect: 'vitMult', value: 0.10, icon: '🛡️', rarity: 'rare', tag: '방어' },
    { id: 'relic_killHeal_r', name: '영혼 수확자', desc: '처치 시 HP 5% 회복', effect: 'killHeal', value: 0.05, icon: '🛡️', rarity: 'rare', tag: '방어' },
    // 특수 (8개)
    { id: 'relic_reward_r', name: '보물 상자', desc: '골드/경험치 +10%', effect: 'reward', value: 1.10, icon: '✨', rarity: 'rare', tag: '특수' },
    { id: 'relic_int_r', name: '지혜의 안경', desc: '지능 +10%', effect: 'intMult', value: 0.10, icon: '✨', rarity: 'rare', tag: '특수' },
    { id: 'relic_luk_r', name: '행운의 클로버', desc: '행운 +10%', effect: 'lukMult', value: 0.10, icon: '✨', rarity: 'rare', tag: '특수' },
    { id: 'relic_killmana_r', name: '마나 회복의 송곳니', desc: '처치 시 MP 10% 회복', effect: 'killMana', value: 0.10, icon: '✨', rarity: 'rare', tag: '특수' },
    { id: 'relic_bleed_r', name: '야수의 발톱', desc: '공격 시 50% 출혈 부여', effect: 'bleed', value: 0.50, icon: '✨', rarity: 'rare', tag: '특수' },
    { id: 'relic_weaken_r', name: '쇠약의 주문서', desc: '공격 시 50% 쇠약 부여', effect: 'weaken', value: 0.50, icon: '✨', rarity: 'rare', tag: '특수' },
    { id: 'relic_stun_r', name: '강철 망치', desc: '공격 시 50% 스턴 부여', effect: 'stun', value: 0.50, icon: '✨', rarity: 'rare', tag: '특수' },
    { id: 'relic_freeze_r', name: '서리 수정', desc: '공격 시 50% 빙결 부여', effect: 'freeze', value: 0.50, icon: '✨', rarity: 'rare', tag: '특수' },

    // ========== 영웅 등급 (25% 수준, 디버프 100%) ==========
    // 공격 (8개)
    { id: 'relic_atk_e', name: '전쟁의 검', desc: '공격력 +25%', effect: 'atkMult', value: 0.25, icon: '⚔️', rarity: 'epic', tag: '공격' },
    { id: 'relic_crit_e', name: '암살자의 장갑', desc: '치명타 확률 +25%', effect: 'crit', value: 25, icon: '⚔️', rarity: 'epic', tag: '공격' },
    { id: 'relic_critdmg_e', name: '파멸의 해골', desc: '치명타 피해 +50%', effect: 'critDmg', value: 50, icon: '⚔️', rarity: 'epic', tag: '공격' },
    { id: 'relic_firstHit_e', name: '기습의 장검', desc: '첫 공격 피해 +50%', effect: 'firstHit', value: 0.50, icon: '⚔️', rarity: 'epic', tag: '공격' },
    { id: 'relic_bossKiller_e', name: '드래곤 슬레이어', desc: '보스에게 피해 +50%', effect: 'bossKiller', value: 0.50, icon: '⚔️', rarity: 'epic', tag: '공격' },
    { id: 'relic_multiHit_e', name: '연쇄의 사슬', desc: '35% 확률로 추가 공격', effect: 'multiHit', value: 0.35, icon: '⚔️', rarity: 'epic', tag: '공격' },
    { id: 'relic_lifesteal_e', name: '흡혈왕의 송곳니', desc: '피해의 5% 흡혈', effect: 'lifeSteal', value: 1.0, icon: '⚔️', rarity: 'epic', tag: '공격' },
    { id: 'relic_execute_e', name: '광전사의 도끼', desc: '적 HP 30% 이하 시 피해 +50%', effect: 'execute', value: 0.50, icon: '⚔️', rarity: 'epic', tag: '공격' },
    // 방어 (8개)
    { id: 'relic_hp_e', name: '거인의 심장', desc: '최대 체력 +25%', effect: 'hpMult', value: 0.25, icon: '🛡️', rarity: 'epic', tag: '방어' },
    { id: 'relic_def_e', name: '강철 갑옷', desc: '받는 피해 -15%', effect: 'def', value: 0.85, icon: '🛡️', rarity: 'epic', tag: '방어' },
    { id: 'relic_dodge_e', name: '바람의 망토', desc: '회피율 +25%', effect: 'dodge', value: 25, icon: '🛡️', rarity: 'epic', tag: '방어' },
    { id: 'relic_reflect_e', name: '반사의 거울', desc: '받은 피해의 25% 반사', effect: 'reflect', value: 0.25, icon: '🛡️', rarity: 'epic', tag: '방어' },
    { id: 'relic_str_e', name: '전사의 문장', desc: '힘 +25%', effect: 'strMult', value: 0.25, icon: '🛡️', rarity: 'epic', tag: '방어' },
    { id: 'relic_dex_e', name: '암살자의 문장', desc: '민첩 +25%', effect: 'dexMult', value: 0.25, icon: '🛡️', rarity: 'epic', tag: '방어' },
    { id: 'relic_vit_e', name: '수호자의 문장', desc: '활력 +25%', effect: 'vitMult', value: 0.25, icon: '🛡️', rarity: 'epic', tag: '방어' },
    { id: 'relic_killHeal_e', name: '영혼 착취자', desc: '처치 시 HP 10% 회복', effect: 'killHeal', value: 0.10, icon: '🛡️', rarity: 'epic', tag: '방어' },
    // 특수 (8개)
    { id: 'relic_reward_e', name: '용의 보물', desc: '골드/경험치 +25%', effect: 'reward', value: 1.25, icon: '✨', rarity: 'epic', tag: '특수' },
    { id: 'relic_int_e', name: '현자의 문장', desc: '지능 +25%', effect: 'intMult', value: 0.25, icon: '✨', rarity: 'epic', tag: '특수' },
    { id: 'relic_luk_e', name: '도박사의 문장', desc: '행운 +25%', effect: 'lukMult', value: 0.25, icon: '✨', rarity: 'epic', tag: '특수' },
    { id: 'relic_killmana_e', name: '마나 착취자', desc: '처치 시 MP 25% 회복', effect: 'killMana', value: 0.25, icon: '✨', rarity: 'epic', tag: '특수' },
    { id: 'relic_bleed_e', name: '피의 칼날', desc: '공격 시 출혈 부여', effect: 'bleed', value: 1.0, icon: '✨', rarity: 'epic', tag: '특수' },
    { id: 'relic_weaken_e', name: '쇠약의 인장', desc: '공격 시 쇠약 부여', effect: 'weaken', value: 1.0, icon: '✨', rarity: 'epic', tag: '특수' },
    { id: 'relic_stun_e', name: '번개 망치', desc: '공격 시 스턴 부여', effect: 'stun', value: 1.0, icon: '✨', rarity: 'epic', tag: '특수' },
    { id: 'relic_freeze_e', name: '빙결 수정', desc: '공격 시 빙결 부여', effect: 'freeze', value: 1.0, icon: '✨', rarity: 'epic', tag: '특수' },

    // ========== 전설 등급 (80% 수준, 디버프 복합) ==========
    // 공격 (8개)
    { id: 'relic_atk_l', name: '파괴의 검', desc: '공격력 +80%', effect: 'atkMult', value: 0.80, icon: '⚔️', rarity: 'legendary', tag: '공격' },
    { id: 'relic_crit_l', name: '예언자의 눈', desc: '치명타 확률 +50%', effect: 'crit', value: 50, icon: '⚔️', rarity: 'legendary', tag: '공격' },
    { id: 'relic_critdmg_l', name: '심판의 보석', desc: '치명타 피해 +160%', effect: 'critDmg', value: 160, icon: '⚔️', rarity: 'legendary', tag: '공격' },
    { id: 'relic_firstHit_l', name: '광기의 가면', desc: '첫 공격 피해 +160%', effect: 'firstHit', value: 1.60, icon: '⚔️', rarity: 'legendary', tag: '공격' },
    { id: 'relic_bossKiller_l', name: '신 사냥꾼', desc: '보스에게 피해 +160%', effect: 'bossKiller', value: 1.60, icon: '⚔️', rarity: 'legendary', tag: '공격' },
    { id: 'relic_multiHit_l', name: '폭풍의 눈', desc: '70% 확률로 추가 공격', effect: 'multiHit', value: 0.70, icon: '⚔️', rarity: 'legendary', tag: '공격' },
    { id: 'relic_lifesteal_l', name: '흡혈 군주', desc: '피해의 10% 흡혈', effect: 'lifeSteal', value: 2.0, icon: '⚔️', rarity: 'legendary', tag: '공격' },
    { id: 'relic_execute_l', name: '처형자의 도끼', desc: '적 HP 30% 이하 시 피해 +160%', effect: 'execute', value: 1.60, icon: '⚔️', rarity: 'legendary', tag: '공격' },
    // 방어 (8개)
    { id: 'relic_hp_l', name: '타이탄의 심장', desc: '최대 체력 +80%', effect: 'hpMult', value: 0.80, icon: '🛡️', rarity: 'legendary', tag: '방어' },
    { id: 'relic_def_l', name: '드래곤의 심장', desc: '받는 피해 -30%', effect: 'def', value: 0.70, icon: '🛡️', rarity: 'legendary', tag: '방어' },
    { id: 'relic_dodge_l', name: '환영의 망토', desc: '회피율 +50%', effect: 'dodge', value: 50, icon: '🛡️', rarity: 'legendary', tag: '방어' },
    { id: 'relic_reflect_l', name: '가시왕관', desc: '받은 피해의 50% 반사', effect: 'reflect', value: 0.50, icon: '🛡️', rarity: 'legendary', tag: '방어' },
    { id: 'relic_str_l', name: '거인의 힘', desc: '힘 +50%', effect: 'strMult', value: 0.50, icon: '🛡️', rarity: 'legendary', tag: '방어' },
    { id: 'relic_dex_l', name: '바람의 축복', desc: '민첩 +50%', effect: 'dexMult', value: 0.50, icon: '🛡️', rarity: 'legendary', tag: '방어' },
    { id: 'relic_vit_l', name: '대지의 축복', desc: '활력 +50%', effect: 'vitMult', value: 0.50, icon: '🛡️', rarity: 'legendary', tag: '방어' },
    { id: 'relic_killHeal_l', name: '불사조의 깃털', desc: '처치 시 HP 25% 회복', effect: 'killHeal', value: 0.25, icon: '🛡️', rarity: 'legendary', tag: '방어' },
    // 특수 (8개)
    { id: 'relic_reward_l', name: '신의 축복', desc: '골드/경험치 +80%', effect: 'reward', value: 1.80, icon: '✨', rarity: 'legendary', tag: '특수' },
    { id: 'relic_int_l', name: '지혜의 축복', desc: '지능 +50%', effect: 'intMult', value: 0.50, icon: '✨', rarity: 'legendary', tag: '특수' },
    { id: 'relic_luk_l', name: '행운의 축복', desc: '행운 +50%', effect: 'lukMult', value: 0.50, icon: '✨', rarity: 'legendary', tag: '특수' },
    { id: 'relic_killmana_l', name: '마나 지배자', desc: '처치 시 MP 50% 회복', effect: 'killMana', value: 0.50, icon: '✨', rarity: 'legendary', tag: '특수' },
    { id: 'relic_bleed_l', name: '피의 군주', desc: '공격 시 출혈 부여 (2중첩)', effect: 'bleed', value: 2.0, icon: '✨', rarity: 'legendary', tag: '특수' },
    { id: 'relic_weaken_l', name: '쇠약의 군주', desc: '공격 시 쇠약 부여 (2중첩)', effect: 'weaken', value: 2.0, icon: '✨', rarity: 'legendary', tag: '특수' },
    { id: 'relic_stun_l', name: '천둥 망치', desc: '공격 시 스턴 부여', effect: 'stun', value: 1.0, icon: '✨', rarity: 'legendary', tag: '특수' },
    { id: 'relic_freeze_l', name: '영원의 빙결', desc: '공격 시 빙결 부여 (2중첩)', effect: 'freeze', value: 2.0, icon: '✨', rarity: 'legendary', tag: '특수' }
];

// 등급별 출현 확률 (조정됨)
const rarityWeights = {
    common: 40,
    rare: 35,
    epic: 18,
    legendary: 7
};

// 3가지 태그 종류
const RELIC_TAGS = ['공격', '방어', '특수'];

// 효과별 태그 매핑 (공격/방어/특수)
const effectToTags = {
    // 공격
    'atk': ['공격'], 'atkMult': ['공격'], 'bossKiller': ['공격'],
    'crit': ['공격'], 'critDmg': ['공격'],
    'execute': ['공격'], 'firstHit': ['공격'], 'multiHit': ['공격'],
    'lifeSteal': ['공격'],
    // 방어
    'def': ['방어'], 'hpMult': ['방어'], 'vitMult': ['방어'],
    'dodge': ['방어'], 'reflect': ['방어'], 'killHeal': ['방어'],
    'strMult': ['방어'], 'dexMult': ['방어'],
    // 특수
    'intMult': ['특수'], 'lukMult': ['특수'],
    'reward': ['특수'], 'killMana': ['특수'],
    'bleed': ['특수'], 'weaken': ['특수'], 'stun': ['특수'], 'freeze': ['특수']
};

// 유물의 태그 가져오기 (배열로 반환, 최대 2개)
function getRelicTags(relic) {
    const tags = new Set();

    // 단일 효과
    if (relic.effect && effectToTags[relic.effect]) {
        effectToTags[relic.effect].forEach(t => tags.add(t));
    }

    // 복합 효과 - 모든 효과의 태그 합침
    if (relic.effects) {
        relic.effects.forEach(e => {
            if (effectToTags[e.effect]) {
                effectToTags[e.effect].forEach(t => tags.add(t));
            }
        });
    }

    // 최대 2개로 제한 (3개 전부인 경우 제외)
    const result = Array.from(tags);
    return result.length > 2 ? result.slice(0, 2) : result;
}

// 유물이 특정 태그를 가지는지 확인
function relicHasTag(relic, tag) {
    return getRelicTags(relic).includes(tag);
}

// 같은 태그, 같은 등급 유물 그룹 찾기
function findCombinableGroups() {
    const relics = gameState.tempRelics;
    const groups = {};

    // 태그+등급별로 그룹화 (유물이 여러 태그면 각 태그 그룹에 포함)
    relics.forEach((relic, index) => {
        if (relic.rarity === 'legendary') return; // 전설은 제외
        const tags = getRelicTags(relic);
        tags.forEach(tag => {
            const key = `${tag}_${relic.rarity}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push({ relic, index });
        });
    });

    // 3개 이상인 그룹만 반환
    const result = [];
    for (const [key, items] of Object.entries(groups)) {
        if (items.length >= 3) {
            const [tag, rarity] = key.split('_');
            result.push({ tag, rarity, items });
        }
    }
    return result;
}

// 태그 합성 실행 - 같은 태그+등급 2개 → 다음 등급 무작위 유물
function executeTagCombine(indices) {
    const relics = indices.map(i => gameState.tempRelics[i]);
    const rarity = relics[0].rarity;
    const nextRarity = getNextRarity(rarity);

    if (!nextRarity) return null;

    // 공통 태그 찾기
    const tags1 = getRelicTags(relics[0]);
    const tags2 = getRelicTags(relics[1]);
    const commonTags = tags1.filter(t => tags2.includes(t));

    // 해당 태그를 가진 다음 등급 유물 중 무작위 선택
    const randomRelic = getRandomRelicWithTag(commonTags[0], nextRarity);

    // 기존 2개 유물 제거 (인덱스 큰 것부터)
    const sortedIndices = [...indices].sort((a, b) => b - a);
    sortedIndices.forEach(idx => {
        gameState.tempRelics.splice(idx, 1);
    });

    // 새 유물 추가
    gameState.tempRelics.push(randomRelic);

    return randomRelic;
}

// 특정 등급 유물 중 무작위 선택 (근원 합성: 태그 무관하게 랜덤)
function getRandomRelicWithTag(tag, rarity) {
    // 해당 등급의 모든 유물 중 무작위 선택
    const allOfRarity = relicsData.filter(r => r.rarity === rarity);
    return { ...allOfRarity[Math.floor(Math.random() * allOfRarity.length)] };
}

// 태그 합성 UI 업데이트
function updateTagCombineUI() {
    const container = document.getElementById('tag-combine-grid');
    if (!container) return;

    container.innerHTML = '';

    gameState.tempRelics.forEach((relic, index) => {
        const card = document.createElement('div');
        card.className = `relic-tag-card rarity-${relic.rarity}`;

        if (gameState.selectedForCombine.includes(index)) {
            card.classList.add('selected-for-combine');
        }

        const tags = getRelicTags(relic);
        const tagsHtml = tags.map(t => `<span class="tag tag-${t}">태그 | ${t}</span>`).join('');

        card.innerHTML = `
            <div class="relic-icon">${relic.icon}</div>
            <div class="relic-name">${relic.name}</div>
            <div class="relic-rarity">[${rarityNames[relic.rarity]}]</div>
            <div class="relic-desc">${getRelicDescFull(relic)}</div>
            <div class="relic-tags">${tagsHtml}</div>
        `;

        card.addEventListener('click', () => toggleRelicForCombine(index));
        container.appendChild(card);
    });

    // 합성 버튼 상태 업데이트
    updateCombineButton();
}

// 합성 버튼 상태 업데이트
function updateCombineButton() {
    const combineBtn = document.getElementById('btn-tag-combine');
    if (!combineBtn) return;

    const selected = gameState.selectedForCombine;

    if (selected.length !== 2) {
        combineBtn.disabled = true;
        combineBtn.textContent = `합성 (${selected.length}/2)`;
        return;
    }

    // 같은 등급인지 확인
    const relics = selected.map(i => gameState.tempRelics[i]);
    const rarities = relics.map(r => r.rarity);
    const sameRarity = rarities.every(r => r === rarities[0]);
    const notLegendary = rarities[0] !== 'legendary';

    if (!sameRarity) {
        combineBtn.disabled = true;
        combineBtn.textContent = '등급이 다름';
        return;
    }

    if (!notLegendary) {
        combineBtn.disabled = true;
        combineBtn.textContent = '전설은 합성 불가';
        return;
    }

    // 공통 태그 찾기 (모든 유물이 공유하는 태그)
    const allTags = relics.map(r => getRelicTags(r));
    const commonTags = allTags[0].filter(tag =>
        allTags.every(tags => tags.includes(tag))
    );

    if (commonTags.length > 0) {
        combineBtn.disabled = false;
        combineBtn.textContent = `합성 [${commonTags[0]}] → ${rarityNames[getNextRarity(rarities[0])]}`;
    } else {
        combineBtn.disabled = true;
        combineBtn.textContent = '공통 태그 없음';
    }
}

// 유물 선택 토글
function toggleRelicForCombine(index) {
    const idx = gameState.selectedForCombine.indexOf(index);
    if (idx >= 0) {
        gameState.selectedForCombine.splice(idx, 1);
    } else if (gameState.selectedForCombine.length < 2) {
        gameState.selectedForCombine.push(index);
    }
    updateTagCombineUI();
}

// 태그 합성 실행
function onTagCombineClick() {
    if (gameState.selectedForCombine.length !== 2) return;

    const relics = gameState.selectedForCombine.map(i => gameState.tempRelics[i]);
    const allTags = relics.map(r => getRelicTags(r));
    const rarities = relics.map(r => r.rarity);

    // 공통 태그 찾기
    const commonTags = allTags[0].filter(tag =>
        allTags.every(tags => tags.includes(tag))
    );

    // 유효성 검사
    if (commonTags.length === 0) return;
    if (!rarities.every(r => r === rarities[0])) return;
    if (rarities[0] === 'legendary') return;

    const newRelic = executeTagCombine(gameState.selectedForCombine);

    // 결과 표시
    const resultInfo = document.getElementById('tag-combine-result');
    if (resultInfo && newRelic) {
        resultInfo.innerHTML = `
            <div class="combine-success">
                <span class="result-icon">${newRelic.icon}</span>
                <span class="result-name rarity-${newRelic.rarity}">${newRelic.name}</span>
                <span class="result-rarity">[${rarityNames[newRelic.rarity]}]</span>
                <p class="result-desc">${newRelic.desc}</p>
            </div>
        `;
        resultInfo.classList.remove('hidden');
    }

    gameState.selectedForCombine = [];
    updateTagCombineUI();
}

// 태그 합성 모드 열기
function openTagCombineMode() {
    // 마을 복귀가 불가능할 때 합성 불가 (전투 중 행동 후)
    if (gameState.dungeon.inBattle && hasActed) {
        alert('⚔️ 전투 중에는 합성할 수 없습니다!\n(첫 턴에만 가능)');
        return;
    }
    if (gameState.tempRelics.length < 3) {
        alert('📦 유물이 3개 이상 필요합니다.');
        return;
    }
    gameState.tagCombineMode = true;
    gameState.selectedForCombine = [];
    document.getElementById('tag-combine-section').classList.remove('hidden');
    document.getElementById('tag-combine-result').classList.add('hidden');
    updateTagCombineUI();
}

// 태그 합성 모드 닫기
function closeTagCombineMode() {
    gameState.tagCombineMode = false;
    gameState.selectedForCombine = [];
    document.getElementById('tag-combine-section').classList.add('hidden');
}

// 등급별 표시명
const rarityNames = {
    common: '일반',
    rare: '희귀',
    epic: '영웅',
    legendary: '전설'
};

// 스킬 데이터
// type: 'active'(액티브), 'buff'(버프), 'passive'(패시브)
// cooldown: 사용 후 쿨타임 (턴)
// buffEffect: 버프 효과 종류, buffValue: 버프 수치, buffTurns: 버프 지속 턴
const skillsData = {
    // 묘인: 민첩한 근접 딜러, 치명타 특화
    cat: [
        {
            id: 'cat_slash', name: '폭렬참', mpCost: 3, damageMult: 1.25, type: 'active', subtype: 'strong', cooldown: 2,
            desc: '공격력 125% 피해', char: '묘인'
        },
        {
            id: 'cat_scratch', name: '물어 뜯기', mpCost: 1, damageMult: 0.25, type: 'active', subtype: 'sub', cooldown: 0,
            effect: 'skillLifeSteal', healPercent: 5,
            desc: '25% 피해, 피해량 5% 회복', char: '묘인'
        },
        {
            id: 'cat_bleed', name: '친절한 조언', mpCost: 2, type: 'buff', cooldown: 4,
            buffEffect: 'lifeSteal', buffValue: 0.10, buffTurns: 3, buffIcon: '🩸',
            desc: '3턴간 피해의 10% HP 회복', char: '묘인'
        },
        {
            id: 'cat_brutal', name: '난폭한 힘', mpCost: 0, type: 'passive', subtype: 'always',
            effect: 'critDmgUp', value: 25,
            desc: '치명타 피해 +25%', char: '묘인'
        },
        {
            id: 'cat_instinct', name: '야수의 본능', mpCost: 0, type: 'passive', subtype: 'conditional',
            effect: 'beastInstinct', value: 10,
            desc: '회피 시 다음 공격 치명타 +10%', char: '묘인'
        }
    ],
    // 엘프: 마법사, MP 관리/지속 딜러
    elf: [
        {
            id: 'elf_starshot', name: '별빛 화살', mpCost: 3, damageMult: 0.2, hits: 5, type: 'active', subtype: 'strong', cooldown: 2,
            effect: 'magicDamage',
            desc: '20% 마법 피해 x5회', char: '엘프'
        },
        {
            id: 'elf_arrow', name: '마력 화살', mpCost: 0, damageMult: 0.4, type: 'active', subtype: 'sub', cooldown: 0,
            effect: 'magicDamage', mpRestore: 1, mpRestoreChance: 10,
            desc: '40% 마법 피해, MP 1 회복 (10%)', char: '엘프'
        },
        {
            id: 'elf_focus', name: '용감한 영혼', mpCost: 0, type: 'buff', cooldown: 3,
            buffEffect: 'mpBurst', buffValue: 2, buffBonus: 50, buffIcon: '✨',
            desc: 'MP 2 회복 (+50%)', char: '엘프'
        },
        {
            id: 'elf_arrogant', name: '오만한 정신', mpCost: 0, type: 'passive', subtype: 'always',
            effect: 'mpToHpRegen', value: 25,
            desc: '매 턴 현재 MP의 25% HP 회복', char: '엘프'
        },
        {
            id: 'elf_surge', name: '마력 폭발', mpCost: 0, type: 'passive', subtype: 'conditional',
            effect: 'critMpRestore', value: 10,
            desc: '치명타 시 MP 10% 회복', char: '엘프'
        }
    ],
    // 드워프: 탱커, 생존/방어 특화
    dwarf: [
        {
            id: 'dwarf_bash', name: '방패 강타', mpCost: 2, type: 'active', subtype: 'strong', cooldown: 2,
            effect: 'enemyMaxHpDamage', value: 15,
            desc: '적 최대 체력의 15% 피해', char: '드워프'
        },
        {
            id: 'dwarf_hammer', name: '해머 스윙', mpCost: 1, damageMult: 0.25, type: 'active', subtype: 'sub', cooldown: 0,
            effect: 'counterBlock',
            desc: '25% 피해, 반격 피해 -50%', char: '드워프'
        },
        {
            id: 'dwarf_iron', name: '올바른 벽', mpCost: 2, type: 'buff', cooldown: 4,
            buffEffect: 'defBoost', buffValue: 0.15, buffTurns: 4, buffIcon: '🛡️',
            desc: '4턴간 받는 피해 -15%', char: '드워프'
        },
        {
            id: 'dwarf_stupid', name: '멍청한 희생', mpCost: 0, type: 'passive', subtype: 'always',
            effect: 'thorns', damageIncrease: 10, reflectPercent: 20,
            desc: '받는 피해 +10%, 반사 피해 20%', char: '드워프'
        },
        {
            id: 'dwarf_healthy', name: '건강한 신체', mpCost: 0, type: 'passive', subtype: 'conditional',
            effect: 'mpToHpOnRestore', value: 50,
            desc: 'MP 회복 시 50% HP 회복', char: '드워프'
        }
    ],
    // 인간: 사냥꾼, 반격무시/처형 특화
    human: [
        {
            id: 'human_snipe', name: '저격', mpCost: 3, damageMult: 0.75, type: 'active', subtype: 'strong', cooldown: 2,
            effect: 'noCounter',
            desc: '75% 피해, 반격 무시', char: '인간'
        },
        {
            id: 'human_quickshot', name: '속사', mpCost: 1, damageMult: 0.15, type: 'active', subtype: 'sub', cooldown: 0,
            effect: 'noCounter',
            desc: '15% 피해, 반격 무시', char: '인간'
        },
        {
            id: 'human_stealth', name: '약속과 의리', mpCost: 2, type: 'buff', cooldown: 3,
            buffEffect: 'stealth', buffValue: 1, buffTurns: 1, buffIcon: '👤',
            desc: '다음 공격 회피', char: '인간'
        },
        {
            id: 'human_dirty', name: '비열한 사격', mpCost: 0, type: 'passive', subtype: 'always',
            effect: 'firstHitBonus', value: 12,
            desc: '첫 공격 피해 +12%', char: '인간'
        },
        {
            id: 'human_execute', name: '처형자', mpCost: 0, type: 'passive', subtype: 'conditional',
            effect: 'executioner', value: 0.2,
            desc: '적 HP 30% 이하 시 피해 +20%', char: '인간'
        }
    ]
};

// 모드별 설정
// enemyMult: 적 능력치 배율, rewardMult: 보상 배율
const modeSettings = {
    easy: { enemyMult: 0.5, rewardMult: 1, maxFloor: 100, name: '전장 초입부' },
    normal: { enemyMult: 5, rewardMult: 5, maxFloor: 100, name: '전장 중심부' },
    hard: { enemyMult: 30, rewardMult: 10, maxFloor: 100, name: '전장의 끝' },
    infinite: { enemyMult: 10, rewardMult: 10, maxFloor: Infinity, name: '무한의 전장' }
};

// 적 타입 (weight: 등장 확률 가중치)
const enemyTypes = [
    { id: 'power', name: '파워', prefix: '강력한 ', hpMult: 0.8, atkMult: 1.4, dodge: 0, crit: 5, weight: 30 },
    { id: 'speed', name: '스피드', prefix: '날렵한 ', hpMult: 0.9, atkMult: 1.0, dodge: 15, crit: 10, weight: 30 },
    { id: 'lucky', name: '행운', prefix: '행운의 ', hpMult: 0.9, atkMult: 1.0, dodge: 20, crit: 20, weight: 20 },
    { id: 'tank', name: '탱크', prefix: '단단한 ', hpMult: 1.5, atkMult: 0.7, dodge: 0, crit: 0, weight: 8 },
    { id: 'berserk', name: '광폭', prefix: '광폭한 ', hpMult: 0.7, atkMult: 1.6, dodge: 0, crit: 15, weight: 5 },
    { id: 'cunning', name: '교활', prefix: '교활한 ', hpMult: 1.0, atkMult: 1.1, dodge: 10, crit: 15, weight: 5 },
    { id: 'giant', name: '거대', prefix: '거대한 ', hpMult: 2.0, atkMult: 0.9, dodge: 0, crit: 5, weight: 2 }
];

// 가중치 기반 적 타입 선택
function selectEnemyType() {
    const totalWeight = enemyTypes.reduce((sum, t) => sum + t.weight, 0);
    let random = Math.random() * totalWeight;
    for (const type of enemyTypes) {
        random -= type.weight;
        if (random <= 0) return type;
    }
    return enemyTypes[0];
}

// 보스 버프 목록
const bossBuffs = [
    { id: 'rage', name: '격노', desc: '공격력 +30%', atkMult: 1.3, hpMult: 1.0 },
    { id: 'fortify', name: '강화', desc: '체력 +50%', atkMult: 1.0, hpMult: 1.5 },
    { id: 'swift', name: '신속', desc: '회피 +15%, 치명타 확률 +10%', atkMult: 1.0, hpMult: 1.0, dodge: 15, crit: 10 },
    { id: 'berserk', name: '광폭화', desc: '공격력 +50%, 체력 -20%', atkMult: 1.5, hpMult: 0.8 },
    { id: 'resilient', name: '불굴', desc: '체력 +30%, 공격력 +15%', atkMult: 1.15, hpMult: 1.3 }
];

// 적 생성
function generateEnemy(floor) {
    const isBoss = floor % 10 === 0;
    const isMiniBoss = floor % 5 === 0 && !isBoss;
    const isRelicFloor = floor % 5 === 0; // 5층마다 유물 보상
    const modeMult = modeSettings[gameState.gameMode].enemyMult;

    // 가중치 기반 타입 선택
    const type = selectEnemyType();

    // 보스/중보스에게 랜덤 버프 부여
    const buff = (isBoss || isMiniBoss) ? bossBuffs[Math.floor(Math.random() * bossBuffs.length)] : null;

    const baseHp = 30 + floor * 10;
    const baseAtk = 5 + floor * 2;

    const tierMult = isBoss ? 3 : isMiniBoss ? 2 : 1;
    const atkTierMult = isBoss ? 2 : isMiniBoss ? 1.5 : 1;

    // 버프 적용
    const buffHpMult = buff ? buff.hpMult : 1;
    const buffAtkMult = buff ? buff.atkMult : 1;
    const buffDodge = buff?.dodge || 0;
    const buffCrit = buff?.crit || 0;

    return {
        name: getEnemyName(floor, isBoss, isMiniBoss),
        type: type,
        buff: buff,
        hp: Math.floor(baseHp * tierMult * type.hpMult * modeMult * buffHpMult),
        maxHp: Math.floor(baseHp * tierMult * type.hpMult * modeMult * buffHpMult),
        atk: Math.floor(baseAtk * atkTierMult * type.atkMult * modeMult * buffAtkMult),
        dodge: type.dodge + buffDodge,
        crit: type.crit + buffCrit,
        goldReward: Math.floor((10 + floor * 5) * tierMult),
        expReward: Math.floor((20 + floor * 10) * tierMult),
        isBoss,
        isMiniBoss,
        stunned: false,
        // 디버프 상태 (중첩 수)
        debuffs: {
            bleed: 0,       // 출혈: 턴당 플레이어 공격력의 50% 데미지 (중첩 가능)
            weaken: 0,      // 쇠약: 공격력 -10%, 받는 피해 +10% (중첩 가능)
            stun: 0,        // 스턴: 반격 1회 무효화
            freeze: 0       // 빙결: 선제공격 +2
        }
    };
}

function getEnemyName(floor, isBoss, isMiniBoss) {
    const tier = Math.floor((floor - 1) / 10) % 5;

    // 난이도별 마물 이름
    const enemyNames = {
        easy: {
            normal: ['임프', '고블린', '슬라임', '박쥐', '해골'],
            miniBoss: ['임프 대장', '고블린 대장', '거대 슬라임', '박쥐 군장', '해골 전사'],
            boss: ['임프 군주', '고블린 왕', '슬라임 킹', '박쥐 군주', '해골 기사']
        },
        normal: {
            normal: ['하급 악령', '오크', '늑대인간', '트롤', '가고일'],
            miniBoss: ['악령 대장', '오크 대장', '늑대인간 대장', '트롤 대장', '가고일 대장'],
            boss: ['악령 군주', '오크 로드', '늑대인간 군주', '트롤 왕', '가고일 군주']
        },
        hard: {
            normal: ['마물 전사', '마계 기사', '데몬', '암흑 마법사', '죽음의 기사'],
            miniBoss: ['마물 대장', '마계 기사장', '데몬 대장', '암흑 대마법사', '죽음의 기사장'],
            boss: ['마물 장군', '마계 사령관', '데몬 군주', '암흑 대현자', '죽음의 군주']
        },
        infinite: {
            normal: ['마왕 친위병', '상급 악마', '지옥의 전사', '심연의 기사', '파멸의 사도'],
            miniBoss: ['친위 대장', '상급 악마장', '지옥의 장군', '심연의 기사장', '파멸의 사도장'],
            boss: ['마왕 근위대장', '대악마', '지옥의 군주', '심연의 군주', '파멸의 군주']
        }
    };

    const mode = gameState.gameMode || 'easy';
    const enemies = enemyNames[mode];

    if (isBoss) return enemies.boss[tier];
    if (isMiniBoss) return enemies.miniBoss[tier];
    return enemies.normal[tier];
}

// 유물에서 특정 효과의 값을 가져오는 헬퍼 함수 (복합 효과 지원)
// 근원 강화 보너스 (5% per level, max 100%)
function getOriginEnhancementBonus() {
    return Math.min(gameState.originEnhancement * 5, 100) / 100;
}

// 근원 강화 비용 (처음 싸게 시작, 점점 많이 비싸짐)
function getOriginEnhanceCost() {
    const level = gameState.originEnhancement;
    // 1-3: 1개, 4-6: 5개, 7-9: 15개, 10-12: 30개, 13-15: 60개, 16-18: 100개, 19-20: 200개
    // 총 비용: 3 + 15 + 45 + 90 + 180 + 300 + 400 = 1033개
    if (level < 3) return 1;
    if (level < 6) return 5;
    if (level < 9) return 15;
    if (level < 12) return 30;
    if (level < 15) return 60;
    if (level < 18) return 100;
    return 200; // 19-20
}

function getRelicEffectValue(relic, effectType) {
    let value = null;

    // 단일 효과 체크
    if (relic.effect === effectType) {
        value = relic.value;
    }
    // 복합 효과 체크
    if (relic.effects) {
        const found = relic.effects.find(e => e.effect === effectType);
        if (found) value = found.value;
    }

    // 근원 강화 보너스 적용 (수치형 효과에만, 확률형 제외)
    const probabilityEffects = ['multiHit', 'lifeSteal', 'bleed', 'weaken', 'stun', 'freeze'];
    if (value !== null && typeof value === 'number' && !probabilityEffects.includes(effectType)) {
        value *= (1 + getOriginEnhancementBonus());
    }

    return value;
}

// 확률형 효과의 원본 값 (근원 강화 미적용, 합산용)
function getRelicEffectValueRaw(relic, effectType) {
    let value = null;
    if (relic.effect === effectType) {
        value = relic.value;
    }
    if (relic.effects) {
        const found = relic.effects.find(e => e.effect === effectType);
        if (found) value = found.value;
    }
    return value;
}

// 확률형 효과 판정 (기본 확률 + 근원 강화 재판정)
// 기본 확률로 체크 후 실패하면 근원 강화 확률로 재판정
function checkProbabilityWithReroll(baseChance) {
    // 기본 확률 체크
    if (Math.random() < Math.min(baseChance, 1.0)) return true;

    // 근원 강화 재판정 (기본확률 * 근원강화레벨*5/100, 레벨당 5%)
    const enhancementLevel = gameState.originEnhancement || 0;
    const rerollChance = baseChance * (enhancementLevel * 5 / 100);
    if (rerollChance > 0 && Math.random() < Math.min(rerollChance, 1.0)) return true;

    return false;
}

// 모든 스탯 보너스 계산
function getAllStatsBonus() {
    let bonus = 0;
    gameState.tempRelics.forEach(relic => {
        const val = getRelicEffectValue(relic, 'allStats');
        if (val !== null) bonus += val;
    });
    return bonus;
}

// 스탯별 유물 증폭 계산
function getStatMultiplier(statType) {
    let mult = 1;
    const effectMap = {
        str: 'strMult',
        dex: 'dexMult',
        int: 'intMult',
        vit: 'vitMult',
        luk: 'lukMult'
    };
    const effectName = effectMap[statType];
    gameState.tempRelics.forEach(relic => {
        const val = getRelicEffectValue(relic, effectName);
        if (val !== null) mult += val;
    });
    return mult;
}

// 증폭 적용된 스탯값 반환
function getEffectiveStat(statType) {
    const baseStat = gameState.player.stats[statType];
    return Math.floor(baseStat * getStatMultiplier(statType));
}

// 스탯 계산
// 힘: 공격력 +1, 체력 +2, 치명타 데미지 +0.5%
// 민첩: 치명타 확률 +1%, 공격력 +1, 체력 +0.5
// 지능: 치명타 데미지 +2%, 마나 +0.5, 체력 +1
// 활력: 체력 +4, 데미지 감소 +0.2% (최대 20%)
// 행운: 치명타 확률 +0.5%, 회피 +0.5%, 경험치 +1%, 골드 +1%
function getPlayerAtk() {
    let atk = gameState.player.baseAtk + (getEffectiveStat('str') * 1) + (getEffectiveStat('dex') * 1);

    gameState.equippedSkills.forEach(skill => {
        if (skill?.type === 'passive' && skill.effect === 'atkUp') {
            atk *= skill.value;
        }
    });

    // 유물 고정 공격력
    gameState.tempRelics.forEach(relic => {
        const val = getRelicEffectValue(relic, 'atk');
        if (val !== null) atk += val;
    });

    // 모든 스탯 보너스
    atk *= (1 + getAllStatsBonus());

    // 유물 공격력 증폭
    let atkMult = 1;
    gameState.tempRelics.forEach(relic => {
        const val = getRelicEffectValue(relic, 'atkMult');
        if (val !== null) atkMult += val;
    });
    atk *= atkMult;

    // 퍼센트 강화 (상점)
    atk *= (1 + gameState.percentBonus.atk / 100);

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

// 패시브 스킬의 캐릭터 찾기
function getSkillCharacter(skill) {
    if (skill.char) {
        const charMap = { '묘인': 'cat', '엘프': 'elf', '드워프': 'dwarf', '인간': 'human' };
        return charMap[skill.char] || null;
    }
    return null;
}

// 패시브 값에 대장간 보너스 적용
function getPassiveValue(skill, valueName = 'value') {
    const baseValue = skill[valueName] || 0;
    const character = getSkillCharacter(skill);
    if (!character) return baseValue;
    const weaponBonus = getWeaponBonus(character);
    return baseValue * (1 + weaponBonus / 100);
}

function getMaxHp() {
    const baseHp = 50 + (gameState.player.level - 1) * 5;
    const strHp = getEffectiveStat('str') * 1;
    const dexHp = getEffectiveStat('dex') * 0.25;
    const intHp = getEffectiveStat('int') * 0.5;
    const vitHp = getEffectiveStat('vit') * 2;

    let totalHp = baseHp + strHp + dexHp + intHp + vitHp;

    // 유물 체력 증폭
    let hpMult = 1;
    gameState.tempRelics.forEach(relic => {
        const val = getRelicEffectValue(relic, 'hpMult');
        if (val !== null) hpMult += val;
    });
    totalHp *= hpMult;

    // 퍼센트 강화 (상점)
    totalHp *= (1 + gameState.percentBonus.hp / 100);

    return Math.floor(totalHp);
}

// 활력 스탯으로 인한 데미지 감소 (최대 20%)
function getVitDamageReduction() {
    const reduction = getEffectiveStat('vit') * 0.2;
    return Math.min(reduction, 20) / 100; // 0~0.2 사이 값 반환
}

function getMaxMp() {
    let mp = 5 + Math.floor(getEffectiveStat('int') * 0.5);

    gameState.equippedSkills.forEach(skill => {
        if (skill?.type === 'passive' && skill.effect === 'mpUp') {
            mp += skill.value;
        }
    });

    gameState.tempRelics.forEach(relic => {
        const val = getRelicEffectValue(relic, 'mp');
        if (val !== null) mp += val;
    });

    return mp;
}

function getDodgeChance() {
    // 기본 10% + 행운으로 회피율 증가
    let dodge = 10 + getEffectiveStat('luk') * 0.5;

    gameState.tempRelics.forEach(relic => {
        const val = getRelicEffectValue(relic, 'dodge');
        if (val !== null) dodge += val;
    });

    // 버프 효과
    gameState.activeBuffs.forEach(buff => {
        if (buff.effect === 'dodgeBoost') dodge += buff.value;
    });

    // 모든 스탯 보너스 (5% = 5%p 추가)
    dodge += getAllStatsBonus() * 100;

    // 퍼센트 강화 (상점) - 회피율에 직접 더함
    dodge += gameState.percentBonus.dodge;

    return Math.min(dodge, 80);
}

// 실제 치명타 확률 (100% 상한)
function getCritChance() {
    return Math.min(getRawCritChance(), 100);
}

// 치명타 확률 원본값 (초과분은 데미지로 전환)
function getRawCritChance() {
    // 기본 10% + 행운(0.5%) + 민첩(1%)으로 치명타 확률 증가
    let chance = 10 + (getEffectiveStat('luk') * 0.5) + (getEffectiveStat('dex') * 1);

    gameState.equippedSkills.forEach(skill => {
        if (skill?.type === 'passive' && skill.effect === 'critUp') {
            chance += skill.value * 100;
        }
    });

    gameState.tempRelics.forEach(relic => {
        const val = getRelicEffectValue(relic, 'crit');
        if (val !== null) chance += val;
    });

    // 버프 효과
    gameState.activeBuffs.forEach(buff => {
        if (buff.effect === 'critBoost') chance += buff.value;
    });

    // 야수의 본능 보너스 (회피 성공 시 치명타 +10%)
    chance += gameState.beastInstinctBonus || 0;

    // 모든 스탯 보너스 (5% = 5%p 추가)
    chance += getAllStatsBonus() * 100;

    // 퍼센트 강화 (상점) - 치명타 확률에 직접 더함
    chance += gameState.percentBonus.crit;

    return chance;
}

// 치명타 데미지 배율 (기본 130%, 100% 초과 확률은 데미지로 전환)
function getCritDamage() {
    let critDmg = 130 + (getEffectiveStat('int') * 2) + (getEffectiveStat('str') * 0.5);

    // 유물 치명타 데미지 보너스
    gameState.tempRelics.forEach(relic => {
        const val = getRelicEffectValue(relic, 'critDmg');
        if (val !== null) critDmg += val;
    });

    // 패시브 스킬 치명타 데미지 보너스
    gameState.equippedSkills.forEach(skill => {
        if (skill?.type === 'passive' && (skill.effect === 'critDmgBoost' || skill.effect === 'critDmgUp')) {
            critDmg += getPassiveValue(skill);
        }
    });

    // 100% 초과 치명타 확률은 치명타 데미지로 전환
    const rawCrit = getRawCritChance();
    if (rawCrit > 100) {
        critDmg += (rawCrit - 100);
    }

    // 퍼센트 강화 (상점) - 치명타 데미지에 직접 더함
    critDmg += gameState.percentBonus.critDmg;

    return Math.floor(critDmg);
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

    // 버프 효과 (올바른 벽 등)
    gameState.activeBuffs.forEach(buff => {
        if (buff.effect === 'defBoost') mult *= (1 - buff.value);
    });

    // 유물 효과
    gameState.tempRelics.forEach(relic => {
        const val = getRelicEffectValue(relic, 'def');
        if (val !== null) mult *= val;
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

// 총 피해 감소율 (표시용, 최대 50%)
function getTotalDamageReduction() {
    let totalReduction = 0;

    // 방어 배율 (패시브/버프/유물)
    totalReduction += (1 - getDefenseMultiplier()) * 100;

    // 활력 스탯 데미지 감소
    totalReduction += getVitDamageReduction() * 100;

    // 퍼센트 강화 (상점)
    totalReduction += gameState.percentBonus.def;

    return Math.min(totalReduction, 80);
}

// 흡혈 효과 체크 (확률 + 흡혈량 반환, 근원 강화는 재판정으로 적용)
function getLifeStealInfo() {
    let chance = 0;
    let healPercent = 0.05; // 기본 5%

    // 버프 흡혈 효과 (피의 갈증 등)
    gameState.activeBuffs.forEach(buff => {
        if (buff.effect === 'lifeSteal') {
            chance = 1.0; // 버프는 100% 확률
            healPercent = Math.max(healPercent, buff.value);
        }
    });

    // 유물 흡혈 효과 (원본 확률 합산)
    gameState.tempRelics.forEach(relic => {
        const val = getRelicEffectValueRaw(relic, 'lifeSteal');
        if (val !== null) {
            chance += val;
            // 2.0 이상이면 10% 흡혈 (전설급)
            if (val >= 2.0) healPercent = 0.10;
        }
    });

    return { chance, healPercent }; // 원본 확률 반환
}

// 흡혈 확률만 반환 (UI 표시용)
function getLifeStealChance() {
    return getLifeStealInfo().chance;
}

// === 새 유물 효과 헬퍼 함수들 ===

// 피해 반사율
function getReflectPercent() {
    let percent = 0;
    gameState.tempRelics.forEach(relic => {
        const val = getRelicEffectValue(relic, 'reflect');
        if (val !== null) percent += val;
    });
    return percent;
}

// MP 소모 감소율
function getMpSavePercent() {
    let percent = 0;
    gameState.tempRelics.forEach(relic => {
        const val = getRelicEffectValue(relic, 'mpSave');
        if (val !== null) percent += val;
    });
    return Math.min(percent, 0.5); // 최대 50% 감소
}

// 처치 시 HP 회복률
function getKillHealPercent() {
    let percent = 0;
    gameState.tempRelics.forEach(relic => {
        const val = getRelicEffectValue(relic, 'killHeal');
        if (val !== null) percent += val;
    });
    return percent;
}

// 처치 시 MP 회복률
function getKillManaPercent() {
    let percent = 0;
    gameState.tempRelics.forEach(relic => {
        const val = getRelicEffectValue(relic, 'killMana');
        if (val !== null) percent += val;
    });
    return percent;
}

// 골드 증가율 계산 (행운 + 유물 + 부적)
function getGoldBonus() {
    // 행운 스탯 보너스 (1% per point)
    let bonus = getEffectiveStat('luk') * 1;

    // 유물 효과 (reward는 골드/경험치 둘 다)
    gameState.tempRelics.forEach(relic => {
        const rewardVal = getRelicEffectValue(relic, 'reward');
        if (rewardVal !== null) {
            bonus += (rewardVal - 1) * 100;
        }
    });

    // 부적 효과 (2% per purchase)
    bonus += gameState.talismanPurchases.gold * 2;

    return Math.floor(bonus);
}

// 경험치 증가율 계산 (행운 + 유물 + 부적)
function getExpBonus() {
    // 행운 스탯 보너스 (1% per point)
    let bonus = getEffectiveStat('luk') * 1;

    // 유물 효과 (reward는 골드/경험치 둘 다)
    gameState.tempRelics.forEach(relic => {
        const rewardVal = getRelicEffectValue(relic, 'reward');
        if (rewardVal !== null) {
            bonus += (rewardVal - 1) * 100;
        }
    });

    // 부적 효과 (2% per purchase)
    bonus += gameState.talismanPurchases.exp * 2;

    return Math.floor(bonus);
}

// 쿨타임 감소량
function getCooldownReduce() {
    let reduce = 0;
    gameState.tempRelics.forEach(relic => {
        const val = getRelicEffectValue(relic, 'cooldownReduce');
        if (val !== null) reduce += val;
    });
    return reduce;
}

// 디버프 확률 계산 (원본 값 합산, 근원 강화는 재판정으로 적용)
function getDebuffChance(debuffType) {
    let chance = 0;
    gameState.tempRelics.forEach(relic => {
        const val = getRelicEffectValueRaw(relic, debuffType);
        if (val !== null) chance += val;
    });
    return chance;
}

// 공격 후 디버프 적용 시도 - 기본 확률 + 근원 강화 재판정으로 연쇄 중첩
function tryApplyDebuffs() {
    const enemy = gameState.currentEnemy;
    if (!enemy || enemy.hp <= 0) return;

    const debuffTypes = ['bleed', 'weaken', 'stun', 'freeze'];
    const debuffNames = { bleed: '출혈', weaken: '쇠약', stun: '스턴', freeze: '빙결' };

    debuffTypes.forEach(type => {
        const chance = getDebuffChance(type);
        if (chance <= 0) return;

        // 연쇄 적용: 기본 확률 + 근원 강화 재판정으로 계속 시도
        let appliedStacks = 0;
        while (checkProbabilityWithReroll(chance)) {
            appliedStacks++;
        }

        if (appliedStacks > 0) {
            const prevStacks = enemy.debuffs[type];
            enemy.debuffs[type] += appliedStacks;

            if (prevStacks === 0 && appliedStacks === 1) {
                addBattleLog(`${enemy.name}에게 ${debuffNames[type]} 적용!`);
            } else {
                addBattleLog(`${debuffNames[type]} ${enemy.debuffs[type]}중첩! (+${appliedStacks})`);
            }
        }
    });
}

// 턴 시작 시 디버프 피해 처리 (출혈만 피해)
function processDebuffDamage() {
    const enemy = gameState.currentEnemy;
    if (!enemy || enemy.hp <= 0) return;

    // 출혈: 플레이어 공격력의 50% * 중첩 수
    if (enemy.debuffs.bleed > 0) {
        const playerAtk = getPlayerAtk();
        const bleedDamage = Math.floor(playerAtk * 0.5 * enemy.debuffs.bleed);
        enemy.hp -= bleedDamage;
        addBattleLog(`출혈 피해: ${bleedDamage} (${enemy.debuffs.bleed}중첩)`);
        // 출혈은 턴마다 1중첩씩 감소
        enemy.debuffs.bleed--;
    }

    // 전투 함성: 턴마다 감소
    if (enemy.debuffs?.warcry > 0) {
        enemy.debuffs.warcry--;
        if (enemy.debuffs.warcry <= 0) {
            addBattleLog('📯 전투 함성 효과 종료');
        }
    }

    // 스턴은 반격 후 감소 (checkStunBlockCounter에서 처리)
    // 빙결은 지속 (전투 끝날 때까지)
}

// 디버프로 인한 적 공격력 감소 (쇠약: 10% per stack)
function getEnemyDebuffAtkReduction() {
    const enemy = gameState.currentEnemy;
    if (!enemy) return 1.0;

    let reduction = 0;
    // 쇠약: 중첩당 10% 감소
    const weakenStacks = enemy.debuffs?.weaken || 0;
    reduction += weakenStacks * 10;

    // 전투 함성: 20% 감소
    if (enemy.debuffs?.warcry > 0) {
        reduction += 20;
    }

    return Math.max(0.1, 1 - reduction / 100); // 최소 10% 공격력
}

// 디버프로 인한 적 받는 피해 증가 (쇠약: 10% per stack)
function getEnemyDebuffDamageTaken() {
    const enemy = gameState.currentEnemy;
    if (!enemy) return 1.0;

    let increase = 0;
    // 쇠약: 중첩당 10% 증가
    const weakenStacks = enemy.debuffs?.weaken || 0;
    increase += weakenStacks * 10;

    return 1 + increase / 100;
}

// 디버프로 인한 적 회피 감소
function getEnemyDebuffDodgeReduction() {
    const enemy = gameState.currentEnemy;
    if (!enemy) return 0;

    let reduction = 0;
    // 빙결: 중첩당 5% 회피 감소
    const freezeStacks = enemy.debuffs?.freeze || 0;
    reduction += freezeStacks * 5;

    return reduction;
}

// 스턴으로 인한 반격 불가 체크
function checkStunBlockCounter() {
    const enemy = gameState.currentEnemy;
    if (!enemy) return false;

    if (enemy.debuffs.stun > 0) {
        enemy.debuffs.stun--;
        addBattleLog(`스턴으로 적의 반격이 무효화됨!`);
        return true; // 반격 불가
    }
    return false;
}

// 디버프로 인한 적 선제공격 증가 (빙결 +2)
function getEnemyPriorityPenalty() {
    const enemy = gameState.currentEnemy;
    if (!enemy) return 0;

    let penalty = 0;
    // 스턴은 반격만 무효화, 선제공격에는 영향 없음
    penalty += (enemy.debuffs.freeze || 0) * 2;
    return penalty;
}

// 처형 보너스 (적 HP 30% 이하 시 추가 피해)
function getExecuteBonus() {
    let bonus = 0;
    gameState.tempRelics.forEach(relic => {
        const val = getRelicEffectValue(relic, 'execute');
        if (val !== null) bonus += val;
    });
    // 패시브 처형자 보너스
    gameState.equippedSkills.forEach(skill => {
        if (skill?.type === 'passive' && skill.effect === 'executioner') {
            bonus += getPassiveValue(skill);
        }
    });
    return bonus;
}

// 첫타 보너스 (전투당 첫 공격에 추가 피해)
function getFirstHitBonus() {
    let bonus = 0;
    gameState.tempRelics.forEach(relic => {
        const val = getRelicEffectValue(relic, 'firstHit');
        if (val !== null) bonus += val;
    });
    // 패시브 첫 공격 보너스 (비열한 사격)
    gameState.equippedSkills.forEach(skill => {
        if (skill?.type === 'passive' && skill.effect === 'firstHitBonus') {
            bonus += getPassiveValue(skill) / 100;
        }
    });
    return bonus;
}

// 보스 추가 데미지
function getBossKillerBonus() {
    let bonus = 0;
    gameState.tempRelics.forEach(relic => {
        const val = getRelicEffectValue(relic, 'bossKiller');
        if (val !== null) bonus += val;
    });
    return bonus;
}

// 추가 공격 확률 (원본 값 합산, 근원 강화는 재판정으로 적용)
function getMultiHitChance() {
    let chance = 0;
    gameState.tempRelics.forEach(relic => {
        const val = getRelicEffectValueRaw(relic, 'multiHit');
        if (val !== null) chance += val;
    });
    return chance; // 합산된 원본 확률 반환
}

// 스킬 데미지 증가율
function getSkillDmgBonus() {
    let bonus = 0;
    gameState.tempRelics.forEach(relic => {
        const val = getRelicEffectValue(relic, 'skillDmg');
        if (val !== null) bonus += val;
    });
    return bonus;
}

function calculateDamageTaken(damage, guarding = false, isCounter = false, originalDamage = null) {
    let finalDamage = damage;
    const baseDamageForMin = originalDamage || damage; // 최소 데미지 계산용

    // 총 피해 감소율 계산 (최대 80%)
    let totalReduction = 0;

    // 방어 배율 (패시브/버프)
    totalReduction += (1 - getDefenseMultiplier()) * 100;

    // 활력 스탯 데미지 감소
    totalReduction += getVitDamageReduction() * 100;

    // 퍼센트 강화 (상점)
    totalReduction += gameState.percentBonus.def;

    // 최대 80%로 제한
    totalReduction = Math.min(totalReduction, 80);
    finalDamage *= (1 - totalReduction / 100);

    // 반격일 경우 추가 감소 (별도 계산)
    if (isCounter) {
        finalDamage *= getCounterDefenseMultiplier();
    }

    if (guarding) finalDamage *= 0.3;

    // 멍청한 희생 패시브 (받는 피해 증가)
    gameState.equippedSkills.forEach(skill => {
        if (skill?.type === 'passive' && skill.effect === 'thorns' && skill.damageIncrease) {
            finalDamage *= (1 + getPassiveValue(skill, 'damageIncrease') / 100);
        }
    });

    // 최소 데미지: 원래 피해량의 10% (최소 1)
    const minDamage = Math.max(1, Math.floor(baseDamageForMin * 0.1));
    return Math.floor(Math.max(minDamage, finalDamage));
}

// === 버프 시스템 ===
function applyBuff(skill, weaponBonus = 0) {
    const bonusMult = 1 + weaponBonus / 100;

    // 즉시 효과 버프 처리 (mpBurst 등)
    if (skill.buffEffect === 'mpBurst') {
        let mpRestore = skill.buffValue;
        // 스킬 자체 보너스 적용
        if (skill.buffBonus) {
            mpRestore = Math.floor(mpRestore * (1 + skill.buffBonus / 100));
        }
        // 대장간 보너스 적용
        mpRestore = Math.floor(mpRestore * bonusMult);
        gameState.player.mp = Math.min(gameState.player.maxMp, gameState.player.mp + mpRestore);
        addBattleLog(`${skill.buffIcon} ${skill.name}! MP +${mpRestore}`);
        return;
    }

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
                value: eff.value * bonusMult
            });
        });
    } else {
        gameState.activeBuffs.push({
            id: skill.id,
            name: skill.name,
            icon: skill.buffIcon,
            turns: skill.buffTurns,
            effect: skill.buffEffect,
            value: skill.buffValue * bonusMult
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
        // 쿨타임 감소 유물 적용
        const reducedCooldown = Math.max(1, skill.cooldown - getCooldownReduce());
        gameState.skillCooldowns[skill.id] = reducedCooldown;
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
    let totalMpRestored = 0;

    gameState.equippedSkills.forEach(skill => {
        if (skill?.type === 'passive' && skill.effect === 'mpRegen') {
            const regen = skill.value;
            const oldMp = gameState.player.mp;
            gameState.player.mp = Math.min(gameState.player.maxMp, gameState.player.mp + regen);
            totalMpRestored += gameState.player.mp - oldMp;
            if (regen > 0) addBattleLog(`MP +${regen}`);
        }
        // 오만한 정신: 현재 MP의 일정 비율만큼 HP 회복
        if (skill?.type === 'passive' && skill.effect === 'mpToHpRegen') {
            const healAmount = Math.floor(gameState.player.mp * (getPassiveValue(skill) / 100));
            if (healAmount > 0) {
                gameState.player.hp = Math.min(getMaxHp(), gameState.player.hp + healAmount);
                addBattleLog(`HP +${healAmount} (오만한 정신)`);
            }
        }
    });

    // 건강한 신체: MP 회복 시 일정 비율 HP 회복
    if (totalMpRestored > 0) {
        gameState.equippedSkills.forEach(skill => {
            if (skill?.type === 'passive' && skill.effect === 'mpToHpOnRestore') {
                const healAmount = Math.floor(totalMpRestored * (getPassiveValue(skill) / 100));
                if (healAmount > 0) {
                    gameState.player.hp = Math.min(getMaxHp(), gameState.player.hp + healAmount);
                    addBattleLog(`HP +${healAmount} (건강한 신체)`);
                }
            }
        });
    }
}

function getExpForLevel(level) {
    // 초반 레벨업 경험치 감소: 50 * level
    return 50 * level;
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

// 스킵 가능 층 계산 (5층 단위)
function getSkipFloor() {
    // 5층 단위로 스킵 (5, 10, 15, 20...)
    const highestCleared5 = Math.floor(gameState.dungeon.highestFloor / 5) * 5;
    if (highestCleared5 >= 5) {
        // 해당 층까지 스킵
        return highestCleared5;
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

    // 포인트가 있을 때 뱃지 강조 효과
    const pointBadge = document.querySelector('.point-badge');
    if (pointBadge) {
        if (gameState.player.statPoints > 0) {
            pointBadge.classList.add('has-points');
        } else {
            pointBadge.classList.remove('has-points');
        }
    }
    document.getElementById('stat-str').textContent = gameState.player.stats.str;
    document.getElementById('stat-dex').textContent = gameState.player.stats.dex;
    document.getElementById('stat-int').textContent = gameState.player.stats.int;
    document.getElementById('stat-vit').textContent = gameState.player.stats.vit;
    document.getElementById('stat-luk').textContent = gameState.player.stats.luk;

    // 현재 스펙 업데이트
    document.getElementById('spec-atk').textContent = getPlayerAtk();
    document.getElementById('spec-hp').textContent = getMaxHp();
    document.getElementById('spec-crit').textContent = getCritChance() + '%';
    document.getElementById('spec-critdmg').textContent = getCritDamage() + '%';
    document.getElementById('spec-dodge').textContent = getDodgeChance() + '%';
    // 피해감소: 활력 기반 + 상점 보너스 (최대 50%)
    const totalDefReduction = Math.min(
        getVitDamageReduction() * 100 + gameState.percentBonus.def,
        50
    );
    document.getElementById('spec-def').textContent = Math.floor(totalDefReduction) + '%';

    // 스킵 버튼 업데이트
    const skipFloor = getSkipFloor();
    const skipBtn = document.getElementById('btn-skip');
    const skipInfo = document.getElementById('skip-info');

    if (skipFloor > 0) {
        skipBtn.disabled = false;
        skipInfo.textContent = `5→${skipFloor}구역 보스전만 진행 (최고: ${gameState.dungeon.highestFloor}구역)`;
    } else {
        skipBtn.disabled = true;
        skipInfo.textContent = '5구역 클리어 후 스킵 가능';
    }
}

function getPercentUpgradeCost(purchases, stat) {
    // 비용: 50번까지 적당히, 이후 급격히 증가
    const base = 50;

    if (purchases < 50) {
        // 50번까지: 적당한 증가
        return Math.floor(base * (1 + purchases * 0.05) + purchases * 5);
    } else {
        // 50번 이후: 급격한 비용 증가
        const over50 = purchases - 50;
        const base50Cost = Math.floor(base * (1 + 49 * 0.05) + 49 * 5);
        return Math.floor(base50Cost * (1 + over50 * 0.3) + over50 * 50);
    }
}

function getTalismanCost(type, purchases) {
    // 부적별 기본 비용: 50번까지 적당히, 이후 급격히 증가
    const baseCosts = { exp: 50, gold: 50, stone: 100, origin: 300 };
    const base = baseCosts[type];

    if (purchases < 50) {
        // 50번까지: 기본가 + 구매수*5 + 5% 증가
        return Math.floor(base * (1 + purchases * 0.05) + purchases * 5);
    } else {
        // 50번 이후: 급격한 비용 증가
        const over50 = purchases - 50;
        const base50Cost = Math.floor(base * (1 + 49 * 0.05) + 49 * 5);
        return Math.floor(base50Cost * (1 + over50 * 0.3) + over50 * 50);
    }
}

function updateShopUI() {
    document.getElementById('shop-gold').textContent = gameState.player.gold;
    document.getElementById('shop-stones').textContent = gameState.enhancementStones;
    document.getElementById('shop-origins').textContent = gameState.originStones;

    // 부적 (경험치, 골드) - 2%씩, 무제한
    const expBonus = gameState.talismanPurchases.exp * 2;
    const expCost = getTalismanCost('exp', gameState.talismanPurchases.exp);
    document.getElementById('exp-bonus').textContent = expBonus;
    document.getElementById('cost-exp').textContent = expCost;
    const expBtn = document.querySelector('.btn-talisman[data-talisman="exp"]');
    expBtn.disabled = gameState.player.gold < expCost;

    const goldBonus = gameState.talismanPurchases.gold * 2;
    const goldTalismanCost = getTalismanCost('gold', gameState.talismanPurchases.gold);
    document.getElementById('gold-bonus').textContent = goldBonus;
    document.getElementById('cost-gold-talisman').textContent = goldTalismanCost;
    const goldBtn = document.querySelector('.btn-talisman[data-talisman="gold"]');
    goldBtn.disabled = gameState.player.gold < goldTalismanCost;

    // 재화 교환
    const stoneCost = getTalismanCost('stone', gameState.talismanPurchases.stone);
    document.getElementById('cost-stone').textContent = stoneCost;
    document.querySelector('.btn-talisman[data-talisman="stone"]').disabled = gameState.player.gold < stoneCost;

    const originCost = getTalismanCost('origin', gameState.talismanPurchases.origin);
    document.getElementById('cost-origin').textContent = originCost;
    document.querySelector('.btn-talisman[data-talisman="origin"]').disabled = gameState.player.gold < originCost;

    // 능력 부적 (스탯별 다른 증가량)
    const increments = { atk: 1, hp: 1, crit: 0.5, critDmg: 2, dodge: 0.5, def: 0.15 };
    // 공격력, 체력, 치명타피해, 골드, 경험치는 무제한
    const maxValues = { atk: Infinity, hp: Infinity, crit: 100, critDmg: Infinity, dodge: 100, def: 15 };
    const stats = ['atk', 'hp', 'crit', 'critDmg', 'dodge', 'def'];

    stats.forEach(stat => {
        const current = gameState.percentBonus[stat];
        const increment = increments[stat];
        const maxValue = maxValues[stat];
        const purchases = Math.round(current / increment);
        const cost = getPercentUpgradeCost(purchases, stat);
        const isMax = maxValue !== Infinity && current >= maxValue;

        document.getElementById(`percent-${stat}`).textContent = current.toFixed(1);
        document.getElementById(`cost-${stat}`).textContent = isMax ? 'MAX' : cost;
        // 진행바: 무제한 스탯은 100을 기준으로, 유한 스탯은 최대값 기준
        const barMax = maxValue === Infinity ? Math.max(100, current) : maxValue;
        const fillPercent = Math.min(100, (current / barMax) * 100);
        document.getElementById(`fill-${stat}`).style.width = `${fillPercent}%`;

        const btn = document.querySelector(`.btn-percent-upgrade[data-stat="${stat}"]`);
        btn.disabled = isMax || gameState.player.gold < cost;
        if (isMax) {
            btn.textContent = 'MAX';
        }
    });
}

function getEnhanceSuccessRate(level) {
    // 1강: 100%, 20강: 5% (선형 감소)
    return Math.max(5, 100 - (level - 1) * 5);
}

function getEnhanceGoldCost(level) {
    // 골드 비용: 확률 실패가 있으므로 근원 강화보다 저렴하게
    return 50 + level * 30;
}

function getEnhanceStoneCost(level) {
    // 강화석 비용: 레벨에 따라 증가 (1-5: 1개, 6-10: 2개, 11-15: 3개, 16-20: 5개)
    if (level < 5) return 1;
    if (level < 10) return 2;
    if (level < 15) return 3;
    return 5;
}

function showEnhanceResult(weapon, success, level) {
    const weaponNames = {
        sword: '대검',
        shield: '방패',
        bow: '활',
        staff: '지팡이'
    };
    const resultDiv = document.getElementById('enhance-result');
    if (resultDiv) {
        if (success) {
            resultDiv.className = 'enhance-result success';
            resultDiv.innerHTML = `✨ ${weaponNames[weapon]} +${level} 강화 성공!`;
        } else {
            resultDiv.className = 'enhance-result fail';
            resultDiv.innerHTML = `💔 ${weaponNames[weapon]} 강화 실패...`;
        }
        resultDiv.classList.remove('hidden');
        setTimeout(() => {
            resultDiv.classList.add('hidden');
        }, 1500);
    }
}

function updateBlacksmithUI() {
    document.getElementById('blacksmith-stones').textContent = gameState.enhancementStones;
    document.getElementById('blacksmith-gold').textContent = gameState.player.gold;

    const weaponTypes = ['sword', 'shield', 'bow', 'staff'];
    weaponTypes.forEach(weapon => {
        const level = gameState.weapons[weapon];
        const successRate = getEnhanceSuccessRate(level);
        const goldCost = getEnhanceGoldCost(level);
        const stoneCost = getEnhanceStoneCost(level);
        const isMaxLevel = level >= 20;
        const canAfford = gameState.enhancementStones >= stoneCost && gameState.player.gold >= goldCost;

        document.getElementById(`${weapon}-level`).textContent = level;
        document.getElementById(`${weapon}-bonus`).textContent = (level * 5).toFixed(0);
        document.getElementById(`${weapon}-rate`).textContent = successRate;
        document.getElementById(`${weapon}-gold`).textContent = goldCost;
        document.getElementById(`${weapon}-stone`).textContent = stoneCost;

        const btn = document.querySelector(`.btn-upgrade[data-weapon="${weapon}"]`);
        btn.disabled = !canAfford || isMaxLevel;
        btn.textContent = isMaxLevel ? 'MAX' : `강화 (${successRate}%)`;
    });
}

function updateInnUI() {
    document.getElementById('inn-origin-stones').textContent = gameState.originStones;

    // 근원 강화 표시
    const enhancementLevel = gameState.originEnhancement;
    const enhancementBonus = Math.min(enhancementLevel * 5, 100);
    const enhanceCost = getOriginEnhanceCost();
    document.getElementById('origin-enhancement-level').textContent = enhancementLevel;
    document.getElementById('origin-enhancement-bonus').textContent = enhancementBonus + '%';

    // 근원 강화 버튼 상태 및 비용 표시 (최대 20레벨)
    const enhanceBtn = document.getElementById('btn-origin-enhance');
    if (enhanceBtn) {
        enhanceBtn.disabled = gameState.originStones < enhanceCost || enhancementLevel >= 20;
        enhanceBtn.textContent = `강화 (${enhanceCost}🔮)`;
    }

    // 스탯 포인트 구매 비용 (구매할수록 증가)
    const statPointCost = 1 + Math.floor(gameState.statPointsPurchased / 5);
    document.getElementById('stat-point-cost').textContent = statPointCost;
    document.getElementById('stat-points-purchased').textContent = gameState.statPointsPurchased;
    document.getElementById('btn-buy-stat-point').disabled = gameState.originStones < statPointCost;

    // 리더보드 UI 업데이트
    updateLeaderboardUI();
}

function updateDungeonUI() {
    // 스킵 모드면 목표층 표시
    if (gameState.skipMode) {
        document.getElementById('current-floor').textContent =
            `${gameState.dungeon.currentFloor} → ${gameState.skipTargetFloor}`;
    } else {
        document.getElementById('current-floor').textContent = gameState.dungeon.currentFloor;
    }
    document.getElementById('pending-gold').textContent = gameState.dungeon.pendingGold;
    document.getElementById('pending-exp').textContent = gameState.dungeon.pendingExp;
    document.getElementById('pending-stones').textContent = gameState.dungeon.pendingStones;
    document.getElementById('pending-origin-stones').textContent = gameState.dungeon.pendingOriginStones;

    // 전투 중에는 합성 버튼 숨기기
    const combineBtn = document.getElementById('btn-tag-combine-open');
    if (combineBtn) {
        combineBtn.style.display = gameState.dungeon.inBattle ? 'none' : 'inline-block';
    }

    // 전투 시작 시 합성창이 열려있으면 닫기
    if (gameState.dungeon.inBattle && gameState.tagCombineMode) {
        closeTagCombineMode();
    }
}

function updateBattleUI() {
    // 플레이어 HP/MP 업데이트 (항상)
    document.getElementById('battle-hp').textContent = gameState.player.hp;
    document.getElementById('battle-max-hp').textContent = gameState.player.maxHp;
    document.getElementById('battle-mp').textContent = gameState.player.mp;
    document.getElementById('battle-max-mp').textContent = gameState.player.maxMp;

    const hpPercent = (gameState.player.hp / gameState.player.maxHp) * 100;
    const mpPercent = (gameState.player.mp / gameState.player.maxMp) * 100;
    document.getElementById('hp-bar').style.width = `${hpPercent}%`;
    document.getElementById('mp-bar').style.width = `${mpPercent}%`;

    // 왼쪽 스탯 패널 - 기본 스탯
    document.getElementById('panel-str').textContent = Math.floor(getEffectiveStat('str'));
    document.getElementById('panel-dex').textContent = Math.floor(getEffectiveStat('dex'));
    document.getElementById('panel-int').textContent = Math.floor(getEffectiveStat('int'));
    document.getElementById('panel-vit').textContent = Math.floor(getEffectiveStat('vit'));
    document.getElementById('panel-luk').textContent = Math.floor(getEffectiveStat('luk'));
    // 왼쪽 스탯 패널 - 전투 능력
    document.getElementById('panel-atk').textContent = getPlayerAtk();
    document.getElementById('panel-crit').textContent = getCritChance() + '%';
    document.getElementById('panel-crit-dmg').textContent = getCritDamage() + '%';
    document.getElementById('panel-dodge').textContent = getDodgeChance() + '%';
    document.getElementById('panel-def').textContent = Math.floor(getTotalDamageReduction()) + '%';
    document.getElementById('panel-reflect').textContent = Math.floor(getReflectPercent() * 100) + '%';
    // 추가 공격, 흡혈, 디버프 확률
    document.getElementById('panel-multihit').textContent = Math.floor(getMultiHitChance() * 100) + '%';
    document.getElementById('panel-lifesteal').textContent = Math.floor(getLifeStealChance() * 100) + '%';
    document.getElementById('panel-bleed').textContent = Math.floor(getDebuffChance('bleed') * 100) + '%';
    document.getElementById('panel-weaken').textContent = Math.floor(getDebuffChance('weaken') * 100) + '%';
    document.getElementById('panel-stun').textContent = Math.floor(getDebuffChance('stun') * 100) + '%';
    document.getElementById('panel-freeze').textContent = Math.floor(getDebuffChance('freeze') * 100) + '%';

    // 근원 강화 보너스 표시
    const originBonus = Math.floor(getOriginEnhancementBonus() * 100);
    const originBonusEl = document.getElementById('panel-origin-bonus');
    if (originBonusEl) {
        originBonusEl.textContent = originBonus > 0 ? `+${originBonus}%` : '';
    }

    // 획득 보상 표시
    document.getElementById('panel-gold').textContent = gameState.dungeon.pendingGold || 0;
    document.getElementById('panel-exp').textContent = gameState.dungeon.pendingExp || 0;
    document.getElementById('panel-gold-bonus').textContent = '+' + getGoldBonus() + '%';
    document.getElementById('panel-exp-bonus').textContent = '+' + getExpBonus() + '%';

    // 적 정보 업데이트 (적이 있을 때만)
    const enemy = gameState.currentEnemy;
    if (!enemy) return;

    const typePrefix = enemy.type ? enemy.type.prefix : '';
    const buffTag = enemy.buff ? ` [${enemy.buff.name}]` : '';
    document.getElementById('enemy-name').textContent = typePrefix + enemy.name + buffTag + (enemy.stunned ? ' [스턴]' : '');
    document.getElementById('enemy-hp').textContent = Math.max(0, Math.floor(enemy.hp));
    document.getElementById('enemy-max-hp').textContent = enemy.maxHp;
    document.getElementById('enemy-atk').textContent = enemy.atk;
    document.getElementById('enemy-preempt-counter').textContent = enemyAttackCounter;

    const enemyHpPercent = (Math.max(0, enemy.hp) / enemy.maxHp) * 100;
    document.getElementById('enemy-hp-bar').style.width = `${enemyHpPercent}%`;

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
    return Math.floor(Math.random() * 4) + 3; // 3-6턴
}

function startBattle() {
    gameState.currentEnemy = generateEnemy(gameState.dungeon.currentFloor);
    gameState.dungeon.inBattle = true;
    gameState.dungeon.firstHitUsed = false; // 첫타 보너스 초기화
    isGuarding = false;
    hasActed = false;
    enemyAttackCounter = getRandomAttackCounter();
    clearBattleLog();

    // 도주 버튼 활성화
    document.getElementById('btn-return').disabled = false;

    const enemy = gameState.currentEnemy;
    const floorType = enemy.isBoss ? '보스' : enemy.isMiniBoss ? '중간보스' : '';
    const typePrefix = enemy.type ? enemy.type.prefix : '';
    addBattleLog(`${gameState.dungeon.currentFloor}구역 - ${typePrefix}${enemy.name} ${floorType ? `[${floorType}]` : ''} 등장!`);

    // 보스/중보스 버프 표시
    if (enemy.buff) {
        addBattleLog(`버프: ${enemy.buff.name} - ${enemy.buff.desc}`);
    }

    addBattleLog(`적 선제공격까지 ${enemyAttackCounter}턴`);

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
    if (!gameState.dungeon.inBattle || !gameState.currentEnemy) return false;

    enemyAttackCounter--;

    // 카운터가 0 이하면 선제공격 발동
    if (enemyAttackCounter <= 0) {
        addBattleLog(`⚠️ 적의 선제공격!`);
        enemyPreemptiveAttack();
        enemyAttackCounter = getRandomAttackCounter();
        addBattleLog(`다음 선제공격까지 ${enemyAttackCounter}턴`);

        if (gameState.player.hp <= 0) {
            return true; // 플레이어 사망
        }
    }

    return false;
}

// 은신 버프 체크 (완전 회피)
function checkAndConsumeStealthBuff() {
    const stealthBuff = gameState.activeBuffs.find(b => b.effect === 'stealth');
    if (stealthBuff) {
        gameState.activeBuffs = gameState.activeBuffs.filter(b => b.effect !== 'stealth');
        addBattleLog(`👤 은신으로 공격 회피!`);
        return true;
    }
    return false;
}

function enemyPreemptiveAttack() {
    if (gameState.currentEnemy.stunned) {
        addBattleLog(`${gameState.currentEnemy.name}은(는) 스턴 상태! 선제공격 실패`);
        gameState.currentEnemy.stunned = false;
        return;
    }

    // 은신 버프 체크
    if (checkAndConsumeStealthBuff()) {
        return;
    }

    // 디버프로 인한 공격력 감소 적용
    const enemyAtk = Math.floor(gameState.currentEnemy.atk * getEnemyDebuffAtkReduction());
    const enemyCrit = gameState.currentEnemy.crit || 0;
    const isCrit = Math.random() * 100 < enemyCrit;
    const isDodge = Math.random() * 100 < getDodgeChance();

    const originalDamage = isCrit ? Math.floor(enemyAtk * 1.5) : enemyAtk;
    let baseDamage = originalDamage;
    if (isDodge) baseDamage = Math.floor(baseDamage * 0.5);
    const damage = calculateDamageTaken(baseDamage, false, false, originalDamage);

    gameState.player.hp -= damage;
    const logParts = [`${damage} 피해를 받았다!`];
    if (isCrit) logParts.push('(치명타!)');
    if (isDodge) logParts.push('(부분 회피!)');
    addBattleLog(logParts.join(' '));

    // 반사 피해 (멍청한 희생) - 감소 이전 피해량 기준
    applyThornsDamage(originalDamage);

    if (gameState.player.hp <= 0) {
        playerDefeated();
    }
    updateBattleUI();
}

// 반사 피해 적용 (멍청한 희생 패시브)
function applyThornsDamage(damageTaken) {
    gameState.equippedSkills.forEach(skill => {
        if (skill?.type === 'passive' && skill.effect === 'thorns' && skill.reflectPercent) {
            const reflectDamage = Math.floor(damageTaken * (getPassiveValue(skill, 'reflectPercent') / 100));
            if (reflectDamage > 0 && gameState.currentEnemy) {
                gameState.currentEnemy.hp -= reflectDamage;
                addBattleLog(`반사 피해 ${reflectDamage}!`);
                if (gameState.currentEnemy.hp <= 0) {
                    enemyDefeated();
                }
            }
        }
    });
}

function playerAttack() {
    if (!gameState.dungeon.inBattle) return;
    disableFlee();

    // 적 선제공격 체크
    if (checkEnemyPreemptiveAttack()) return;

    // 턴 시작 처리
    processPlayerTurn();

    // 공격 실행
    const totalDamage = executePlayerAttack(false);

    // 추가 공격 (multiHit) - 기본 확률 + 근원 강화 재판정으로 연쇄 발동
    const multiHitChance = getMultiHitChance();
    let multiHitCount = 0;
    while (multiHitChance > 0 && checkProbabilityWithReroll(multiHitChance) && gameState.currentEnemy.hp > 0) {
        multiHitCount++;
        addBattleLog(`⚡ 추가 공격! (${multiHitCount}연속)`);
        executePlayerAttack(false);
    }

    if (gameState.currentEnemy.hp <= 0) {
        enemyDefeated();
    } else {
        enemyCounterAttack();
    }
    updateBattleUI();
}

// 실제 공격 데미지 계산 및 적용
function executePlayerAttack(isSkill = false, skillDamage = 0) {
    const playerAtk = isSkill ? skillDamage : getPlayerAtk();
    const damageMultiplier = getDamageMultiplier();
    const isCrit = Math.random() * 100 < getCritChance();

    // 야수의 본능 보너스 사용 후 리셋
    if (gameState.beastInstinctBonus > 0) {
        gameState.beastInstinctBonus = 0;
    }

    const isEnemyDodge = gameState.currentEnemy.dodge && Math.random() * 100 < gameState.currentEnemy.dodge;

    let damage = Math.floor(playerAtk * damageMultiplier);

    // 보스킬러 보너스
    if (gameState.currentEnemy.isBoss || gameState.currentEnemy.isMiniBoss) {
        const bossBonus = getBossKillerBonus();
        if (bossBonus > 0) {
            damage = Math.floor(damage * (1 + bossBonus));
        }
    }

    // 첫타 보너스 (전투당 첫 공격)
    const isFirstHit = !gameState.dungeon.firstHitUsed;
    if (isFirstHit) {
        const firstHitBonus = getFirstHitBonus();
        if (firstHitBonus > 0) {
            damage = Math.floor(damage * (1 + firstHitBonus));
        }
        gameState.dungeon.firstHitUsed = true;
    }

    // 처형 보너스 (적 HP 30% 이하)
    const enemyHpPercent = gameState.currentEnemy.hp / gameState.currentEnemy.maxHp;
    const isExecute = enemyHpPercent <= 0.3;
    if (isExecute) {
        const executeBonus = getExecuteBonus();
        if (executeBonus > 0) {
            damage = Math.floor(damage * (1 + executeBonus));
        }
    }

    if (isCrit) damage = Math.floor(damage * getCritDamage() / 100);
    if (isEnemyDodge) damage = Math.floor(damage * 0.5);

    // 디버프로 인한 받는 피해 증가 적용
    damage = Math.floor(damage * getEnemyDebuffDamageTaken());

    gameState.currentEnemy.hp -= damage;
    const logParts = [`${isSkill ? '' : '공격! '}${damage} 피해!`];
    if (isCrit) logParts.push('(치명타!)');
    if (isEnemyDodge) logParts.push('(적 부분 회피!)');
    if (isFirstHit && getFirstHitBonus() > 0) logParts.push('(첫타!)');
    if (isExecute && getExecuteBonus() > 0) logParts.push('(처형!)');
    addBattleLog(logParts.join(' '));

    // 흡혈 효과
    applyLifeSteal(damage);

    // 치명타 시 MP 회복 (마력 폭발)
    if (isCrit) {
        applyCritMpRestore();
    }

    // 디버프 적용 시도
    tryApplyDebuffs();

    return damage;
}

// 치명타 시 MP 회복 (마력 폭발 패시브)
function applyCritMpRestore() {
    gameState.equippedSkills.forEach(skill => {
        if (skill?.type === 'passive' && skill.effect === 'critMpRestore') {
            const mpRestore = Math.floor(gameState.player.maxMp * (getPassiveValue(skill) / 100));
            if (mpRestore > 0) {
                gameState.player.mp = Math.min(gameState.player.maxMp, gameState.player.mp + mpRestore);
                addBattleLog(`MP +${mpRestore} (마력 폭발)`);
            }
        }
    });
}

// 턴 처리 (쿨타임 감소, MP 재생, 디버프 피해 등)
function processPlayerTurn() {
    tickCooldowns();
    tickMpRegen();
    // 적 디버프 피해 처리
    processDebuffDamage();
}

// 흡혈 효과 (기본 확률 + 근원 강화 재판정)
function applyLifeSteal(damage) {
    const { chance, healPercent } = getLifeStealInfo();
    if (chance > 0 && checkProbabilityWithReroll(chance)) {
        const heal = Math.floor(damage * healPercent);
        if (heal > 0) {
            gameState.player.hp = Math.min(gameState.player.maxHp, gameState.player.hp + heal);
            addBattleLog(`HP +${heal} (흡혈)`);
        }
    }
}

function enemyCounterAttack() {
    // 스턴으로 인한 반격 불가 체크
    if (checkStunBlockCounter()) {
        endPlayerTurn();
        return;
    }

    if (gameState.currentEnemy.stunned) {
        addBattleLog(`${gameState.currentEnemy.name}은(는) 스턴 상태!`);
        gameState.currentEnemy.stunned = false;
        endPlayerTurn();
        return;
    }

    // 은신 버프 체크
    if (checkAndConsumeStealthBuff()) {
        endPlayerTurn();
        return;
    }

    // 디버프로 인한 공격력 감소 적용
    const enemyAtk = Math.floor(gameState.currentEnemy.atk * getEnemyDebuffAtkReduction());
    const enemyCrit = gameState.currentEnemy.crit || 0;
    const isCrit = Math.random() * 100 < enemyCrit;
    const isDodge = Math.random() * 100 < getDodgeChance();

    const originalDamage = isCrit ? Math.floor(enemyAtk * 1.5) : enemyAtk;
    let baseDamage = originalDamage;
    if (isDodge) {
        baseDamage = Math.floor(baseDamage * 0.5);
        // 야수의 본능 패시브 체크
        const beastInstinctSkill = gameState.equippedSkills.find(
            s => s?.type === 'passive' && s.effect === 'beastInstinct'
        );
        if (beastInstinctSkill) {
            gameState.beastInstinctBonus = getPassiveValue(beastInstinctSkill);
        }
    }
    let damage = calculateDamageTaken(baseDamage, isGuarding, true, originalDamage); // isCounter = true

    // 스킬로 인한 반격 피해 감소 (방패 강타 등)
    if (gameState.skillCounterReduction > 0) {
        damage = Math.floor(damage * (1 - gameState.skillCounterReduction));
    }

    gameState.player.hp -= damage;
    const logParts = [`적의 반격! ${damage} 피해`];
    if (isCrit) logParts.push('(치명타!)');
    if (isDodge) logParts.push('(부분 회피!)');
    if (isGuarding) logParts.push('(방어!)');
    if (gameState.skillCounterReduction > 0) logParts.push('(피해 감소!)');
    addBattleLog(logParts.join(' '));
    isGuarding = false;

    // 피해 반사 (reflect) - 감소 이전 피해량 기준
    const reflectPercent = getReflectPercent();
    if (reflectPercent > 0 && originalDamage > 0) {
        const reflectDamage = Math.floor(originalDamage * reflectPercent);
        gameState.currentEnemy.hp -= reflectDamage;
        addBattleLog(`🦔 ${reflectDamage} 피해 반사!`);

        // 반사로 적 처치 체크
        if (gameState.currentEnemy.hp <= 0) {
            endPlayerTurn();
            enemyDefeated();
            return;
        }
    }

    // 반사 피해 (멍청한 희생) - 감소 이전 피해량 기준
    applyThornsDamage(originalDamage);
    if (gameState.currentEnemy && gameState.currentEnemy.hp <= 0) {
        endPlayerTurn();
        enemyDefeated();
        return;
    }

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

    // MP 소모 감소 적용
    const actualMpCost = Math.ceil(skill.mpCost * (1 - getMpSavePercent()));

    if (gameState.player.mp < actualMpCost) {
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

    gameState.player.mp -= actualMpCost;
    const weaponBonus = getWeaponBonus(skillCharacter);

    // 쿨타임 적용
    applyCooldown(skill);

    addBattleLog(`[${skill.name}] 사용!`);

    // === 버프 스킬 ===
    if (skill.type === 'buff') {
        applyBuff(skill, weaponBonus);
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

    // === MP 고정 + 절반 회복 스킬 ===
    if (skill.effect === 'mpRecoverHalf') {
        const baseRecover = skill.value || 0;
        const halfRecover = Math.floor(gameState.player.maxMp / 2);
        const recoverAmount = baseRecover + halfRecover;
        gameState.player.mp = Math.min(gameState.player.maxMp, gameState.player.mp + recoverAmount);
        addBattleLog(`MP +${recoverAmount} 회복! (${baseRecover} + 절반 ${halfRecover})`);
        endPlayerTurn();
        updateBattleUI();
        return;
    }

    // === 그림자 도약 (회피 버프 + 적 회피 무시) ===
    if (skill.effect === 'shadowLeap') {
        // 회피 버프 적용
        gameState.activeBuffs = gameState.activeBuffs.filter(b => b.id !== skill.id);
        gameState.activeBuffs.push({
            id: skill.id,
            name: skill.name,
            icon: '🌑',
            turns: skill.buffTurns,
            effect: 'dodgeBoost',
            value: 30
        });
        // 적 회피 무시 플래그 설정
        gameState.ignoreEnemyDodge = true;
        addBattleLog(`🌑 ${skill.name} 발동! (회피 +30%, ${skill.buffTurns}턴)`);
        addBattleLog(`다음 공격 시 적 회피 무시!`);
        endPlayerTurn();
        updateBattleUI();
        return;
    }

    // === 전투 함성 (적 약화 + 아군 방어) ===
    if (skill.effect === 'warcry') {
        // 적 공격력 감소 디버프
        gameState.currentEnemy.debuffs = gameState.currentEnemy.debuffs || {};
        gameState.currentEnemy.debuffs.warcry = skill.debuffTurns;
        // 아군 피해감소 버프
        gameState.activeBuffs = gameState.activeBuffs.filter(b => b.id !== skill.id);
        gameState.activeBuffs.push({
            id: skill.id,
            name: skill.name,
            icon: '📯',
            turns: skill.debuffTurns,
            effect: 'defBoost',
            value: 0.1
        });
        addBattleLog(`📯 ${skill.name}! 적 공격력 -20%, 피해감소 +10% (${skill.debuffTurns}턴)`);
        endPlayerTurn();
        updateBattleUI();
        return;
    }

    // === 응급 처치 (HP 회복) ===
    if (skill.effect === 'heal') {
        const healAmount = Math.floor(gameState.player.maxHp * skill.value * (1 + weaponBonus / 100));
        gameState.player.hp = Math.min(gameState.player.maxHp, gameState.player.hp + healAmount);
        addBattleLog(`💚 HP +${healAmount} 회복!`);
        endPlayerTurn();
        updateBattleUI();
        return;
    }

    // === 적 최대 체력 비례 데미지 스킬 (방패 강타) ===
    if (skill.effect === 'enemyMaxHpDamage') {
        const baseHpDamage = gameState.currentEnemy.maxHp * (skill.value / 100);
        const hpDamage = Math.floor(baseHpDamage * (1 + weaponBonus / 100));
        gameState.currentEnemy.hp -= hpDamage;
        addBattleLog(`🛡️ ${skill.name}! ${hpDamage} 피해!`);

        // 흡혈 효과
        applyLifeSteal(hpDamage);

        if (gameState.currentEnemy.hp <= 0) {
            enemyDefeated();
        } else {
            enemyCounterAttack();
        }
        updateBattleUI();
        return;
    }

    // === 데미지 스킬 ===
    if (skill.damage || skill.damageMult) {
        const hits = skill.hits || 1;
        const damageMultiplier = getDamageMultiplier();
        const skillDmgBonus = 1 + getSkillDmgBonus(); // 스킬 데미지 보너스
        let totalDamage = 0;

        // 마법 데미지나 적 회피 무시 효과 체크
        const ignoresDodge = skill.effect === 'magicDamage' || gameState.ignoreEnemyDodge;
        // 그림자 도약 사용 후 적 회피 무시 플래그 해제
        if (gameState.ignoreEnemyDodge) {
            gameState.ignoreEnemyDodge = false;
        }

        for (let i = 0; i < hits; i++) {
            // 100% 치명타 스킬 체크
            const isCrit = skill.effect === 'guaranteedCrit' ? true : (Math.random() * 100 < getCritChance());

            // 야수의 본능 보너스 사용 후 리셋 (첫 타격에만 적용)
            if (i === 0 && gameState.beastInstinctBonus > 0) {
                gameState.beastInstinctBonus = 0;
            }

            // 회피 불가 스킬인지 체크
            let isEnemyDodge = false;
            if (!ignoresDodge) {
                const enemyDodge = Math.max(0, (gameState.currentEnemy.dodge || 0) - getEnemyDebuffDodgeReduction());
                isEnemyDodge = enemyDodge > 0 && Math.random() * 100 < enemyDodge;
            }

            // damageMult가 있으면 플레이어 공격력 기반, 없으면 고정 데미지
            let skillBaseDamage = skill.damageMult
                ? getPlayerAtk() * skill.damageMult
                : skill.damage;

            // 최대 체력 비례 추가 피해 (해머 스윙)
            if (skill.effect === 'maxHpDamage') {
                const maxHpBonus = getMaxHp() * (skill.value / 100);
                skillBaseDamage += maxHpBonus;
            }

            let baseDamage = Math.floor(skillBaseDamage * (1 + weaponBonus / 100) * damageMultiplier * skillDmgBonus);

            // 보스킬러 보너스
            if (gameState.currentEnemy.isBoss || gameState.currentEnemy.isMiniBoss) {
                const bossBonus = getBossKillerBonus();
                if (bossBonus > 0) {
                    baseDamage = Math.floor(baseDamage * (1 + bossBonus));
                }
            }

            if (isCrit) baseDamage = Math.floor(baseDamage * getCritDamage() / 100);
            if (isEnemyDodge) baseDamage = Math.floor(baseDamage * 0.5);

            // 디버프로 인한 받는 피해 증가 적용
            baseDamage = Math.floor(baseDamage * getEnemyDebuffDamageTaken());

            gameState.currentEnemy.hp -= baseDamage;
            totalDamage += baseDamage;

            const logParts = [`${baseDamage} 피해!`];
            if (skill.effect === 'magicDamage') logParts.unshift('✨');
            if (isCrit) logParts.push('(치명타!)');
            if (isEnemyDodge) logParts.push('(적 부분 회피!)');
            addBattleLog(logParts.join(' '));

            // 치명타 시 MP 회복 (마력 폭발)
            if (isCrit) {
                applyCritMpRestore();
            }
        }

        // 흡혈 효과
        applyLifeSteal(totalDamage);

        // 스킬 자체 흡혈 효과 (물어 뜯기)
        if (skill.effect === 'skillLifeSteal' && skill.healPercent) {
            const effectiveHealPercent = skill.healPercent * (1 + weaponBonus / 100);
            const heal = Math.floor(totalDamage * (effectiveHealPercent / 100));
            if (heal > 0) {
                gameState.player.hp = Math.min(getMaxHp(), gameState.player.hp + heal);
                addBattleLog(`HP +${heal} (흡혈)`);
            }
        }

        // 스킬 사용 시 MP 회복 (마력 화살)
        if (skill.mpRestore && skill.mpRestoreChance) {
            if (Math.random() * 100 < skill.mpRestoreChance) {
                gameState.player.mp = Math.min(gameState.player.maxMp, gameState.player.mp + skill.mpRestore);
                addBattleLog(`MP +${skill.mpRestore}`);
            }
        }

        // 스턴 효과
        if (skill.effect === 'stun') {
            gameState.currentEnemy.stunned = true;
            addBattleLog('적 스턴!');
        }

        // 반격 피해 감소 플래그 (방패 강타)
        if (skill.effect === 'counterBlock') {
            gameState.skillCounterReduction = 0.5; // 50% 감소
        }

        if (gameState.currentEnemy.hp <= 0) {
            enemyDefeated();
        } else if (skill.effect === 'noCounter') {
            // 반격 없음
            endPlayerTurn();
        } else {
            enemyCounterAttack();
        }

        // 반격 피해 감소 플래그 리셋
        gameState.skillCounterReduction = 0;
    }

    updateBattleUI();
}

function enemyDefeated() {
    const enemy = gameState.currentEnemy;
    gameState.dungeon.inBattle = false;

    // 모드별 보상 배율 적용
    const rewardMult = modeSettings[gameState.gameMode].rewardMult;
    let goldReward = Math.floor(enemy.goldReward * rewardMult);
    let expReward = Math.floor(enemy.expReward * rewardMult);

    // 행운 스탯 보너스 (1% per point)
    const luckBonus = 1 + (getEffectiveStat('luk') * 0.01);
    goldReward = Math.floor(goldReward * luckBonus);
    expReward = Math.floor(expReward * luckBonus);

    // 유물 효과 추가 적용
    gameState.tempRelics.forEach(relic => {
        const goldVal = getRelicEffectValue(relic, 'gold');
        const expVal = getRelicEffectValue(relic, 'exp');
        const rewardVal = getRelicEffectValue(relic, 'reward');
        if (goldVal !== null) goldReward = Math.floor(goldReward * goldVal);
        if (expVal !== null) expReward = Math.floor(expReward * expVal);
        if (rewardVal !== null) {
            goldReward = Math.floor(goldReward * rewardVal);
            expReward = Math.floor(expReward * rewardVal);
        }
    });

    // 부적 효과 (+3% per purchase)
    const expTalismanBonus = 1 + (gameState.talismanPurchases.exp * 0.02);
    const goldTalismanBonus = 1 + (gameState.talismanPurchases.gold * 0.02);
    expReward = Math.floor(expReward * expTalismanBonus);
    goldReward = Math.floor(goldReward * goldTalismanBonus);

    gameState.dungeon.pendingGold += goldReward;
    gameState.dungeon.pendingExp += expReward;

    addBattleLog(`🎉 ${enemy.name} 처치!`);
    addBattleLog(`💰 +${goldReward} 골드, +${expReward} 경험치`);

    // 처치 시 HP 회복 (killHeal)
    const killHealPercent = getKillHealPercent();
    if (killHealPercent > 0) {
        const healAmount = Math.floor(gameState.player.maxHp * killHealPercent);
        gameState.player.hp = Math.min(gameState.player.maxHp, gameState.player.hp + healAmount);
        addBattleLog(`HP +${healAmount} (처치 회복)`);
    }

    // 처치 시 MP 회복 (killMana)
    const killManaPercent = getKillManaPercent();
    if (killManaPercent > 0) {
        const manaAmount = Math.floor(gameState.player.maxMp * killManaPercent);
        gameState.player.mp = Math.min(gameState.player.maxMp, gameState.player.mp + manaAmount);
        addBattleLog(`MP +${manaAmount} (처치 회복)`);
    }

    // 강화석 드랍 (하드 모드에서 더 많이)
    let stoneDropChance = enemy.isBoss ? 1.0 : enemy.isMiniBoss ? 0.5 : 0.3;
    let stoneAmount = enemy.isBoss ? 3 : enemy.isMiniBoss ? 2 : 1;
    if (gameState.gameMode === 'hard') stoneAmount *= 2;
    if (gameState.gameMode === 'normal') stoneAmount = Math.ceil(stoneAmount * 1.5);

    if (Math.random() < stoneDropChance) {
        gameState.dungeon.pendingStones += stoneAmount;
        addBattleLog(`💎 강화석 +${stoneAmount}개 획득!`);
    }

    // 근원석 드랍 (보스/중간보스에서만)
    if (enemy.isBoss || enemy.isMiniBoss) {
        let originAmount = enemy.isBoss ? 2 : 1;
        if (gameState.gameMode === 'hard') originAmount *= 2;
        if (gameState.gameMode === 'normal') originAmount = Math.ceil(originAmount * 1.5);
        gameState.dungeon.pendingOriginStones += originAmount;
        addBattleLog(`🔮 근원석 +${originAmount}개 획득!`);
    }

    // 최고 기록 갱신
    if (gameState.dungeon.currentFloor > gameState.dungeon.highestFloor) {
        gameState.dungeon.highestFloor = gameState.dungeon.currentFloor;
    }

    // 무한의 전장 최고 기록 갱신
    if (gameState.gameMode === 'infinite' && gameState.dungeon.currentFloor > gameState.dungeon.infiniteHighestFloor) {
        gameState.dungeon.infiniteHighestFloor = gameState.dungeon.currentFloor;
    }

    // 5층마다 유물 보상 (5, 10, 15, 20...)
    const isRelicFloor = gameState.dungeon.currentFloor % 5 === 0;

    if (isRelicFloor) {
        handleRelicFloorClear();
        return;
    }

    updateDungeonUI();

    // 바로 다음 층 이동
    gameState.dungeon.currentFloor++;
    startBattle();
}

// 5층 단위 클리어 처리 (유물 보상)
function handleRelicFloorClear() {
    const maxFloor = modeSettings[gameState.gameMode].maxFloor;
    const currentFloor = gameState.dungeon.currentFloor;
    const isBossFloor = currentFloor % 10 === 0;

    // 게임 클리어 체크
    if (currentFloor >= maxFloor) {
        handleGameClear();
        return;
    }

    // 보상 페이즈 초기화
    // 중간보스: tier1 -> done (1단계 유물 + 30% 회복)
    // 보스: tier1 -> tier2 -> skill -> done (1단계 + 2단계 유물 + 스킬 + 30% 회복)
    gameState.rewardPhase = 'tier1';
    gameState.isBossReward = isBossFloor;

    // 1단계(common) 유물 선택지 생성
    generateRelicChoices('common');

    // 보스층에는 2단계 유물과 스킬도 미리 생성
    if (isBossFloor) {
        generateRelicChoices2('rare');
        generateSkillChoices();
    }

    // 보스 클리어 화면 표시
    showBossClearScreen(isBossFloor);
}

// 2단계 유물 선택지 생성 (보스용)
function generateRelicChoices2(fixedRarity) {
    gameState.relicChoices2 = [];
    const selectedIds = new Set();
    const allowedRarities = fixedRarity ? [fixedRarity] : null;

    while (gameState.relicChoices2.length < 3) {
        const relic = selectRelicByRarity(allowedRarities);
        if (!selectedIds.has(relic.id)) {
            selectedIds.add(relic.id);
            gameState.relicChoices2.push({ ...relic });
        }
    }
}


// 등급별 유물 선택 (확률 기반, 허용 등급 제한 가능)
function selectRelicByRarity(allowedRarities = null) {
    // 허용된 등급만 필터링
    const filteredWeights = {};
    for (const [rarity, weight] of Object.entries(rarityWeights)) {
        if (!allowedRarities || allowedRarities.includes(rarity)) {
            filteredWeights[rarity] = weight;
        }
    }

    const totalWeight = Object.values(filteredWeights).reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;

    let selectedRarity = Object.keys(filteredWeights)[0] || 'common';
    for (const [rarity, weight] of Object.entries(filteredWeights)) {
        random -= weight;
        if (random <= 0) {
            selectedRarity = rarity;
            break;
        }
    }

    // 해당 등급의 유물 중 랜덤 선택
    const relicsOfRarity = relicsData.filter(r => r.rarity === selectedRarity);
    return relicsOfRarity[Math.floor(Math.random() * relicsOfRarity.length)];
}

// 유물 선택지 3개 생성 (중복 허용)
// fixedRarity: 'common', 'rare' 등 특정 등급만 등장
function generateRelicChoices(fixedRarity = null) {
    gameState.relicChoices = [];
    const selectedIds = new Set(); // 같은 선택지에서는 중복 방지
    const allowedRarities = fixedRarity ? [fixedRarity] : null;

    while (gameState.relicChoices.length < 3) {
        const relic = selectRelicByRarity(allowedRarities);
        // 이번 선택지에서 같은 유물이 나오지 않도록
        if (!selectedIds.has(relic.id)) {
            selectedIds.add(relic.id);
            gameState.relicChoices.push({ ...relic }); // 복사본 저장
        }
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
    // 고정 시작 스킬: 각 캐릭터의 공격 액티브 스킬
    return [
        { ...skillsData.cat[0], character: 'cat' },      // 폭렬참 (1.5배 데미지)
        { ...skillsData.elf[0], character: 'elf' },      // 별빛 화살 (마법 데미지)
        { ...skillsData.dwarf[0], character: 'dwarf' },  // 방패 강타 (스턴)
        { ...skillsData.human[0], character: 'human' }   // 정밀 사격 (반격없음)
    ];
}

function showBossClearScreen(isBossFloor = false) {
    // 확인 버튼 섹션만 표시, 나머지는 숨김
    document.getElementById('boss-confirm-section').classList.remove('hidden');
    document.getElementById('relic-choice-section').classList.add('hidden');
    document.getElementById('skill-rest-section').classList.add('hidden');
    document.getElementById('relic-replace-section').classList.add('hidden');

    // 현재 구역 정보 표시
    const floorType = isBossFloor ? '보스' : '중간보스';
    document.getElementById('boss-confirm-section').querySelector('h2').textContent =
        `${gameState.dungeon.currentFloor}구역 ${floorType} 클리어!`;

    // 보상 안내 메시지
    const rewardMsg = isBossFloor
        ? '1단계 유물 + 2단계 유물 + 스킬 변경 + HP 30% 회복!'
        : '1단계 유물 + HP 30% 회복!';
    document.getElementById('boss-confirm-section').querySelector('.boss-confirm-msg').textContent = rewardMsg;

    showScreen('boss-clear-screen');
}

function showBossRewardChoices() {
    // 확인 버튼 숨기고 선택지 표시
    document.getElementById('boss-confirm-section').classList.add('hidden');
    document.getElementById('relic-choice-section').classList.remove('hidden');
    document.getElementById('skill-rest-section').classList.add('hidden'); // 스킬은 나중에

    // 교체 섹션 숨김
    document.getElementById('relic-replace-section').classList.add('hidden');

    // 1단계 유물 선택 안내
    document.getElementById('relic-choice-desc').textContent = '1단계 유물을 선택하세요 (일반)';

    // 유물 선택지 표시 (3개)
    const relicGrid = document.getElementById('relic-choice-grid');
    relicGrid.innerHTML = '';

    if (gameState.relicChoices.length > 0) {
        gameState.relicChoices.forEach(relic => {
            const ownedCount = gameState.tempRelics.filter(r => r.id === relic.id && r.rarity === relic.rarity).length;
            const tags = getRelicTags(relic);
            const tagsHtml = tags.map(t => `<span class="tag tag-${t}">태그 | ${t}</span>`).join('');
            const btn = document.createElement('button');
            btn.className = `relic-choice-btn rarity-${relic.rarity}`;
            btn.innerHTML = `
                <div class="relic-rarity rarity-${relic.rarity}">${rarityNames[relic.rarity]}</div>
                <div class="relic-icon">${relic.icon}</div>
                <div class="relic-name">${relic.name}</div>
                <div class="relic-desc">${getRelicDescFull(relic)}</div>
                <div class="relic-tags">${tagsHtml}</div>
                ${ownedCount > 0 ? `<div class="relic-owned">보유: ${ownedCount}개</div>` : ''}
            `;
            btn.addEventListener('click', () => selectRelic(relic));
            relicGrid.appendChild(btn);
        });
    } else {
        relicGrid.innerHTML = '<p class="no-relic-msg">획득 가능한 유물이 없습니다</p>';
    }
}

// 유물 선택 (보상 다 받은 후 합성)
function selectRelic(relic) {
    // 유물 바로 추가
    gameState.tempRelics.push({ ...relic });

    // 보상 페이즈에 따라 다음 단계로 이동
    if (gameState.rewardPhase === 'tier1') {
        if (gameState.isBossReward) {
            // 보스: 2단계 유물 선택으로
            gameState.rewardPhase = 'tier2';
            showTier2RelicChoices();
        } else {
            // 일반: 합성 단계로
            gameState.rewardPhase = 'combine';
            showRewardCombinePhase();
        }
    } else if (gameState.rewardPhase === 'tier2') {
        // 2단계 유물 받은 후 합성 단계로
        gameState.rewardPhase = 'combine';
        showRewardCombinePhase();
    }
}

// 보상 중 합성 선택 상태
let rewardCombineSelected = [];

// 보상 중 유물 합성 페이즈 표시
function showRewardCombinePhase() {
    document.getElementById('relic-choice-section').classList.add('hidden');
    document.getElementById('reward-combine-section').classList.remove('hidden');

    rewardCombineSelected = [];
    updateRewardCombineUI();
}

// 보상 합성 UI 업데이트
function updateRewardCombineUI() {
    const grid = document.getElementById('reward-combine-relics');
    grid.innerHTML = '';

    if (gameState.tempRelics.length < 2) {
        grid.innerHTML = '<p style="color: #888;">합성 가능한 유물이 부족합니다</p>';
        document.getElementById('btn-reward-combine').disabled = true;
        return;
    }

    gameState.tempRelics.forEach((relic, idx) => {
        const tags = getRelicTags(relic);
        const item = document.createElement('div');
        item.className = `reward-combine-item rarity-${relic.rarity}`;
        if (rewardCombineSelected.includes(idx)) {
            item.classList.add('selected');
        }
        item.innerHTML = `
            <div class="relic-rarity rarity-${relic.rarity}">${rarityNames[relic.rarity]}</div>
            <div class="relic-icon">${relic.icon}</div>
            <div class="relic-name">${relic.name}</div>
            <div class="relic-desc">${relic.desc}</div>
            <div class="relic-tag">[${tags.join(', ')}]</div>
        `;
        item.addEventListener('click', () => toggleRewardCombineSelect(idx));
        grid.appendChild(item);
    });

    updateRewardCombineButton();
}

// 합성 유물 선택/해제
function toggleRewardCombineSelect(idx) {
    const pos = rewardCombineSelected.indexOf(idx);
    if (pos !== -1) {
        rewardCombineSelected.splice(pos, 1);
    } else if (rewardCombineSelected.length < 2) {
        rewardCombineSelected.push(idx);
    }
    updateRewardCombineUI();
}

// 합성 버튼 상태 업데이트
function updateRewardCombineButton() {
    const btn = document.getElementById('btn-reward-combine');
    const selected = document.getElementById('reward-combine-selected');

    if (rewardCombineSelected.length === 2) {
        const r1 = gameState.tempRelics[rewardCombineSelected[0]];
        const r2 = gameState.tempRelics[rewardCombineSelected[1]];
        const tags1 = getRelicTags(r1);
        const tags2 = getRelicTags(r2);
        const commonTags = tags1.filter(t => tags2.includes(t));

        selected.innerHTML = `
            <span>${r1.icon} ${r1.name}</span>
            <span>+</span>
            <span>${r2.icon} ${r2.name}</span>
        `;

        if (r1.rarity === 'legendary' || r2.rarity === 'legendary') {
            btn.disabled = true;
            btn.textContent = '전설 등급 합성 불가';
        } else if (r1.rarity !== r2.rarity) {
            btn.disabled = true;
            btn.textContent = '같은 등급만 합성 가능';
        } else if (commonTags.length === 0) {
            btn.disabled = true;
            btn.textContent = '공통 태그 없음';
        } else {
            btn.disabled = false;
            const nextRarity = getNextRarity(r1.rarity);
            btn.textContent = `합성 [${commonTags[0]}] → ${rarityNames[nextRarity]}`;
        }
    } else {
        selected.innerHTML = `<span style="color: #888;">유물 2개를 선택하세요</span>`;
        btn.disabled = true;
        btn.textContent = `합성하기 (${rewardCombineSelected.length}/2)`;
    }
}

// 합성 결과 선택지 저장
let combineResultChoices = [];
let combineRemoveIndices = [];

// 보상 합성 실행 - 3개 선택지 표시
function executeRewardCombine() {
    if (rewardCombineSelected.length !== 2) return;

    const idx1 = rewardCombineSelected[0];
    const idx2 = rewardCombineSelected[1];
    const r1 = gameState.tempRelics[idx1];
    const r2 = gameState.tempRelics[idx2];

    const tags1 = getRelicTags(r1);
    const tags2 = getRelicTags(r2);
    const commonTags = tags1.filter(t => tags2.includes(t));

    if (commonTags.length === 0 || r1.rarity !== r2.rarity) return;

    const nextRarity = getNextRarity(r1.rarity);

    // 3개의 선택지 생성 (중복 방지)
    combineResultChoices = [];
    const usedIds = new Set();
    for (let i = 0; i < 3; i++) {
        let relic;
        let attempts = 0;
        do {
            relic = getRandomRelicWithTag(commonTags[0], nextRarity);
            attempts++;
        } while (usedIds.has(relic.id) && attempts < 10);
        usedIds.add(relic.id);
        combineResultChoices.push({ ...relic });
    }

    // 제거할 인덱스 저장
    combineRemoveIndices = [idx1, idx2].sort((a, b) => b - a);

    // 합성 결과 선택 UI 표시
    showCombineResultChoices();
}

// 합성 결과 선택 UI 표시
function showCombineResultChoices() {
    document.getElementById('reward-combine-section').classList.add('hidden');

    // 합성 결과 섹션이 없으면 동적으로 생성
    let resultSection = document.getElementById('combine-result-section');
    if (!resultSection) {
        resultSection = document.createElement('div');
        resultSection.id = 'combine-result-section';
        resultSection.className = 'reward-section';
        document.getElementById('boss-clear-screen').appendChild(resultSection);
    }

    resultSection.innerHTML = `
        <h2>✨ 근원 합성 결과</h2>
        <p style="color: #aaa; margin-bottom: 15px;">"3개 중 하나를 선택해." - 잿빛 소녀</p>
        <div id="combine-result-grid" class="relic-choice-grid"></div>
    `;
    resultSection.classList.remove('hidden');

    const grid = document.getElementById('combine-result-grid');

    combineResultChoices.forEach((relic, idx) => {
        const tags = getRelicTags(relic);
        const tagsHtml = tags.map(t => `<span class="tag tag-${t}">태그 | ${t}</span>`).join('');
        const btn = document.createElement('button');
        btn.className = `relic-choice-btn rarity-${relic.rarity}`;
        btn.innerHTML = `
            <div class="relic-rarity rarity-${relic.rarity}">${rarityNames[relic.rarity]}</div>
            <div class="relic-icon">${relic.icon}</div>
            <div class="relic-name">${relic.name}</div>
            <div class="relic-desc">${getRelicDescFull(relic)}</div>
            <div class="relic-tags">${tagsHtml}</div>
        `;
        btn.addEventListener('click', () => selectCombineResult(idx));
        grid.appendChild(btn);
    });
}

// 합성 결과 선택
function selectCombineResult(idx) {
    const selectedRelic = combineResultChoices[idx];

    // 기존 유물 제거
    combineRemoveIndices.forEach(i => gameState.tempRelics.splice(i, 1));

    // 선택한 유물 추가
    gameState.tempRelics.push({ ...selectedRelic });

    // UI 초기화
    document.getElementById('combine-result-section').classList.add('hidden');
    combineResultChoices = [];
    combineRemoveIndices = [];
    rewardCombineSelected = [];

    // 합성 UI로 돌아가서 계속 합성 가능
    document.getElementById('reward-combine-section').classList.remove('hidden');
    updateRewardCombineUI();

    // 결과 표시
    const selected = document.getElementById('reward-combine-selected');
    selected.innerHTML = `<span style="color: #50fa7b;">✨ ${selectedRelic.icon} ${selectedRelic.name} 획득!</span>`;
}

// 다음 보상 단계로 이동
function proceedToNextRewardPhase() {
    document.getElementById('reward-combine-section').classList.add('hidden');
    document.getElementById('combine-result-section')?.classList.add('hidden');

    if (gameState.rewardPhase === 'combine') {
        if (gameState.isBossReward) {
            // 보스: 스킬 선택으로
            gameState.rewardPhase = 'skill';
            showSkillChoicesOnly();
        } else {
            // 중간보스: 30% 회복 후 종료
            applyRewardHeal();
            proceedAfterRelicChoice();
        }
    }
}

// 2단계 유물 선택지 표시
function showTier2RelicChoices() {
    const relicGrid = document.getElementById('relic-choice-grid');
    relicGrid.innerHTML = '';

    document.getElementById('relic-choice-desc').textContent = '2단계 유물을 선택하세요 (희귀)';

    gameState.relicChoices2.forEach(relic => {
        const ownedCount = gameState.tempRelics.filter(r => r.id === relic.id && r.rarity === relic.rarity).length;
        const tags = getRelicTags(relic);
        const tagsHtml = tags.map(t => `<span class="tag tag-${t}">태그 | ${t}</span>`).join('');
        const btn = document.createElement('button');
        btn.className = `relic-choice-btn rarity-${relic.rarity}`;
        btn.innerHTML = `
            <div class="relic-rarity rarity-${relic.rarity}">${rarityNames[relic.rarity]}</div>
            <div class="relic-icon">${relic.icon}</div>
            <div class="relic-name">${relic.name}</div>
            <div class="relic-desc">${getRelicDescFull(relic)}</div>
            <div class="relic-tags">${tagsHtml}</div>
            ${ownedCount > 0 ? `<div class="relic-owned">보유: ${ownedCount}개</div>` : ''}
        `;
        btn.addEventListener('click', () => selectTier2Relic(relic));
        relicGrid.appendChild(btn);
    });
}

// 2단계 유물 선택
function selectTier2Relic(relic) {
    gameState.tempRelics.push({ ...relic });
    // 합성 단계로 이동
    gameState.rewardPhase = 'combine';
    document.getElementById('relic-choice-section').classList.add('hidden');
    showRewardCombinePhase();
}

// 스킬 선택지만 표시 (유물 선택 완료 후)
function showSkillChoicesOnly() {
    document.getElementById('relic-choice-section').classList.add('hidden');
    document.getElementById('skill-rest-section').classList.remove('hidden');

    const skillGrid = document.getElementById('skill-choice-grid');
    skillGrid.innerHTML = '';

    const charToWeapon = { cat: 'sword', elf: 'staff', dwarf: 'shield', human: 'bow' };
    const weaponNames = { sword: '검', staff: '지팡이', shield: '방패', bow: '활' };
    const typeNames = { attack: '공격', utility: '유틸', buff: '버프', passive: '패시브' };

    gameState.skillChoices.forEach(skill => {
        const btn = document.createElement('button');
        btn.className = 'skill-choice-btn';

        // 스킬 타입 표시
        const skillType = skill.subtype ? typeNames[skill.subtype] : typeNames[skill.type];
        const typeLabel = skill.type === 'passive' ? '[패시브]' : `[${skillType}]`;

        // 무기 보너스 표시
        const weapon = charToWeapon[skill.character];
        const weaponLevel = weapon ? gameState.weapons[weapon] : 0;
        const weaponBonus = weaponLevel > 0 ? weaponLevel * 5 : 0;
        const weaponName = weaponNames[weapon] || '';
        const weaponText = weaponBonus > 0 ? `<div class="skill-choice-weapon">🔧 ${weaponName} +${weaponLevel} (효과 +${weaponBonus}%)</div>` : '';

        btn.innerHTML = `
            <div class="skill-choice-name">${skill.name} ${typeLabel} ${skill.type !== 'passive' ? `(MP ${skill.mpCost})` : ''}</div>
            <div class="skill-choice-char">${skill.char}</div>
            <div class="skill-choice-desc">${skill.desc}</div>
            ${weaponText}
        `;
        btn.addEventListener('click', () => selectSkillFinal(skill));
        skillGrid.appendChild(btn);
    });
}

// 스킬 선택 (최종 - 보스 보상 마무리)
function selectSkillFinal(skill) {
    // 스킬 교체
    const characterOrder = ['cat', 'elf', 'dwarf', 'human'];
    const slotIndex = characterOrder.indexOf(skill.character);
    if (slotIndex !== -1) {
        gameState.equippedSkills[slotIndex] = skill;
    } else {
        const emptySlot = gameState.equippedSkills.findIndex(s => s === null);
        gameState.equippedSkills[emptySlot !== -1 ? emptySlot : 0] = skill;
    }
    updateSkillButtons();

    // 30% 회복 후 종료
    applyRewardHeal();
    proceedAfterRelicChoice();
}

// 보상 30% 체력 회복
function applyRewardHeal() {
    const healAmount = Math.floor(gameState.player.maxHp * 0.3);
    gameState.player.hp = Math.min(gameState.player.maxHp, gameState.player.hp + healAmount);
}

// 합성 결과 표시
function showCombineResult(oldRelic, newRelic) {
    document.getElementById('relic-choice-section').classList.add('hidden');
    document.getElementById('skill-rest-section').classList.add('hidden');

    const combineSection = document.getElementById('relic-combine-section');
    combineSection.classList.remove('hidden');

    const combineInfo = document.getElementById('combine-info');
    combineInfo.innerHTML = `
        <div class="combine-result-display">
            <div class="combine-old rarity-${oldRelic.rarity}">
                <span class="combine-icon">${oldRelic.icon}</span>
                <span class="combine-rarity">${rarityNames[oldRelic.rarity]}</span>
            </div>
            <div class="combine-arrow">→</div>
            <div class="combine-new rarity-${newRelic.rarity}">
                <span class="combine-icon">${newRelic.icon}</span>
                <span class="combine-name">${newRelic.name}</span>
                <span class="combine-rarity">${rarityNames[newRelic.rarity]}</span>
                <span class="combine-desc">${newRelic.desc}</span>
            </div>
        </div>
        <p class="combine-success-msg">"근원 합성 완료." - 잿빛 소녀</p>
    `;

    // 확인 버튼만 표시
    document.getElementById('btn-combine').classList.add('hidden');
    document.getElementById('btn-skip-combine').textContent = '확인';
}


// 다음 등급 반환
function getNextRarity(currentRarity) {
    const rarityOrder = ['common', 'rare', 'epic', 'legendary'];
    const currentIndex = rarityOrder.indexOf(currentRarity);
    if (currentIndex < rarityOrder.length - 1) {
        return rarityOrder[currentIndex + 1];
    }
    return null; // 전설은 더 이상 업그레이드 불가
}

// 개별 효과값 업그레이드 헬퍼
function upgradeEffectValue(effectType, value, mult) {
    if (effectType === 'gold' || effectType === 'exp') {
        // 배율형 효과는 (value - 1) * mult + 1
        return 1 + (value - 1) * mult;
    } else if (effectType === 'def') {
        // 피해 감소는 (1 - value) * mult 후 1에서 빼기
        return 1 - (1 - value) * mult;
    } else {
        return Math.floor(value * mult * 10) / 10;
    }
}

// 업그레이드된 유물 정보 생성
function getUpgradedRelic(relic) {
    const nextRarity = getNextRarity(relic.rarity);
    if (!nextRarity) return relic;

    // 효과값 증가율
    const valueMultiplier = {
        'common_to_rare': 1.5,
        'rare_to_epic': 1.5,
        'epic_to_legendary': 1.5
    };

    const key = `${relic.rarity}_to_${nextRarity}`;
    const mult = valueMultiplier[key] || 1.5;

    // 새 유물 생성
    const upgraded = { ...relic };
    upgraded.rarity = nextRarity;

    // 복합 효과 유물 처리
    if (relic.effects && relic.effects.length > 0) {
        upgraded.effects = relic.effects.map(e => ({
            effect: e.effect,
            value: upgradeEffectValue(e.effect, e.value, mult)
        }));
    }
    // 단일 효과 유물 처리
    else if (typeof upgraded.value === 'number') {
        upgraded.value = upgradeEffectValue(relic.effect, relic.value, mult);
    }

    // 설명 업데이트
    upgraded.desc = generateRelicDesc(upgraded);

    return upgraded;
}

// 유물 설명 생성
function generateRelicDesc(relic) {
    const effectDescs = {
        'atk': (v) => `공격력 +${Math.floor(v)}`,
        'mp': (v) => `최대 MP +${Math.floor(v)}`,
        'gold': (v) => `골드 +${Math.floor((v - 1) * 100)}%`,
        'exp': (v) => `경험치 +${Math.floor((v - 1) * 100)}%`,
        'dodge': (v) => `회피 +${Math.floor(v)}%`,
        'def': (v) => `피해 -${Math.floor((1 - v) * 100)}%`,
        'crit': (v) => `치명타 확률 +${Math.floor(v)}%`,
        'killMana': (v) => `처치 시 MP ${Math.floor(v * 100)}% 회복`,
        'critDmg': (v) => `치명타 데미지 +${Math.floor(v)}%`,
        'atkMult': (v) => `공격력 +${Math.floor(v * 100)}%`,
        'hpMult': (v) => `체력 +${Math.floor(v * 100)}%`,
        'allStats': (v) => `모든 스탯 +${Math.floor(v * 100)}%`,
        'strMult': (v) => `힘 +${Math.floor(v * 100)}%`,
        'dexMult': (v) => `민첩 +${Math.floor(v * 100)}%`,
        'intMult': (v) => `지능 +${Math.floor(v * 100)}%`,
        'vitMult': (v) => `활력 +${Math.floor(v * 100)}%`,
        'lukMult': (v) => `행운 +${Math.floor(v * 100)}%`,
        // 새 효과들
        'reflect': (v) => `피해의 ${Math.floor(v * 100)}% 반사`,
        'mpSave': (v) => `MP 소모 -${Math.floor(v * 100)}%`,
        'killHeal': (v) => `처치 시 HP ${Math.floor(v * 100)}% 회복`,
        'cooldownReduce': (v) => `스킬 쿨타임 -${Math.floor(v)}턴`,
        'bleed': (v) => v >= 1.0 ? `출혈 ${Math.floor(v)}중첩` : `출혈 ${Math.floor(v * 100)}%`,
        'weaken': (v) => v >= 1.0 ? `쇠약 ${Math.floor(v)}중첩` : `쇠약 ${Math.floor(v * 100)}%`,
        'stun': (v) => `스턴 ${Math.floor(v * 100)}%`,
        'freeze': (v) => v >= 1.0 ? `빙결 ${Math.floor(v)}중첩` : `빙결 ${Math.floor(v * 100)}%`,
        'reward': (v) => `골드/경험치 +${Math.floor((v - 1) * 100)}%`,
        'execute': (v) => `처형 피해 +${Math.floor(v * 100)}%`,
        'firstHit': (v) => `첫타 피해 +${Math.floor(v * 100)}%`,
        'bossKiller': (v) => `보스에게 피해 +${Math.floor(v * 100)}%`,
        'multiHit': (v) => `${Math.floor(v * 100)}% 확률로 추가 공격`,
        'skillDmg': (v) => `스킬 피해 +${Math.floor(v * 100)}%`
    };

    // 복합 효과 유물 처리
    if (relic.effects && relic.effects.length > 0) {
        return relic.effects.map(e => {
            const fn = effectDescs[e.effect];
            return fn ? fn(e.value) : '';
        }).filter(s => s).join(', ');
    }

    // 단일 효과 유물 처리
    const descFn = effectDescs[relic.effect];
    return descFn ? descFn(relic.value) : relic.desc;
}

// 유물 설명 + 근원 강화 보정 수치 표시
function getRelicDescWithEnhancement(relic) {
    const enhancementBonus = getOriginEnhancementBonus();
    const enhancementLevel = gameState.originEnhancement || 0;

    // 확률형 효과 목록
    const probabilityEffects = ['multiHit', 'lifeSteal', 'bleed', 'weaken', 'stun', 'freeze'];

    // 효과 값 포맷팅 (소수점 1자리)
    const formatValue = (v, multiplier = 100) => (v * multiplier).toFixed(1);

    // 효과별 설명 생성 (근원 강화 보정 포함)
    const getEnhancedDesc = (effect, baseValue) => {
        const isProbability = probabilityEffects.includes(effect);

        if (isProbability) {
            // 확률형: 기본확률 (+재판정확률), 레벨당 5%
            const rerollChance = baseValue * (enhancementLevel * 5 / 100);
            const basePercent = formatValue(baseValue);
            const rerollPercent = formatValue(rerollChance);

            switch(effect) {
                case 'multiHit':
                    return rerollChance > 0
                        ? `${basePercent}% 추가공격 (+${rerollPercent}%)`
                        : `${basePercent}% 추가공격`;
                case 'lifeSteal':
                    return rerollChance > 0
                        ? `${basePercent}% 흡혈 (+${rerollPercent}%)`
                        : `${basePercent}% 흡혈`;
                case 'bleed':
                    return rerollChance > 0
                        ? `${basePercent}% 출혈 (+${rerollPercent}%)`
                        : `${basePercent}% 출혈`;
                case 'weaken':
                    return rerollChance > 0
                        ? `${basePercent}% 쇠약 (+${rerollPercent}%)`
                        : `${basePercent}% 쇠약`;
                case 'stun':
                    return rerollChance > 0
                        ? `${basePercent}% 스턴 (+${rerollPercent}%)`
                        : `${basePercent}% 스턴`;
                case 'freeze':
                    return rerollChance > 0
                        ? `${basePercent}% 빙결 (+${rerollPercent}%)`
                        : `${basePercent}% 빙결`;
            }
        } else {
            // 비확률형: 기본값 (→강화값)
            const enhancedValue = baseValue * (1 + enhancementBonus);

            switch(effect) {
                case 'atkMult':
                    return enhancementBonus > 0
                        ? `공격력 +${formatValue(baseValue)}% (→${formatValue(enhancedValue)}%)`
                        : `공격력 +${formatValue(baseValue)}%`;
                case 'critDmg':
                    return enhancementBonus > 0
                        ? `치명타 피해 +${formatValue(baseValue, 1)}% (→${formatValue(enhancedValue, 1)}%)`
                        : `치명타 피해 +${formatValue(baseValue, 1)}%`;
                case 'crit':
                    return enhancementBonus > 0
                        ? `치명타 확률 +${formatValue(baseValue, 1)}% (→${formatValue(enhancedValue, 1)}%)`
                        : `치명타 확률 +${formatValue(baseValue, 1)}%`;
                case 'execute':
                    return enhancementBonus > 0
                        ? `처형 +${formatValue(baseValue)}% (→${formatValue(enhancedValue)}%)`
                        : `처형 +${formatValue(baseValue)}%`;
                case 'firstHit':
                    return enhancementBonus > 0
                        ? `첫타 +${formatValue(baseValue)}% (→${formatValue(enhancedValue)}%)`
                        : `첫타 +${formatValue(baseValue)}%`;
                case 'bossKiller':
                    return enhancementBonus > 0
                        ? `보스킬러 +${formatValue(baseValue)}% (→${formatValue(enhancedValue)}%)`
                        : `보스킬러 +${formatValue(baseValue)}%`;
                case 'reward':
                    const baseReward = (baseValue - 1) * 100;
                    const enhancedReward = baseReward * (1 + enhancementBonus);
                    return enhancementBonus > 0
                        ? `보상 +${baseReward.toFixed(1)}% (→${enhancedReward.toFixed(1)}%)`
                        : `보상 +${baseReward.toFixed(1)}%`;
                case 'hpMult':
                    return enhancementBonus > 0
                        ? `체력 +${formatValue(baseValue)}% (→${formatValue(enhancedValue)}%)`
                        : `체력 +${formatValue(baseValue)}%`;
                case 'killHeal':
                    return enhancementBonus > 0
                        ? `처치회복 ${formatValue(baseValue)}% (→${formatValue(enhancedValue)}%)`
                        : `처치회복 ${formatValue(baseValue)}%`;
                case 'killMana':
                    return enhancementBonus > 0
                        ? `처치MP ${formatValue(baseValue)}% (→${formatValue(enhancedValue)}%)`
                        : `처치MP ${formatValue(baseValue)}%`;
                default:
                    return relic.desc;
            }
        }
        return relic.desc;
    };

    // 단일 효과
    if (relic.effect) {
        return getEnhancedDesc(relic.effect, relic.value);
    }

    return relic.desc;
}

// 효과 설명 (용어 설명이 필요한 특수 효과만)
function getEffectExplanation(effectType) {
    const explanations = {
        // 특수 용어가 필요한 효과들만
        'bleed': '출혈: 매 턴 (공격력×50%×중첩) 피해, 턴마다 1중첩 감소',
        'weaken': '쇠약: 중첩당 적 공격력 -10%, 받는 피해 +10%',
        'stun': '스턴: 적 반격 1회 무효화',
        'freeze': '빙결: 적 선제공격 +2턴 (중첩 가능)',
        'execute': '처형: 적 HP 30% 이하일 때만 추가 피해',
        'firstHit': '첫타: 전투의 첫 번째 공격에만 적용',
        'bossKiller': '보스킬러: 보스/중보스에게만 적용',
        'multiHit': '추가공격: 성공 시 같은 확률로 연속 재공격',
        'lifeSteal': '흡혈: 피해량의 일정 비율을 HP로 회복',
        'reflect': '반사: 받은 피해의 일정 비율을 적에게 반사',
        'killHeal': '처치회복: 적 처치 시 최대HP의 일정% 회복',
        'killMana': '처치마나: 적 처치 시 최대MP의 일정% 회복'
    };
    return explanations[effectType] || '';
}

// 유물 설명 + 효과 설명 포함
function getRelicDescFull(relic) {
    const mainDesc = getRelicDescWithEnhancement(relic);
    const effectExplanation = getEffectExplanation(relic.effect);

    if (effectExplanation) {
        return `${mainDesc}<div class="effect-explanation">${effectExplanation}</div>`;
    }
    return mainDesc;
}

// 합성 결과 확인 후 진행
function confirmCombineResult() {
    // 합성 섹션 숨김
    document.getElementById('relic-combine-section').classList.add('hidden');

    // 버튼 상태 복원
    document.getElementById('btn-combine').classList.remove('hidden');
    document.getElementById('btn-skip-combine').textContent = '그냥 추가';

    proceedAfterRelicChoice();
}

// 유물 선택 후 처리 (유물을 선택하면 스킬 변경 불가)
function proceedAfterRelicChoice() {
    // MP 회복
    gameState.player.maxMp = getMaxMp();
    gameState.player.mp = gameState.player.maxMp;

    // HP 재계산 (hpMult 유물 적용)
    gameState.player.maxHp = getMaxHp();

    // 유물 선택 시 스킬 선택 건너뛰고 바로 다음 층으로
    proceedToNextFloor();
}

// 다음 층으로 이동 처리
function proceedToNextFloor() {
    if (gameState.skipMode) {
        // 스킵 모드: 다음 5층 단위로 점프
        const nextFloor = gameState.dungeon.currentFloor + 5;

        if (nextFloor > gameState.skipTargetFloor) {
            // 목표 도달: 스킵 모드 종료, 정상 진행
            gameState.skipMode = false;
            gameState.skipTargetFloor = 0;
            gameState.dungeon.currentFloor++;
        } else {
            // 다음 보스/중간보스로 점프
            gameState.dungeon.currentFloor = nextFloor;
        }
    } else {
        // 일반 모드: 다음 층
        gameState.dungeon.currentFloor++;
    }

    showScreen('dungeon-screen');
    startBattle();
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
        btn.className = `relic-replace-btn rarity-${relic.rarity}`;
        btn.innerHTML = `
            <div class="relic-rarity rarity-${relic.rarity}">${rarityNames[relic.rarity]}</div>
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

    // 다음 층으로 (스킵 모드 처리 포함)
    proceedToNextFloor();
}

// 스킬 스킵 + HP 30% 회복 후 다음 층으로
function skipSkillAndContinue() {
    // 30% 회복 후 종료
    applyRewardHeal();
    proceedAfterRelicChoice();
}

function handleGameClear() {
    gameState.player.gold += gameState.dungeon.pendingGold;
    gameState.player.exp += gameState.dungeon.pendingExp;
    gameState.enhancementStones += gameState.dungeon.pendingStones;
    gameState.originStones += gameState.dungeon.pendingOriginStones;
    checkLevelUp();

    document.getElementById('clear-mode').textContent = modeSettings[gameState.gameMode].name;
    document.getElementById('clear-floor').textContent = gameState.dungeon.currentFloor;
    document.getElementById('clear-gold').textContent = gameState.dungeon.pendingGold;
    document.getElementById('clear-exp').textContent = gameState.dungeon.pendingExp;
    document.getElementById('clear-stones').textContent = gameState.dungeon.pendingStones;
    document.getElementById('clear-origin-stones').textContent = gameState.dungeon.pendingOriginStones;

    showScreen('clear-screen');
}

function showReturnScreen() {
    gameState.dungeon.inBattle = false;

    document.getElementById('return-floor').textContent = gameState.dungeon.currentFloor;
    document.getElementById('return-gold').textContent = gameState.dungeon.pendingGold;
    document.getElementById('return-exp').textContent = gameState.dungeon.pendingExp;
    document.getElementById('return-stones').textContent = gameState.dungeon.pendingStones;
    document.getElementById('return-origin-stones').textContent = gameState.dungeon.pendingOriginStones;

    showScreen('return-screen');
}

function playerDefeated() {
    gameState.dungeon.inBattle = false;

    const halfGold = Math.floor(gameState.dungeon.pendingGold / 2);
    const halfExp = Math.floor(gameState.dungeon.pendingExp / 2);
    const halfStones = Math.floor(gameState.dungeon.pendingStones / 2);
    const halfOriginStones = Math.floor(gameState.dungeon.pendingOriginStones / 2);

    document.getElementById('death-gold').textContent = halfGold;
    document.getElementById('death-exp').textContent = halfExp;
    document.getElementById('death-stones').textContent = halfStones;
    document.getElementById('death-origin-stones').textContent = halfOriginStones;

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
        gameState.originStones += gameState.dungeon.pendingOriginStones;
        checkLevelUp();
    } else {
        // 사망 시에도 강화석/근원석은 50%만 획득
        gameState.enhancementStones += Math.floor(gameState.dungeon.pendingStones / 2);
        gameState.originStones += Math.floor(gameState.dungeon.pendingOriginStones / 2);
    }

    // 던전 상태 초기화
    gameState.dungeon.pendingGold = 0;
    gameState.dungeon.pendingExp = 0;
    gameState.dungeon.pendingStones = 0;
    gameState.dungeon.pendingOriginStones = 0;
    gameState.dungeon.currentFloor = 1;
    gameState.tempRelics = []; // 유물 초기화
    gameState.equippedSkills = [null, null, null, null]; // 스킬 초기화
    gameState.activeBuffs = []; // 버프 초기화
    gameState.skillCooldowns = {}; // 쿨타임 초기화
    gameState.skipMode = false; // 스킵 모드 초기화
    gameState.skipTargetFloor = 0;

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
    const charToWeapon = { cat: 'sword', elf: 'staff', dwarf: 'shield', human: 'bow' };
    const weaponNames = { sword: '검', staff: '지팡이', shield: '방패', bow: '활' };
    const typeNames = { attack: '공격', utility: '유틸', buff: '버프', passive: '패시브' };

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

        // 무기 보너스 계산
        const weapon = charToWeapon[skill.character];
        const weaponLevel = weapon ? gameState.weapons[weapon] : 0;
        const weaponBonus = weaponLevel > 0 ? weaponLevel * 5 : 0;
        const weaponName = weaponNames[weapon] || '';

        // 스킬 타입 표시
        const skillType = skill.subtype ? typeNames[skill.subtype] : typeNames[skill.type];

        if (skill.type === 'passive') {
            btn.textContent = `${skill.name} [P]`;
            btn.title = `[${charName}] ${skill.name} (${skillType})\n${skill.desc}`;
            btn.disabled = true;
            btn.classList.remove('on-cooldown');
        } else {
            // active 또는 buff 스킬
            const mpText = skill.mpCost > 0 ? `MP ${skill.mpCost}` : 'MP 0';
            const cdText = skill.cooldown > 0 ? `쿨타임 ${skill.cooldown}턴` : '쿨타임 없음';
            const weaponText = weaponBonus > 0 ? `\n🔧 ${weaponName} +${weaponLevel} (효과 +${weaponBonus}%)` : '';

            if (cooldown > 0) {
                btn.textContent = `${skill.name} [⏳${cooldown}]`;
                btn.title = `[${charName}] ${skill.name} (${skillType})\n${mpText} | ${cdText}\n\n${skill.desc}${weaponText}\n\n⏳ 남은 쿨타임: ${cooldown}턴`;
                btn.disabled = true;
                btn.classList.add('on-cooldown');
            } else {
                // MP와 쿨타임 모두 표시
                const cdDisplay = skill.cooldown > 0 ? `CD${skill.cooldown}` : '';
                const btnInfo = cdDisplay ? `${skill.mpCost}/${cdDisplay}` : `${skill.mpCost}`;
                btn.textContent = `${skill.name} (${btnInfo})`;
                btn.title = `[${charName}] ${skill.name} (${skillType})\n${mpText} | ${cdText}\n\n${skill.desc}${weaponText}`;
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

    // 현재 스탯 섹션
    html += '<div class="info-section-title">📊 현재 스탯</div>';
    const totalDefReduction = Math.min(
        getVitDamageReduction() * 100 + gameState.percentBonus.def,
        50
    );
    html += `
        <div class="info-stats-grid">
            <div class="info-stat-item"><span class="info-stat-label">공격력</span><span class="info-stat-value">${getPlayerAtk()}</span></div>
            <div class="info-stat-item"><span class="info-stat-label">최대HP</span><span class="info-stat-value">${gameState.player.maxHp}</span></div>
            <div class="info-stat-item"><span class="info-stat-label">치명타 확률</span><span class="info-stat-value">${getCritChance()}%</span></div>
            <div class="info-stat-item"><span class="info-stat-label">치명타 데미지</span><span class="info-stat-value">${getCritDamage()}%</span></div>
            <div class="info-stat-item"><span class="info-stat-label">회피율</span><span class="info-stat-value">${getDodgeChance()}%</span></div>
            <div class="info-stat-item"><span class="info-stat-label">피해 감소</span><span class="info-stat-value">${Math.floor(totalDefReduction)}%</span></div>
        </div>
    `;

    // 태그 합성 버튼 (전투 중이 아닐 때만)
    if (!gameState.dungeon.inBattle && gameState.tempRelics.length >= 3) {
        html += `
            <div class="info-combine-section">
                <button id="btn-info-tag-combine" class="btn-info-tag-combine">✨ 근원 합성</button>
            </div>
        `;
    }

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
            const rarityName = rarityNames[relic.rarity] || '일반';
            html += `
                <div class="relic-info-item rarity-${relic.rarity}">
                    <span class="relic-info-icon">${relic.icon}</span>
                    <div class="relic-info-content">
                        <div class="relic-info-header">
                            <span class="relic-info-name">${relic.name}</span>
                            <span class="relic-info-rarity rarity-${relic.rarity}">${rarityName}</span>
                        </div>
                        <div class="relic-info-desc">${getRelicDescFull(relic)}</div>
                    </div>
                </div>
            `;
        });
    } else {
        html += '<p class="no-info-msg">보유한 유물이 없습니다</p>';
    }

    panel.innerHTML = html;

    // 태그 합성 버튼 이벤트 리스너 (동적 생성된 버튼)
    const tagCombineBtn = document.getElementById('btn-info-tag-combine');
    if (tagCombineBtn) {
        tagCombineBtn.addEventListener('click', () => {
            // 상세 정보 패널 닫기
            panel.classList.add('hidden');
            document.getElementById('btn-info-toggle').classList.remove('active');
            document.getElementById('btn-info-toggle').textContent = '상세 정보';
            // 태그 합성 열기
            openTagCombineMode();
        });
    }
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
        critBoost: (v) => `치명타 확률 +${v}%`,
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
    easy: '보상 x1',
    normal: '보상 x5',
    hard: '보상 x10',
    infinite: '보상 x10 (무한 스테이지)'
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

    // 스킵 입장 (중간보스/보스전만 진행)
    document.getElementById('btn-skip').addEventListener('click', () => {
        const skipFloor = getSkipFloor();
        if (skipFloor <= 0) return;

        // 스킵 모드 활성화: 5층부터 시작해서 목표층까지 보스전만
        gameState.skipMode = true;
        gameState.skipTargetFloor = skipFloor;
        gameState.dungeon.currentFloor = 5; // 첫 번째 중간보스부터 시작
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

    // 마을 시설 버튼
    document.getElementById('btn-shop').addEventListener('click', () => {
        updateShopUI();
        showScreen('shop-screen');
    });

    document.getElementById('btn-blacksmith').addEventListener('click', () => {
        updateBlacksmithUI();
        showScreen('blacksmith-screen');
    });

    document.getElementById('btn-inn').addEventListener('click', () => {
        updateInnUI();
        showScreen('inn-screen');
    });

    // 스탯 올리기 (+1, +10)
    document.querySelectorAll('.btn-stat-up').forEach(btn => {
        btn.addEventListener('click', () => {
            const stat = btn.dataset.stat;
            const amount = parseInt(btn.dataset.amount) || 1;
            const actualAmount = Math.min(amount, gameState.player.statPoints);

            if (actualAmount > 0) {
                gameState.player.stats[stat] += actualAmount;
                gameState.player.statPoints -= actualAmount;
                updateVillageUI();
            }
        });
    });

    // 스탯 초기화
    document.getElementById('btn-stat-reset').addEventListener('click', () => {
        resetStats();
    });

    // 대장간 - 4종 무기 강화 (강화석 + 골드 사용, 확률 시스템)
    document.querySelectorAll('.btn-upgrade[data-weapon]').forEach(btn => {
        btn.addEventListener('click', () => {
            const weapon = btn.dataset.weapon;
            const currentLevel = gameState.weapons[weapon];
            const goldCost = getEnhanceGoldCost(currentLevel);

            const stoneCost = getEnhanceStoneCost(currentLevel);
            if (gameState.enhancementStones >= stoneCost && gameState.player.gold >= goldCost && currentLevel < 20) {
                gameState.enhancementStones -= stoneCost;
                gameState.player.gold -= goldCost;
                const successRate = getEnhanceSuccessRate(currentLevel);
                const roll = Math.random() * 100;

                if (roll < successRate) {
                    // 강화 성공
                    gameState.weapons[weapon]++;
                    showEnhanceResult(weapon, true, currentLevel + 1);
                } else {
                    // 강화 실패
                    showEnhanceResult(weapon, false, currentLevel);
                }
                updateBlacksmithUI();
            }
        });
    });

    // 상점 - 부적 구매 (재화 부적)
    document.querySelectorAll('.btn-talisman').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.talisman;
            const cost = getTalismanCost(type, gameState.talismanPurchases[type]);

            if (gameState.player.gold >= cost) {
                gameState.player.gold -= cost;
                gameState.talismanPurchases[type]++;

                // 재화 지급
                if (type === 'stone') {
                    gameState.enhancementStones++;
                } else if (type === 'origin') {
                    gameState.originStones++;
                }
                updateShopUI();
            }
        });
    });

    // 상점 - 퍼센트 능력 강화 (스탯별 다른 증가량)
    document.querySelectorAll('.btn-percent-upgrade').forEach(btn => {
        btn.addEventListener('click', () => {
            const stat = btn.dataset.stat;
            const current = gameState.percentBonus[stat];
            // 스탯별 증가량: 공격력/체력 1%, 치명타확률/회피율 0.5%, 치명타피해 2%, 피해감소 0.15%
            const increments = { atk: 1, hp: 1, crit: 0.5, critDmg: 2, dodge: 0.5, def: 0.15 };
            const maxValues = { atk: 100, hp: 100, crit: 100, critDmg: 200, dodge: 100, def: 15 };
            const increment = increments[stat];
            const maxValue = maxValues[stat];
            const purchases = Math.round(current / increment);
            const cost = getPercentUpgradeCost(purchases, stat);

            if (current < maxValue && gameState.player.gold >= cost) {
                gameState.player.gold -= cost;
                gameState.percentBonus[stat] += increment;

                // HP 강화 시 즉시 적용
                if (stat === 'hp') {
                    gameState.player.maxHp = getMaxHp();
                }
                updateShopUI();
            }
        });
    });

    // 숙소 - 근원 강화 (근원석 사용, 유물 효과 +5%)
    document.getElementById('btn-origin-enhance')?.addEventListener('click', () => {
        const cost = getOriginEnhanceCost();
        if (gameState.originStones >= cost && gameState.originEnhancement < 20) {
            gameState.originStones -= cost;
            gameState.originEnhancement++;
            updateInnUI();
        }
    });

    // 숙소 - 능력치 포인트 구매 (근원석 사용)
    document.getElementById('btn-buy-stat-point').addEventListener('click', () => {
        const cost = 1 + Math.floor(gameState.statPointsPurchased / 5);
        if (gameState.originStones >= cost) {
            gameState.originStones -= cost;
            gameState.player.statPoints++;
            gameState.statPointsPurchased++;
            updateInnUI();
            updateVillageUI();
        }
    });

    // 시설 돌아가기 버튼들
    document.getElementById('btn-shop-back').addEventListener('click', () => {
        updateVillageUI();
        showScreen('village-screen');
    });

    document.getElementById('btn-blacksmith-back').addEventListener('click', () => {
        updateVillageUI();
        showScreen('village-screen');
    });

    document.getElementById('btn-inn-back').addEventListener('click', () => {
        updateVillageUI();
        showScreen('village-screen');
    });

    // 세이브/로드
    document.getElementById('btn-save-game').addEventListener('click', saveGame);
    document.getElementById('btn-load-game').addEventListener('click', loadGame);

    // 리더보드
    document.getElementById('btn-refresh-leaderboard')?.addEventListener('click', () => {
        leaderboardData = null;
        fetchLeaderboard();
    });
    document.getElementById('btn-submit-score')?.addEventListener('click', submitScore);

    // 전투
    document.getElementById('btn-attack').addEventListener('click', playerAttack);

    for (let i = 1; i <= 4; i++) {
        document.getElementById(`btn-skill-${i}`).addEventListener('click', () => useSkill(i - 1));
    }

    // 상세 정보 버튼
    document.getElementById('btn-info-toggle').addEventListener('click', toggleInfoPanel);

    document.getElementById('btn-return').addEventListener('click', () => showReturnScreen());
    document.getElementById('btn-return-confirm').addEventListener('click', () => returnToVillage(false));
    document.getElementById('btn-gameover-return').addEventListener('click', () => returnToVillage(true));
    document.getElementById('btn-clear-return').addEventListener('click', () => returnToVillage(false));

    // 보스 클리어 화면
    document.getElementById('btn-boss-confirm').addEventListener('click', showBossRewardChoices);
    document.getElementById('btn-skip-skill').addEventListener('click', skipSkillAndContinue);
    document.getElementById('btn-cancel-relic').addEventListener('click', cancelRelicReplace);

    // 유물 합성 확인
    document.getElementById('btn-skip-combine').addEventListener('click', confirmCombineResult);

    // 보상 중 유물 합성
    document.getElementById('btn-reward-combine').addEventListener('click', executeRewardCombine);
    document.getElementById('btn-reward-next').addEventListener('click', proceedToNextRewardPhase);

    // 태그 합성
    document.getElementById('btn-tag-combine-open').addEventListener('click', openTagCombineMode);
    document.getElementById('btn-tag-combine').addEventListener('click', onTagCombineClick);
    document.getElementById('btn-tag-combine-close').addEventListener('click', closeTagCombineMode);
}

// 스탯 초기화 (모든 스탯을 0으로 되돌리고 포인트 환불)
function resetStats() {
    const baseStats = 0;
    const currentTotal = gameState.player.stats.str + gameState.player.stats.dex +
                        gameState.player.stats.int + gameState.player.stats.vit + gameState.player.stats.luk;
    const baseTotal = baseStats * 5; // 0 (초기 스탯 없음)

    // 투자한 포인트 환불
    const refund = currentTotal - baseTotal;

    gameState.player.stats.str = baseStats;
    gameState.player.stats.dex = baseStats;
    gameState.player.stats.int = baseStats;
    gameState.player.stats.vit = baseStats;
    gameState.player.stats.luk = baseStats;
    gameState.player.statPoints += refund;

    // HP/MP 재계산
    gameState.player.maxHp = getMaxHp();
    gameState.player.maxMp = getMaxMp();

    updateVillageUI();
}

// === 세이브/로드 시스템 ===
const SAVE_KEY = 'grayMercenary_save';
const SAVE_VERSION = 1;

// 스킬 ID로 스킬 찾기
function findSkillById(skillId) {
    if (!skillId) return null;
    for (const charSkills of Object.values(skillsData)) {
        const skill = charSkills.find(s => s.id === skillId);
        if (skill) return skill;
    }
    return null;
}

// 저장할 데이터 추출
function getSaveData() {
    return {
        version: SAVE_VERSION,
        timestamp: Date.now(),
        player: {
            level: gameState.player.level,
            exp: gameState.player.exp,
            gold: gameState.player.gold,
            statPoints: gameState.player.statPoints,
            stats: { ...gameState.player.stats },
            baseAtk: gameState.player.baseAtk
        },
        dungeon: {
            highestFloor: gameState.dungeon.highestFloor,
            infiniteHighestFloor: gameState.dungeon.infiniteHighestFloor
        },
        weapons: { ...gameState.weapons },
        talismanPurchases: { ...gameState.talismanPurchases },
        percentBonus: { ...gameState.percentBonus },
        enhancementStones: gameState.enhancementStones,
        originStones: gameState.originStones,
        originEnhancement: gameState.originEnhancement,
        statPointsPurchased: gameState.statPointsPurchased,
        equippedSkills: gameState.equippedSkills.map(s => s?.id || null),
        gameMode: gameState.gameMode
    };
}

// 저장 데이터 적용
function applySaveData(data) {
    // 플레이어 정보
    gameState.player.level = data.player.level;
    gameState.player.exp = data.player.exp;
    gameState.player.gold = data.player.gold;
    gameState.player.statPoints = data.player.statPoints;
    gameState.player.stats = { ...data.player.stats };
    gameState.player.baseAtk = data.player.baseAtk;

    // 던전 기록
    gameState.dungeon.highestFloor = data.dungeon.highestFloor;
    gameState.dungeon.infiniteHighestFloor = data.dungeon.infiniteHighestFloor || 0;
    gameState.dungeon.currentFloor = 1;
    gameState.dungeon.inBattle = false;

    // 장비/자원
    gameState.weapons = { ...data.weapons };
    gameState.talismanPurchases = { ...data.talismanPurchases };
    gameState.percentBonus = { ...data.percentBonus };
    gameState.enhancementStones = data.enhancementStones;
    gameState.originStones = data.originStones;
    gameState.originEnhancement = data.originEnhancement;
    gameState.statPointsPurchased = data.statPointsPurchased;
    gameState.gameMode = data.gameMode;

    // 스킬 복원
    gameState.equippedSkills = data.equippedSkills.map(id => findSkillById(id));

    // 상태 초기화
    gameState.tempRelics = [];
    gameState.activeBuffs = [];
    gameState.skillCooldowns = {};
    gameState.currentEnemy = null;

    // HP/MP 재계산
    gameState.player.maxHp = getMaxHp();
    gameState.player.maxMp = getMaxMp();
    gameState.player.hp = gameState.player.maxHp;
    gameState.player.mp = gameState.player.maxMp;
}

// 게임 저장
function saveGame() {
    try {
        const saveData = getSaveData();
        localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));

        const statusEl = document.getElementById('save-status');
        if (statusEl) {
            const date = new Date();
            const timeStr = `${date.getFullYear()}.${String(date.getMonth()+1).padStart(2,'0')}.${String(date.getDate()).padStart(2,'0')} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
            statusEl.textContent = `저장 완료! (${timeStr})`;
            statusEl.className = 'save-status success';
        }
        return true;
    } catch (e) {
        const statusEl = document.getElementById('save-status');
        if (statusEl) {
            statusEl.textContent = '저장 실패: ' + e.message;
            statusEl.className = 'save-status error';
        }
        return false;
    }
}

// 게임 불러오기
function loadGame() {
    try {
        const saveStr = localStorage.getItem(SAVE_KEY);
        if (!saveStr) {
            const statusEl = document.getElementById('save-status');
            if (statusEl) {
                statusEl.textContent = '저장된 데이터가 없습니다.';
                statusEl.className = 'save-status error';
            }
            return false;
        }

        if (!confirm('현재 진행을 덮어쓰고 저장된 데이터를 불러올까요?')) {
            return false;
        }

        const saveData = JSON.parse(saveStr);
        applySaveData(saveData);

        // UI 업데이트
        updateSkillButtons();
        updateVillageUI();
        updateInnUI();
        showScreen('village-screen');

        const statusEl = document.getElementById('save-status');
        if (statusEl) {
            statusEl.textContent = '불러오기 완료!';
            statusEl.className = 'save-status success';
        }
        return true;
    } catch (e) {
        const statusEl = document.getElementById('save-status');
        if (statusEl) {
            statusEl.textContent = '불러오기 실패: ' + e.message;
            statusEl.className = 'save-status error';
        }
        return false;
    }
}

// 저장 데이터 존재 여부 확인
function hasSaveData() {
    return localStorage.getItem(SAVE_KEY) !== null;
}

// === 리더보드 시스템 (Firebase Firestore) ===
const firebaseConfig = {
    apiKey: "AIzaSyBwHIITHru4Od1fjwg6OOMNTjRFbvwpVkg",
    authDomain: "boardgame-1a3dd.firebaseapp.com",
    projectId: "boardgame-1a3dd",
    storageBucket: "boardgame-1a3dd.firebasestorage.app",
    messagingSenderId: "278191503167",
    appId: "1:278191503167:web:f1258978f7c3814639058a"
};

let firebaseApp = null;
let db = null;
let leaderboardData = null;

// Firebase 초기화
function initFirebase() {
    if (!firebaseApp && typeof firebase !== 'undefined') {
        firebaseApp = firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
    }
}

// 리더보드 데이터 가져오기
async function fetchLeaderboard() {
    try {
        initFirebase();
        if (!db) throw new Error('Firebase 연결 실패');

        const snapshot = await db.collection('leaderboard')
            .orderBy('floor', 'desc')
            .limit(20)
            .get();

        const entries = [];
        snapshot.forEach(doc => {
            entries.push({ id: doc.id, ...doc.data() });
        });

        leaderboardData = { leaderboard: entries };
        renderLeaderboard(leaderboardData);
        return true;
    } catch (e) {
        console.log('리더보드 로드 실패:', e);
        const listEl = document.getElementById('leaderboard-list');
        if (listEl) {
            listEl.innerHTML = '<p class="leaderboard-error">순위표를 불러올 수 없습니다.</p>';
        }
        return false;
    }
}

// 점수 제출
async function submitScore() {
    const nicknameInput = document.getElementById('input-nickname');
    const statusEl = document.getElementById('submit-status');
    const nickname = nicknameInput?.value.trim();

    if (!nickname) {
        if (statusEl) {
            statusEl.textContent = '닉네임을 입력해주세요.';
            statusEl.className = 'submit-status error';
        }
        return;
    }

    if (nickname.length > 12) {
        if (statusEl) {
            statusEl.textContent = '닉네임은 12자 이하로 입력해주세요.';
            statusEl.className = 'submit-status error';
        }
        return;
    }

    try {
        initFirebase();
        if (!db) throw new Error('Firebase 연결 실패');

        const floor = gameState.dungeon.infiniteHighestFloor;
        const level = gameState.player.level;

        // 동일 닉네임 기존 기록 확인
        const existing = await db.collection('leaderboard')
            .where('nickname', '==', nickname)
            .get();

        if (!existing.empty) {
            const doc = existing.docs[0];
            const oldFloor = doc.data().floor;
            if (floor <= oldFloor) {
                if (statusEl) {
                    statusEl.textContent = `이미 더 높은 기록(${oldFloor}구역)이 등록되어 있습니다.`;
                    statusEl.className = 'submit-status error';
                }
                return;
            }
            // 기존 기록 업데이트
            await doc.ref.update({ floor, level, timestamp: Date.now() });
        } else {
            // 새 기록 추가
            await db.collection('leaderboard').add({
                nickname,
                floor,
                level,
                timestamp: Date.now()
            });
        }

        if (statusEl) {
            statusEl.textContent = '기록이 등록되었습니다!';
            statusEl.className = 'submit-status success';
        }

        // 리더보드 새로고침
        await fetchLeaderboard();
    } catch (e) {
        console.log('점수 제출 실패:', e);
        if (statusEl) {
            statusEl.textContent = '등록 실패: ' + e.message;
            statusEl.className = 'submit-status error';
        }
    }
}

// HTML 이스케이프 (XSS 방지)
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 리더보드 렌더링
function renderLeaderboard(data) {
    const listEl = document.getElementById('leaderboard-list');
    if (!listEl || !data || !data.leaderboard) return;

    if (data.leaderboard.length === 0) {
        listEl.innerHTML = '<p class="leaderboard-empty">아직 등록된 기록이 없습니다.</p>';
        return;
    }

    let html = '<div class="leaderboard-table">';
    html += '<div class="leaderboard-header"><span>순위</span><span>닉네임</span><span>구역</span><span>레벨</span></div>';

    data.leaderboard.forEach((entry, idx) => {
        const rankClass = idx < 3 ? `rank-${idx + 1}` : '';
        const rankIcon = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`;
        const safeNickname = escapeHtml(entry.nickname || '');
        html += `
            <div class="leaderboard-row ${rankClass}">
                <span class="rank">${rankIcon}</span>
                <span class="nickname">${safeNickname}</span>
                <span class="floor">${entry.floor}구역</span>
                <span class="level">Lv.${entry.level}</span>
            </div>
        `;
    });

    html += '</div>';
    if (data.updatedAt) {
        html += `<p class="leaderboard-updated">마지막 업데이트: ${data.updatedAt}</p>`;
    }
    listEl.innerHTML = html;
}

// 리더보드 UI 업데이트
function updateLeaderboardUI() {
    const lockedEl = document.getElementById('leaderboard-locked');
    const unlockedEl = document.getElementById('leaderboard-unlocked');
    const infiniteRecordEl = document.getElementById('infinite-record');
    const myFloorEl = document.getElementById('my-floor');
    const myLevelEl = document.getElementById('my-level');

    const infiniteFloor = gameState.dungeon.infiniteHighestFloor;
    const isUnlocked = infiniteFloor >= 50;

    // 현재 기록 표시
    if (infiniteRecordEl) infiniteRecordEl.textContent = infiniteFloor;
    if (myFloorEl) myFloorEl.textContent = infiniteFloor;
    if (myLevelEl) myLevelEl.textContent = gameState.player.level;

    // 잠금/해제 상태
    if (lockedEl) lockedEl.classList.toggle('hidden', isUnlocked);
    if (unlockedEl) unlockedEl.classList.toggle('hidden', !isUnlocked);

    // 해제된 경우 리더보드 로드
    if (isUnlocked && !leaderboardData) {
        fetchLeaderboard();
    }
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
