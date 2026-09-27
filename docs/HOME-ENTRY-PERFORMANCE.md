# Homepage entry — measured performance and limits

> Historical report: this loader was replaced on 27 September 2026. The measurements below do not apply to the current reference-composition loader. See [current implementation and QA](HOME-INTRO-QA.md).

Recorded on 26 September 2026 against the **dedicated stone/walnut TP + breeze entry composition**, not the former minimal wordmark loader. The Chrome trace below was captured **before** the final header `transition: none` and fixed-width percentage fixes. Those fixes are present in source, but no second trace was obtained; no measured improvement is claimed for them.

## Capture and reproduction

- Chrome Performance: Record + reload, Screenshots and Memory enabled; browser extensions remained enabled.
- URL: `http://localhost:4483/?intro=1`.
- Trace: `/private/tmp/tanphong-entry-composition-trace.json.gz` (2,405,676 bytes; 52,645 events).
- Trace metadata timestamp: `2026-09-26T08:18:16.883Z`.
- SHA-256: `28f8a13a8594e6788e8337292aeb9a197b110a4f502555d30b449510d1abf37b`.
- Analyzer: `/private/tmp/analyze-tanphong-entry.py`; results: `/private/tmp/tanphong-entry-composition-trace-summary.json`. These temporary local artifacts are not committed to the repository.

```sh
python3 /private/tmp/analyze-tanphong-entry.py /private/tmp/tanphong-entry-composition-trace.json.gz
```

The analyzer pairs asynchronous `Animation` begin/end records by process and animation ID, selects `hi-top-open` and `hi-bottom-open`, and uses their union as the reveal interval. Main-thread event totals are clipped to that interval. Compositor presentation records are paired separately and deduplicated by frame sequence. Image URLs are matched to LCP candidates through `PaintImage` node IDs.

The captured document layout was **578 × 1660 CSS pixels** for most samples, with an initial 578 × 1658 layout, at host DPR 2. This is a compact-width recording with DevTools open, not a measurement for an assumed phone model or the desktop breakpoint.

## Reveal measurements

The two-panel animation was recorded from **1.821863s to 2.816139s after navigation**, a **994.276ms** span consistent with the configured 1000ms mobile reveal. Recorded event registration/completion timestamps need not equal the CSS duration exactly.

| Measurement within that interval                             |                                      Result |
| ------------------------------------------------------------ | ------------------------------------------: |
| Main-thread tasks ≥50ms overlapping reveal                   |                                       **0** |
| Main-thread `RunTask` overlap, total                         |                                    37.053ms |
| Largest full `RunTask` overlapping reveal                    |                                    10.975ms |
| `Layout`                                                     | 32 events / 1.858ms total / 0.571ms maximum |
| `UpdateLayoutTree`                                           |                   58 events / 3.281ms total |
| `PrePaint`                                                   |                   87 events / 2.527ms total |
| `Paint`                                                      |                   86 events / 4.431ms total |
| Worker `ImageDecodeTask`                                     |                    3 events / 0.035ms total |
| Main-thread image decode events                              |                                           0 |
| Compositor `DrawFrame` markers                               |                                          60 |
| Draw-marker interval, median / maximum                       |                         16.630ms / 19.172ms |
| Presented-all pipeline completion interval, median / maximum |                         16.667ms / 16.668ms |
| Explicit `DroppedFrame` markers                              |                                       **0** |

Event categories overlap and must not be added together as independent CPU costs. The compositor results support smooth cadence in this recorded interval; they are not a universal 60fps guarantee or a benchmark of all devices.

Five ≥50ms main-thread tasks occurred earlier in startup, outside the reveal. Two include **116.838ms** and **342.470ms** of extension script evaluation from `chrome-extension://difoiogjjojoaoomphldepapgpbgkhkb/`. Other startup tasks contain substantial style/layout work. Whole-recording time must not be attributed entirely to the intro application code.

## Findings and subsequent fixes

The trace exposed a shared-header `height` transition starting about **245ms into the reveal** and lasting about **516ms**. Many layout records subsequently carry the chapter geometry function in their stack, consistent with its observer responding to the changing header size. This was unnecessary repeated layout, although it did not create a ≥50ms task in this capture. The final CSS disables header transitions while the entry gate exists, so its geometry can switch discretely during the transparent handoff interval. **The reduction in layout work has not been remeasured.**

Two tiny layout-shift records involved the percentage label expanding as its digits changed. Both had `had_recent_input: true` and recorded cumulative score 0. The final label now reserves 44px. **No after-fix CLS measurement is available.**

The recorded LCP candidate was **640.608ms**, mapped to `/images/intro-breeze-1280.webp`. This measures the visible **intro artwork**, not the underlying Homepage architecture; it must not be reported as Scene 1 LCP.

## Memory and cleanup observations

The live Chrome monitor readings reported during QA were:

| Observation                                       | JS heap shown |
| ------------------------------------------------- | ------------: |
| Initial sample after GC                           |        63.8MB |
| After ten Home → Worlds → Home cycles and GC      |        71.2MB |
| Immediately after ten forced intro reloads and GC |        99.3MB |
| Later reload/trace and settled GC sample          |        33.3MB |

Separately, this saved trace recorded a peak JS heap of **46,583,180 bytes** and a last sample of **33,384,872 bytes**, about 3.334s after navigation. Within the reveal its samples ranged from 32,650,828 to 33,327,056 bytes. These are renderer JS-heap counters, not browser process RSS or GPU memory. Frameworks and extensions also allocate in the observed renderer; reload and GC timing change the comparison baseline.

After each of the ten navigation cycles and ten forced replays, live DOM checks found **zero retained intro overlays, reveal panels or canvas elements**, and scrolling was unlocked. This demonstrates observed cleanup across those cycles. The rising intermediate heap values and later lower reading **do not prove a stable RAM plateau or establish the absence of every leak**.

Chrome's GPU process was shared with other browser work, so no isolated intro VRAM amount or reliable per-intro GPU-memory trend was obtained. Zero retained canvas elements is not an exact GPU-memory measurement.

## Remaining limits

The user resumed using Chrome before the corrected trace could be recorded; QA did not take over their tabs. The final header and percentage fixes have source/test verification plus final production computed-style confirmation (`transition-property:none`, percentage width44px), but their performance effect remains unmeasured. This report contains no reused timing from the older minimal loader, no desktop-trace claim, no exact VRAM estimate and no claim of long-term memory stability. A clean-profile recording after these fixes, plus longer identical-route heap sampling, would be needed to strengthen those conclusions.
