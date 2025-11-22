import { Decimal } from "./core/MockDecimal"; // 本番では decimal.js
import { Unit } from "./core/Unit";

// === 基本型 ===
export type StatKey = 'hp' | 'max_hp' | 'mp' | 'max_mp' | 'strength' | 'agility' | 'intelligence' | 'stamina' | 'attack_min' | 'attack_max' | 'defense' | 'crit_rate';

// バフ・デバフの定義
export type BuffId = string;
export interface BuffEffect {
    id: BuffId;
    name: string; // ログ出力用
    duration: number;
    // ここにもロジックを持たせられる（例：ターン開始時効果など）
    onTurnStart?: (owner: Unit) => void;
}

// === スキルロジックの核 ===

// 戦闘のコンテキスト（場の状況）
export interface BattleContext {
    turn: number;
    attacker: Unit;
    allies: Unit[];
    enemies: Unit[];
    log: (msg: string) => void;
}

// ターゲット選択関数型
export type TargetSelector = (ctx: BattleContext) => Unit[];

// ダメージ計算関数型
// JSONでは表現不可能な「計算式」をここに直接書く
export type DamageFormula = (attacker: Unit, defender: Unit) => Decimal;

// スキル効果の定義
export interface SkillEffect {
    type: 'damage' | 'heal' | 'buff' | 'debuff' | 'remove_buff';
    
    // ダメージ計算ロジック（関数の配列にすることで多段ヒットや複雑な補正に対応）
    calc?: DamageFormula; 
    
    // 発動条件（確率やステータス比較など）
    condition?: (attacker: Unit, defender: Unit) => boolean;
    
    // バフ/デバフ用
    buffId?: BuffId;
    buffDuration?: number;
    
    // その他パラメータ
    probability?: number; // 成功率
}

// アクティブスキルの定義
export interface ActiveSkill {
    id: number;
    name: string;
    
    // ターゲット選択ロジック（関数として定義）
    selectTargets: TargetSelector;
    
    // 攻撃前の処理（バフ解除や自己バフなど）
    preSkillActions?: (ctx: BattleContext) => void;

    // 実際の効果（攻撃フロー）
    effects: SkillEffect[];

    // 攻撃後の処理
    postSkillActions?: (ctx: BattleContext) => void;
}

// キャラクター定義（これが「データ」となる）
export interface CharacterDef {
    id: string;
    name: string;
    baseStats: Record<StatKey, number>; // ここはスプレッドシートから流し込む想定
    activeSkills: ActiveSkill[];
    passiveSkills: any[]; // 今回は省略
}