import path from 'path';
import { runAppleScript } from 'run-applescript';
import * as Text from '@eatonfyi/text';
import jetpack from '@eatonfyi/fs-jetpack';
import { KeynoteDeck, KeynoteExportOptions } from './types.js';

export class KeynoteApp {
  protected deck?: KeynoteDeck;

  protected constructor() {}

  slideDelimiter = '\x1C';
  itemDelimiter = '\x1D';
  valDelimiter = '\x1E';

  static async open(file: string) {
    return new KeynoteApp().open(file);
  }

  static async quit() {
    return runAppleScript('tell application "Keynote" to quit')
      .then(() => true)
      .catch(() => false);
  }

  get id() {
    return this.deck?.id;
  }

  get title() {
    return this.deck?.name?.replace('.key', '') ?? '';
  }

  get name() {
    return this.deck?.name ?? '';
  }

  get file() {
    return this.deck?.file ?? '';
  }

  get theme() {
    return this.deck?.theme ?? '';
  }

  get width() {
    return this.deck?.width ?? 0;
  }

  get height() {
    return this.deck?.height ?? 0;
  }

  get slides() {
    return this.deck?.slides ?? [];
  }

  toJSON() {
    return this.deck;
  }

  // TODO: Keynote Deck should probably be its own class, wrapping the idea of
  // which window/document is being manipulated rather than always assuming the
  // frontmost window. It's extremely janky, however, so for now this probably
  // works juuuuuuust fine.

  async open(file: string) {
    this.deck = await runAppleScript(`
    tell application "Keynote"
      open the POSIX file "${file}"
      return id of front document
    end tell
    `).then((id) => this._getDeckInfo(id));
    return Promise.resolve(this);
  }

  async refresh() {
    if (this.deck) {
      return this._getDeckInfo(this.deck.id).then((deck) => {
        this.deck = deck;
        return true;
      });
    } else {
      return Promise.resolve(false);
    }
  }

  async close() {
    if (this.deck) {
      return runAppleScript(
        `tell application "Keynote" to close document id "${this.deck?.id}"`,
      ).then(() => true);
    } else {
      return Promise.resolve(false);
    }
  }

  async export(options: KeynoteExportOptions = {}) {
    const defaults = {
      path: path.resolve('.', Text.toSlug(this.title)),
      format: 'JSON with images',
      exportStyle: 'IndividualSlides',
      imageFormat: 'JPEG',
      skippedSlides: false,
    };

    let { path: dir, format, ...opt } = { ...defaults, ...options };
    let cwd = jetpack.dir(dir);

    // JSON format formats aren't part of the official spec, but what the hey.
    if (format === 'JSON' || format === 'JSON with images') {
      const json = {
        ...this.deck,
        slides: this.slides.filter(
          (s) =>
            options.skippedSlides || s.skipped === false || s.number === -1,
        ),
      };
      if (format === 'JSON with images') {
        json.slides = json.slides.map((s) => {
          s.image = `./images/images.${s.number.toString().padStart(3, '0')}.${
            opt.imageFormat
          }`;
          return s;
        });
        cwd.file('deck.json', { content: json });
        format = 'slide images';
      } else {
        cwd.file('deck.json', { content: json });
        return Promise.resolve(cwd.path('deck.json'));
      }
    }

    // TODO: the incoming `path` param should control this more directly.
    // Instead of constructing this and coercing, we should check for an
    // extension on the incoming path that matches what's about to be
    // generated, and treat it as authoritative if it seems to be explicit.

    let outputPath = cwd.path();
    switch (format) {
      case 'slide images':
        if (opt.allStages) {
          outputPath = cwd.path('builds');
        } else {
          outputPath = cwd.path('images');
        }
        break;
      case 'HTML':
        outputPath = cwd.path('html');
        break;
      case 'PDF':
        outputPath = cwd.path(opt.exportStyle + '.pdf');
        break;
      case 'QuickTime movie':
        outputPath = cwd.path(this.title + '.m4v');
        break;
      case 'Keynote 09':
        outputPath = cwd.path(this.title + '.key');
        break;
      case 'Microsoft PowerPoint':
        outputPath = cwd.path(this.title + '.pptx');
        break;
    }

    // Construct the applescript snippet
    let scr = '';
    scr += `tell application "Keynote"\n`;
    scr += `  set deck to document id "${this.id}"\n`;
    scr += `  set the current slide of deck to slide 1 of deck\n`;
    scr += `  export deck as ${format} to POSIX file "${outputPath}"`;
    if (Object.entries(opt).length) {
      scr +=
        ' with properties { ' +
        Object.entries(opt)
          .map(([k, v]) => Text.toCase.none(k) + ':' + v)
          .join(', ') +
        ' }\n';
    }
    scr += `end tell`;
    return runAppleScript(scr);
  }

