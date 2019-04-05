import { Injectable } from '@angular/core';
import { KeyService } from './key.service';
import { Random } from './helpers/random';
import { SoundService } from './sound.service';
import { TimeSignature } from './model/time-signature';
import { Note, NoteLength } from './model/enums';
import { Motif } from './model/motif';
import { NoteTone } from './model/tone';
import { EnumHelper } from './helpers/enum-helper';
import { MotifService } from './motif.service';

@Injectable({
  providedIn: 'root'
})
export class MusicService {
  noteLengths: NoteLength[];
  constructor(private keyService: KeyService, private soundService: SoundService, private motifService: MotifService) {
    this.noteLengths = EnumHelper.getEnumNumberArray(NoteLength);
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
      const motifToApply = shouldAlterMotif ? this.motifService.modifyMotif(motif, motifPool) : motif;

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
    this.accentFirstNoteInEachBar(phrase, timeSignature);
    this.padWithRests(phrase, timeSignature);
    return phrase;
  }

  private accentFirstNoteInEachBar(phrase: NoteTone[], timeSignature: TimeSignature) {
    for (let i = 0; i < phrase.length; i++) {
      const timeUpToThisTone = this.totalTime(phrase.slice(i));
      const singleBarTime = timeSignature.barTime;
      if (timeUpToThisTone % singleBarTime === 0) {
        phrase[i].volume = 0.3;
      } else {
        phrase[i].volume = 0.2;
      }
    }
  }

  private padWithRests(phrase: NoteTone[], timeSignature: TimeSignature) {
    const singleBarTime = timeSignature.barTime;
    const remainder = this.totalTime(phrase) % singleBarTime;
    let endRestTime = singleBarTime - remainder;
    while (endRestTime >= NoteLength.Semibreve) {
      const newTone = new NoteTone();
      newTone.note = Note.Rest;
      newTone.length = NoteLength.Semibreve;
      newTone.octave = null;
      phrase.push(newTone);
      endRestTime = endRestTime - NoteLength.Semibreve;
    }
    while (endRestTime >= NoteLength.Minim) {
      const newTone = new NoteTone();
      newTone.note = Note.Rest;
      newTone.length = NoteLength.Minim;
      newTone.octave = null;
      phrase.push(newTone);
      endRestTime = endRestTime - NoteLength.Minim;
    }
    while (endRestTime >= NoteLength.Crotchet) {
      const newTone = new NoteTone();
      newTone.note = Note.Rest;
      newTone.length = NoteLength.Crotchet;
      newTone.octave = null;
      phrase.push(newTone);
      endRestTime = endRestTime - NoteLength.Crotchet;
    }
    while (endRestTime >= NoteLength.Quaver) {
      const newTone = new NoteTone();
      newTone.note = Note.Rest;
      newTone.length = NoteLength.Quaver;
      newTone.octave = null;
      phrase.push(newTone);
      endRestTime = endRestTime - NoteLength.Quaver;
    }
    while (endRestTime >= NoteLength.SemiQuaver) {
      const newTone = new NoteTone();
      newTone.note = Note.Rest;
      newTone.length = NoteLength.SemiQuaver;
      newTone.octave = null;
      phrase.push(newTone);
      endRestTime = endRestTime - NoteLength.SemiQuaver;
    }
  }

  private totalTime(phrase: NoteTone[]): number {
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
}
