import { Decimal } from "./MockDecimal.ts"; // 本番では decimal.js
import { StatKey, BuffId, BuffEffect } from "../types";

export class Unit {
    public name: string;
    public stats: Record<StatKey, Decimal>;
    public currentHp: Decimal;
    public buffs: Map<BuffId, BuffEffect> = new Map();

    constructor(name: string, baseStats: Record<StatKey, number>) {
        this.name = name;
        this.stats = {} as any;
        
        // 初期化（実際はパッシブ補正などをここで計算）
        for (const key in baseStats) {
            this.stats[key as StatKey] = new Decimal(baseStats[key as StatKey]);
        }
        this.currentHp = this.stats.max_hp;
    }

    // ステータス取得（バフ補正込みの値を返すロジックをここに集約）
    getStat(key: StatKey): Decimal {
        // TODO: ここでバフによる補正係数を掛ける
        return this.stats[key];
    }

    isAlive(): boolean {
        return this.currentHp.gt(0);
    }

    takeDamage(amount: Decimal) {
        this.currentHp = this.currentHp.minus(amount);
        if (this.currentHp.lt(0)) this.currentHp = new Decimal(0);
    }

    heal(amount: Decimal) {
        this.currentHp = this.currentHp.plus(amount);
        if (this.currentHp.gt(this.getStat('max_hp'))) {
            this.currentHp = this.getStat('max_hp');
        }
    }

    addBuff(buff: BuffEffect) {
        this.buffs.set(buff.id, buff);
    }

    removeBuff(buffId: BuffId) {
        this.buffs.delete(buffId);
    }

    hasBuff(buffId: BuffId): boolean {
        return this.buffs.has(buffId);
    }

    // ランダムなターゲット取得用ユーティリティ
    static getRandomTargets(units: Unit[], count: number): Unit[] {
        const living = units.filter(u => u.isAlive());
        const shuffled = living.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }
}