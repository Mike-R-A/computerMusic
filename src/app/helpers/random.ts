export class Random {
    static next(min: number, max: number) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
}
