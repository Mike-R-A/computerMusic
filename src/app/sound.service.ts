import { Injectable, EventEmitter } from '@angular/core';
import { NoteLength, Note } from './model/enums';
import { NoteTone } from './model/tone';

@Injectable({
  providedIn: 'root'
})
export class SoundService {
  synths = <any[]>[];
  minOctave = 0;
  maxOctave = 7;
  bar = 0;
  beat = 0;
  sixteenth = 0;
  metronome: any;
  isSetup = false;
  notePlayed = new EventEmitter<NoteTone>();
  get composedTime() {
    return this.bar.toString() + ':' +
      this.beat.toString() + ':' +
      this.sixteenth.toString();
  }

  constructor() {
  }

  addTime(noteLength: NoteLength, beatsInBar = 4) {
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
  }

  addNoteToTransport(tone: NoteTone, synthIndex = 0) {
    Tone.Transport.schedule((time) => {
      if (tone.note !== Note.Rest) {
        this.playTone(this.synths[synthIndex], tone, time);
      }
    }, this.composedTime);

    this.addTime(tone.length);
  }

  toggleTransport() {
    if (!this.isSetup) {
      this.setUp();
      this.isSetup = true;
    }
    if (Tone.context.state !== 'running') {
      Tone.context.resume();
    }
    Tone.Transport.toggle();
  }

  playTone(instrument: any, tone: NoteTone, time: any) {
    this.playSound(instrument, tone.id, this.mapNoteLengthToDuration(tone.length), time, tone.volume);
    this.notePlayed.emit(tone);
  }

  playSound(instrument: any, note: string, duration: string, time: any, volume: number) {
    instrument.triggerAttackRelease(note, duration, time, volume);
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

  setUp() {
    this.synths.push(new Tone.Synth().toMaster());
    this.synths.push(new Tone.AMSynth().toMaster());
    this.synths.push(new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 1,
      oscillator: {
        type: 'sine'
      },
      envelope: {
        attack: 0.001,
        decay: 0.4,
        sustain: 0.01,
        release: 1.4,
        attackCurve: 'exponential'
      }
    }).toMaster());
    Tone.Transport.bpm.value = 120;
  }

  metronomeOn() {
    console.log('on');
    this.metronome = Tone.Transport.scheduleRepeat((time) => {
      this.synths[2].triggerAttackRelease('C2', this.mapNoteLengthToDuration(NoteLength.Quaver), time, 0.5);
    }, '4n');
  }

  metronomeOff() {
    console.log('off');

    Tone.Transport.clear(this.metronome);
  }

  get transportTime() {
    return Tone.Transport.position;
  }
}
