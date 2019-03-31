import { Injectable } from '@angular/core';
import { KeyService } from './key.service';
import { Random } from './helpers/random';
import { SoundService } from './sound.service';
import { TimeSignature } from './model/time-signature';
import { Note, NoteLength } from './model/enums';
import { Motif } from './model/motif';
import { NoteTone } from './model/tone';

@Injectable({
  providedIn: 'root'
})
export class MusicService {

  constructor(private keyService: KeyService, private soundService: SoundService) { }

  public chord(key: Note[], rootNumber: number, noOfNotes: number): Note[] {
    const chord = <Note[]>[];
    const rootIndex = rootNumber - 1;
    const root = key[rootIndex];
    chord.push(root);
    let previous = root;
    for (let i = 0; i < noOfNotes - 1; i++) {
      const next = this.keyService.nextNote(previous, key, 2);
      chord.push(next);
      previous = next;
    }

    return chord;
  }

  public motif(length: number, maxSize: number, stasisInhibitor = 5,
    restChance = 0.01, mostLikelyNoteLength = NoteLength.Crotchet): Motif {
    const motif = new Motif();
    let addRest = Random.next(0, Math.round(1 / restChance));
    const randomPitch = addRest === 1 ? -1 : Random.next(0, maxSize);
    let previousDirection = Random.next(-1, 2);
    let nextIndex = randomPitch;
    let lastIndex = randomPitch;
    motif.pitches.push(nextIndex);
    motif.rhythm.push(this.randomNoteLength(mostLikelyNoteLength));
    for (let i = 0; i < length; i++) {
      if (nextIndex !== -1) {
        lastIndex = nextIndex;
        let direction = Random.next(-1, 1);
        for (let j = 0; j < stasisInhibitor; j++) {
          if (direction === 0 || direction !== previousDirection) {
            direction = Random.next(-1, 1);
          }
        }
        let potentialNextIndex = lastIndex + direction;
        previousDirection = direction;
        while (potentialNextIndex < 0 || potentialNextIndex > maxSize) {
          const newDirection = Random.next(-1, 2);
          potentialNextIndex = nextIndex + newDirection;
        }
        addRest = Random.next(0, Math.round(1 / restChance));
        nextIndex = restChance === 1 ? -1 : potentialNextIndex;
      }

      motif.pitches.push(nextIndex);
      motif.rhythm.push(this.randomNoteLength(mostLikelyNoteLength));
    }

    return motif;
  }

  public randomNoteLength(mostLikelyNoteLength: NoteLength = null, likelyFactor = 4): NoteLength {
    const noOfNoteLengths = 8;
    const randomNoteLengthSelector = Random.next(0, noOfNoteLengths + likelyFactor);
    switch (randomNoteLengthSelector) {
      case 0:
        {
          return NoteLength.Semibreve;
        }
      case 1:
        {
          return NoteLength.DottedMinim;
        }
      case 2:
        {
          return NoteLength.Minim;
        }
      case 3:
        {
          return NoteLength.DottedCrotchet;
        }
      case 4:
        {
          return NoteLength.Crotchet;
        }
      case 5:
        {
          return NoteLength.DottedQuaver;
        }
      case 6:
        {
          return NoteLength.Quaver;
        }
      case 7:
        {
          return NoteLength.SemiQuaver;
        }
      default:
        {
          return mostLikelyNoteLength || NoteLength.Crotchet;
        }
    }
  }

  public makeChordal(motif: Motif): Motif {
    const chordalMotif = new Motif();
    chordalMotif.pitches = motif.pitches.map(i => i === -1 ? i : i * 2);
    chordalMotif.rhythm = [...motif.rhythm];

    return chordalMotif;
  }

  public transpose(motif: number[], amount: number): number[] {
    return motif.map(i => i === -1 ? i : i + amount);
  }

  public concatenate(motif1: Motif, motif2: Motif): Motif {
    const newMotif = new Motif();
    newMotif.pitches = [...newMotif.pitches, ...motif1.pitches];
    newMotif.rhythm = [...newMotif.rhythm, ...motif1.rhythm];
    newMotif.pitches = [...newMotif.pitches, ...motif2.pitches];
    newMotif.rhythm = [...newMotif.rhythm, ...motif2.rhythm];
    return newMotif;
  }

  public modifyMotif(motif: Motif, motifPool: Motif[] = null): Motif {
    const noOfTypesOfDevelopment = motifPool ? 4 : 5;
    let developedMotif = new Motif();
    let developedMotifPitches = [...motif.pitches];
    let developedMotifRhythm = [...motif.rhythm];
    const randomInt = Random.next(1, noOfTypesOfDevelopment);
    const displacement = Random.next(-1, 1);
    switch (randomInt) {
      case 1:
        {
          developedMotifPitches.reverse();
          break;
        }
      case 2:
        {
          developedMotifPitches = [...developedMotifPitches, ...this.transpose(developedMotifPitches, displacement)];
          developedMotifRhythm = [...developedMotifRhythm, ...developedMotifRhythm];
          break;
        }
      case 3:
        {
          const copyPitches = [...developedMotifPitches];
          const copyRhythm = [...developedMotifRhythm];
          copyPitches.reverse();
          copyRhythm.reverse();
          developedMotifPitches = [...developedMotifPitches, ...this.transpose(copyPitches, displacement)];
          developedMotifRhythm = [...developedMotifRhythm, ...copyRhythm];
          break;
        }
      case 4:
        {
          const copyPitches = [...developedMotifPitches];
          const copyRhythm = [...developedMotifRhythm];
          developedMotifPitches.reverse();
          copyRhythm.reverse();
          developedMotifPitches = [...developedMotifPitches, ...this.transpose(copyPitches, displacement)];
          developedMotifRhythm = [...developedMotifRhythm, ...copyRhythm];
          break;
        }
      case 5:
        {
          if (motifPool != null) {
            const poolSelection = Random.next(0, motifPool.length - 1);
            developedMotif = this.concatenate(motif, motifPool[poolSelection]);
          }
          break;
        }
    }

    developedMotif.pitches = developedMotifPitches;
    developedMotif.rhythm = developedMotifRhythm;
    return developedMotif;
  }

