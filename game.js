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
        stats: {
            str: 5,
            dex: 5,
            int: 5,
            vit: 5,
            luk: 5
        }
    },
    dungeon: {
        currentFloor: 1,
        highestFloor: 0,
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
    ashBlessings: {  // 잿빛 소녀의 축복 (근원석 사용)
        fury: 0,      // 분노의 축복 - 공격력
        aegis: 0,     // 수호의 축복 - 체력
        insight: 0,   // 통찰의 축복 - 치명타
        patience: 0   // 인내의 축복 - 방어
    },
    armorLevel: 1,
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
    selectedForCombine: [] // 합성을 위해 선택된 유물 인덱스들
};

// 유물 데이터
// 등급: common(일반), rare(희귀), epic(영웅), legendary(전설)
const relicsData = [
    // 일반 등급
    { id: 'relic_sword', name: '고대의 검날', desc: '공격력 +10', effect: 'atk', value: 10, icon: '⚔️', rarity: 'common' },
    { id: 'relic_ring', name: '마력의 반지', desc: '최대 MP +3', effect: 'mp', value: 3, icon: '💍', rarity: 'common' },
    { id: 'relic_coin', name: '황금 동전', desc: '골드 획득 +15%', effect: 'gold', value: 1.15, icon: '🪙', rarity: 'common' },
    { id: 'relic_feather', name: '깃털 장식', desc: '회피율 +5%', effect: 'dodge', value: 5, icon: '🪶', rarity: 'common' },
    { id: 'relic_band', name: '전사의 머리띠', desc: '공격력 +5%', effect: 'atkMult', value: 0.05, icon: '🎀', rarity: 'common' },
    // 희귀 등급
    { id: 'relic_shield', name: '수호의 방패', desc: '받는 피해 -6%', effect: 'def', value: 0.94, icon: '🛡️', rarity: 'rare' },
    { id: 'relic_cloak', name: '그림자 망토', desc: '회피율 +10%', effect: 'dodge', value: 10, icon: '🧥', rarity: 'rare' },
    { id: 'relic_amulet', name: '행운의 부적', desc: '크리티컬 +10%', effect: 'crit', value: 10, icon: '🔮', rarity: 'rare' },
    { id: 'relic_boots', name: '신속의 장화', desc: '선제공격 확률 +15%', effect: 'first', value: 15, icon: '👢', rarity: 'rare' },
    { id: 'relic_gauntlet', name: '강철 건틀릿', desc: '공격력 +6%', effect: 'atkMult', value: 0.06, icon: '🧤', rarity: 'rare' },
    { id: 'relic_pendant', name: '생명의 목걸이', desc: '최대 체력 +6%', effect: 'hpMult', value: 0.06, icon: '📿', rarity: 'rare' },
    // 영웅 등급
    { id: 'relic_crown', name: '왕의 왕관', desc: '경험치 획득 +25%', effect: 'exp', value: 1.25, icon: '👑', rarity: 'epic' },
    { id: 'relic_orb', name: '마력의 오브', desc: '최대 MP +5', effect: 'mp', value: 5, icon: '🔵', rarity: 'epic' },
    { id: 'relic_fang', name: '흡혈의 송곳니', desc: '공격 시 피해의 5% 회복', effect: 'lifeSteal', value: 0.05, icon: '🦷', rarity: 'epic' },
    { id: 'relic_horn', name: '전쟁의 뿔피리', desc: '공격력 +20', effect: 'atk', value: 20, icon: '📯', rarity: 'epic' },
    { id: 'relic_skull', name: '파멸의 해골', desc: '치명타 데미지 +10%', effect: 'critDmg', value: 10, icon: '💀', rarity: 'epic' },
    { id: 'relic_belt', name: '거인의 허리띠', desc: '최대 체력 +9%', effect: 'hpMult', value: 0.09, icon: '🎗️', rarity: 'epic' },
    { id: 'relic_gloves', name: '암살자의 장갑', desc: '공격력 +9%', effect: 'atkMult', value: 0.09, icon: '🖐️', rarity: 'epic' },
    // 전설 등급
    { id: 'relic_heart', name: '드래곤의 심장', desc: '받는 피해 -12%', effect: 'def', value: 0.88, icon: '❤️‍🔥', rarity: 'legendary' },
    { id: 'relic_eye', name: '예언자의 눈', desc: '크리티컬 +15%', effect: 'crit', value: 15, icon: '👁️', rarity: 'legendary' },
    { id: 'relic_star', name: '별의 파편', desc: '모든 스탯 +5%', effect: 'allStats', value: 0.05, icon: '⭐', rarity: 'legendary' },
    { id: 'relic_blade', name: '파괴의 검', desc: '공격력 +12%', effect: 'atkMult', value: 0.12, icon: '🗡️', rarity: 'legendary' },
    { id: 'relic_gem', name: '심판의 보석', desc: '치명타 데미지 +15%', effect: 'critDmg', value: 15, icon: '💎', rarity: 'legendary' },
    { id: 'relic_titan', name: '타이탄의 심장', desc: '최대 체력 +12%', effect: 'hpMult', value: 0.12, icon: '🫀', rarity: 'legendary' },
    // 스탯 증폭 유물
    { id: 'relic_str_rare', name: '힘의 팔찌', desc: '힘 +10%', effect: 'strMult', value: 0.10, icon: '💪', rarity: 'rare' },
    { id: 'relic_dex_rare', name: '민첩의 귀걸이', desc: '민첩 +10%', effect: 'dexMult', value: 0.10, icon: '🏃', rarity: 'rare' },
    { id: 'relic_int_rare', name: '지혜의 안경', desc: '지능 +10%', effect: 'intMult', value: 0.10, icon: '🧠', rarity: 'rare' },
    { id: 'relic_vit_rare', name: '활력의 벨트', desc: '활력 +10%', effect: 'vitMult', value: 0.10, icon: '💚', rarity: 'rare' },
    { id: 'relic_luk_rare', name: '행운의 클로버', desc: '행운 +10%', effect: 'lukMult', value: 0.10, icon: '🍀', rarity: 'rare' },
    { id: 'relic_str_epic', name: '전사의 문장', desc: '힘 +15%', effect: 'strMult', value: 0.15, icon: '🦁', rarity: 'epic' },
    { id: 'relic_dex_epic', name: '암살자의 문장', desc: '민첩 +15%', effect: 'dexMult', value: 0.15, icon: '🦅', rarity: 'epic' },
    { id: 'relic_int_epic', name: '현자의 문장', desc: '지능 +15%', effect: 'intMult', value: 0.15, icon: '🦉', rarity: 'epic' },
    { id: 'relic_vit_epic', name: '수호자의 문장', desc: '활력 +15%', effect: 'vitMult', value: 0.15, icon: '🐢', rarity: 'epic' },
    { id: 'relic_luk_epic', name: '도박사의 문장', desc: '행운 +15%', effect: 'lukMult', value: 0.15, icon: '🎰', rarity: 'epic' },

    // === 새로운 유물들 ===
    // 일반 등급 - 새 효과
    { id: 'relic_spike', name: '가시 갑옷', desc: '받은 피해의 5% 반사', effect: 'reflect', value: 0.05, icon: '🦔', rarity: 'common' },
    { id: 'relic_book', name: '마법서', desc: 'MP 소모 -10%', effect: 'mpSave', value: 0.1, icon: '📖', rarity: 'common' },

    // 희귀 등급 - 새 효과
    { id: 'relic_dagger', name: '암살자의 단검', desc: '처치 시 HP 3% 회복', effect: 'killHeal', value: 0.03, icon: '🗡️', rarity: 'rare' },
    { id: 'relic_hourglass', name: '시간의 모래', desc: '스킬 쿨타임 -1턴', effect: 'cooldownReduce', value: 1, icon: '⏳', rarity: 'rare' },
    { id: 'relic_arrow', name: '맹독의 화살', desc: '공격 시 10% 확률로 독 (3턴간 5% 피해)', effect: 'poison', value: 0.1, icon: '🏹', rarity: 'rare' },
    { id: 'relic_claw', name: '야수의 발톱', desc: '공격 시 10% 확률로 출혈 (3턴간 4% 피해)', effect: 'bleed', value: 0.1, icon: '🐾', rarity: 'rare' },
    { id: 'relic_rage', name: '분노의 결정', desc: '첫 공격 피해 +25%', effect: 'firstHit', value: 0.25, icon: '😠', rarity: 'rare' },
    { id: 'relic_hunter', name: '사냥꾼의 표식', desc: '보스에게 피해 +15%', effect: 'bossKiller', value: 0.15, icon: '🎯', rarity: 'rare' },

    // 영웅 등급 - 새 효과
    { id: 'relic_mirror', name: '반사의 거울', desc: '받은 피해의 10% 반사', effect: 'reflect', value: 0.1, icon: '🪞', rarity: 'epic' },
    { id: 'relic_scroll', name: '고대의 두루마리', desc: 'MP 소모 -20%', effect: 'mpSave', value: 0.2, icon: '📜', rarity: 'epic' },
    { id: 'relic_soul', name: '영혼 수확자', desc: '처치 시 HP 5% 회복', effect: 'killHeal', value: 0.05, icon: '👻', rarity: 'epic' },
    { id: 'relic_spear', name: '염화의 창', desc: '공격 시 15% 확률로 화상 (3턴간 7% 피해)', effect: 'burn', value: 0.15, icon: '🔱', rarity: 'epic' },
    { id: 'relic_fang', name: '흡혈박쥐 송곳니', desc: '공격 시 15% 확률로 출혈 (3턴간 4% 피해)', effect: 'bleed', value: 0.15, icon: '🦇', rarity: 'epic' },
    { id: 'relic_hex', name: '저주받은 인형', desc: '공격 시 12% 확률로 저주 (3턴간 3% + 공격력↓)', effect: 'curse', value: 0.12, icon: '🪆', rarity: 'epic' },
    { id: 'relic_fury', name: '광전사의 도끼', desc: '적 HP 30% 이하 시 피해 +35%', effect: 'execute', value: 0.35, icon: '🪓', rarity: 'epic' },
    { id: 'relic_slayer', name: '드래곤 슬레이어', desc: '보스에게 피해 +25%', effect: 'bossKiller', value: 0.25, icon: '🐉', rarity: 'epic' },
    { id: 'relic_chain', name: '연쇄의 사슬', desc: '10% 확률로 추가 공격', effect: 'multiHit', value: 0.1, icon: '⛓️', rarity: 'epic' },
    { id: 'relic_skill', name: '마법 증폭기', desc: '스킬 피해 +15%', effect: 'skillDmg', value: 0.15, icon: '✨', rarity: 'epic' },

    // 전설 등급 - 새 효과
    { id: 'relic_phoenix', name: '불사조의 깃털', desc: '처치 시 HP 10% 회복', effect: 'killHeal', value: 0.1, icon: '🔥', rarity: 'legendary' },
    { id: 'relic_void', name: '공허의 수정', desc: '스킬 쿨타임 -2턴', effect: 'cooldownReduce', value: 2, icon: '🌀', rarity: 'legendary' },
    { id: 'relic_pierce', name: '역병의 창', desc: '공격 시 20% 확률로 독+화상 (3턴간 10% 피해)', effect: 'plague', value: 0.2, icon: '⚡', rarity: 'legendary' },
    { id: 'relic_berserk', name: '광기의 가면', desc: '첫 공격 피해 +50%', effect: 'firstHit', value: 0.5, icon: '🎭', rarity: 'legendary' },
    { id: 'relic_godslayer', name: '신 사냥꾼', desc: '보스에게 피해 +35%', effect: 'bossKiller', value: 0.35, icon: '☠️', rarity: 'legendary' },
    { id: 'relic_storm', name: '폭풍의 눈', desc: '15% 확률로 추가 공격', effect: 'multiHit', value: 0.15, icon: '🌪️', rarity: 'legendary' },
    { id: 'relic_arcane', name: '비전의 오브', desc: '스킬 피해 +20%', effect: 'skillDmg', value: 0.2, icon: '🔮', rarity: 'legendary' },
    { id: 'relic_thorns', name: '가시왕관', desc: '받은 피해의 15% 반사', effect: 'reflect', value: 0.15, icon: '👑', rarity: 'legendary' },

    // === 복합 효과 유물 ===
    // 일반 등급 - 복합 (단일 효과 대비 약 60% 성능)
    { id: 'relic_trainee', name: '수련자의 장신구', desc: '공격력 +6, 치명타 +3%', icon: '🏅', rarity: 'common',
      effects: [{ effect: 'atk', value: 6 }, { effect: 'crit', value: 3 }] },
    { id: 'relic_traveler', name: '여행자의 장비', desc: '골드 +8%, 경험치 +8%', icon: '🎒', rarity: 'common',
      effects: [{ effect: 'gold', value: 1.08 }, { effect: 'exp', value: 1.08 }] },

    // 희귀 등급 - 복합 (단일 효과 대비 약 60% 성능)
    { id: 'relic_warrior_mark', name: '전투의 증표', desc: '공격력 +4%, 받는 피해 -4%', icon: '⚔️', rarity: 'rare',
      effects: [{ effect: 'atkMult', value: 0.04 }, { effect: 'def', value: 0.96 }] },
    { id: 'relic_survivor', name: '생존자의 부적', desc: '회피 +4%, 최대 HP +4%', icon: '🧿', rarity: 'rare',
      effects: [{ effect: 'dodge', value: 4 }, { effect: 'hpMult', value: 0.04 }] },
    { id: 'relic_explorer', name: '탐험가의 지도', desc: '골드 +10%, 경험치 +10%', icon: '🗺️', rarity: 'rare',
      effects: [{ effect: 'gold', value: 1.10 }, { effect: 'exp', value: 1.10 }] },
    { id: 'relic_duelist', name: '결투사의 장갑', desc: '치명타 +5%, 치명타 피해 +6%', icon: '🥊', rarity: 'rare',
      effects: [{ effect: 'crit', value: 5 }, { effect: 'critDmg', value: 6 }] },

    // 영웅 등급 - 복합 (단일 효과 대비 약 55% 성능, 3개 효과)
    { id: 'relic_balance', name: '균형의 결정', desc: '공격력 +5%, 받는 피해 -5%, 치명타 +4%', icon: '⚖️', rarity: 'epic',
      effects: [{ effect: 'atkMult', value: 0.05 }, { effect: 'def', value: 0.95 }, { effect: 'crit', value: 4 }] },
    { id: 'relic_tactician', name: '전략가의 문장', desc: '스킬 피해 +10%, MP 소모 -12%', icon: '📋', rarity: 'epic',
      effects: [{ effect: 'skillDmg', value: 0.10 }, { effect: 'mpSave', value: 0.12 }] },
    { id: 'relic_hunter_arm', name: '사냥꾼의 완장', desc: '보스 피해 +15%, 독 확률 +10%', icon: '🎖️', rarity: 'epic',
      effects: [{ effect: 'bossKiller', value: 0.15 }, { effect: 'poison', value: 0.10 }] },
    { id: 'relic_undying', name: '불굴의 심장', desc: '최대 HP +6%, 처치 시 HP 3% 회복', icon: '💗', rarity: 'epic',
      effects: [{ effect: 'hpMult', value: 0.06 }, { effect: 'killHeal', value: 0.03 }] },
    { id: 'relic_assassin', name: '암살자의 비수', desc: '치명타 +6%, 치명타 피해 +8%, 회피 +4%', icon: '🔪', rarity: 'epic',
      effects: [{ effect: 'crit', value: 6 }, { effect: 'critDmg', value: 8 }, { effect: 'dodge', value: 4 }] },

    // 전설 등급 - 복합 (단일 효과 대비 약 50% 성능, 3개 효과)
    { id: 'relic_hero_legacy', name: '영웅의 유산', desc: '공격력 +7%, 치명타 +6%, 치명타 피해 +8%', icon: '🏆', rarity: 'legendary',
      effects: [{ effect: 'atkMult', value: 0.07 }, { effect: 'crit', value: 6 }, { effect: 'critDmg', value: 8 }] },
    { id: 'relic_guardian', name: '수호신의 축복', desc: '받는 피해 -7%, 최대 HP +7%, 피해 반사 6%', icon: '🛡️', rarity: 'legendary',
      effects: [{ effect: 'def', value: 0.93 }, { effect: 'hpMult', value: 0.07 }, { effect: 'reflect', value: 0.06 }] },
    { id: 'relic_conqueror', name: '정복자의 인장', desc: '보스 피해 +20%, 화상 확률 +10%, 스킬 피해 +8%', icon: '👑', rarity: 'legendary',
      effects: [{ effect: 'bossKiller', value: 0.20 }, { effect: 'burn', value: 0.10 }, { effect: 'skillDmg', value: 0.08 }] },
    { id: 'relic_eternal', name: '영원의 성배', desc: '최대 HP +8%, 처치 시 HP 4% 회복, 흡혈 2%', icon: '🏺', rarity: 'legendary',
      effects: [{ effect: 'hpMult', value: 0.08 }, { effect: 'killHeal', value: 0.04 }, { effect: 'lifeSteal', value: 0.02 }] }
];

