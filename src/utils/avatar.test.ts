import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateAvatarSvg,
  svgToDataUrl,
  generateNameAvatar,
  DEFAULT_AVATAR_OPTIONS,
} from './avatar.ts';

test('generateAvatarSvg produces valid SVG string with required attributes', () => {
  const svg = generateAvatarSvg(DEFAULT_AVATAR_OPTIONS);
  assert.ok(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"'));
  assert.ok(svg.includes('viewBox="0 0 200 200"'));
  assert.ok(svg.endsWith('</svg>'));
});

test('generateNameAvatar returns non-empty data URL and differentiates names', () => {
  const avatar1 = generateNameAvatar('Simran Kaur');
  const avatar2 = generateNameAvatar('Aarav Sharma');

  assert.ok(avatar1.startsWith('data:image/svg+xml;utf8,'));
  assert.ok(avatar2.startsWith('data:image/svg+xml;utf8,'));
  assert.notEqual(avatar1, avatar2);
  assert.ok(!avatar1.includes('bottts'));
  assert.ok(!avatar1.includes('unsplash'));
});

test('svgToDataUrl properly encodes SVG elements', () => {
  const rawSvg = '<svg><circle cx="10" cy="10" r="5" fill="#FBBF24" /></svg>';
  const dataUrl = svgToDataUrl(rawSvg);
  assert.ok(dataUrl.startsWith('data:image/svg+xml;utf8,'));
  assert.ok(dataUrl.includes('%3Ccircle'));
});
