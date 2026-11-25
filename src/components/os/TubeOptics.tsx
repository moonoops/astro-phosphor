import { useEffect, useRef, type RefObject } from 'react';
import curveMap from '../../assets/tube-curve.png?inline';
import { createPhotographedLens, setPointerField } from '../../geometry/signal-lens';
import { aperture, overscan, rasterInset, rasterMaskTransform, virtualScreen } from '../../geometry/tube';
import { $preferences } from '../../stores/osStore';

const corners = [
  ['lower', 'lower'],
  ['upper', 'lower'],
  ['lower', 'upper'],
  ['upper', 'upper'],
] as const;

const axes = [
  { name: 'x', channel: '1 0 0 0 0' },
  { name: 'y', channel: '0 1 0 0 0' },
] as const;

function sampleTables(pixelScale: number) {
  const lower = [];
  const upper = [];
  const fraction = [];
  if (pixelScale < 0.01) {
    for (let channel = 0; channel < 256; channel++) {
      lower.push('0.50000');
      upper.push('0.50000');
      fraction.push('0.00000');
    }
    return { lower: lower.join(' '), upper: upper.join(' '), fraction: fraction.join(' ') };
  }
  const encode = (pixel: number) => Math.min(1, Math.max(0, 0.5 + pixel / pixelScale));

  // The lens uses byte 128 for zero. Each table gives the two integer
  // neighbors and the fractional weight for one device-pixel displacement.
  for (let channel = 0; channel < 256; channel++) {
    const offset = pixelScale * (channel - 128) / 255;
    const floor = Math.floor(offset);
    lower.push(encode(floor).toFixed(5));
    upper.push(encode(floor + 1).toFixed(5));
    fraction.push((offset - floor).toFixed(5));
  }

  return { lower: lower.join(' '), upper: upper.join(' '), fraction: fraction.join(' ') };
}

function BlendSamples({ from, to, axis, result }: { from: string; to: string; axis: 'x' | 'y'; result: string }) {
  return (
    <>
      <feComposite in={from} in2={`${axis}-weight`} operator="out" result={`${result}-low`} />
      <feComposite in={to} in2={`${axis}-weight`} operator="in" result={`${result}-high`} />
      <feComposite in={`${result}-low`} in2={`${result}-high`} operator="arithmetic" k2="1" k3="1" result={result} />
    </>
  );
}

