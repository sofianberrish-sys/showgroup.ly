/* Deterministic mask repair for solid furniture faces. */
(() => {
  'use strict';
  function solidifyColumns(alpha, width, height, startY, endY, ranges) {
    const output = new Uint8ClampedArray(alpha);
    for (const [startX, endX] of ranges) {
      for (let x = startX; x < Math.min(endX, width); x++) {
        let first = -1, last = -1;
        for (let y = startY; y < Math.min(endY, height); y++) {
          if (alpha[y * width + x] >= 140) {
            if (first < 0) first = y;
            last = y;
          }
        }
        if (first < 0 || last - first < 3) continue;
        for (let y = first + 1; y < last; y++) output[y * width + x] = 255;
      }
    }
    return output;
  }
  window.ShowGroupMaskRepair = { solidifyColumns };
})();
