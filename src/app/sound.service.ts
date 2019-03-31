import { Injectable } from '@angular/core';
import { NoteLength, Note } from './model/enums';
import { NoteTone } from './model/tone';

@Injectable({
  providedIn: 'root'
})
export class SoundService {
  synth: any;
  minOctave = 2;
  maxOctave = 6;
  constructor() {
    this.synth = new Tone.Synth().toMaster();
  }

  playNote(tone: NoteTone) {
    console.log('playNote', tone);

    if (tone.note === Note.Rest) {
      // play rest
      console.log('REST', tone.id, this.mapNoteLengthToDuration(tone.length));

    } else {
      console.log('PLAYING', tone.id, this.mapNoteLengthToDuration(tone.length));

      this.playSound(tone.id, this.mapNoteLengthToDuration(tone.length));
    }
  }

  playSound(note: string, duration: string) {
    console.log('playSound', note, duration);
    this.synth.triggerAttackRelease(note, duration);
  }

  mapNoteLengthToDuration(noteLength: NoteLength) {
    switch (noteLength) {
      case NoteLength.Semibreve: {
        return '1n';
      }
      case NoteLength.DottedMinim: {
        return '2n.';
      }
      case NoteLength.Minim: {
        return '2n';
      }
      case NoteLength.DottedCrotchet: {
        return '4n.';
      }
      case NoteLength.Crotchet: {
        return '4n';
      }
      case NoteLength.DottedQuaver: {
        return '8n.';
      }
      case NoteLength.Quaver: {
        return '8n';
      }
      case NoteLength.SemiQuaver: {
        return '16n';
      }
    }
  }
}
