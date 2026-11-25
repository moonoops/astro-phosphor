import afternoon from './assets/macintosh-lc-afternoon-desk-details.webp';
import afternoonStandard from './assets/macintosh-lc-afternoon-desk-details-standard.webp';
import morning from './assets/macintosh-lc-morning-desk-details.webp';
import morningStandard from './assets/macintosh-lc-morning-desk-details-standard.webp';
import noon from './assets/macintosh-lc-noon-desk-details.webp';
import noonStandard from './assets/macintosh-lc-noon-desk-details-standard.webp';
import dusk from './assets/macintosh-lc-dusk-desk-details.webp';
import duskStandard from './assets/macintosh-lc-dusk-desk-details-standard.webp';
import night from './assets/macintosh-lc-night-desk-details.webp';
import nightStandard from './assets/macintosh-lc-night-desk-details-standard.webp';
import type { RoomScene } from './stores/osStore';

export const roomMedia = '(min-width: 1000px) and (min-aspect-ratio: 6/5)';

function candidates(standard: ImageMetadata, detail: ImageMetadata) {
  return `${standard.src} ${standard.width}w, ${detail.src} ${detail.width}w`;
}

export const roomSources = {
  afternoon: candidates(afternoonStandard, afternoon),
  morning: candidates(morningStandard, morning),
  noon: candidates(noonStandard, noon),
  dusk: candidates(duskStandard, dusk),
  night: candidates(nightStandard, night),
} satisfies Record<RoomScene, string>;
