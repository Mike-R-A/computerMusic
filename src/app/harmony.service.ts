import { Injectable } from '@angular/core';
import { NoteTone } from './model/tone';
import { prefillHostVars } from '@angular/core/src/render3/instructions';
import { Note, NoteLength } from './model/enums';
import { EnumHelper } from './helpers/enum-helper';
import { KeyService } from './key.service';
import { Random } from './helpers/random';

@Injectable({
  providedIn: 'root'
})
export class HarmonyService {
  noteLengths: NoteLength[];
  constructor(private keyService: KeyService) {
    this.noteLengths = EnumHelper.getEnumNumberArray(NoteLength);
  }

  firstSpeciesCounterpoint(phrase: NoteTone[], keyRange: NoteTone[], firstNoteHarmonyInterval = 5) {
    const harmony = <number[]>[];

    const firstNoteIndex = keyRange.findIndex(n => n.id === phrase[0].id); // unison
    harmony.push(firstNoteIndex - firstNoteHarmonyInterval);
    for (let i = 1; i < phrase.length; i++) {
      const currentMelodyNoteIndex = keyRange.findIndex(k => k.id === phrase[i].id);
      const previousMelodyNoteIndex = keyRange.findIndex(k => k.id === phrase[i - 1].id);
      const previousHarmonyNoteIndex = harmony[i - 1];

      const nextNote = this.harmoniseNoteFirstSpecies(currentMelodyNoteIndex,
        previousMelodyNoteIndex, previousHarmonyNoteIndex, keyRange);

      harmony.push(nextNote);
    }
    return harmony.map((h, i) => {
      const noteTone = new NoteTone();
      const note = keyRange[h];
      const melodyNote = phrase[i];
      if (h !== -1) {
        noteTone.note = note ? note.note : Note.Rest;
        noteTone.length = melodyNote.length;
        noteTone.octave = note ? note.octave : null;
        noteTone.volume = melodyNote.volume;
      } else {
        noteTone.note = Note.Rest;
        noteTone.length = melodyNote.length;
        noteTone.octave = null;
        noteTone.volume = null;
      }

      return noteTone;
    });
  }

  harmoniseNoteFirstSpecies(currentMelodyNoteIndex: number, previousMelodyNoteIndex: number,
    previousHarmonyNoteIndex: number, keyRange: NoteTone[]) {
    if (currentMelodyNoteIndex === -1) {
      return -1;
    }

    const previousMelodyNote = keyRange[previousMelodyNoteIndex];
    const previousHarmonyNote = keyRange[previousHarmonyNoteIndex];

    const melodyIsLeap = Math.abs(currentMelodyNoteIndex - previousMelodyNoteIndex) > 1;
    const melodyChange = currentMelodyNoteIndex
      - previousMelodyNoteIndex;

    const previousWasOctave = previousMelodyNote && previousHarmonyNote && previousMelodyNote.note === previousHarmonyNote.note;
    const previousWasFifth = previousMelodyNoteIndex &&
      currentMelodyNoteIndex && (previousMelodyNoteIndex - currentMelodyNoteIndex) % 7 === 4;

    let harmonyChoices = previousWasOctave || previousWasFifth ? [
      currentMelodyNoteIndex - 2,
      currentMelodyNoteIndex - 5,
    ] : [
        currentMelodyNoteIndex,
        currentMelodyNoteIndex - 2,
        currentMelodyNoteIndex - 4,
        currentMelodyNoteIndex - 5,
        currentMelodyNoteIndex - 7
      ];


    harmonyChoices = harmonyChoices.filter(h => h < keyRange.length && h > 0);

    const stepwiseChoices = harmonyChoices.filter(choice => {
      return Math.abs(previousHarmonyNoteIndex - choice) <= 1;
    });
    const leapChoices = harmonyChoices.filter(choice => {
      return Math.abs(previousHarmonyNoteIndex - choice) > 1;
    });
    const contraryMotionChoices = harmonyChoices.filter(choice => {
      return Math.sign(previousHarmonyNoteIndex - choice) !== Math.sign(melodyChange);
    });
    const parallelMotionChoices = harmonyChoices.filter(choice => {
      return Math.sign(previousHarmonyNoteIndex - choice) === Math.sign(melodyChange);
    });
    const equalIsOk = harmonyChoices.includes(previousHarmonyNoteIndex);

    let noteChoice: number;
    const stepAndContraryChoices = harmonyChoices.filter(h => contraryMotionChoices.includes(h) && stepwiseChoices.includes(h));
    if (stepAndContraryChoices.length > 0) {
      noteChoice = stepAndContraryChoices[0];
    } else {
      if (melodyIsLeap) {
        const stepAndParallelChoices = harmonyChoices.filter(h => parallelMotionChoices.includes(h) && stepwiseChoices.includes(h));
        if (stepAndParallelChoices.length > 0) {
          noteChoice = stepAndParallelChoices[0];
        } else if (stepwiseChoices.length > 0) {
          noteChoice = stepwiseChoices[0];
        } else if (contraryMotionChoices.length > 0) {
          noteChoice = contraryMotionChoices[0];
        } else {
          noteChoice = Math.min(...harmonyChoices.map(h => Math.abs(h - previousHarmonyNoteIndex)));
        }
      } else {
        const leapAndParallelChoices = harmonyChoices.filter(h => parallelMotionChoices.includes(h) && leapChoices.includes(h));
        if (leapAndParallelChoices.length > 0) {
          noteChoice = leapAndParallelChoices[0];
        } else if (contraryMotionChoices.length > 0) {
          noteChoice = contraryMotionChoices[0];
        } else if (stepwiseChoices.length > 0) {
          noteChoice = stepwiseChoices[0];
        } else {
          noteChoice = Math.min(...harmonyChoices.map(h => Math.abs(h - previousHarmonyNoteIndex)));
        }
      }
    }
    return noteChoice;
  }

