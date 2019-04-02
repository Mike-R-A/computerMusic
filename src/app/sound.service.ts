import { Injectable, EventEmitter } from '@angular/core';
import { NoteLength, Note } from './model/enums';
import { NoteTone } from './model/tone';

@Injectable({
  providedIn: 'root'
})
export class SoundService {
  synth: any;
  minOctave = 0;
  maxOctave = 7;
  bar = 0;
  beat = 0;
  sixteenth = 0;
  get composedTime() {
    return this.bar.toString() + ':' +
      this.beat.toString() + ':' +
      this.sixteenth.toString();
  }

  constructor() {
    this.synth = new Tone.Synth().toMaster();
    this.synth.sync();
    Tone.Transport.bpm.value = 120;
  }

  addTime(noteLength: NoteLength, beatsInBar = 4) {
    console.log(this.bar, ':', this.beat, ':', this.sixteenth, 'composedTime', this.composedTime, ' notelength:', noteLength);

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

    console.log(this.bar, ':', this.beat, ':', this.sixteenth, ' composedTime:', this.composedTime);
  }

  addNoteToTransport(tone: NoteTone) {
    console.log('addToTransport', tone, this.composedTime);

    Tone.Transport.schedule((time) => {
      if (tone.note !== Note.Rest) {
        this.playNote(tone, time);
      }
    }, this.composedTime);
    this.addTime(tone.length);
  }

  startTransport() {
    Tone.Transport.start();
  }

  playNote(tone: NoteTone, time: any) {
    this.playSound(tone.id, this.mapNoteLengthToDuration(tone.length), time, tone.volume);
  }

  playSound(note: string, duration: string, time: any, volume: number) {
    console.log('playSound', note, duration);
    this.synth.triggerAttackRelease(note, duration, time, volume);
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
