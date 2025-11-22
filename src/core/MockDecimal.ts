// 本番環境では 'decimal.js' をインストールして import { Decimal } from 'decimal.js'; としてください。
// これはデモ用の簡易実装です。

export class Decimal {
    private value: number;

    constructor(value: number | string | Decimal) {
        if (value instanceof Decimal) {
            this.value = value.value;
        } else if (typeof value === 'string') {
            this.value = parseFloat(value);
        } else {
            this.value = value;
        }
    }

    plus(v: Decimal | number): Decimal {
        const val = v instanceof Decimal ? v.value : v;
        return new Decimal(this.value + val);
    }

    minus(v: Decimal | number): Decimal {
        const val = v instanceof Decimal ? v.value : v;
        return new Decimal(this.value - val);
    }

    times(v: Decimal | number): Decimal {
        const val = v instanceof Decimal ? v.value : v;
        return new Decimal(this.value * val);
    }

    div(v: Decimal | number): Decimal {
        const val = v instanceof Decimal ? v.value : v;
        return new Decimal(this.value / val);
    }

    floor(): Decimal {
        return new Decimal(Math.floor(this.value));
    }

    gt(v: Decimal | number): boolean {
        const val = v instanceof Decimal ? v.value : v;
        return this.value > val;
    }

    lt(v: Decimal | number): boolean {
        const val = v instanceof Decimal ? v.value : v;
        return this.value < val;
    }

    toNumber(): number {
        return this.value;
    }

    toString(): string {
        return this.value.toString();
    }
}