  getChordHarmony(key: Note[], phrase: NoteTone[], harmony: NoteTone[]) {
    const chordHarmony = <NoteTone[][]>[];
    const keyChords = <Note[][]>[];
    const chordSize = 3;
    for (let i = 1; i <= key.length; i++) {
      keyChords.push(this.keyService.chord(key, i, chordSize));
    }
    for (let i = 0; i < phrase.length; i++) {
      const chords = keyChords.filter(kc => kc.includes(phrase[i].note) && kc.includes(harmony[i].note));
      const unusedTones = <NoteTone[][]>[];
      let flattenedUnusedTones: NoteTone[];
      for (const chord of chords) {
        const unusedChordNotes = chord.filter(n => n !== phrase[i].note && n !== harmony[i].note);
        const unusedChordTones = unusedChordNotes.map(u => {
          const noteTone = new NoteTone();
          noteTone.length = phrase[i].length;
          noteTone.volume = phrase[i].volume;
          noteTone.octave = harmony[i].octave > 0 ? harmony[i].octave - 1 : 0;
          noteTone.note = u;
          return noteTone;
        });
        unusedTones.push(unusedChordTones);
        flattenedUnusedTones = [].concat.apply([], unusedTones);
      }
      const restTone = new NoteTone();
      restTone.length = phrase[i].length;
      restTone.note = Note.Rest;
      restTone.octave = null;
      restTone.volume = null;
      chordHarmony.push(flattenedUnusedTones || [restTone]);
    }
    return chordHarmony;
  }

  createBassLine(phraseOfOptions: NoteTone[][], keyRange: NoteTone[]) {
    const bassLine = <NoteTone[]>[];
    let previousNote: NoteTone;
    let previousIndex: number;
    let currentIndex: number;
    let previousDirection: number;
    let noteToneChoice: NoteTone;
    let concatenated = false;
    for (let i = 0; i < phraseOfOptions.length; i++) {
      const options = phraseOfOptions[i];
      if (previousNote) {
        const index = options.findIndex(o => o.note === previousNote.note);
        if (index > -1) {
          const concatLength = previousNote.length + options[index].length;
          if (this.noteLengths.includes(concatLength)) {
            previousNote.length = concatLength;
            concatenated = true;
          } else {
            noteToneChoice = options[index];
          }
        } else {
          previousIndex = keyRange.findIndex(k => k.id === previousNote.id);
          const stepOptions = options.filter(o => Math.abs(keyRange.findIndex(k => k.id === o.id) - previousIndex) === 1);
          let sameDirectionStepOptions = [];
          if (previousDirection) {
            sameDirectionStepOptions = stepOptions.
              filter(s => keyRange.findIndex(k => k.id === s.id) - previousIndex === previousDirection);
          }

          noteToneChoice = sameDirectionStepOptions.length > 0 ?
            sameDirectionStepOptions[Random.next(0, sameDirectionStepOptions.length - 1)]
            : stepOptions[Random.next(0, stepOptions.length - 1)];
        }
      }
      if (!noteToneChoice && !concatenated) {
        noteToneChoice = options[Random.next(0, options.length - 1)];
      }
      concatenated = false;
      if (noteToneChoice) {
        bassLine.push(noteToneChoice);
        previousNote = noteToneChoice;
        currentIndex = keyRange.findIndex(k => k.id === noteToneChoice.id);
        previousDirection = currentIndex - previousIndex;
      }

      noteToneChoice = null;
    }

    return bassLine;
  }

  getBeatNotes(beatLength: NoteLength, phrase: NoteTone[]) {
    let position = 0;
    const beatNotes = [];
    let positionUpToThisPoint = 0;
    const phraseLength = phrase.map(n => n.length).reduce((l1, l2) => l1 + l2);
    const noOfBeats = Math.ceil(phraseLength / beatLength);
    while (beatNotes.length < noOfBeats) {
      forLoop: for (let i = 0; i < phrase.length; i++) {
        positionUpToThisPoint += phrase[i].length;

        if (positionUpToThisPoint > position) {
          const beatNote = new NoteTone();
          beatNote.length = beatLength;
          beatNote.note = phrase[i].note;
          beatNote.octave = phrase[i].octave;
          beatNote.volume = phrase[i].volume;
          beatNotes.push(beatNote);
          break forLoop;
        }
      }
      position += beatLength;
      positionUpToThisPoint = 0;
    }

    return beatNotes;
  }
}
