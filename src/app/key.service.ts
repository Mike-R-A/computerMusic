import { Injectable } from '@angular/core';
import { Note } from './model/enums';
import { NoteTone } from './model/tone';

@Injectable({
  providedIn: 'root'
})
export class KeyService {

  constructor() { }

  public chromatic(): Note[] {
    return [
      Note.A,
      Note.AsharpBflat,
      Note.B,
      Note.C,
      Note.CsharpDflat,
      Note.D,
      Note.DsharpEflat,
      Note.E,
      Note.F,
      Note.FsharpGflat,
      Note.G,
      Note.GsharpAflat
    ];
  }

  public nextNote(start: Note, key: Note[], distance: number): Note {
    let startIndex = key.indexOf(start);
    const allNotes = this.chromatic();
    while (startIndex === -1) {
      const nextChromaticNote = this.nextNote(allNotes[allNotes.indexOf(start)], allNotes, 1);
      startIndex = key.indexOf(nextChromaticNote);
    }
    const lastIndex = key.length - 1;
    let newIndex = startIndex + distance;
    if (newIndex > lastIndex) {
      newIndex = newIndex - key.length;
    }
    const nextNote = key[newIndex];
    return nextNote;
  }

  public major(tonic: Note): Note[] {
    const allNotes = this.chromatic();
    const majorKey = <Note[]>[];

    majorKey.push(tonic);
    const second = this.nextNote(tonic, allNotes, 2);
    majorKey.push(second);
    const third = this.nextNote(second, allNotes, 2);
    majorKey.push(third);
    const fourth = this.nextNote(third, allNotes, 1);
    majorKey.push(fourth);
    const fifth = this.nextNote(fourth, allNotes, 2);
    majorKey.push(fifth);
    const sixth = this.nextNote(fifth, allNotes, 2);
    majorKey.push(sixth);
    const seventh = this.nextNote(sixth, allNotes, 2);
    majorKey.push(seventh);

    return majorKey;
  }

  public minorHarmonic(tonic: Note): Note[] {
    const allNotes = this.chromatic();
    const minorHarmonicKey = <Note[]>[];

    minorHarmonicKey.push(tonic);
    const second = this.nextNote(tonic, allNotes, 2);
    minorHarmonicKey.push(second);
    const third = this.nextNote(second, allNotes, 1);
    minorHarmonicKey.push(third);
    const fourth = this.nextNote(third, allNotes, 2);
    minorHarmonicKey.push(fourth);
    const fifth = this.nextNote(fourth, allNotes, 2);
    minorHarmonicKey.push(fifth);
    const sixth = this.nextNote(fifth, allNotes, 1);
    minorHarmonicKey.push(sixth);
    const seventh = this.nextNote(sixth, allNotes, 3);
    minorHarmonicKey.push(seventh);

    return minorHarmonicKey;
  }

  public mode(key: Note[], modeNumber: number): Note[] {
    let mode = <Note[]>[];
    const modeIndex = modeNumber - 1;
    const modeIndexUp = key.slice(modeIndex, key.length - modeIndex);
    mode = [...mode, ...modeIndexUp];
    const tonicToModeIndex = key.slice(0, modeIndex);
    mode = [...mode, ...tonicToModeIndex];

    return mode;
  }

  public keyRange(key: Note[], noOfRepeats: number): NoteTone[] {
    const keyRange = <NoteTone[]>[];
    let octave = 0;
    for (let i = 0; i < noOfRepeats; i++) {
      for (const note of key) {
        if (note === Note.C) {
          octave++;
        }
        const newTone = new NoteTone();
        newTone.note = note;
        newTone.octave = octave;
        keyRange.push(newTone);
      }
    }

    return keyRange;
  }
}
