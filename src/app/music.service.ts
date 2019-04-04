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
  get noteLengths() {
    return [
      NoteLength.Semibreve,
      NoteLength.DottedMinim,
      NoteLength.Minim,
      NoteLength.DottedCrotchet,
      NoteLength.Crotchet,
      NoteLength.DottedQuaver,
      NoteLength.Quaver,
      NoteLength.SemiQuaver
    ];
  }
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
    restChance = 0.01, mostLikelyNoteLength = NoteLength.Crotchet, isChordal = false, similarNoteLengthFactor = 1): Motif {
    let motif = new Motif();
    let addRest = restChance > 0 && restChance <= 1 && Random.next(1, Math.round(1 / restChance));
    const randomPitch = addRest === 1 ? -1 : Random.next(0, maxSize);
    let previousDirection = Random.next(-1, 1);
    let nextIndex = randomPitch;
    let lastIndex = randomPitch;
    let motifTotalLength = 0;
    while (motifTotalLength < length) {
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
          const newDirection = Random.next(-1, 1);
          potentialNextIndex = nextIndex + newDirection;
        }
        addRest = Random.next(0, Math.round(1 / restChance));
        nextIndex = restChance === 1 ? -1 : potentialNextIndex;
      }

      motif.pitches.push(nextIndex);
      const validLengths = this.noteLengths.filter(n => {
        return n <= (length - motifTotalLength);
      });
      motif.rhythm.push(this.randomNoteLength(mostLikelyNoteLength, validLengths, similarNoteLengthFactor));
      motifTotalLength = this.totalLength(motif.rhythm);
    }
    if (isChordal) {
      motif = this.makeChordal(motif);
    }
    return motif;
  }

  public randomNoteLength(mostLikelyNoteLength: NoteLength = null,
    validNoteLengths: NoteLength[], similarNoteLengthFactor: number): NoteLength {
    const randomNoteLengthIndex = Random.next(0, similarNoteLengthFactor * (validNoteLengths.length - 1));
    if (randomNoteLengthIndex < validNoteLengths.length) {
      return validNoteLengths[randomNoteLengthIndex];
    } else {
      return mostLikelyNoteLength || NoteLength.Crotchet;
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

  public modifyMotif(motif: Motif, motifPool: Motif[]): Motif {
    const noOfTypesOfDevelopment = 6;
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
      case 6:
        {
          developedMotifRhythm = motif.rhythm.map(r => r <= NoteLength.Minim ? r * 2 : r);
          break;
        }
    }

    const minValue = Math.min(...developedMotifPitches);
    if (minValue < 0) {
      const transposeAmount = Math.abs(minValue);
      developedMotifPitches = this.transpose(developedMotifPitches, transposeAmount);
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

      appliedMotif.push(tone);
    }
    return appliedMotif;
  }

  public developMotif(key: Note[], motif: Motif, startIndexes: number[], motifPool: Motif[],
    timeSignature: TimeSignature, maxBars = 8, startOctave = 4, alterChance = 0.5): NoteTone[] {
    let phrase = <NoteTone[]>[];
    for (const startIndex of startIndexes) {
      const shouldAlterMotif = Random.booleanByProbability(alterChance);
      const motifToApply = shouldAlterMotif ? this.modifyMotif(motif, motifPool) : motif;

      const addition = this.applyMotif(key, motifToApply, startIndex, startOctave);
      const phraseTime = this.totalTime(phrase);
      const timeWithAddition = phraseTime + this.totalTime(addition);
      const maxTime = maxBars * timeSignature.barTime;

      if (timeWithAddition < maxTime) {
        phrase = [...phrase, ...addition];
      } else {
        const lastNote = addition[0];
        const lastNoteLenth = lastNote.length;
        for (let i = this.noteLengths.indexOf(lastNoteLenth); i >= 0; i--) {
          lastNote.length = this.noteLengths[i];
          if (phraseTime + lastNote.length < maxTime) {
            phrase.push(lastNote);
            break;
          }
        }
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
      return total;
    } else {
      return 0;
    }
  }

  totalLength(noteLengths: NoteLength[]) {
    return <number>noteLengths.reduce((a, b) => {
      return a + b;
    });
  }
}
