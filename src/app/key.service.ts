import { Injectable } from '@angular/core';
import { MusicService } from './music.service';

@Injectable({
  providedIn: 'root'
})
export class KeyService {

  constructor(private musicService: MusicService) { }

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

  public major(tonic: Note): Note[] {
    const allNotes = this.chromatic();
    const majorKey = <Note[]>[];

    majorKey.push(tonic);
    const second = this.musicService.nextNote(tonic, allNotes, 2);
    majorKey.push(second);
    const third = this.musicService.nextNote(second, allNotes, 2);
    majorKey.push(third);
    const fourth = this.musicService.nextNote(third, allNotes, 1);
    majorKey.push(fourth);
    const fifth = this.musicService.nextNote(fourth, allNotes, 2);
    majorKey.push(fifth);
    const sixth = this.musicService.nextNote(fifth, allNotes, 2);
    majorKey.push(sixth);
    const seventh = this.musicService.nextNote(sixth, allNotes, 2);
    majorKey.push(seventh);

    return majorKey;
  }

  public minorHarmonic(tonic: Note): Note[] {
    const allNotes = this.chromatic();
    const minorHarmonicKey = <Note[]>[];

    minorHarmonicKey.push(tonic);
    const second = this.musicService.nextNote(tonic, allNotes, 2);
    minorHarmonicKey.push(second);
    const third = this.musicService.nextNote(second, allNotes, 1);
    minorHarmonicKey.push(third);
    const fourth = this.musicService.nextNote(third, allNotes, 2);
    minorHarmonicKey.push(fourth);
    const fifth = this.musicService.nextNote(fourth, allNotes, 2);
    minorHarmonicKey.push(fifth);
    const sixth = this.musicService.nextNote(fifth, allNotes, 1);
    minorHarmonicKey.push(sixth);
    const seventh = this.musicService.nextNote(sixth, allNotes, 3);
    minorHarmonicKey.push(seventh);

    return minorHarmonicKey;
  }

  public mode(key: Note[], modeNumber: number): Note[] {
    const mode = <Note[]>[];
    const modeIndex = modeNumber - 1;
    const modeIndexUp = key.slice(modeIndex, key.length - modeIndex);
    mode.concat(modeIndexUp);
    const tonicToModeIndex = key.slice(0, modeIndex);
    mode.concat(tonicToModeIndex);

    return mode;
  }

  public keyRange(key: Note[], noOfRepeats: number): ITone[] {
    const keyRange = <ITone[]>[];
    let octave = 0;
    for (let i = 0; i < noOfRepeats; i++) {
      for (const note of key) {
        if (note === Note.C) {
          octave++;
        }
        keyRange.push(<ITone>
          {
            note: note,
            octave: octave
          });
      }
    }

    return keyRange;
  }
}
