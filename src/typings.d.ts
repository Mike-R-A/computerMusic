declare var Tone: any;

declare enum Note {
    A,
    AsharpBflat,
    B,
    C,
    CsharpDflat,
    D,
    DsharpEflat,
    E,
    F,
    FsharpGflat,
    G,
    GsharpAflat,
    Rest
}

declare enum NoteLength {
    Semibreve = 4,
    DottedMinim = 3,
    Minim = 2,
    DottedCrotchet = 1.5,
    Crotchet = 1,
    DottedQuaver = 0.75,
    Quaver = 0.5,
    SemiQuaver = 0.25
}

interface ITone {
    note: Note;
    octave: number;
    length: NoteLength;
    volume: number;
    id: string;
}

interface Motif {
    pitches: number[];
    rhythm: NoteLength[];
}