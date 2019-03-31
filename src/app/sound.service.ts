import { Injectable } from '@angular/core';
import { NoteLength, Note } from './model/enums';
import { NoteTone } from './model/tone';

@Injectable({
  providedIn: 'root'
})
export class SoundService {
  synth: any;
  minOctave = 0;
  maxOctave = 10;
  bar = 0;
  beat = 0;
  sixteenth = 0;
  get currentTime() {
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
    console.log('notelength', noteLength);
    const addedToBeat = this.beat + noteLength;
    console.log('addedToBeat', addedToBeat);
    let bars = 0;
    const remainder = addedToBeat % beatsInBar;
    const beats = Math.floor(remainder);
    console.log('beats', beats);
    const sixteenths = (remainder - beats) / 0.25;
    console.log('sixteenths', sixteenths);
    this.beat = beats;
    this.sixteenth = this.sixteenth + sixteenths;
    if (addedToBeat > beatsInBar) {
      bars = Math.floor(addedToBeat / beatsInBar);
      console.log('bars', bars);
      this.bar = this.bar + bars;
    }
  }

  addNoteToTransport(tone: NoteTone) {
    console.log(this.currentTime);

    Tone.Transport.schedule((time) => {
      this.playNote(tone, time);
    }, this.currentTime);
    this.addTime(tone.length);
  }

  startTransport() {
    Tone.Transport.start();
  }

  stopTransport() {
    Tone.Transport.stop();
  }

  playNote(tone: NoteTone, time: any) {
    console.log('playNote', tone);

    if (tone.note === Note.Rest) {
      // play rest
      console.log('REST', tone.id, this.mapNoteLengthToDuration(tone.length));
    } else {
      this.playSound(tone.id, this.mapNoteLengthToDuration(tone.length), time, tone.volume);
    }
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
