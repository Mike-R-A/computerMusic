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

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'computer-music';
  motifLength = 4;
  motifMaxSize = 8;
  motifStasisInhibitor = 8;
  motifRestChance = 0.01;
  motifMostLikelyNoteLength = NoteLength.Crotchet;
  phraseBarLength = 4;
  isChordalChance = 0.25;
  motifs = <Motif[]>[];
  phrases = <NoteTone[][]>[];
  key = <Note[]>[];
  currentTone: NoteTone;
  constructor(private soundService: SoundService,
    private musicService: MusicService,
    private keyService: KeyService, private changeDetector: ChangeDetectorRef) { }

  ngOnInit() {
    this.key = this.keyService.minorHarmonic(Note.C);
    this.soundService.notePlayed.subscribe((t: NoteTone) => {
      console.log(t.note);
      this.currentTone = t;
      this.changeDetector.detectChanges();
    });
  }

  addMotif(motif: Motif) {
    if (!motif) {
      const isChordal = this.isChordalChance >= 0 && this.isChordalChance <= 1
        && Random.next(1, Math.round(1 / this.isChordalChance)) === 1;
      motif = this.musicService.motif(this.motifLength, this.motifMaxSize,
        this.motifStasisInhibitor, this.motifRestChance, this.motifMostLikelyNoteLength, isChordal);
    }
    this.motifs.push(motif);
  }

  deleteMotif(motif: Motif, event: MouseEvent) {
    event.stopPropagation();
    this.motifs.splice(this.motifs.indexOf(motif), 1);
  }

  addMotifVariation() {
    const randomInt = Random.next(0, this.motifs.length - 1);
    const motif = this.musicService.modifyMotif(this.motifs[randomInt], this.motifs);
    this.motifs.push(motif);
  }

  addPhrase(phrase: NoteTone[] = null) {
    if (!phrase) {
      const timeSignature = new TimeSignature();
      timeSignature.beats = 4;
      timeSignature.beatType = NoteLength.Crotchet;
      const randomInt1 = Random.next(0, this.motifs.length - 1);
      const randomInt2 = Random.next(0, this.motifs.length - 1);
      const alterChance = 1 / (Random.next(1, 10));
      phrase = this.musicService.developMotif(this.key, this.motifs[randomInt1],
        this.motifs[randomInt2].pitches, this.motifs, timeSignature, this.phraseBarLength, 4, alterChance);
    }
    this.phrases.push(phrase);
    this.addPhraseToTransport(phrase);
  }

  deletePhrase(phrase: NoteTone[], event: MouseEvent) {
    event.stopPropagation();
    this.phrases.splice(this.phrases.indexOf(phrase), 1);
  }

  addPhraseToTransport(phrase: NoteTone[]) {
    for (const tone of phrase) {
      this.soundService.addNoteToTransport(tone);
    }
  }

  toggleTransport() {
    this.soundService.toggleTransport();
  }

  getRhythmName(value: any) {
    return EnumHelper.getEnumPropertyName(NoteLength, value);
  }

  rewindToStart() {
    Tone.Transport.position = '00:00:00';
  }
}
