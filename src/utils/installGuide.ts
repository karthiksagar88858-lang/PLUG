/**
 * Utility functions for app installation guide, platform detection, and playback formatting.
 */

export type PlatformType = 'android' | 'ios' | 'desktop';

export interface InstallStep {
  step: number;
  title: string;
  detail: string;
}

export function detectUserPlatform(userAgent: string): PlatformType {
  const ua = userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) {
    return 'ios';
  }
  if (/android/.test(ua)) {
    return 'android';
  }
  return 'desktop';
}

export function getInstallGuideSteps(platform: PlatformType): InstallStep[] {
  if (platform === 'ios') {
    return [
      {
        step: 1,
        title: 'Open in Safari',
        detail: 'Open this website in Safari on your iPhone or iPad.',
      },
      {
        step: 2,
        title: 'Tap Share Icon',
        detail: 'Tap the square Share button at the bottom of Safari.',
      },
      {
        step: 3,
        title: 'Add to Home Screen',
        detail: 'Scroll down and tap "Add to Home Screen" to install PLUG.',
      },
    ];
  }

  if (platform === 'android') {
    return [
      {
        step: 1,
        title: 'Open Chrome Menu',
        detail: 'Tap the 3 vertical dots (⋮) in the top-right corner.',
      },
      {
        step: 2,
        title: 'Select "Install app"',
        detail: 'Tap "Install app" or "Install and create shortcut".',
      },
      {
        step: 3,
        title: 'Confirm Installation',
        detail: 'Tap "Install" on the pop-up. PLUG is now on your home screen!',
      },
    ];
  }

  return [
    {
      step: 1,
      title: 'Click Address Bar Icon',
      detail: 'Look for the install computer/download icon in the Chrome URL bar.',
    },
    {
      step: 2,
      title: 'Select Install',
      detail: 'Click "Install PLUG - Campus Peer Exchange".',
    },
    {
      step: 3,
      title: 'Launch from Desktop',
      detail: 'Use PLUG as a fast standalone desktop application.',
    },
  ];
}

export function formatVideoTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