  public applyMotif(key: Note[], motif: Motif, startIndex: number = null, startOctave = 4): NoteTone[] {
    const start = startIndex || motif.pitches[0];
    const translatedMotif = new Motif();
    const translationAmount = start + startOctave * key.length - motif.pitches[0];
    translatedMotif.pitches = motif.pitches.map(i => i === -1 || i + translationAmount < 0 ? i : i + translationAmount);
    const appliedMotif = <NoteTone[]>[];
    const octaves = 100;
    const keyRange = this.keyService.keyRange(key, octaves);
    for (let i = 0; i < translatedMotif.pitches.length; i++) {
      const tone = new NoteTone();

      if (translatedMotif.pitches[i] === -1) {
        tone.note = Note.Rest;
        tone.octave = null;
      } else {
        const octave = keyRange[translatedMotif.pitches[i]].octave;
        let octaveToUse;
        if (octave < this.soundService.minOctave) {
          octaveToUse = this.soundService.minOctave;
        } else if (octave > this.soundService.maxOctave) {
          octaveToUse = this.soundService.maxOctave;
        } else {
          octaveToUse = octave;
        }

        tone.note = keyRange[translatedMotif.pitches[i]].note;
        tone.octave = octaveToUse;
      }
      tone.length = motif.rhythm[i];
      console.log('motifRhythmi', motif.rhythm[i]);

      appliedMotif.push(tone);
    }

    return appliedMotif;
  }

  public developMotif(key: Note[], motif: Motif, startIndexes: number[],
    timeSignature: TimeSignature, maxBars = 8, startOctave = 4, alterChance = 0.5): NoteTone[] {
    console.log('developMotif', motif);

    let phrase = <NoteTone[]>[];
    for (const startIndex of startIndexes) {
      const max = Math.round(1 / alterChance);
      const randomAlterChance = Random.next(1, max);
      let altered = new Motif();
      if (randomAlterChance === 1) {
        altered = this.modifyMotif(motif);
      } else {
        altered = motif;
      }

      const addition = this.applyMotif(key, altered, startIndex, startOctave);
      console.log('addition', addition, phrase[0] && phrase[0].note);

      const timeWithAddition = this.totalTime(phrase) + this.totalTime(addition);
      const maxTime = maxBars * timeSignature.barTime;
      console.log('phrase loses notes here', phrase);

      if (timeWithAddition < maxTime) {
        phrase = [...phrase, ...addition];

      }
    }
    for (let i = 0; i < phrase.length; i++) {
      const timeUpToThisTone = this.totalTime(phrase.slice(i));
      const singleBarTime = timeSignature.barTime;
      if (timeUpToThisTone % singleBarTime === 0) {
        phrase[i].volume = 0.3;
      } else {
        phrase[i].volume = 0.2;
      }
    }
    this.padWithRests(phrase, timeSignature);

    return phrase;
  }

  private padWithRests(phrase: NoteTone[], timeSignature: TimeSignature) {
    const singleBarTime = timeSignature.barTime;
    const remainder = this.totalTime(phrase) % singleBarTime;
    let endRestTime = singleBarTime - remainder;
    while (endRestTime > NoteLength.Semibreve) {
      const newTone = new NoteTone();
      newTone.note = Note.Rest;
      newTone.length = NoteLength.Semibreve;
      newTone.octave = null;
      phrase.push(newTone);
      endRestTime = endRestTime - NoteLength.Semibreve;
    }
    while (endRestTime > NoteLength.Minim) {
      const newTone = new NoteTone();
      newTone.note = Note.Rest;
      newTone.length = NoteLength.Minim;
      newTone.octave = null;
      phrase.push(newTone);
      endRestTime = endRestTime - NoteLength.Minim;
    }
    while (endRestTime > NoteLength.Crotchet) {
      const newTone = new NoteTone();
      newTone.note = Note.Rest;
      newTone.length = NoteLength.Crotchet;
      newTone.octave = null;
      phrase.push(newTone);
      endRestTime = endRestTime - NoteLength.Crotchet;
    }
    while (endRestTime > NoteLength.Quaver) {
      const newTone = new NoteTone();
      newTone.note = Note.Rest;
      newTone.length = NoteLength.Quaver;
      newTone.octave = null;
      phrase.push(newTone);
      endRestTime = endRestTime - NoteLength.Quaver;
    }
    while (endRestTime > NoteLength.SemiQuaver) {
      const newTone = new NoteTone();
      newTone.note = Note.Rest;
      newTone.length = NoteLength.SemiQuaver;
      newTone.octave = null;
      phrase.push(newTone);
      endRestTime = endRestTime - NoteLength.SemiQuaver;
    }
  }

  public totalTime(phrase: NoteTone[]): number {
    const toneLengths = phrase.map(t => {
      return t.length;
    });
    if (toneLengths.length > 0) {
      const total = toneLengths.reduce((t, l) => t + l);
      console.log('total time', phrase, toneLengths);

      return total;
    } else {
      return 0;
    }
  }
}
