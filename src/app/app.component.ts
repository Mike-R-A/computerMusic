import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { SoundService } from './sound.service';
import { Random } from './helpers/random';
import { MusicService } from './music.service';
import { KeyService } from './key.service';
import { TimeSignature } from './model/time-signature';
import { NoteLength, Note } from './model/enums';
import { NoteTone } from './model/tone';

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
  motifs = [];
  phrases = [];
  key = [];
  constructor(private soundService: SoundService,
    private musicService: MusicService,
    private keyService: KeyService) { }

  ngOnInit() {
    this.key = this.keyService.minorHarmonic(Note.C);
  }

  addMotif() {
    const isChordal = this.isChordalChance >= 0 && this.isChordalChance <= 1
      && Random.next(1, Math.round(1 / this.isChordalChance)) === 1;
    const motif = this.musicService.motif(this.motifLength, this.motifMaxSize,
      this.motifStasisInhibitor, this.motifRestChance, this.motifMostLikelyNoteLength, isChordal);
    this.motifs.push(motif);
  }

  addMotifVariation() {
    const randomInt = Random.next(0, this.motifs.length - 1);
    this.musicService.modifyMotif(this.motifs[randomInt], this.motifs);
  }

  addPhrase() {
    const timeSignature = new TimeSignature();
    timeSignature.beats = 4;
    timeSignature.beatType = NoteLength.Crotchet;
    const randomInt1 = Random.next(0, this.motifs.length - 1);
    const randomInt2 = Random.next(0, this.motifs.length - 1);
    const alterChance = 1 / (Random.next(1, 10));
    const phrase = this.musicService.developMotif(this.key, this.motifs[randomInt1],
      this.motifs[randomInt2].pitches, timeSignature, this.phraseBarLength, 4, alterChance);
    this.phrases.push(phrase);
    for (const tone of phrase) {
      this.soundService.addNoteToTransport(tone);
    }
  }

  startSound() {
    this.soundService.startTransport();
  }
}
