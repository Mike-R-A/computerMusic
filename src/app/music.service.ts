import { Injectable } from '@angular/core';
import { KeyService } from './key.service';
import { Random } from './helpers/Random';
import { SoundService } from './sound.service';
import { TimeSignature } from './model/time-signature';

@Injectable({
  providedIn: 'root'
})
export class MusicService {

  constructor(private keyService: KeyService, private soundService: SoundService) { }

  public nextNote(start: Note, key: Note[], distance: number): Note {
    let startIndex = key.indexOf(start);
    const allNotes = this.keyService.chromatic();
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

  public chord(key: Note[], rootNumber: number, noOfNotes: number): Note[] {
    const chord = <Note[]>[];
    const rootIndex = rootNumber - 1;
    const root = key[rootIndex];
    chord.push(root);
    let previous = root;
    for (let i = 0; i < noOfNotes - 1; i++) {
      const next = this.nextNote(previous, key, 2);
      chord.push(next);
      previous = next;
    }

    return chord;
  }

  public motif(length: number, maxSize: number, stasisInhibitor = 5,
    restChance = 0.01, mostLikelyNoteLength = NoteLength.Crotchet): Motif {
    const motif = <Motif>{};
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
    const chordalMotif = <Motif>{};
    chordalMotif.pitches = motif.pitches.map(i => i === -1 ? i : i * 2);
    chordalMotif.rhythm = [...motif.rhythm];

    return chordalMotif;
  }

  public transpose(motif: number[], amount: number): number[] {
    return motif.map(i => i === -1 ? i : i + amount);
  }

  public concatenate(motif1: Motif, motif2: Motif): Motif {
    const newMotif = <Motif>{};
    newMotif.pitches.concat(motif1.pitches);
    newMotif.rhythm.concat(motif1.rhythm);
    newMotif.pitches.concat(motif2.pitches);
    newMotif.rhythm.concat(motif2.rhythm);
    return newMotif;
  }

  public modifyMotif(motif: Motif, motifPool: Motif[] = null): Motif {
    const noOfTypesOfDevelopment = motifPool == null ? 4 : 5;
    let developedMotif = <Motif>{};
    const developedMotifPitches = [...motif.pitches];
    const developedMotifRhythm = [...motif.rhythm];
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
          developedMotifPitches.concat(this.transpose(developedMotifPitches, displacement));
          developedMotifRhythm.concat(developedMotifRhythm);
          break;
        }
      case 3:
        {
          const copyPitches = [...developedMotifPitches];
          const copyRhythm = [...developedMotifRhythm];
          copyPitches.reverse();
          copyRhythm.reverse();
          developedMotifPitches.concat(this.transpose(copyPitches, displacement));
          developedMotifRhythm.concat(copyRhythm);
          break;
        }
      case 4:
        {
          const copyPitches = [...developedMotifPitches];
          const copyRhythm = [...developedMotifRhythm];
          developedMotifPitches.reverse();
          copyRhythm.reverse();
          developedMotifPitches.concat(this.transpose(copyPitches, displacement));
          developedMotifRhythm.concat(copyRhythm);
          break;
        }
      case 5:
        {
          if (motifPool != null) {
            const poolSelection = Random.next(1, motifPool.length);
            developedMotif = this.concatenate(motif, motifPool[poolSelection]);
          }
          break;
        }
    }

    developedMotif.pitches = developedMotifPitches;
    developedMotif.rhythm = developedMotifRhythm;
    return developedMotif;
  }

  public applyMotif(key: Note[], motif: Motif, startIndex: number = null, startOctave = 4): ITone[] {
    const start = startIndex || motif.pitches[0];
    const translatedMotif = <Motif>{};
    const translationAmount = start + startOctave * key.length - motif.pitches[0];
    translatedMotif.pitches = motif.pitches.map(i => i === -1 || i + translationAmount < 0 ? i : i + translationAmount);
    const appliedMotif = <ITone[]>[];
    const octaves = 100;
    const keyRange = this.keyService.keyRange(key, octaves);
    for (let i = 0; i < translatedMotif.pitches.length; i++) {
      const tone = new Tone();
      if (translatedMotif.pitches[i] === -1) {
        tone.Note = Note.Rest;
        tone.Octave = null;
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
        tone.Note = keyRange[translatedMotif.pitches[i]].note;
        tone.Octave = octaveToUse;
      }
      tone.Length = motif.rhythm[i];
      appliedMotif.push(tone);
    }

    return appliedMotif;
  }

  public developMotif(key: Note[], motif: Motif, startIndexes: number[],
    timeSignature: TimeSignature, maxBars = 8, startOctave = 4, alterChance = 0.5): ITone[] {
    const phrase = <ITone[]>[];
    for (const startIndex of startIndexes) {
      const max = Math.round(1 / alterChance);
      const randomAlterChance = Random.next(1, max);
      let altered = <Motif>{};
      if (randomAlterChance === 1) {
        altered = this.modifyMotif(motif);
      } else {
        altered = motif;
      }

      const addition = this.applyMotif(key, altered, startIndex, startOctave);
      const timeWithAddition = this.totalTime(phrase) + this.totalTime(addition);
      const maxTime = maxBars * timeSignature.barTime;
      if (timeWithAddition < maxTime) {
        phrase.concat(addition);
      }
    }

    for (let i = 0; i < phrase.length; i++) {
      const timeUpToThisTone = this.totalTime(phrase.slice(i));
      const singleBarTime = timeSignature.beats * timeSignature.beatType;
      if (timeUpToThisTone % singleBarTime === 0) {
        phrase[i].volume = 0.3;
      } else {
        phrase[i].volume = 0.2;
      }
    }
    this.padWithRests(phrase, timeSignature);

    return phrase;
  }

  private padWithRests(phrase: ITone[], timeSignature: TimeSignature) {
    const singleBarTime = timeSignature.beats * timeSignature.beatType;
    const remainder = this.totalTime(phrase) % singleBarTime;
    let endRestTime = singleBarTime - remainder;
    while (endRestTime > NoteLength.Semibreve) {
      const newTone = new Tone();
      newTone.note = Note.Rest;
      newTone.length = NoteLength.Semibreve;
      newTone.octave = null;
      phrase.push(newTone);
      endRestTime = endRestTime - NoteLength.Semibreve;
    }
    while (endRestTime > NoteLength.Minim) {
      const newTone = new Tone();
      newTone.note = Note.Rest;
      newTone.length = NoteLength.Minim;
      newTone.octave = null;
      phrase.push(newTone);
      endRestTime = endRestTime - NoteLength.Minim;
    }
    while (endRestTime > NoteLength.Crotchet) {
      const newTone = new Tone();
      newTone.note = Note.Rest;
      newTone.length = NoteLength.Crotchet;
      newTone.octave = null;
      phrase.push(newTone);
      endRestTime = endRestTime - NoteLength.Crotchet;
    }
    while (endRestTime > NoteLength.Quaver) {
      const newTone = new Tone();
      newTone.note = Note.Rest;
      newTone.length = NoteLength.Quaver;
      newTone.octave = null;
      phrase.push(newTone);
      endRestTime = endRestTime - NoteLength.Quaver;
    }
    while (endRestTime > NoteLength.SemiQuaver) {
      const newTone = new Tone();
      newTone.note = Note.Rest;
      newTone.length = NoteLength.SemiQuaver;
      newTone.octave = null;
      phrase.push(newTone);
      endRestTime = endRestTime - NoteLength.SemiQuaver;
    }
  }

  public totalTime(phrase: ITone[]): number {
    return phrase.map(t => t.length).reduce((t, l) => t + l);
  }
}
