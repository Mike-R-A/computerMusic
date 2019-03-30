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
    Semibreve = '1n',
    DottedMinim = '2n.',
    Minim = '2n',
    DottedCrotchet = '4n.',
    Crotchet = '4n',
    DottedQuaver = '8n.',
    Quaver = '8n',
    SemiQuaver = '16n'
}

interface Tone {
    note: Note;
    octave: number;
    length: NoteLength;
    volume: number;
    id: string;
}