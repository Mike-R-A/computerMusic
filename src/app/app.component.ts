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
  keys = <Note[][]>[];
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
    this.keys.push(this.keyService.minorHarmonic(Note.C));
    this.keys.push(this.keyService.major(Note.DsharpEflat));
    this.keys.push(this.keyService.major(Note.AsharpBflat));
    this.keys.push(this.keyService.minorHarmonic(Note.G));
    this.keys.push(this.keyService.minorHarmonic(Note.DsharpEflat));
    setInterval(() => {
      this.time = this.soundService.transportTime;
    }, 100);
    this.soundService.notePlayed.subscribe((t: NoteTone) => {
      this.currentTone = t;

      this.changeDetector.detectChanges();
    });
    this.soundService.setBpm(Random.next(60, 120));
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
    this.key = this.keys[Random.next(0, this.keys.length - 1)];
    let harmonisedPhrase: Piece;

    if (!phrase) {
      const alterChance = 1 / (Random.next(1, 10));
      harmonisedPhrase = this.musicService.developMotif(
        this.key, Random.randomFromArray(this.motifs), Random.randomFromArray(this.motifs).pitches,
        this.motifs, this.timeSignature, this.maxPhraseBarLength, 4, alterChance, this.developmentFactor);
    } else {
      phrase = this.copyPhrase(phrase);
    }

    this.phrases.push(harmonisedPhrase.phrase);
    this.soundService.addPhraseToTransport(harmonisedPhrase.phrase, 1);
    this.soundService.addPhraseToTransport(harmonisedPhrase.harmony, 2);
    this.soundService.addPhraseToTransport(harmonisedPhrase.bassLine, 3);

    // const doubledMelody = harmonisedPhrase.phrase.map(n => {
    //   const doubledTone = new NoteTone();
    //   doubledTone.length = n.length,
    //     doubledTone.note = n.note,
    //     doubledTone.octave = n.octave + 1 < this.soundService.maxOctave ? n.octave + 1 : n.octave;
    //   doubledTone.volume = n.volume;
    //   return doubledTone;
    // });
    // this.soundService.addPhraseToTransport(doubledMelody, 3);
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
