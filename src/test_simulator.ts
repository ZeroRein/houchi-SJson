import { Unit } from "./core/Unit";
import { BattleContext } from "./types";
import { Apollo } from "./data/characters/Apollo";

// === 1. ユニットのセットアップ ===
// アポロを作成（実際はスプレッドシートから読み込んだ値を使う）
const attacker = new Unit(Apollo.name, Apollo.baseStats);

// 敵を作成（ダミー）
const enemy1 = new Unit("敵A", { 
    hp: 0, max_hp: 20000000, mp: 0, max_mp: 0,
    strength: 100000, agility: 100000, intelligence: 100000, stamina: 100000,
    attack_min: 100000, attack_max: 100000, defense: 10000, crit_rate: 0.1 
});
const enemy2 = new Unit("敵B", { 
    hp: 0, max_hp: 20000000, mp: 0, max_mp: 0,
    strength: 100000, agility: 100000, intelligence: 100000, stamina: 100000,
    attack_min: 100000, attack_max: 100000, defense: 10000, crit_rate: 0.1 
});

// 敵Bに「破甲」を付与しておく（アポロのスキル1のターゲット分岐テスト用）
enemy2.addBuff({ id: "armor_break_sin", name: "破甲(罪悪)", duration: 4 });


// === 2. 戦闘コンテキストの作成 ===
const context: BattleContext = {
    turn: 1,
    attacker: attacker,
    allies: [attacker],
    enemies: [enemy1, enemy2],
    log: (msg) => console.log(`[BattleLog] ${msg}`)
};


// === 3. スキル実行エンジンの簡易実装 ===
function executeSkill(charDef: typeof Apollo, skillIndex: number, ctx: BattleContext) {
    const skill = charDef.activeSkills[skillIndex];
    ctx.log(`\n=== ${charDef.name} のスキル${skill.id}「${skill.name}」発動 ===`);

    // 1. スキル前処理
    if (skill.preSkillActions) {
        skill.preSkillActions(ctx);
    }

    // 2. ターゲット選択
    const targets = skill.selectTargets(ctx);
    ctx.log(`ターゲット数: ${targets.length} 名`);

    // 3. 攻撃実行（実際は多段ヒットやミス判定などのループになる）
    targets.forEach((target, i) => {
        ctx.log(`--- 攻撃 ${i + 1} (Target: ${target.name}) ---`);
        
        skill.effects.forEach(effect => {
            if (effect.type === 'damage' && effect.calc) {
                // 条件判定（例：敏捷勝負でバフ解除）
                if (effect.condition) {
                    const conditionMet = effect.condition(ctx.attacker, target);
                    if (conditionMet) {
                        ctx.log(`  (条件達成: 特殊効果発動判定など)`);
                    }
                }

                // ダメージ計算実行（ここが最速の理由。パース不要で即座に計算）
                const dmg = effect.calc(ctx.attacker, target);
                target.takeDamage(dmg);
                
                ctx.log(`  ダメージ: ${dmg.floor().toString()} (残りHP: ${target.currentHp.floor().toString()})`);
            }
        });
    });

    // 4. スキル後処理
    if (skill.postSkillActions) {
        skill.postSkillActions(ctx);
    }
}

// === 4. 実行 ===
console.log("戦闘開始！");
// スキル1を実行
executeSkill(Apollo, 0, context);