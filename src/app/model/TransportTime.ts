export class TransportTime {
    bar = 0;
    beat = 0;
    sixteenth = 0;

    get time() {
        return this.bar.toString() + ':' +
            this.beat.toString() + ':' +
            this.sixteenth.toString();
    }
}
