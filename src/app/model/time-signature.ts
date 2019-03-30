export class TimeSignature {
    beats: number;
    beatType: NoteLength;
    get barTime() {
        return this.beats * this.beatType;
    }
}
