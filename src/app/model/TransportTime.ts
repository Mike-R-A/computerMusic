import { NoteLength } from './enums';

export class TransportTime {
    bar = 0;
    beat = 0;
    sixteenth = 0;

    get time() {
        return this.bar.toString() + ':' +
            this.beat.toString() + ':' +
            this.sixteenth.toString();
    }

    addTime(noteLength: NoteLength, beatsInBar = 4) {
        const addedToBeat = this.beat + noteLength;
        let bars = 0;
        const remainder = addedToBeat % beatsInBar;
        const beats = Math.floor(remainder);
        const sixteenths = (remainder - beats) / 0.25;
        this.beat = beats;
        this.sixteenth = this.sixteenth + sixteenths;
        if (addedToBeat >= beatsInBar) {
            bars = Math.floor(addedToBeat / beatsInBar);
            this.bar = this.bar + bars;
        }
    }
}
