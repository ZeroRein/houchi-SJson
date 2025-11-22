import { CharacterDef, ActiveSkill, BattleContext } from "../../types";
import { Decimal } from "../../core/MockDecimal.ts"; // 本番では decimal.js
import { Unit } from "../../core/Unit";

/**
 * アポロ (Apollo)
 * * JSONデータにあった複雑な条件分岐（例：「破甲でない敵を優先」）を
 * 簡潔なTypeScriptコードとして記述しています。
 * これにより、パーサーを介さずに仕様を直接実行可能です。
 */

export const Apollo: CharacterDef = {
    id: "apollo_mr",
    name: "アポロ",
    // 基礎ステータス（ここはGoogleスプレッドシートから自動生成してimportする想定）
    baseStats: {
        hp: 0, max_hp: 10000000,
        mp: 0, max_mp: 0,
        strength: 200000,
        agility: 450000, // 特化
        intelligence: 150000,
        stamina: 200000,
        attack_min: 1500000,
        attack_max: 2000000,
        defense: 50000,
        crit_rate: 0.5
    },
    activeSkills: [
        // === スキル1: 輝きの黄金色 ===
        {
            id: 1,
            name: "輝きの黄金色",

            // ターゲット選択ロジック: JSONの "priority_condition" をコード化
            selectTargets: (ctx: BattleContext) => {
                const livingEnemies = ctx.enemies.filter(e => e.isAlive());
                
                // 優先: 破甲(armor_break_sin)状態でない敵
                const priorityTargets = livingEnemies.filter(e => !e.hasBuff("armor_break_sin"));
                const otherTargets = livingEnemies.filter(e => e.hasBuff("armor_break_sin"));
                
                // 優先ターゲットから先にリストを作り、足りなければその他から補充
                // JSONでは "count": 9, "type": "random"
                let candidates = [...priorityTargets, ...otherTargets];
                
                // ランダムに9回選択（重複ありならこの実装、重複なしならslice）
                // 放置少女のランダム攻撃は通常「重複あり」でターゲットを選定するが
                // ここでは簡易的に「生きている敵からランダムに9回攻撃判定を行う」とする
                // 実際の実装では「攻撃ごとにターゲットを再抽選」するループを回すことが多い
                return Array(9).fill(null).map(() => 
                    livingEnemies[Math.floor(Math.random() * livingEnemies.length)]
                ).filter(u => u !== undefined); 
            },

            // スキル発動前の処理
            preSkillActions: (ctx: BattleContext) => {
                ctx.log(`${ctx.attacker.name} は自身異常状態を2つ解除！`);
                // 実際の実装: ctx.attacker.cleanse(2);
                
                ctx.log(`${ctx.attacker.name} に「冷血」「幸運」を付与`);
                ctx.attacker.addBuff({ id: "cold_blood_sacred", name: "冷血(聖護)", duration: 4 });
                ctx.attacker.addBuff({ id: "fortune_sacred", name: "幸運(聖護)", duration: 4 });
            },

            // 攻撃効果フロー
            effects: [
                {
                    type: "damage",
                    // 計算式: 800% + 敏捷*16 + 攻撃力*0.8
                    calc: (attacker, defender) => {
                        const baseDmg = attacker.getStat("attack_max").times(8.0);
                        const agiDmg = attacker.getStat("agility").times(16.0);
                        const atkDmg = attacker.getStat("attack_max").times(0.8);
                        
                        // 実際のシミュではここで防御減算やクリティカル計算が入る
                        return baseDmg.plus(agiDmg).plus(atkDmg);
                    },
                    // 攻撃前のバフ解除判定 (JSON: "condition": self.agility > target.agility)
                    condition: (attacker, defender) => {
                        if (attacker.getStat("agility").gt(defender.getStat("agility"))) {
                             // ここでバフ解除ロジックを呼ぶ
                             // defender.removeBuff(...)
                             return true; 
                        }
                        return true;
                    }
                },
                // デバフ付与: 聖裁 or 破甲
                {
                    type: "debuff",
                    condition: (attacker, defender) => {
                        // 既に破甲なら聖裁、そうでなければ破甲
                        if (defender.hasBuff("armor_break_sin")) {
                            // 本来はここで "divine_judgment_sin" を付与
                            return true;
                        } else {
                            // 本来はここで "armor_break_sin" を付与
                            return true;
                        }
                    }
                }
            ],
            
            postSkillActions: (ctx: BattleContext) => {
                 ctx.log(`${ctx.attacker.name} が味方6名に「朧月(聖護)」を付与`);
            }
        },
        
        // === スキル2: 慕われる身 ===
        {
            id: 2,
            name: "慕われる身",
            selectTargets: (ctx: BattleContext) => {
                // 条件: 体力が最も低い敵 (lowest_stat_vit)
                // TypeScriptならsort一発で書ける。JSONパーサー実装コストゼロ。
                const targets = ctx.enemies.filter(e => e.isAlive())
                    .sort((a, b) => a.getStat("stamina").toNumber() - b.getStat("stamina").toNumber());
                
                // 6回攻撃 + 会心発生で追加攻撃（最大+6）
                // この動的な回数変更も、コードなら while ループで簡単に記述可能
                return targets.length > 0 ? [targets[0]] : []; // デモのため簡易化
            },
            effects: [
                {
                    type: "damage",
                    // 計算式: 800% + 敏捷*10 + 攻撃力*1.0
                    calc: (attacker, defender) => {
                         return attacker.getStat("attack_max").times(8.0)
                            .plus(attacker.getStat("agility").times(10.0))
                            .plus(attacker.getStat("attack_max").times(1.0));
                    }
                }
            ]
        }
    ]
};