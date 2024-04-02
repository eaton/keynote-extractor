import test from 'ava';
import { KeynoteApp } from "../src/index.js";
import jetpack from '@eatonfyi/fs-jetpack';

const path = jetpack.dir('test').path('test.key');
const output = jetpack.dir('test/output');

test.serial('open and parse', async t => {
  const k = await KeynoteApp.open(path);
  t.assert(k.file === path);
  t.assert(k.slides.length === 3);

  t.assert(await k.close());
  t.assert(await KeynoteApp.quit());
});

test.serial('json with images', async t => {
  const k = await KeynoteApp.open(path);
  await k.export({ path: output.path(), format: 'JSON with images' });
  t.assert(output.exists('deck.json') === 'file');
  t.assert(output.exists('images') === 'dir');

  t.assert(await k.close());
  t.assert(await KeynoteApp.quit());
  return output.removeAsync();
});

test.serial('pdf export', async t => {
  const k = await KeynoteApp.open(path);
  await k.export({ path: output.path(), format: 'PDF', exportStyle: 'SlideWithNotes' });
  t.assert(output.exists('SlideWithNotes.pdf') === 'file');

  t.assert(await k.close());
  t.assert(await KeynoteApp.quit());

  return output.removeAsync();
});

test('alter notes', async t => {
  const k = await KeynoteApp.open(path);
  const oldNotes = k.slides[0].notes;
  
  t.notThrowsAsync(k.setNotes(1, 'Updated notes'));
  await k.setNotes(1, oldNotes);

  t.assert(await k.close());
  t.assert(await KeynoteApp.quit());
});
