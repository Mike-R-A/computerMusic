import { NoteLength, Note } from './enums';

export class NoteTone {
    octave: number;
    length: NoteLength;
    volume: number;
    note: Note;
    get id() {
        return this.note + (this.octave || '');
    }
}
