import { NoteLength } from './enums';

export class Motif implements IMotif {
    pitches: number[];
    rhythm: NoteLength[];
    get notes() {
        return this.pitches.map((p, i) => {
            return {
                pitch: p,
                rhythm: this.rhythm[i]
            };
        });
    }
    constructor() {
        this.pitches = [];
        this.rhythm = [];
    }

}
