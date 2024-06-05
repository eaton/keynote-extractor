export type KeynoteSlide = {
  number: number,
  skipped: boolean,
  layout: string,
  title: string,
  body: string,
  notes: string,
  image?: string,
  textItems: string[],
}

export type KeynoteDeck = {
  id: string,
  name: string,
  file: string;
  theme: string,
  height: number,
  width: number,
  slides: KeynoteSlide[],
}

export type KeynoteExportOptions = {
  path?: string,
  format?: ExportFormat,
  imageFormat?: ImageFormat,
  movieFormat?: MovieFormat,
  movieCodec?: MovieCodec,
  movieFramerate?: MovieFramerate,
  exportStyle?: ExportStyle,
  compressionFactor?: number,
  allStages?: boolean,
  skippedSlides?: boolean,
  borders?: boolean,
  slideNumbers?: boolean,
  date?: boolean,
  rawkpf?: boolean,
  password?: boolean,
  passwordHint?: boolean,
  includeComments?: boolean,
  pdfImageQuality?: PdfQuality;
}

type ExportStyle = 'IndividualSlides' | 'SlideWithNotes' | 'Handouts';

type ImageFormat = 'JPEG' | 'PNG' | 'TIFF';

type PdfQuality = 'Good' | 'Better' | 'Best';

export type ExportFormat = 'JSON'
| 'JSON with images'
| 'HTML'
| 'QuickTime movie'
| 'PDF'
| 'slide images'
| 'Microsoft PowerPoint'
| 'Keynote 09';

export type MovieCodec = 'h264'
| 'AppleProRes422'
| 'AppleProRes4444'
| 'AppleProRes422LT'
| 'AppleProRes422HQ'
| 'AppleProRes422Proxy'
| 'HEVC';

export type MovieFormat = 'format360p'
| 'format540p'
| 'format720p'
| 'format1080p'
| 'format2160p'
| 'native size';

export type MovieFramerate = 'FPS12'
| 'FPS2398'
| 'FPS24'
| 'FPS25'
| 'FPS2997'
| 'FPS30'
| 'FPS50'
| 'FPS5994'
| 'FPS60';
