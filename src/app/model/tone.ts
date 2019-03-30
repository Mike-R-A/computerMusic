export class Tone implements ITone {
    octave: number;
    length: NoteLength;
    volume: number;
    note: Note;
    get id() {
        return this.note.toString() + this.octave.toString();
    }
}