  /**
   * Alter a particular slide's presenter notes.
   *
   * @remarks
   *
   * Keynote's internal numbering can be thrown off if there are skipped slides;
   * always use the index of the slide in the keynote.slides array, rather than
   * slide.number.
   */
  async setNotes(slide: number, text: string) {
    let scr = `tell application "Keynote" to set the presenter notes of slide ${slide} of document id "${this.id}" to "${text}"`;
    return runAppleScript(scr).then((newText) =>
      this.refresh().then(() => newText),
    );
  }

  /**
   * Alter a particular slide's title.
   *
   * @remarks
   *
   * Keynote's internal numbering can be thrown off if there are skipped slides;
   * always use the index of the slide in the keynote.slides array, rather than
   * slide.number.
   */
  async setTitle(slide: number, text: string) {
    let scr = `tell application "Keynote" to set the object text of default title item of slide ${slide} of document id "${this.id}" to "${text}"`;
    return runAppleScript(scr).then((newText) =>
      this.refresh().then(() => newText),
    );
  }

  /**
   * Alter a particular slide's body text.
   *
   * @remarks
   *
   * Keynote's internal numbering can be thrown off if there are skipped slides;
   * always use the index of the slide in the keynote.slides array, rather than
   * slide.number.
   */
  async setBody(slide: number, text: string) {
    let scr = `tell application "Keynote" to set the object text of default body item of slide ${slide} of document id "${this.id}" to "${text}"`;
    return runAppleScript(scr).then((newText) =>
      this.refresh().then(() => newText),
    );
  }

  protected async _getDeckInfo(id: string): Promise<KeynoteDeck> {
    const deck: KeynoteDeck = await runAppleScript(`
      set i to "${id}"
      set valueDelim to "${this.valDelimiter}"
      tell application "Keynote"
        set deck to document id i
        set deckFile to the file of deck
        set p to the file of deck
        
        set v to { i }
        set v to v & the name of deck
        set v to v & the POSIX path of p

        set v to v & the name of the document theme of deck
        set v to v & the height of deck
        set v to v & the width of deck

        set AppleScript's text item delimiters to valueDelim
        return v as string
      end tell
    `).then((result) => {
      const [id, name, file, theme, height, width] =
        result.split(this.valDelimiter);
      return {
        id,
        name,
        file,
        theme,
        height: Number.parseInt(height),
        width: Number.parseInt(width),
        slides: [],
      };
    });
    deck.slides = await this._getSlides(id);
    return Promise.resolve(deck);
  }

  protected async _getSlides(id: string) {
    return runAppleScript(`
      set i to "${id}"
      set slideDelim to "${this.slideDelimiter}"
      set valueDelim to "${this.valDelimiter}"
      set itemDelim to "${this.itemDelimiter}"

      tell application "Keynote"
        set ss to {}
        set sd to {}

        repeat with s in every slide of document id i
          set ss to ss & the slide number of s
          set ss to ss & the skipped of s
          set ss to ss & the name of the base layout of s
          set ss to ss & the object text of the default title item of s
          set ss to ss & the object text of the default body item of s
          set ss to ss & the presenter notes of s

          set ti to {}
          -- The last two items are dublicates of title and body
          repeat with i from 1 to (the count of items in the text items of s) - 2
            set ti to ti & the object text of item i of the text items of s
          end repeat

          set AppleScript's text item delimiters to itemDelim
          set ss to ss & (ti as string)

          set AppleScript's text item delimiters to valueDelim
          set sd to sd & (ss as string)
          set ss to {}
        end repeat

        set AppleScript's text item delimiters to slideDelim
        return sd as string
      end tell
    `)
      .then((result) => result.split(this.slideDelimiter))
      .then((slides) =>
        slides.map((slide) => {
          const [number, skipped, layout, title, body, notes, textItems] =
            slide.split(this.valDelimiter);
          return {
            number: Number.parseInt(number),
            skipped: skipped === 'true',
            layout,
            title,
            body,
            notes,
            textItems: textItems
              .split(this.itemDelimiter)
              .filter((t) => t.trim().length > 0),
          };
        }),
      );
  }
}
