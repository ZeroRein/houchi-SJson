import { BuffDef, BuffContext } from "../../types";
import { Decimal } from "../../core/MockDecimal";

/**
 * 聖護バフ定義ファイル
 * JSONデータをTypeScriptのオブジェクトとして再定義。
 * 関数でロジックを直接記述できるため、複雑な条件も柔軟に実装可能。
 */
export const SacredBuffs: Record<string, BuffDef> = {
    
    // === 1. バリア・ダメージ吸収系 ===

    // 影甲 (Shadow Armor)
    // JSON: "mp_based", "multiplier": 12, "hp_based_scaling" (カット率30-60%)
    shadow_armor_sacred: {
        id: "shadow_armor_sacred",
        name: "影甲(聖護)",
        isSacred: true,
        isRemovable: false, // 一般的な解除では消えない（聖護解除が必要）

        // 付与時にMPベースのシールドを貼る
        onApplied: (ctx, duration) => {
            const mp = ctx.owner.getStat("max_mp");
            const shieldValue = mp.times(12);
            // Unitクラスに addShield メソッドがある想定
            // ctx.owner.addShield("shadow_armor", shieldValue);
            console.log(`${ctx.owner.name}に影甲を展開: 耐久値 ${shieldValue.toString()}`);
        },

        // ダメージ軽減ロジック
        modifyDamageTaken: (ctx, damage) => {
            // 残HP%が低いほどカット率上昇 (30% ~ 60%)
            const maxHp = ctx.owner.getStat("max_hp");
            const currentHp = ctx.owner.currentHp;
            const hpPercent = currentHp.div(maxHp).toNumber();

            // HP100% -> 0.30, HP0% -> 0.60 の線形補間
            // 計算式: 0.60 - (HP% * 0.30)
            let cutRate = 0.60 - (hpPercent * 0.30);
            
            // 範囲制限
            if (cutRate < 0.30) cutRate = 0.30;
            if (cutRate > 0.60) cutRate = 0.60;

            const multiplier = new Decimal(1 - cutRate);
            return damage.times(multiplier);
        }
    },

    // 血誓 (Blood Oath)
    // JSON: "hp_overheal_accumulation"
    blood_oath_sacred: {
        id: "blood_oath_sacred",
        name: "血誓(聖護)",
        isSacred: true,
        isRemovable: false,
        // 血誓の「回復超過分をシールドにする」ロジックは
        // Unitクラスの heal() メソッド内でこのバフを持っているかチェックして分岐させるのが一般的
        // ここには定義のみ置いておく
        description: "回復超過分をダメージ吸収として蓄積"
    },

    // === 2. 防御・カウンター系 ===

    // 嘲弄 (Taunt)
    // JSON: "aggro_redirection", "condition": "self_hp_gt_target_hp"
    taunt_sacred: {
        id: "taunt_sacred",
        name: "嘲弄(聖護)",
        isSacred: true,
        isRemovable: true,
        // ターゲット選択ロジックがこのバフIDを参照する想定
        description: "自身のHPが敵より高い場合、攻撃を引き付ける"
    },

    // 援護 (Cover)
    // JSON: "damage_reduction": 0.50, "damage_reflection": 0.80
    cover_sacred: {
        id: "cover_sacred",
        name: "援護(聖護)",
        isSacred: true,
        isRemovable: true,
        
        getStatMods: (ctx) => ({
            damage_reflection: 0.80 // 反射 +80%
        }),

        modifyDamageTaken: (ctx, damage) => {
            return damage.times(0.5); // 被ダメージ50%カット
        },

        // カウンター: 被弾時50%で流血付与
        onHitReceived: (ctx) => {
            if (ctx.attacker && Math.random() < 0.5) {
                console.log("援護カウンター発動: 流血(罪悪)付与試行");
                // ctx.attacker.addDebuff("bleed_sin", ...);
            }
        }
    },

    // 霧中 (Mist)
    // JSON: "target_restriction": "aoe_only", "resistance_up": 0.50
    mist_sacred: {
        id: "mist_sacred",
        name: "霧中(聖護)",
        isSacred: true,
        isRemovable: true,

        getStatMods: (ctx) => ({
            status_resistance: 0.50 // 耐性 +50%
        })
        // ターゲット制限ロジックは Skill.selectTargets 内で "mist_sacred" をチェックして実装
    },

    // === 3. 攻撃・ステータス強化系 ===

    // 暴走 (Rage/Rampage)
    // JSON: "attack_percent": 1.0, "receive_damage_mod": 0.25
    rampage_sacred: { // JSONでは rage_sacred となっている場合もあるが、idに合わせて調整
        id: "rampage_sacred", 
        name: "暴走(聖護)",
        isSacred: true,
        isRemovable: true, // 聖護でも解除可能設定の場合あり

        getStatMods: (ctx) => ({
            attack_percent: 1.0,      // 攻撃力 +100%
            all_stats_percent: 0.60   // 全ステータス +60% (JSONによる)
        }),

        modifyDamageTaken: (ctx, damage) => {
            return damage.times(1.25); // 被ダメージ 1.25倍 (25%増加)
        }
    },

    // 祝福 (Blessing)
    // JSON: "damage_negation" (cost: reduce_duration)
    blessing_sacred: {
        id: "blessing_sacred",
        name: "祝福(聖護)",
        isSacred: true,
        isRemovable: true,

        getStatMods: (ctx) => ({
            attack_percent: 0.80, // 攻撃力 +80%
            crit_rate: 0.40       // 会心率 +40%
        }),

        // 被弾時処理: 攻撃を無効化してバフ解除（またはターン減少）
        // ここでは「ダメージを0にする」処理と「バフを消す」処理を記述
        modifyDamageTaken: (ctx, damage) => {
            // ダメージを0にする
            console.log("祝福の効果発動: ダメージ無効化");
            return new Decimal(0);
        },

        onHitReceived: (ctx) => {
            // バフを解除（またはターン数-1）
            // ctx.owner.removeBuff("blessing_sacred"); 
            // または duration -= 1 のロジック
            console.log("祝福の効果発動: 祝福が解除されました");
        }
    },

    // 七星 (Seven Stars)
    // JSON: "scaling_factor": "duration" (ターン数に応じて強化)
    seven_stars_sacred: {
        id: "seven_stars_sacred",
        name: "七星(聖護)",
        isSacred: true,
        isRemovable: true,

        getStatMods: (ctx, duration) => {
            // 残りターン数 * 係数
            // attack: 15% * duration
            return {
                attack_percent: 0.15 * duration,
                crit_rate: 0.15 * duration,
                all_stats_percent: 0.10 * duration
            };
        }
    },

    // === 4. 特殊・耐性系 ===

    // 花詞 (Flower Words)
    // JSON: "debuff_immunity", cost: "reduce_duration"
    flower_words_sacred: {
        id: "flower_words_sacred",
        name: "花詞(聖護)",
        isSacred: true,
        isRemovable: true,
        description: "デバフを無効化し、ターン数を消費する"
        // 実装時は Unit.addDebuff() 内でこのバフをチェックし、
        // 存在すればデバフ付与をキャンセルして buff.duration-- する
    },

    // 心曜 (Shinyou)
    // JSON: "auto_cleanse" (pre_action)
    shinyou_sacred: {
        id: "shinyou_sacred",
        name: "心曜(聖護)",
        isSacred: true,
        isRemovable: true,

        getStatMods: (ctx) => ({
            status_resistance: 0.50
        }),

        onTurnStart: (ctx) => {
            console.log("心曜の効果: デバフを1つ解除");
            // ctx.owner.cleanse(1);
        }
    },

    // === 5. 属性耐性系 (共通ロジックの例) ===
    
    // 英知 (Wisdom) - 知力・攻撃力ダメカット
    wisdom_sacred: {
        id: "wisdom_sacred",
        name: "英知(聖護)",
        isSacred: true,
        isRemovable: true,
        
        modifyDamageTaken: (ctx, damage) => {
            // 攻撃者の参照が必要
            if (!ctx.attacker) return damage;
            
            // JSON: Intelligence * 2.0, Attack * 1.0 カット
            // ここでは簡易的に「知力ベース攻撃ならカット」等の判定ロジックを入れる
            // 本格的な実装では、ダメージ計算時に「ダメージの種類（筋力依存など）」を渡す必要がある
            return damage; 
        }
    }
};