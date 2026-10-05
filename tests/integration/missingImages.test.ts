import { beforeEach, describe, expect, it } from 'vitest';
import { isUsableImageResponse } from '../../scripts/images/imageCheck';
import { schema, useDb } from '../../server/utils/db';
import { forgetMissingImages, markMissingImages } from '../../server/utils/missingImages';
import { resetDatabase } from './fixtures';

const DEAD_URL = 'http://dead.example/a.jpg?x=1&y=2';
const ALIVE_URL = 'https://alive.example/b.png';

describe('missing image marking', () => {
  beforeEach(() => {
    resetDatabase();
    forgetMissingImages();
    useDb()
      .insert(schema.externalImages)
      .values([
        { url: DEAD_URL, status: 'dead' },
        { url: ALIVE_URL, status: 'alive' },
        { url: 'https://unknown.example/c.gif', status: 'unchecked' },
      ])
      .run();
  });

  it('replaces only images known to be gone with a linked placeholder', () => {
    const html = `<p><img src="http://dead.example/a.jpg?x=1&amp;y=2" alt="" loading="lazy" /> <img src="${ALIVE_URL}" alt="" /> <img src="https://unknown.example/c.gif" alt="" /></p>`;

    const marked = markMissingImages(html);

    expect(marked).toContain('<a class="missing-image" href="http://dead.example/a.jpg?x=1&amp;y=2"');
    expect(marked).toContain('<strong>CONTENT.IMAGE_NOT_FOUND</strong>');
    expect(marked).toContain(`<img src="${ALIVE_URL}" alt="" />`);
    expect(marked).toContain('<img src="https://unknown.example/c.gif" alt="" />');
    expect(marked).not.toContain('<img src="http://dead.example');
  });

  it('leaves content without images untouched', () => {
    expect(markMissingImages('<p>Bez obrazków</p>')).toBe('<p>Bez obrazków</p>');
  });

  it('picks up newly found dead images after the remembered list expires', () => {
    const now = 1_000_000;
    const html = `<img src="${ALIVE_URL}" alt="" />`;
    expect(markMissingImages(html, now)).toBe(html);
    useDb().update(schema.externalImages).set({ status: 'dead' }).run();

    expect(markMissingImages(html, now + 1000)).toBe(html);
    expect(markMissingImages(html, now + 6 * 60 * 1000)).toContain('missing-image');
  });
});

describe('image response check', () => {
  const url = 'http://img.example/pictures/seiya.jpg';

  it('accepts a successful image response from the same place', () => {
    expect(isUsableImageResponse(true, 'image/jpeg', url, url)).toBe(true);
    expect(isUsableImageResponse(true, 'IMAGE/PNG', url, 'https://img.example/pictures/seiya.jpg')).toBe(true);
    expect(isUsableImageResponse(true, 'image/webp', url, 'https://cdn.example/pictures/seiya.jpg')).toBe(true);
  });

  it('rejects errors, pages and stand-in pictures served from elsewhere', () => {
    expect(isUsableImageResponse(false, 'image/jpeg', url, url)).toBe(false);
    expect(isUsableImageResponse(true, 'text/html; charset=utf-8', url, url)).toBe(false);
    expect(isUsableImageResponse(true, null, url, url)).toBe(false);
    expect(isUsableImageResponse(true, 'image/png', url, 'https://other.example/removed.png')).toBe(false);
  });
});
