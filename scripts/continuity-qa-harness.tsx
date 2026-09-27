'use client';

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from 'react';

type MemorySnapshot = {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
};
type CaptureReport = ReturnType<typeof readContinuityReport>;

/** Temporary opt-in localhost harness. It is not part of the production UI. */
function readContinuityReport() {
  const owner = document.querySelector<HTMLElement>('.home-experience');
  const doc = document.documentElement;
  const sceneNodes = [
    ...document.querySelectorAll<HTMLElement>(
      '.spatial-hero, [data-home-chapter]',
    ),
  ];
  const scenes = sceneNodes.map((node) => {
    const rect = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    return {
      name: node.dataset.homeChapter ?? node.className,
      width: Math.round(rect.width * 100) / 100,
      left: Math.round(rect.left * 100) / 100,
      top: Math.round((rect.top + window.scrollY) * 100) / 100,
      bottom: Math.round((rect.bottom + window.scrollY) * 100) / 100,
      overflowX: style.overflowX,
      isolation: style.isolation,
      transform: style.transform,
      zIndex: style.zIndex,
    };
  });
  const memory = (performance as Performance & { memory?: MemorySnapshot })
    .memory;
  const breeze = document.querySelector<HTMLElement>(
    '[data-continuous-breeze], .continuous-breeze',
  );
  return {
    capturedAt: new Date().toISOString(),
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
    },
    overflow: {
      clientWidth: doc.clientWidth,
      scrollWidth: doc.scrollWidth,
      horizontal: doc.scrollWidth > doc.clientWidth,
    },
    ownerWidth: owner?.getBoundingClientRect().width ?? null,
    scenes,
    overlaps: scenes.slice(1).map((scene, index) => ({
      from: scenes[index].name,
      to: scene.name,
      pixels: Math.round((scenes[index].bottom - scene.top) * 100) / 100,
    })),
    breeze: {
      count: document.querySelectorAll(
        '[data-continuous-breeze], .continuous-breeze',
      ).length,
      owner: breeze?.parentElement?.className ?? null,
      svgCount: breeze?.querySelectorAll('svg').length ?? 0,
      pointerEvents: breeze ? getComputedStyle(breeze).pointerEvents : null,
    },
    brokenImages: [...document.images]
      .filter((img) => img.complete && img.naturalWidth === 0)
      .map((img) => img.currentSrc || img.src),
    canvasCount: document.querySelectorAll('canvas').length,
    iframeCount: owner?.querySelectorAll('iframe').length ?? 0,
    memory: memory
      ? {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        }
      : null,
  };
}

const panelStyle: CSSProperties = {
  position: 'fixed',
  left: 8,
  right: 8,
  bottom: 8,
  zIndex: 10000,
  maxWidth: 760,
  marginInline: 'auto',
  padding: 8,
  color: '#fff',
  background: '#29251feb',
  font: '11px/1.4 monospace',
};
const buttonStyle: CSSProperties = {
  appearance: 'none',
  padding: '7px 10px',
  border: '1px solid #a39885',
  marginRight: 6,
  color: '#fff',
  background: '#494034',
  cursor: 'pointer',
  font: 'inherit',
  minHeight: 32,
};

const subscribeLocation = () => () => {};
const localQaEnabled = () =>
  ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname) &&
  new URLSearchParams(window.location.search).get('continuityQa') === '1';
const serverQaEnabled = () => false;

