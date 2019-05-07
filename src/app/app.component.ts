import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { SoundService } from './sound.service';
import { Random } from './helpers/random';
import { MusicService } from './music.service';
import { KeyService } from './key.service';
import { TimeSignature } from './model/time-signature';
import { NoteLength, Note } from './model/enums';
import { NoteTone } from './model/tone';
import { Motif } from './model/motif';
import { EnumHelper } from './helpers/enum-helper';
import { MotifService } from './motif.service';
import { Piece } from './model/piece';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'computer-music';
  motifLength = 4;
  motifMaxSize = 8;
  sameDirectionChance = 0.5;
  motifRestChance = 0.01;
  motifMostLikelyNoteLength = NoteLength.Crotchet;
  maxPhraseBarLength = 8;
  isChordalChance = 0.25;
  beatsInBar = 4;
  developmentFactor = 1;
  beatsInBarType = NoteLength.Crotchet;
  motifs = <Motif[]>[];
  phrases = <NoteTone[][]>[];
  key = <Note[]>[];
  currentTone: NoteTone;
  time: string;
  metronomeIsOn = false;

  get timeSignature() {
    const timeSignature = new TimeSignature();
    timeSignature.beats = this.beatsInBar;
    timeSignature.beatType = this.beatsInBarType;
    return timeSignature;
  }

  constructor(public soundService: SoundService,
    private musicService: MusicService,
    private motifService: MotifService,
    private keyService: KeyService, private changeDetector: ChangeDetectorRef) { }

  ngOnInit() {
    this.key = this.keyService.minorHarmonic(Note.C);
    setInterval(() => {
      this.time = this.soundService.transportTime;
    }, 100);
    this.soundService.notePlayed.subscribe((t: NoteTone) => {
      this.currentTone = t;

      this.changeDetector.detectChanges();
    });
  }

  addMotif(motif: Motif = null) {
    if (!motif) {
      motif = this.motifService.motif(this.motifLength, this.motifMaxSize, this.sameDirectionChance,
        this.motifRestChance, this.motifMostLikelyNoteLength, Random.booleanByProbability(this.isChordalChance));
    }
    this.motifs.push(motif);
  }

  deleteMotif(motif: Motif, event: MouseEvent) {
    event.stopPropagation();
    this.motifs.splice(this.motifs.indexOf(motif), 1);
  }

  addMotifVariation() {
    const randomInt = Random.next(0, this.motifs.length - 1);
    const motif = this.motifService.modifyMotif(this.motifs[randomInt], this.motifs);
    this.motifs.push(motif);
  }

  addPhrase(phrase: NoteTone[] = null) {
    let x: Piece;
    const chordHarmony = <NoteTone[][]>[];
    if (!phrase) {
      const alterChance = 1 / (Random.next(1, 10));
      x = this.musicService.developMotif(this.key, Random.randomFromArray(this.motifs), Random.randomFromArray(this.motifs).pitches,
        this.motifs, this.timeSignature, this.maxPhraseBarLength, 4, alterChance, this.developmentFactor);
      const keyChords = <Note[][]>[];
      const chordSize = 3;
      for (let i = 1; i <= this.key.length; i++) {
        keyChords.push(this.keyService.chord(this.key, i, chordSize));
      }
      for (let i = 0; i < x.phrase.length; i++) {
        const chords = keyChords.filter(kc => kc.includes(x.phrase[i].note) && kc.includes(x.harmony[i].note));
        const unusedTones = <NoteTone[][]>[];
        let flattenedUnusedTones: NoteTone[];
        for (const chord of chords) {
          const unusedChordNotes = chord.filter(n => n !== x.phrase[i].note && n !== x.harmony[i].note);
          const unusedChordTones = unusedChordNotes.map(u => {
            const noteTone = new NoteTone();
            noteTone.length = x.phrase[i].length;
            noteTone.volume = x.phrase[i].volume;
            noteTone.octave = x.harmony[i].octave > 0 ? x.harmony[i].octave - 1 : 0;
            noteTone.note = u;
            return noteTone;
          });

          unusedTones.push(unusedChordTones);
          flattenedUnusedTones = [].concat.apply([], unusedTones);
        }
        const restTone = new NoteTone();
        restTone.length = x.phrase[i].length;
        restTone.note = Note.Rest;
        restTone.octave = null;
        restTone.volume = null;
        chordHarmony.push(flattenedUnusedTones || [restTone]);
      }

    } else {
      phrase = this.copyPhrase(phrase);
    }

    const bassLine = this.musicService.createBassLine(chordHarmony);

    this.phrases.push(x.phrase);
    this.soundService.addPhraseToTransport(x.phrase, 0);
    this.soundService.addPhraseToTransport(x.harmony, 1);
    this.soundService.addPhraseToTransport(bassLine, 2);
  }

  private copyPhrase(phrase: NoteTone[]) {
    phrase = phrase.map(n => {
      const copy = new NoteTone();
      copy.length = n.length;
      copy.note = n.note;
      copy.octave = n.octave;
      copy.volume = n.volume;
      return copy;
    });
    return phrase;
  }

  toggleTransport() {
    this.soundService.toggleTransport();
  }

  toggleMetronome() {
    this.metronomeIsOn = !this.metronomeIsOn;
    if (this.metronomeIsOn) {
      this.soundService.metronomeOn();
    } else {
      this.soundService.metronomeOff();
    }
  }

  getRhythmName(value: any) {
    return EnumHelper.getEnumPropertyName(NoteLength, value);
  }

  rewindToStart() {
    Tone.Transport.position = '00:00:00';
  }
}
