import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  detectUserPlatform,
  getInstallGuideSteps,
  formatVideoTime,
} from './installGuide.js';

test('detectUserPlatform accurately identifies Android devices', () => {
  const ua = 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 Chrome/120.0 Mobile';
  assert.equal(detectUserPlatform(ua), 'android');
});

test('detectUserPlatform accurately identifies iOS devices', () => {
  const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 Mobile';
  assert.equal(detectUserPlatform(ua), 'ios');
});

test('detectUserPlatform falls back to desktop on Mac/Windows/Linux browsers', () => {
  const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0 Safari/537.36';
  assert.equal(detectUserPlatform(ua), 'desktop');
});

test('getInstallGuideSteps returns 3 steps with correct action items for Android', () => {
  const steps = getInstallGuideSteps('android');
  assert.equal(steps.length, 3);
  assert.match(steps[0].title, /Chrome Menu/i);
  assert.match(steps[1].title, /Install app/i);
});

test('getInstallGuideSteps returns Safari share instructions for iOS', () => {
  const steps = getInstallGuideSteps('ios');
  assert.equal(steps.length, 3);
  assert.match(steps[1].title, /Share Icon/i);
  assert.match(steps[2].title, /Add to Home Screen/i);
});

test('formatVideoTime formats seconds into mm:ss strings', () => {
  assert.equal(formatVideoTime(0), '0:00');
  assert.equal(formatVideoTime(5), '0:05');
  assert.equal(formatVideoTime(65), '1:05');
  assert.equal(formatVideoTime(14.5), '0:14');
  assert.equal(formatVideoTime(-1), '0:00');
});
