# Keynote Extractor

Actually parsing Keynote files is a huge PITA, but in theory you can control the Keynote application (and interrogate a given document, slide by slide and object by object) with Applescript.

And so, the journey into madness begins.

## Installation

`npm install eaton/keynote-extractor`, that's it.

## Usage

```
import { Keynote, KeynoteSlide } from "@eatonfyi/keynote-extractor";

const path = '~/my-presentation-stuff';
const deck = await Keynote.open('~/my-keynote-file.key');

// Print and alter deck properties, iterate over slides
console.log(`${deck.title} is ${deck.width}x${deck.height} pixels.`);
for (const slide of deck.slides) {
  console.log(`Slide ${slide.number} of ${deck.slides.length}: "${slide.title}"`);
  console.log(slide.notes);
}

// Generate a standard Keynote PDF export
await deck.export({ 
  format: 'PDF',
  exportStyle: 'IndividualSlides',
  pdfImageQuality: 'Better',
  path
});

// Generate slide-by-slide images
await deck.export({ 
  format: 'slide images',
  allStages: true,
  exportStyle: 'IndividualSlides',
  path
});

// Generate an mp4 video of the presentation, including all transitions and
// animations. It will be enormous and annoying, and export options can't be
// controlled via the Applescript call.
await deck.export({ 
  format: 'QuickTime movie',
  movieFormat: 'format720p',
  movieFramerate: 'FPS12',
  movieCodec: 'h264',
  path,
});

// Generate a JSON file with presentation metadata, and title/body/notes text
// for each slide
await deck.export({ format: 'JSON', path });

```
