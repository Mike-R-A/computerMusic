export class Random {
    static next(min: number, max: number) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    static booleanByProbability(probability: number) {
        if (probability > 1 || probability < 0) {
            throw new Error('probability must be between 0 and 1');
        }

        return probability === 0 ? false : this.next(1, Math.round(1 / probability)) === 1;
    }

    static randomFromArray(array: any[]) {
        const randomInt = this.next(0, array.length - 1);
        return array[randomInt];
    }
}