export function ContinuityQaHarness() {
  const enabled = useSyncExternalStore(
    subscribeLocation,
    localQaEnabled,
    serverQaEnabled,
  );
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState('Local QA tools');
  const [report, setReport] = useState<
    CaptureReport | { before: CaptureReport; after: CaptureReport } | null
  >(null);
  const frameRef = useRef(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const disposeRef = useRef(false);
  const settleRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    disposeRef.current = false;
    return () => {
      disposeRef.current = true;
      cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
      settleRef.current?.();
      settleRef.current = null;
      if (recorderRef.current?.state === 'recording') {
        recorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const stop = () => {
    cancelAnimationFrame(frameRef.current);
    frameRef.current = 0;
    settleRef.current?.();
    settleRef.current = null;
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
  };

  const scrollSequence = () =>
    new Promise<void>((resolve) => {
      const owner = document.querySelector<HTMLElement>('.home-experience');
      if (!owner) {
        resolve();
        return;
      }
      const ownerRect = owner.getBoundingClientRect();
      const startY = Math.max(0, ownerRect.top + window.scrollY);
      const endY = Math.max(
        startY,
        ownerRect.bottom + window.scrollY - window.innerHeight,
      );
      window.scrollTo({ top: startY, left: 0, behavior: 'instant' });
      const startTime = performance.now();
      const leg = 9500;
      const pause = 500;
      settleRef.current = resolve;
      const step = (time: number) => {
        if (disposeRef.current) {
          resolve();
          return;
        }
        const elapsed = time - startTime;
        let fraction = 0;
        if (elapsed < pause) fraction = 0;
        else if (elapsed < pause + leg) fraction = (elapsed - pause) / leg;
        else if (elapsed < pause + leg + pause) fraction = 1;
        else fraction = 1 - (elapsed - pause - leg - pause) / leg;
        window.scrollTo({
          left: 0,
          top: startY + (endY - startY) * Math.min(1, Math.max(0, fraction)),
          behavior: 'instant',
        });
        if (elapsed >= 2 * (leg + pause)) {
          frameRef.current = 0;
          settleRef.current = null;
          resolve();
        } else frameRef.current = requestAnimationFrame(step);
      };
      frameRef.current = requestAnimationFrame(step);
    });

  const run = async (record: boolean) => {
    if (running) return;
    setRunning(true);
    setReport(null);
    let recorder: MediaRecorder | null = null;
    let captureFinished: Promise<void> | null = null;
    try {
      if (record) {
        setStatus('Choose this localhost tab in the browser capture dialog.');
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { displaySurface: 'browser' },
          audio: false,
          // Browser hints keep capture scoped to this QA tab when supported.
          preferCurrentTab: true,
          selfBrowserSurface: 'include',
          monitorTypeSurfaces: 'exclude',
        } as DisplayMediaStreamOptions);
        if (disposeRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        const surface = stream
          .getVideoTracks()[0]
          ?.getSettings().displaySurface;
        if (surface && surface !== 'browser') {
          throw new Error(
            'Select only the localhost browser tab for QA capture.',
          );
        }
        const mimeType = ['video/webm;codecs=vp9', 'video/webm'].find((type) =>
          MediaRecorder.isTypeSupported(type),
        );
        recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
        recorderRef.current = recorder;
        const chunks: Blob[] = [];
        recorder.ondataavailable = (event) => {
          if (event.data.size) chunks.push(event.data);
        };
        captureFinished = new Promise<void>((resolve) => {
          recorder!.onstop = () => {
            if (!disposeRef.current && chunks.length) {
              const file = new Blob(chunks, {
                type: recorder?.mimeType || 'video/webm',
              });
              const url = URL.createObjectURL(file);
              const anchor = document.createElement('a');
              anchor.href = url;
              anchor.download = 'continuity-scroll.webm';
              anchor.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
            }
            resolve();
          };
        });
        stream.getVideoTracks()[0]?.addEventListener('ended', stop, {
          once: true,
        });
        recorder.start(250);
      }
      const before = readContinuityReport();
      setStatus(
        record
          ? 'Recording forward + reverse scroll…'
          : 'Scrolling forward + reverse…',
      );
      await scrollSequence();
      if (!disposeRef.current) {
        setReport({ before, after: readContinuityReport() });
        setStatus(
          record
            ? 'Recording complete; video download requested.'
            : 'Forward + reverse complete.',
        );
      }
    } catch (error) {
      if (!disposeRef.current) {
        setStatus(
          error instanceof Error ? error.message : 'QA capture failed.',
        );
      }
    } finally {
      if (recorder?.state === 'recording') recorder.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (captureFinished) await captureFinished;
      recorderRef.current = null;
      streamRef.current = null;
      if (!disposeRef.current) setRunning(false);
    }
  };

  if (!enabled) return null;
  return (
    <aside style={panelStyle} aria-label="Local continuity QA">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 4,
        }}
      >
        <button
          type="button"
          style={buttonStyle}
          onClick={() => window.scrollTo({ top: 0, behavior: 'instant' })}
        >
          Top
        </button>
        {['worlds'].map((name) => (
          <button
            key={name}
            type="button"
            style={buttonStyle}
            onClick={() => {
              const node = document.querySelector(
                `[data-home-chapter="${name}"]`,
              );
              if (node)
                window.scrollTo({
                  top: node.getBoundingClientRect().top + scrollY - 100,
                  behavior: 'instant',
                });
            }}
          >
            {name}
          </button>
        ))}
        {running ? (
          <button type="button" style={buttonStyle} onClick={stop}>
            Stop QA
          </button>
        ) : (
          <>
            <button
              type="button"
              style={buttonStyle}
              onClick={() => void run(false)}
            >
              Run scroll QA
            </button>
            <button
              type="button"
              style={buttonStyle}
              onClick={() => void run(true)}
            >
              Record scroll QA
            </button>
            <button
              type="button"
              style={buttonStyle}
              onClick={() => setReport(readContinuityReport())}
            >
              Read layout report
            </button>
            {report && (
              <button
                type="button"
                style={buttonStyle}
                onClick={() => setReport(null)}
              >
                Hide report
              </button>
            )}
          </>
        )}
        <output>{status}</output>
      </div>
      {report && (
        <pre
          style={{
            maxHeight: '32vh',
            overflow: 'auto',
            margin: '8px 0 0',
            whiteSpace: 'pre-wrap',
            font: '10px/1.35 monospace',
          }}
          data-continuity-qa-report
        >
          {JSON.stringify(report, null, 2)}
        </pre>
      )}
    </aside>
  );
}
