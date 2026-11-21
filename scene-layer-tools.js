/* Build registered masks for native table pixels and source-aligned scene layers. */
(() => {
  'use strict';
  const width = 1536;
  const height = 1024;
  const assets = {
    master: 'images/scene-master-r10.png', structure: 'images/scene-structure-r10.png',
    backdrop: 'images/scene-backdrop-red-r11.png?v=12', labels: 'images/scene-labels-r10.png',
    empty: 'images/assembly-00-empty.png',
    recovery: 'images/scene-master-r10.png',
    tableVase: 'images/decor-foreground.png',
  };
  const colors = {
    sofa: [0, 255, 255], decor: [255, 0, 255], chairs: [0, 0, 255],
    linen: [255, 0, 0], settings: [0, 255, 0], candles: [255, 128, 0],
    flowers: [255, 255, 0],
  };
  const palette = Object.entries(colors);
  const clamp = value => Math.max(0, Math.min(255, value));
  function whiteAlpha(r, g, b) {
    const neutral = Math.max(r, g, b) - Math.min(r, g, b) < 85 && r >= g * .95;
    const warm = r > 180 && g > 135 && b > 65 && r >= g && g >= b;
    return neutral || warm ? clamp((Math.min(r, g, b) - 75) * 3.6) : 0;
  }
  function classify(r, g, b, x, y) {
    const max = Math.max(r, g, b);
    if (max < 50 || max - Math.min(r, g, b) < 35) return null;
    const sample = [r / max * 255, g / max * 255, b / max * 255];
    let selected = null;
    let nearest = 16900;
    for (const [key, color] of palette) {
      const distance = (color[0] - sample[0]) ** 2 +
        (color[1] - sample[1]) ** 2 + (color[2] - sample[2]) ** 2;
      if (distance < nearest) { nearest = distance; selected = key; }
    }
    // Remove every labeled fragment of the old trellis vase before its replacement appears.
    if (x >= 173 && x <= 329 && y >= 270 && y <= 445) return null;
    const side = x < 610 || x > 930;
    if (selected === 'sofa' && !(x > 630 && x < 930 && y > 340 && y < 515)) return null;
    if (selected === 'decor') {
      if (!(y > 190 && y < 535)) return null;
      const stageDecor = x > 380 && x < 1080;
      // Include the full trellis vase silhouette; its blooms extend past x=275 and y=420.
      if (!stageDecor) selected = side ? 'flowers' : null;
    }
    if (['chairs', 'linen', 'settings', 'candles', 'flowers'].includes(selected) &&
        (!side || y < 315 || y > 890)) return null;
    return selected;
  }
  function canvas() {
    const node = document.createElement('canvas');
    node.width = width;
    node.height = height;
    return node;
  }
  function pixels(image) {
    const node = canvas();
    const ctx = node.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(image, 0, 0, width, height);
    const data = ctx.getImageData(0, 0, width, height).data;
    node.width = 1;
    return data;
  }
  function maskUrl(alpha, feather = 1) {
    const node = canvas();
    const ctx = node.getContext('2d');
    const data = ctx.createImageData(width, height);
    for (let i = 0; i < alpha.length; i++) {
      data.data[i * 4] = data.data[i * 4 + 1] = data.data[i * 4 + 2] = 255;
      data.data[i * 4 + 3] = alpha[i];
    }
    ctx.putImageData(data, 0, 0);
    const softened = canvas();
    const soft = softened.getContext('2d');
    soft.filter = `blur(${feather}px)`;
    soft.drawImage(node, 0, 0);
    const url = softened.toDataURL('image/png');
    node.width = softened.width = 1;
    return url;
  }
  function region(points) {
    const node = canvas();
    const ctx = node.getContext('2d');
    ctx.beginPath();
    points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.closePath();
    ctx.fill();
    const data = ctx.getImageData(0, 0, width, height).data;
    const alpha = Uint8ClampedArray.from({ length: width * height }, (_, i) => data[i * 4 + 3]);
    node.width = 1;
    return alpha;
  }
  function intersectMasks(alpha, gate) {
    return Uint8ClampedArray.from(alpha, (value, i) => gate[i] ? value : 0);
  }
  function removeMasks(alpha, exclusions) {
    const result = Uint8ClampedArray.from(alpha);
    for (const mask of exclusions) {
      for (let i = 0; i < result.length; i++) {
        if (mask[i] > 40) result[i] = 0;
      }
    }
    return result;
  }
  function load(source) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => image.naturalWidth === width && image.naturalHeight === height ?
        resolve(image) : reject(new Error('Unregistered scene asset dimensions'));
      image.onerror = reject;
      image.src = source;
    });
  }

  // Patch only curtain pixels, protecting the original chairs, vases and table details.
  function composeCurtains(master, curtainPlate, originalPixels, actorMasks) {
    const left = region([[409,326],[486,269],[574,326],[575,507],[408,507]]);
    const right = region([[1026,326],[1105,260],[1207,326],[1208,507],[1027,507]]);
    const protection = new Uint8Array(width * height);
    for (const mask of Object.values(actorMasks)) {
      for (let i=0; i<protection.length; i++) if (mask[i]>60) protection[i]=1;
    }
    const maskNode=canvas(), maskContext=maskNode.getContext('2d');
    const image=maskContext.createImageData(width,height);
    for (let i=0; i<protection.length; i++) {
      if (!left[i] && !right[i]) continue;
      const x=i%width, y=Math.floor(i/width), p=i*4;
      const r=originalPixels[p], g=originalPixels[p+1], b=originalPixels[p+2];
      let covered=y>405 && Math.min(r,g,b)>140;
      for (let yy=y-2; yy<=y+2 && !covered; yy++) {
        for (let xx=x-2; xx<=x+2; xx++) {
          if (xx>=0 && xx<width && yy>=0 && yy<height && protection[yy*width+xx]) {
            covered=true; break;
          }
        }
      }
      image.data[p]=image.data[p+1]=image.data[p+2]=255;
      image.data[p+3]=covered?0:255;
    }
    maskContext.putImageData(image,0,0);
    const overlay=canvas(), overlayContext=overlay.getContext('2d');
    overlayContext.drawImage(curtainPlate,0,0);
    overlayContext.globalCompositeOperation='destination-in';
    overlayContext.drawImage(maskNode,0,0);
    const result=canvas(), resultContext=result.getContext('2d');
    resultContext.drawImage(master,0,0);
    resultContext.drawImage(overlay,0,0);
    const source=result.toDataURL('image/png');
    maskNode.width=overlay.width=result.width=1;
    return source;
  }

  let cached;
  function prepare() {
    if (cached) return cached;
    cached = Promise.all([load(assets.labels), load(assets.structure),
      load(assets.backdrop), load(assets.master)])
      .then(([labels, structure, backgroundStructure, master]) => {
      const count = width * height;
      const masks = Object.fromEntries(palette.map(([key]) => [key, new Uint8ClampedArray(count)]));
      const labelPixels = pixels(labels);
      const structurePixels = pixels(structure);
      const backdropPixels = pixels(backgroundStructure);
      const masterPixels = pixels(master);
      const tablesLeft = new Uint8ClampedArray(count);
      const tablesRight = new Uint8ClampedArray(count);
      const platform = new Uint8ClampedArray(count);
      const backdrop = region([[355, 181], [616, 181], [616, 88], [981, 88],
        [981, 176], [1260, 176], [1260, 508], [355, 508]]);
      for (let i = 0; i < count; i++) {
        const x = i % width;
        const y = Math.floor(i / width);
        const j = i * 4;
        const key = classify(labelPixels[j], labelPixels[j + 1], labelPixels[j + 2], x, y);
        if (key) masks[key][i] = clamp(Math.max(labelPixels[j],
          labelPixels[j + 1], labelPixels[j + 2]) * 1.25);
        if (y > 430 && y < 875) {
          const alpha = whiteAlpha(structurePixels[j], structurePixels[j + 1],
            structurePixels[j + 2]);
          if (x < 610) tablesLeft[i] = alpha;
          if (x > 930) tablesRight[i] = alpha;
        }
        if (x > 490 && x < 1100 && y > 475 && y < 570) {
          platform[i] = whiteAlpha(backdropPixels[j], backdropPixels[j + 1], backdropPixels[j + 2]);
        }
        // Platform pixels are owned by their later stage, not by the backdrop.
        backdrop[i] = Math.min(backdrop[i], 255 - platform[i]);
      }
      const result = {};
      const counts = {};
      Object.entries(masks).forEach(([key, alpha]) => {
        counts[key] = alpha.reduce((sum, value) => sum + Number(value > 100), 0);
        result[key] = maskUrl(alpha, .75);
      });
      if (Object.values(counts).some(count => count < 20)) {
        throw new Error('Incomplete semantic scene masks');
      }
      // Protect platform-vase pixels from table, flower and final-row layers.
      const leftVase = region([[434, 445], [477, 445], [472, 482], [481, 507],
        [475, 521], [434, 521], [429, 507], [441, 480]]);
      const rightVase = region([[997, 448], [1045, 448], [1040, 481], [1051, 511],
        [1045, 525], [998, 525], [992, 511], [1005, 480]]);
      const platformVases = [leftVase, rightVase];
      result.decorFill = maskUrl(Uint8ClampedArray.from(leftVase,
        (value, i) => Math.max(value, rightVase[i])), 2);
      // Keep the table silhouette while cutting out platform-vase pixels.
      result.tablesLeft = maskUrl(
        removeMasks(tablesLeft, [platform, ...platformVases]), 1);
      result.tablesRight = maskUrl(
        removeMasks(tablesRight, [platform, ...platformVases]), 1);
      // At the completed table stage, restore both original furnished rows from the registered master photo.
      const finishLeft = removeMasks(
        region([[0, 385], [410, 385], [492, 456], [470, 570], [430, 700],
          [420, 875], [0, 920]]),
        [region([[165, 365], [338, 365], [338, 450], [165, 450]]), leftVase]);
      const finishRight = removeMasks(
        region([[1000, 390], [1260, 390], [1536, 405], [1536, 920],
          [1280, 885], [1190, 780], [1115, 650], [1015, 570]]),
        [rightVase]);
      result.finishLeft = maskUrl(finishLeft, 1.1);
      result.finishRight = maskUrl(finishRight, 1.1);
      const leftSide = region([[0, 0], [610, 0], [610, height], [0, height]]);
      const rightSide = region([[930, 0], [width, 0], [width, height], [930, height]]);
      // Keep details registered to their original master-photo coordinates.
      for (const key of ['linen', 'settings', 'flowers']) {
        // Orange candle and centerpiece accents are part of the tabletop setting.
        const detailMask = key === 'settings'
          ? Uint8ClampedArray.from(masks.settings, (value, i) => Math.max(value, masks.candles[i]))
          : masks[key];
        const registeredDetail = key === 'flowers'
          ? removeMasks(detailMask, platformVases)
          : detailMask;
        result[key + 'Left'] = maskUrl(intersectMasks(registeredDetail, leftSide), .75);
        result[key + 'Right'] = maskUrl(intersectMasks(registeredDetail, rightSide), .75);
      }
      result.backdrop = maskUrl(backdrop, 1.5);
      result.platform = maskUrl(platform, 1.2);
      const masterSource = composeCurtains(master, backgroundStructure, masterPixels, masks);
      return { masks: result, counts, masterSource };
    });
    return cached;
  }
  window.ShowGroupLayers = { assets, colors, classify, whiteAlpha, removeMasks, prepare };
})();