// 등급별 출현 확률 (조정됨)
const rarityWeights = {
    common: 40,
    rare: 35,
    epic: 18,
    legendary: 7
};

// 3가지 태그 종류
const RELIC_TAGS = ['공격', '방어', '마법'];

// 효과별 태그 매핑 (대부분 1개, 일부는 2개 태그)
const effectToTags = {
    // 공격 전용
    'atk': ['공격'], 'atkMult': ['공격'], 'bossKiller': ['공격'],
    'strMult': ['공격'],
    'poison': ['공격'], 'burn': ['공격'], 'bleed': ['공격'], 'curse': ['공격', '마법'], 'plague': ['공격'],
    // 방어 전용
    'def': ['방어'], 'hpMult': ['방어'], 'vitMult': ['방어'],
    // 마법 전용
    'mp': ['마법'], 'mpSave': ['마법'], 'cooldownReduce': ['마법'],
    'intMult': ['마법'], 'gold': ['마법'], 'exp': ['마법'],
    // 하이브리드 (2개 태그)
    'crit': ['공격', '마법'],           // 치명타 - 공격+마법
    'critDmg': ['공격', '마법'],        // 치명타 데미지 - 공격+마법
    'multiHit': ['공격', '마법'],       // 다중 공격 - 공격+마법
    'skillDmg': ['공격', '마법'],       // 스킬 데미지 - 공격+마법
    'dodge': ['방어', '마법'],          // 회피 - 방어+마법
    'first': ['공격', '마법'],          // 선제공격 - 공격+마법
    'lifeSteal': ['공격', '방어'],      // 흡혈 - 공격+방어
    'killHeal': ['공격', '방어'],       // 처치 회복 - 공격+방어
    'reflect': ['방어', '공격'],        // 반사 - 방어+공격
    'execute': ['공격'],                // 처형 - 공격
    'firstHit': ['공격'],               // 첫타 - 공격
    'dexMult': ['공격', '방어'],        // 민첩 - 공격+방어
    'lukMult': ['마법', '공격'],        // 행운 - 마법+공격
    'allStats': ['공격', '방어', '마법'] // 모든 스탯 - 3개 전부
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

// 태그 합성 실행 - 같은 태그+등급 3개 → 다음 등급 무작위 유물
function executeTagCombine(indices) {
    const relics = indices.map(i => gameState.tempRelics[i]);
    const rarity = relics[0].rarity;
    const nextRarity = getNextRarity(rarity);

    if (!nextRarity) return null;

    // 다음 등급의 무작위 유물 선택
    const nextRarityRelics = relicsData.filter(r => r.rarity === nextRarity);
    const randomRelic = { ...nextRarityRelics[Math.floor(Math.random() * nextRarityRelics.length)] };

    // 기존 3개 유물 제거 (인덱스 큰 것부터)
    const sortedIndices = [...indices].sort((a, b) => b - a);
    sortedIndices.forEach(idx => {
        gameState.tempRelics.splice(idx, 1);
    });

    // 새 유물 추가
    gameState.tempRelics.push(randomRelic);

    return randomRelic;
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
        const tagsHtml = tags.map(t => `<span class="tag tag-${t}">${t}</span>`).join('');

        card.innerHTML = `
            <div class="relic-icon">${relic.icon}</div>
            <div class="relic-name">${relic.name}</div>
            <div class="relic-rarity">[${rarityNames[relic.rarity]}]</div>
            <div class="relic-desc">${relic.desc}</div>
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

    if (selected.length !== 3) {
        combineBtn.disabled = true;
        combineBtn.textContent = `합성 (${selected.length}/3)`;
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
    } else if (gameState.selectedForCombine.length < 3) {
        gameState.selectedForCombine.push(index);
    }
    updateTagCombineUI();
}

// 태그 합성 실행
function onTagCombineClick() {
    if (gameState.selectedForCombine.length !== 3) return;

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
    cat: [
        {
            id: 'cat_rage', name: '광폭화', mpCost: 2, type: 'buff', cooldown: 4,
            buffEffect: 'atkBoost', buffValue: 0.25, buffTurns: 3, buffIcon: '🔥',
            desc: '3턴간 공격력 +25% (쿨타임 4턴)', char: '묘인'
        },
        {
            id: 'cat_slash', name: '폭렬참', mpCost: 3, damage: 35, type: 'active', cooldown: 2,
            desc: '35 피해 (적 반격 있음, 쿨타임 2턴)', char: '묘인'
        },
        {
            id: 'cat_bleed', name: '피의 갈증', mpCost: 0, type: 'passive',
            effect: 'lifeSteal', value: 0.1,
            desc: '[패시브] 공격 시 피해의 10%를 HP로 회복', char: '묘인'
        }
    ],
    elf: [
        {
            id: 'elf_focus', name: '정신 집중', mpCost: 1, type: 'buff', cooldown: 3,
            buffEffect: 'critBoost', buffValue: 20, buffTurns: 3, buffIcon: '🎯',
            desc: '3턴간 치명타 확률 +20% (쿨타임 3턴)', char: '엘프'
        },
        {
            id: 'elf_mana', name: '마나 순환', mpCost: 0, type: 'active', cooldown: 2,
            effect: 'mpRecover', value: 3,
            desc: 'MP 3 즉시 회복 (쿨타임 2턴)', char: '엘프'
        },
        {
            id: 'elf_nature', name: '자연의 축복', mpCost: 0, type: 'passive',
            effect: 'mpRegen', value: 1,
            desc: '[패시브] 매 턴 MP 1 자동 회복', char: '엘프'
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
            desc: '2턴간 받는 피해 -30%, 반격 피해 -40% (쿨타임 3턴)', char: '드워프'
        },
        {
            id: 'dwarf_bash', name: '방패 강타', mpCost: 2, damage: 20, type: 'active', cooldown: 2,
            effect: 'stun',
            desc: '20 피해 + 적 1턴 스턴 (쿨타임 2턴)', char: '드워프'
        },
        {
            id: 'dwarf_endure', name: '불굴', mpCost: 0, type: 'passive',
            effect: 'endure', value: 0.15,
            desc: '[패시브] 받는 모든 피해 -15%', char: '드워프'
        }
    ],
    human: [
        {
            id: 'human_snipe', name: '정밀 사격', mpCost: 2, damage: 25, type: 'active', cooldown: 0,
            effect: 'noCounter',
            desc: '25 피해 (적 반격 없음)', char: '인간'
        },
        {
            id: 'human_evasion', name: '회피 기동', mpCost: 2, type: 'buff', cooldown: 3,
            buffEffect: 'dodgeBoost', buffValue: 25, buffTurns: 2, buffIcon: '💨',
            desc: '2턴간 회피율 +25% (쿨타임 3턴)', char: '인간'
        },
        {
            id: 'human_tactics', name: '전술적 우위', mpCost: 0, type: 'passive',
            effect: 'firstStrike', value: 1,
            desc: '[패시브] 적의 선제공격이 1턴 늦게 발동', char: '인간'
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
    const isRelicFloor = floor % 5 === 0; // 5층마다 유물 보상
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
        stunned: false,
        // 디버프 상태 (남은 턴 수)
        debuffs: {
            poison: 0,      // 독: 턴당 최대HP 5% 피해
            burn: 0,        // 화상: 턴당 최대HP 7% 피해
            bleed: 0,       // 출혈: 턴당 최대HP 4% 피해
            curse: 0        // 저주: 턴당 최대HP 3% + 공격력 20% 감소
        }
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

// 유물에서 특정 효과의 값을 가져오는 헬퍼 함수 (복합 효과 지원)
function getRelicEffectValue(relic, effectType) {
    // 단일 효과 체크
    if (relic.effect === effectType) {
        return relic.value;
    }
    // 복합 효과 체크
    if (relic.effects) {
        const found = relic.effects.find(e => e.effect === effectType);
        if (found) return found.value;
    }
    return null;
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

    // 잿빛 소녀의 축복 - 분노 (근원석)
    atk += gameState.ashBlessings.fury * 2;

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
    return weapon ? gameState.weapons[weapon] * 0.5 : 0;
}

function getMaxHp() {
    const baseHp = 100 + (gameState.player.level - 1) * 10 + (gameState.armorLevel - 1) * 20;
    const strHp = getEffectiveStat('str') * 2;
    const dexHp = getEffectiveStat('dex') * 0.5;
    const intHp = getEffectiveStat('int') * 1;
    const vitHp = getEffectiveStat('vit') * 4;

    // 잿빛 소녀의 축복 - 수호 (근원석)
    const charHp = gameState.ashBlessings.aegis * 10;

    let totalHp = baseHp + strHp + dexHp + intHp + vitHp + charHp;

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

    // 잿빛 소녀의 축복 - 통찰 (근원석)
    chance += gameState.ashBlessings.insight * 1;

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

// 흡혈 효과 체크
function getLifeStealPercent() {
    let percent = 0;

    gameState.equippedSkills.forEach(skill => {
        if (skill?.type === 'passive' && skill.effect === 'lifeSteal') {
            percent += skill.value;
        }
    });

    // 유물 흡혈 효과
    gameState.tempRelics.forEach(relic => {
        const val = getRelicEffectValue(relic, 'lifeSteal');
        if (val !== null) percent += val;
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

// 쿨타임 감소량
function getCooldownReduce() {
    let reduce = 0;
    gameState.tempRelics.forEach(relic => {
        const val = getRelicEffectValue(relic, 'cooldownReduce');
        if (val !== null) reduce += val;
    });
    return reduce;
}

// 디버프 확률 계산
function getDebuffChance(debuffType) {
    let chance = 0;
    gameState.tempRelics.forEach(relic => {
        const val = getRelicEffectValue(relic, debuffType);
        if (val !== null) chance += val;
        // plague는 독+화상 동시 적용
        if (debuffType === 'poison' || debuffType === 'burn') {
            const plagueVal = getRelicEffectValue(relic, 'plague');
            if (plagueVal !== null) chance += plagueVal;
        }
    });
    return Math.min(chance, 0.8); // 최대 80%
}

// 공격 후 디버프 적용 시도
function tryApplyDebuffs() {
    const enemy = gameState.currentEnemy;
    if (!enemy || enemy.hp <= 0) return;

    const debuffTypes = ['poison', 'burn', 'bleed', 'curse'];
    const debuffNames = { poison: '독', burn: '화상', bleed: '출혈', curse: '저주' };
    const debuffDuration = 3; // 기본 3턴

    debuffTypes.forEach(type => {
        const chance = getDebuffChance(type);
        if (chance > 0 && Math.random() < chance) {
            if (enemy.debuffs[type] === 0) {
                addBattleLog(`💀 ${enemy.name}에게 ${debuffNames[type]} 적용!`);
            }
            enemy.debuffs[type] = debuffDuration; // 갱신
        }
    });
}

// 턴 시작 시 디버프 피해 처리
function processDebuffDamage() {
    const enemy = gameState.currentEnemy;
    if (!enemy || enemy.hp <= 0) return;

    const debuffDamage = {
        poison: 0.05,   // 5%
        burn: 0.07,     // 7%
        bleed: 0.04,    // 4%
        curse: 0.03     // 3%
    };
    const debuffIcons = { poison: '🟢', burn: '🔥', bleed: '🩸', curse: '💜' };

    let totalDamage = 0;
    let debuffMessages = [];

    Object.keys(enemy.debuffs).forEach(type => {
        if (enemy.debuffs[type] > 0) {
            const damage = Math.floor(enemy.maxHp * debuffDamage[type]);
            totalDamage += damage;
            debuffMessages.push(`${debuffIcons[type]}${damage}`);
            enemy.debuffs[type]--;
        }
    });

    if (totalDamage > 0) {
        enemy.hp -= totalDamage;
        addBattleLog(`디버프 피해: ${debuffMessages.join(' + ')} = ${totalDamage}`);
    }
}

// 처형 보너스 (적 HP 30% 이하 시 추가 피해)
function getExecuteBonus() {
    let bonus = 0;
    gameState.tempRelics.forEach(relic => {
        const val = getRelicEffectValue(relic, 'execute');
        if (val !== null) bonus += val;
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

// 추가 공격 확률
function getMultiHitChance() {
    let chance = 0;
    gameState.tempRelics.forEach(relic => {
        const val = getRelicEffectValue(relic, 'multiHit');
        if (val !== null) chance += val;
    });
    return Math.min(chance, 0.5); // 최대 50%
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

function calculateDamageTaken(damage, guarding = false, isCounter = false) {
    let finalDamage = damage;

    // 총 피해 감소율 계산 (최대 80%)
    let totalReduction = 0;

    // 방어 배율 (패시브/버프)
    totalReduction += (1 - getDefenseMultiplier()) * 100;

    // 활력 스탯 데미지 감소
    totalReduction += getVitDamageReduction() * 100;

    // 잿빛 소녀의 축복 - 인내 (0.5% per level)
    totalReduction += Math.min(gameState.ashBlessings.patience * 0.5, 30);

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

    return Math.floor(Math.max(1, finalDamage)); // 최소 1 데미지
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
    // 피해감소: 활력 기반 + 상점 보너스 + 인내의 축복 (최대 80%)
    const totalDefReduction = Math.min(
        getVitDamageReduction() * 100 +
        gameState.percentBonus.def +
        Math.min(gameState.ashBlessings.patience * 0.5, 30),
        80
    );
    document.getElementById('spec-def').textContent = Math.floor(totalDefReduction) + '%';

    // 스킵 버튼 업데이트
    const skipFloor = getSkipFloor();
    const skipBtn = document.getElementById('btn-skip');
    const skipInfo = document.getElementById('skip-info');

    if (skipFloor > 0) {
        skipBtn.disabled = false;
        skipInfo.textContent = `5→${skipFloor}층 보스전만 진행 (최고: ${gameState.dungeon.highestFloor}층)`;
    } else {
        skipBtn.disabled = true;
        skipInfo.textContent = '5층 클리어 후 스킵 가능';
    }
}

function getPercentUpgradeCost(currentPercent) {
    // 비용: 100 + (현재% * 10), 0.5%씩 증가하므로 currentPercent는 0.5 단위
    return Math.floor(100 + currentPercent * 10);
}

function getTalismanCost(type, purchases) {
    // 부적별 기본 비용과 증가율
    const baseCosts = { exp: 100, gold: 100, stone: 200, origin: 500 };
    const multiplier = 1 + purchases * 0.1; // 구매할수록 10%씩 증가
    return Math.floor(baseCosts[type] * multiplier);
}

function updateShopUI() {
    document.getElementById('shop-gold').textContent = gameState.player.gold;
    document.getElementById('shop-stones').textContent = gameState.enhancementStones;
    document.getElementById('shop-origins').textContent = gameState.originStones;

    // 방어구
    document.getElementById('armor-level').textContent = gameState.armorLevel;
    document.getElementById('armor-cost').textContent = gameState.armorLevel * 100;
    const armorCost = gameState.armorLevel * 100;
    document.getElementById('btn-upgrade-armor').disabled = gameState.player.gold < armorCost;

    // 부적 (경험치, 골드)
    const expBonus = gameState.talismanPurchases.exp * 3;
    const expCost = getTalismanCost('exp', gameState.talismanPurchases.exp);
    const isExpMax = expBonus >= 99;
    document.getElementById('exp-bonus').textContent = expBonus;
    document.getElementById('cost-exp').textContent = isExpMax ? 'MAX' : expCost;
    const expBtn = document.querySelector('.btn-talisman[data-talisman="exp"]');
    expBtn.disabled = isExpMax || gameState.player.gold < expCost;
    if (isExpMax) expBtn.textContent = 'MAX';

    const goldBonus = gameState.talismanPurchases.gold * 3;
    const goldTalismanCost = getTalismanCost('gold', gameState.talismanPurchases.gold);
    const isGoldMax = goldBonus >= 99;
    document.getElementById('gold-bonus').textContent = goldBonus;
    document.getElementById('cost-gold-talisman').textContent = isGoldMax ? 'MAX' : goldTalismanCost;
    const goldBtn = document.querySelector('.btn-talisman[data-talisman="gold"]');
    goldBtn.disabled = isGoldMax || gameState.player.gold < goldTalismanCost;
    if (isGoldMax) goldBtn.textContent = 'MAX';

    // 재화 교환
    const stoneCost = getTalismanCost('stone', gameState.talismanPurchases.stone);
    document.getElementById('cost-stone').textContent = stoneCost;
    document.querySelector('.btn-talisman[data-talisman="stone"]').disabled = gameState.player.gold < stoneCost;

    const originCost = getTalismanCost('origin', gameState.talismanPurchases.origin);
    document.getElementById('cost-origin').textContent = originCost;
    document.querySelector('.btn-talisman[data-talisman="origin"]').disabled = gameState.player.gold < originCost;

    // 능력 부적 (퍼센트 강화) - 0.5%씩 증가, 모든 스탯 100%까지 구매 가능
    const stats = ['atk', 'hp', 'crit', 'critDmg', 'dodge', 'def'];
    stats.forEach(stat => {
        const current = gameState.percentBonus[stat];
        const cost = getPercentUpgradeCost(current);
        const isMax = current >= 100;

        document.getElementById(`percent-${stat}`).textContent = current.toFixed(1);
        document.getElementById(`cost-${stat}`).textContent = isMax ? 'MAX' : cost;
        document.getElementById(`fill-${stat}`).style.width = `${current}%`;

        const btn = document.querySelector(`.btn-percent-upgrade[data-stat="${stat}"]`);
        btn.disabled = isMax || gameState.player.gold < cost;
        if (isMax) {
            btn.textContent = 'MAX';
        }
    });
}

function getEnhanceSuccessRate(level) {
    // 1강: 100%, 100강: 1% (선형 감소)
    return Math.max(1, 100 - (level - 1));
}

function getEnhanceGoldCost(level) {
    // 골드 비용: 현재 레벨 * 50
    return level * 50;
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
        const isMaxLevel = level >= 100;
        const canAfford = gameState.enhancementStones >= 1 && gameState.player.gold >= goldCost;

        document.getElementById(`${weapon}-level`).textContent = level;
        document.getElementById(`${weapon}-bonus`).textContent = (level * 0.5).toFixed(1);
        document.getElementById(`${weapon}-rate`).textContent = successRate;
        document.getElementById(`${weapon}-gold`).textContent = goldCost;

        const btn = document.querySelector(`.btn-upgrade[data-weapon="${weapon}"]`);
        btn.disabled = !canAfford || isMaxLevel;
        btn.textContent = isMaxLevel ? 'MAX' : `강화 (${successRate}%)`;
    });
}

function updateInnUI() {
    document.getElementById('inn-origin-stones').textContent = gameState.originStones;

    // 잿빛 소녀의 축복 표시
    document.getElementById('blessing-fury').textContent = gameState.ashBlessings.fury;
    document.getElementById('blessing-aegis').textContent = gameState.ashBlessings.aegis;
    document.getElementById('blessing-insight').textContent = gameState.ashBlessings.insight;
    document.getElementById('blessing-patience').textContent = gameState.ashBlessings.patience;

    // 축복 버튼 상태
    document.querySelectorAll('.btn-blessing').forEach(btn => {
        btn.disabled = gameState.originStones < 1;
    });

    // 스탯 포인트 구매 비용 (구매할수록 증가)
    const statPointCost = 1 + Math.floor(gameState.statPointsPurchased / 5);
    document.getElementById('stat-point-cost').textContent = statPointCost;
    document.getElementById('btn-buy-stat-point').disabled = gameState.originStones < statPointCost;
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
    const enemy = gameState.currentEnemy;
    const typeIcon = enemy.type ? enemy.type.icon : '';
    document.getElementById('enemy-name').textContent = typeIcon + enemy.name + (enemy.stunned ? ' [스턴]' : '');
    document.getElementById('enemy-hp').textContent = Math.max(0, enemy.hp);
    document.getElementById('enemy-max-hp').textContent = enemy.maxHp;
    document.getElementById('enemy-atk').textContent = enemy.atk;
    document.getElementById('enemy-preempt-counter').textContent = Math.max(0, enemyAttackCounter);

    // 선제공격 1턴 남았을 때 경고 표시
    const preemptDisplay = document.querySelector('.enemy-preempt-display');
    if (enemyAttackCounter <= 1) {
        preemptDisplay.classList.add('warning');
    } else {
        preemptDisplay.classList.remove('warning');
    }

    const enemyHpPercent = (Math.max(0, enemy.hp) / enemy.maxHp) * 100;
    document.getElementById('enemy-hp-bar').style.width = `${enemyHpPercent}%`;

    // 왼쪽 스탯 패널 - 기본 스탯
    document.getElementById('panel-str').textContent = Math.floor(getFinalStat('str'));
    document.getElementById('panel-dex').textContent = Math.floor(getFinalStat('dex'));
    document.getElementById('panel-int').textContent = Math.floor(getFinalStat('int'));
    document.getElementById('panel-vit').textContent = Math.floor(getFinalStat('vit'));
    document.getElementById('panel-luk').textContent = Math.floor(getFinalStat('luk'));
    // 왼쪽 스탯 패널 - 전투 능력
    document.getElementById('panel-atk').textContent = getPlayerAtk();
    document.getElementById('panel-crit').textContent = getCritChance() + '%';
    document.getElementById('panel-crit-dmg').textContent = getCritDamage() + '%';
    document.getElementById('panel-dodge').textContent = getDodgeChance() + '%';
    document.getElementById('panel-def').textContent = Math.floor(getVitDamageReduction() * 100) + '%';

    document.getElementById('battle-hp').textContent = gameState.player.hp;
    document.getElementById('battle-max-hp').textContent = gameState.player.maxHp;
    document.getElementById('battle-mp').textContent = gameState.player.mp;
    document.getElementById('battle-max-mp').textContent = gameState.player.maxMp;

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
    gameState.dungeon.firstHitUsed = false; // 첫타 보너스 초기화
    isGuarding = false;
    hasActed = false;
    enemyAttackCounter = getRandomAttackCounter();
    clearBattleLog();

    // 도주 버튼 활성화
    document.getElementById('btn-return').disabled = false;

    const floorType = gameState.currentEnemy.isBoss ? '보스' : gameState.currentEnemy.isMiniBoss ? '중간보스' : '';
    addBattleLog(`${gameState.dungeon.currentFloor}층 - ${gameState.currentEnemy.name} ${floorType ? `[${floorType}]` : ''} 등장!`);
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
    enemyAttackCounter--;

    // 카운터가 0 이하면 선제공격 발동 후 즉시 리셋
    while (enemyAttackCounter <= 0) {
        addBattleLog(`⚠️ 적의 선제공격!`);
        enemyPreemptiveAttack();

        if (gameState.player.hp <= 0) {
            updateBattleUI();
            return true; // 플레이어 사망
        }

        enemyAttackCounter = getRandomAttackCounter();
        addBattleLog(`다음 선제공격까지 ${enemyAttackCounter}턴`);
    }

    updateBattleUI();
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

    let baseDamage = isCrit ? Math.floor(enemyAtk * 1.5) : enemyAtk;
    if (isDodge) baseDamage = Math.floor(baseDamage * 0.5);
    const damage = calculateDamageTaken(baseDamage, false);

    gameState.player.hp -= damage;
    const logParts = [`${damage} 피해를 받았다!`];
    if (isCrit) logParts.push('(치명타!)');
    if (isDodge) logParts.push('(부분 회피!)');
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

    // 공격 실행
    const totalDamage = executePlayerAttack(false);

    // 추가 공격 (multiHit)
    const multiHitChance = getMultiHitChance();
    if (multiHitChance > 0 && Math.random() < multiHitChance && gameState.currentEnemy.hp > 0) {
        addBattleLog('⚡ 추가 공격!');
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

    gameState.currentEnemy.hp -= damage;
    const logParts = [`${isSkill ? '' : '공격! '}${damage} 피해!`];
    if (isCrit) logParts.push('(치명타!)');
    if (isEnemyDodge) logParts.push('(적 부분 회피!)');
    if (isFirstHit && getFirstHitBonus() > 0) logParts.push('(첫타!)');
    if (isExecute && getExecuteBonus() > 0) logParts.push('(처형!)');
    addBattleLog(logParts.join(' '));

    // 흡혈 효과
    applyLifeSteal(damage);

    // 디버프 적용 시도
    tryApplyDebuffs();

    return damage;
}

// 턴 처리 (쿨타임 감소, MP 재생, 디버프 피해 등)
function processPlayerTurn() {
    tickCooldowns();
    tickMpRegen();
    // 적 디버프 피해 처리
    processDebuffDamage();
}

// 흡혈 효과
function applyLifeSteal(damage) {
    const lifeSteal = getLifeStealPercent();
    if (lifeSteal > 0) {
        const heal = Math.floor(damage * lifeSteal);
        if (heal > 0) {
            gameState.player.hp = Math.min(gameState.player.maxHp, gameState.player.hp + heal);
            addBattleLog(`💚 HP +${heal} (흡혈)`);
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

    let baseDamage = isCrit ? Math.floor(enemyAtk * 1.5) : enemyAtk;
    if (isDodge) baseDamage = Math.floor(baseDamage * 0.5);
    const damage = calculateDamageTaken(baseDamage, isGuarding, true); // isCounter = true

    gameState.player.hp -= damage;
    const logParts = [`적의 반격! ${damage} 피해`];
    if (isCrit) logParts.push('(치명타!)');
    if (isDodge) logParts.push('(부분 회피!)');
    if (isGuarding) logParts.push('(방어!)');
    addBattleLog(logParts.join(' '));
    isGuarding = false;

    // 피해 반사 (reflect)
    const reflectPercent = getReflectPercent();
    if (reflectPercent > 0 && damage > 0) {
        const reflectDamage = Math.floor(damage * reflectPercent);
        gameState.currentEnemy.hp -= reflectDamage;
        addBattleLog(`🦔 ${reflectDamage} 피해 반사!`);

        // 반사로 적 처치 체크
        if (gameState.currentEnemy.hp <= 0) {
            endPlayerTurn();
            enemyDefeated();
            return;
        }
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
        applyBuff(skill);
        endPlayerTurn();
        updateBattleUI();
        return;
    }

    // === MP 회복 스킬 ===
    if (skill.effect === 'mpRecover') {
        const recoverAmount = Math.floor(skill.value * (1 + weaponBonus / 100));
        gameState.player.mp = Math.min(gameState.player.maxMp, gameState.player.mp + recoverAmount);
        addBattleLog(`💙 MP +${recoverAmount} 회복!`);
        endPlayerTurn();
        updateBattleUI();
        return;
    }

    // === 데미지 스킬 ===
    if (skill.damage) {
        const hits = skill.hits || 1;
        const damageMultiplier = getDamageMultiplier();
        const skillDmgBonus = 1 + getSkillDmgBonus(); // 스킬 데미지 보너스
        let totalDamage = 0;

        for (let i = 0; i < hits; i++) {
            const isCrit = Math.random() * 100 < getCritChance();
            const isEnemyDodge = gameState.currentEnemy.dodge && Math.random() * 100 < gameState.currentEnemy.dodge;

            let baseDamage = Math.floor(skill.damage * (1 + weaponBonus / 100) * damageMultiplier * skillDmgBonus);

            // 보스킬러 보너스
            if (gameState.currentEnemy.isBoss || gameState.currentEnemy.isMiniBoss) {
                const bossBonus = getBossKillerBonus();
                if (bossBonus > 0) {
                    baseDamage = Math.floor(baseDamage * (1 + bossBonus));
                }
            }

            if (isCrit) baseDamage = Math.floor(baseDamage * getCritDamage() / 100);
            if (isEnemyDodge) baseDamage = Math.floor(baseDamage * 0.5);

            gameState.currentEnemy.hp -= baseDamage;
            totalDamage += baseDamage;

            const logParts = [`${baseDamage} 피해!`];
            if (isCrit) logParts.push('(치명타!)');
            if (isEnemyDodge) logParts.push('(적 부분 회피!)');
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
        if (goldVal !== null) goldReward = Math.floor(goldReward * goldVal);
        if (expVal !== null) expReward = Math.floor(expReward * expVal);
    });

    // 부적 효과 (+3% per purchase)
    const expTalismanBonus = 1 + (gameState.talismanPurchases.exp * 0.03);
    const goldTalismanBonus = 1 + (gameState.talismanPurchases.gold * 0.03);
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
        addBattleLog(`💚 HP +${healAmount} (처치 회복)`);
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

    // 유물 선택지 생성 (3개)
    // 중간보스(5층): 일반 등급만, 보스(10층): 희귀 등급만
    generateRelicChoices(isBossFloor ? 'rare' : 'common');

    // 보스층(10층 단위)에는 스킬 선택도 제공
    if (isBossFloor) {
        generateSkillChoices();
    }

    // 보스 클리어 화면 표시
    showBossClearScreen(isBossFloor);
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
    // 고정 시작 스킬: 각 캐릭터의 액티브 스킬
    return [
        { ...skillsData.cat[1], character: 'cat' },      // 폭렬참 (35 데미지)
        { ...skillsData.elf[1], character: 'elf' },      // 마나 순환 (MP 회복)
        { ...skillsData.dwarf[1], character: 'dwarf' },  // 방패 강타 (스턴)
        { ...skillsData.human[0], character: 'human' }   // 정밀 사격 (반격없음)
    ];
}

function showBossClearScreen(showSkillChoice = true) {
    // 확인 버튼 섹션만 표시, 나머지는 숨김
    document.getElementById('boss-confirm-section').classList.remove('hidden');
    document.getElementById('relic-choice-section').classList.add('hidden');
    document.getElementById('skill-rest-section').classList.add('hidden');
    document.getElementById('relic-replace-section').classList.add('hidden');

    // 스킬 선택 표시 여부 저장 (확인 버튼 클릭 시 사용)
    gameState.showSkillChoiceOnReward = showSkillChoice;

    // 현재 층 정보 표시
    const floorType = showSkillChoice ? '보스' : '중간';
    document.getElementById('boss-confirm-section').querySelector('h2').textContent =
        `${gameState.dungeon.currentFloor}층 ${floorType} 클리어!`;
    document.getElementById('boss-confirm-section').querySelector('.boss-confirm-msg').textContent =
        '특별한 보상을 선택하세요!';

    showScreen('boss-clear-screen');
}

function showBossRewardChoices() {
    // 확인 버튼 숨기고 선택지 표시
    document.getElementById('boss-confirm-section').classList.add('hidden');
    document.getElementById('relic-choice-section').classList.remove('hidden');

    // 스킬 선택은 보스층(10층 단위)에서만 표시
    const skillSection = document.getElementById('skill-rest-section');
    if (gameState.showSkillChoiceOnReward) {
        skillSection.classList.remove('hidden');

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
    } else {
        skillSection.classList.add('hidden');
    }

    // 유물 선택지 표시 (3개)
    const relicGrid = document.getElementById('relic-choice-grid');
    relicGrid.innerHTML = '';

    // 교체 섹션 숨김
    document.getElementById('relic-replace-section').classList.add('hidden');

    // 유물 설명 (보스층에서는 유물/스킬 중 택1 안내)
    if (gameState.showSkillChoiceOnReward) {
        document.getElementById('relic-choice-desc').textContent = '유물을 선택하면 스킬 변경 불가';
    } else {
        document.getElementById('relic-choice-desc').textContent = '3개 중 하나를 선택하세요';
    }

    if (gameState.relicChoices.length > 0) {
        gameState.relicChoices.forEach(relic => {
            // 같은 유물 보유 개수 확인
            const ownedCount = gameState.tempRelics.filter(r => r.id === relic.id && r.rarity === relic.rarity).length;
            const tags = getRelicTags(relic);
            const tagsHtml = tags.map(t => `<span class="tag tag-${t}">${t}</span>`).join('');
            const btn = document.createElement('button');
            btn.className = `relic-choice-btn rarity-${relic.rarity}`;
            btn.innerHTML = `
                <div class="relic-rarity rarity-${relic.rarity}">${rarityNames[relic.rarity]}</div>
                <div class="relic-icon">${relic.icon}</div>
                <div class="relic-name">${relic.name}</div>
                <div class="relic-desc">${relic.desc}</div>
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

// 유물 선택 (수동 합성 - 유물은 바로 추가)
function selectRelic(relic) {
    // 유물 바로 추가 (합성은 수동으로)
    gameState.tempRelics.push({ ...relic });
    proceedAfterRelicChoice();
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
        <p class="combine-success-msg">합성 성공!</p>
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
        'crit': (v) => `치명타 +${Math.floor(v)}%`,
        'first': (v) => `선제공격 +${Math.floor(v)}%`,
        'lifeSteal': (v) => `흡혈 ${Math.floor(v * 100)}%`,
        'critDmg': (v) => `치명타 피해 +${Math.floor(v)}%`,
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
        'poison': (v) => `독 ${Math.floor(v * 100)}% 확률`,
        'burn': (v) => `화상 ${Math.floor(v * 100)}% 확률`,
        'bleed': (v) => `출혈 ${Math.floor(v * 100)}% 확률`,
        'curse': (v) => `저주 ${Math.floor(v * 100)}% 확률`,
        'plague': (v) => `역병 ${Math.floor(v * 100)}% 확률`,
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

// 스킬 유지 + HP 30% 회복 후 다음 층으로
function skipSkillAndContinue() {
    // HP 30% 회복
    const healAmount = Math.floor(gameState.player.maxHp * 0.3);
    gameState.player.hp = Math.min(gameState.player.maxHp, gameState.player.hp + healAmount);

    // MP 회복
    gameState.player.maxMp = getMaxMp();
    gameState.player.mp = gameState.player.maxMp;

    // 다음 층으로 (스킵 모드 처리 포함)
    proceedToNextFloor();
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

    // 현재 스탯 섹션
    html += '<div class="info-section-title">📊 현재 스탯</div>';
    const totalDefReduction = Math.min(
        getVitDamageReduction() * 100 +
        gameState.percentBonus.def +
        Math.min(gameState.ashBlessings.patience * 0.5, 30),
        80
    );
    html += `
        <div class="info-stats-grid">
            <div class="info-stat-item"><span class="info-stat-label">공격력</span><span class="info-stat-value">${getPlayerAtk()}</span></div>
            <div class="info-stat-item"><span class="info-stat-label">최대HP</span><span class="info-stat-value">${gameState.player.maxHp}</span></div>
            <div class="info-stat-item"><span class="info-stat-label">치명타</span><span class="info-stat-value">${getCritChance()}%</span></div>
            <div class="info-stat-item"><span class="info-stat-label">크리뎀</span><span class="info-stat-value">${getCritDamage()}%</span></div>
            <div class="info-stat-item"><span class="info-stat-label">회피율</span><span class="info-stat-value">${getDodgeChance()}%</span></div>
            <div class="info-stat-item"><span class="info-stat-label">피해감소</span><span class="info-stat-value">${Math.floor(totalDefReduction)}%</span></div>
        </div>
    `;

    // 태그 합성 버튼 (전투 중이 아닐 때만)
    if (!gameState.dungeon.inBattle && gameState.tempRelics.length >= 3) {
        html += `
            <div class="info-combine-section">
                <button id="btn-info-tag-combine" class="btn-info-tag-combine">🔮 태그 합성 열기</button>
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
                        <div class="relic-info-desc">${relic.desc}</div>
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
    easy: '적 능력치 x0.5 / 보상 x1 / 입문자용',
    normal: '적 능력치 x5 / 보상 x3 / 성장 필요',
    hard: '적 능력치 x30 / 보상 x5 / 고성장 필수',
    infinite: '적 능력치 x10 / 보상 x4 / 끝없는 도전'
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

            if (gameState.enhancementStones >= 1 && gameState.player.gold >= goldCost && currentLevel < 100) {
                gameState.enhancementStones--;
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

    // 상점 - 방어구 강화 (골드 사용)
    document.getElementById('btn-upgrade-armor').addEventListener('click', () => {
        const cost = gameState.armorLevel * 100;
        if (gameState.player.gold >= cost) {
            gameState.player.gold -= cost;
            gameState.armorLevel++;
            gameState.player.maxHp = getMaxHp();
            updateShopUI();
        }
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

    // 상점 - 퍼센트 능력 강화 (골드 사용, 0.5%씩)
    document.querySelectorAll('.btn-percent-upgrade').forEach(btn => {
        btn.addEventListener('click', () => {
            const stat = btn.dataset.stat;
            const current = gameState.percentBonus[stat];
            const cost = getPercentUpgradeCost(current);

            if (current < 100 && gameState.player.gold >= cost) {
                gameState.player.gold -= cost;
                gameState.percentBonus[stat] += 0.5;

                // HP 강화 시 즉시 적용
                if (stat === 'hp') {
                    gameState.player.maxHp = getMaxHp();
                }
                updateShopUI();
            }
        });
    });

    // 숙소 - 잿빛 소녀의 축복 (근원석 사용)
    document.querySelectorAll('.btn-blessing').forEach(btn => {
        btn.addEventListener('click', () => {
            const blessing = btn.dataset.blessing;
            if (gameState.originStones >= 1) {
                gameState.originStones--;
                gameState.ashBlessings[blessing]++;
                // 수호의 축복(aegis) - HP 증가 시 즉시 적용
                if (blessing === 'aegis') {
                    gameState.player.maxHp = getMaxHp();
                }
                updateInnUI();
            }
        });
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

    // 전투
    document.getElementById('btn-attack').addEventListener('click', playerAttack);

    for (let i = 1; i <= 4; i++) {
        document.getElementById(`btn-skill-${i}`).addEventListener('click', () => useSkill(i - 1));
    }

    // 상세 정보 버튼
    document.getElementById('btn-info-toggle').addEventListener('click', toggleInfoPanel);

    document.getElementById('btn-return').addEventListener('click', () => returnToVillage(false));
    document.getElementById('btn-gameover-return').addEventListener('click', () => returnToVillage(true));
    document.getElementById('btn-clear-return').addEventListener('click', () => returnToVillage(false));

    // 보스 클리어 화면
    document.getElementById('btn-boss-confirm').addEventListener('click', showBossRewardChoices);
    document.getElementById('btn-skip-skill').addEventListener('click', skipSkillAndContinue);
    document.getElementById('btn-cancel-relic').addEventListener('click', cancelRelicReplace);

    // 유물 합성 확인
    document.getElementById('btn-skip-combine').addEventListener('click', confirmCombineResult);

    // 태그 합성
    document.getElementById('btn-tag-combine-open').addEventListener('click', openTagCombineMode);
    document.getElementById('btn-tag-combine').addEventListener('click', onTagCombineClick);
    document.getElementById('btn-tag-combine-close').addEventListener('click', closeTagCombineMode);
}

// 스탯 초기화 (모든 스탯을 5로 되돌리고 포인트 환불)
function resetStats() {
    const baseStats = 5;
    const currentTotal = gameState.player.stats.str + gameState.player.stats.dex +
                        gameState.player.stats.int + gameState.player.stats.vit + gameState.player.stats.luk;
    const baseTotal = baseStats * 5; // 25 (5개 스탯)

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