export default function TubeOptics({ glass }: { glass: RefObject<HTMLDivElement | null> }) {
  const filter = useRef<SVGFilterElement>(null);
  const lens = useRef<SVGFEImageElement>(null);

  useEffect(() => {
    const surface = glass.current;
    const curve = filter.current;
    const map = lens.current;
    if (!surface || !curve || !map) return;

    const offsets = curve.querySelectorAll('feDisplacementMap');
    const tables = curve.querySelectorAll('[data-curve-table]');
    const supportsLens = CSS.supports('filter', 'url("#tube-curvature")');
    const needsScale = !CSS.supports('transform', 'scale(calc(2px / 1px))');
    const roomView = matchMedia('(min-width: 1000px) and (min-aspect-ratio: 6/5)');
    const sx = 1 / aperture.width;
    const sy = 1 / aperture.height;
    let photograph: ReturnType<typeof createPhotographedLens>;
    let previousImage = curveMap;
    let previousScale = -1;
    let previousPixelScale = -1;
    let previousApertureTransform = '';
    let syncFrame = 0;

    const updateApertureClip = (fullProgress: number) => {
      const clipUse = document.querySelector<SVGUseElement>('#tube-aperture use');
      if (!clipUse) return;
      const expand = 1 + 0.08 * fullProgress;
      const transform = fullProgress <= 0.001
        ? `scale(${sx} ${sy})`
        : `matrix(${expand * sx} 0 0 ${expand * sy} ${0.5 - 0.5 * expand} ${0.5 - 0.5 * expand})`;
      if (transform !== previousApertureTransform) {
        clipUse.setAttribute('transform', transform);
        document.querySelector('#tube-raster g')?.setAttribute('transform', rasterMaskTransform(fullProgress));
        previousApertureTransform = transform;
      }
    };

    const measure = () => {
      const root = document.documentElement;
      const zoom = root.dataset.zoom;
      const rawFull = parseFloat(getComputedStyle(root).getPropertyValue('--crt-full'));
      const fullProgress = Number.isFinite(rawFull) ? Math.min(1, Math.max(0, rawFull)) : (zoom === 'fullscreen' ? 1 : 0);
      const curvatureWeight = (1 - fullProgress) * (1 - fullProgress);

      updateApertureClip(fullProgress);

      const { width, height } = surface.getBoundingClientRect();
      const plane = surface.closest('.screen-plane')?.getBoundingClientRect();
      if (!width || !height || !plane?.width || !plane?.height) return fullProgress;
      map.setAttribute('width', String(width));
      map.setAttribute('height', String(height));
      let baseScale = Math.min(36, width * .043);
      let image = curveMap;
      if (roomView.matches) {
        const unit = plane.width / aperture.width;
        const profile = document.querySelector<SVGPathElement>('#raster-profile');
        if (!photograph && profile) {
          photograph = createPhotographedLens(profile, {
            x: -overscan,
            y: -overscan,
            width: aperture.width + 2 * overscan,
            height: aperture.height + 2 * overscan,
          }, aperture, rasterInset);
        }
        if (photograph) {
          image = photograph.image;
          baseScale = photograph.scale * unit;
        }
      }
      const scale = fullProgress >= 0.995 ? 0 : baseScale * curvatureWeight;
      const projected = roomView.matches && supportsLens ? photograph : undefined;
      setPointerField(surface, projected?.offsets, projected ? scale / projected.scale : 0);
      if (image !== previousImage) {
        map.setAttribute('href', image);
        previousImage = image;
      }
      if (Math.abs(scale - previousScale) > 0.001) {
        offsets.forEach(offset => offset.setAttribute('scale', String(scale)));
        previousScale = scale;
      }

      const pixelScale = scale * window.devicePixelRatio;
      if (Math.abs(pixelScale - previousPixelScale) > 0.005) {
        const values = sampleTables(pixelScale);
        tables.forEach(table => {
          const name = table.getAttribute('data-curve-table') as keyof typeof values;
          table.setAttribute('tableValues', values[name]);
        });
        previousPixelScale = pixelScale;
      }

      // Flatten filter & clip-path only after scale has eased smoothly to zero.
      if (zoom === 'fullscreen' && fullProgress >= 0.995) {
        root.dataset.crtFlat = 'on';
      } else if (zoom !== 'fullscreen') {
        delete root.dataset.crtFlat;
      }

      if (needsScale) {
        const style = root.style;
        if (!roomView.matches || fullProgress >= 0.995) {
          style.removeProperty('--stage-scale');
          style.removeProperty('--stage-scale-y');
        } else {
          const horizontal = plane.width / virtualScreen.width;
          const vertical = plane.height / virtualScreen.height;
          style.setProperty('--stage-scale', String(horizontal + (1 - horizontal) * fullProgress));
          style.setProperty('--stage-scale-y', String(vertical + (1 - vertical) * fullProgress));
        }
      }
      return fullProgress;
    };

    const syncTransition = () => {
      cancelAnimationFrame(syncFrame);
      const started = performance.now();
      const step = () => {
        const fullProgress = measure() ?? 0;
        const target = document.documentElement.dataset.zoom === 'fullscreen' ? 1 : 0;
        const settled = Math.abs(fullProgress - target) < 0.002;
        if (!settled && performance.now() - started < 1200) {
          syncFrame = requestAnimationFrame(step);
        } else {
          syncFrame = 0;
        }
      };
      step();
    };

    let resolution = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    function resolutionChanged() {
      resolution.removeEventListener('change', resolutionChanged);
      resolution = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      resolution.addEventListener('change', resolutionChanged);
      measure();
    }

    const resize = new ResizeObserver(() => { measure(); });
    resize.observe(surface);
    roomView.addEventListener('change', measure);
    resolution.addEventListener('change', resolutionChanged);
    document.addEventListener('astro:after-swap', measure);
    const stopPreferences = $preferences.listen(syncTransition);
    measure();
    return () => {
      cancelAnimationFrame(syncFrame);
      setPointerField(surface, undefined, 0);
      resize.disconnect();
      roomView.removeEventListener('change', measure);
      resolution.removeEventListener('change', resolutionChanged);
      document.removeEventListener('astro:after-swap', measure);
      stopPreferences();
    };
  }, [glass]);

  return (
    <svg className="crt-filter-defs" width="0" height="0" focusable="false">
      <defs>
        <filter ref={filter} id="tube-curvature" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feImage ref={lens} href={curveMap} preserveAspectRatio="none" result="lens" />
          {corners.map(([x, y], index) => (
            <SampleCorner key={`${x}-${y}`} x={x} y={y} index={index} />
          ))}
          {axes.map(({ name, channel }) => (
            <WeightMap key={name} name={name} channel={channel} />
          ))}
          <BlendSamples from="sample-0" to="sample-1" axis="x" result="top" />
          <BlendSamples from="sample-2" to="sample-3" axis="x" result="bottom" />
          <BlendSamples from="top" to="bottom" axis="y" result="curved" />
        </filter>
      </defs>
    </svg>
  );
}

function SampleCorner({ x, y, index }: { x: 'lower' | 'upper'; y: 'lower' | 'upper'; index: number }) {
  return (
    <>
      <feComponentTransfer in="lens" result={`offset-${index}`}>
        <feFuncR type="discrete" data-curve-table={x} />
        <feFuncG type="discrete" data-curve-table={y} />
      </feComponentTransfer>
      <feDisplacementMap in="SourceGraphic" in2={`offset-${index}`} scale="0" xChannelSelector="R" yChannelSelector="G" result={`sample-${index}`} />
    </>
  );
}

function WeightMap({ name, channel }: { name: 'x' | 'y'; channel: string }) {
  return (
    <>
      <feColorMatrix in="lens" type="matrix" values={`0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${channel}`} result={`${name}-channel`} />
      <feComponentTransfer in={`${name}-channel`} result={`${name}-weight`}>
        <feFuncA type="discrete" data-curve-table="fraction" />
      </feComponentTransfer>
    </>
  );
}
