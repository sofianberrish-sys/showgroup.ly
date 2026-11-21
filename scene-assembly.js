/* Fixed registered layers: opacity changes, object positions and source pixels do not. */
(() => {
  'use strict';
  const stages = [
    ['backdrop', .035, .075, 'خلفية الديكور'], ['platform', .085, .12, 'المنصّة'],
    ['sofa', .13, .165, 'كرسي المنصّة'], ['decor', .175, .215, 'إضافات الخلفية'],
    ['tables', .225, .29, 'الطاولات · قاعدة بكس منحنية'],
    ['chairs', .31, .41, 'الكراسي · ظهور متتابع ثابت المواضع'],
    ['linen', .43, .47, 'تفاصيل الطاولات · الخلف'],
    ['settings', .49, .53, 'تفاصيل الطاولات · الوسط'],
    ['flowers', .55, .59, 'تفاصيل الطاولات · المقدمة'],
  ];
  function fade(progress, start, end) {
    const t = Math.max(0, Math.min(1, (progress - start) / (end - start)));
    return t * t * (3 - 2 * t);
  }
  function create(world, notify) {
    const tools = window.ShowGroupLayers;
    const layers = [];
    let ready = false, lastProgress = 0, lastStatic = false;
    let referenceSource = tools.assets.master;
    // Furnished pixels must never be part of the initial venue background.
    const background = make('background', tools.assets.empty, 0, 0);
    background.image.hidden = false;
    background.image.style.visibility = 'visible';
    background.image.style.opacity = '1';
    const definitions = [
      ['backdrop', tools.assets.backdrop], ['platform', tools.assets.backdrop],
      ['tablesLeft', tools.assets.structure], ['tablesRight', tools.assets.structure],
      ['sofa', tools.assets.master],
      ['decorFill', tools.assets.recovery], ['decor', tools.assets.master], ['linenLeft', tools.assets.master], ['linenRight', tools.assets.master],
      ['chairs', tools.assets.master],
      ['settingsLeft', tools.assets.master], ['settingsRight', tools.assets.master],
      ['flowersLeft', tools.assets.master], ['flowersRight', tools.assets.master],
      ['finishLeft', tools.assets.master], ['finishRight', tools.assets.master],
    ];
    definitions.forEach(([key, source]) => {
      const baseKey = key.replace(/(Left|Right)$/, '');
      const stageKey = baseKey.startsWith('tables') ? 'tables' :
        baseKey === 'decorFill' ? 'decor' : baseKey;
      const stage = stages.find(item => item[0] === stageKey);
      const start = baseKey === 'finish' ? .75 : stage[1];
      const end = baseKey === 'finish' ? .795 : stage[2];
      layers.push(make(key, source, start, end));
    });
    const jarSupport = document.createElement('div');
    jarSupport.className = 'cinema-jar-support';
    jarSupport.dataset.layer = 'garden-jar-support';
    jarSupport.style.zIndex = '2';
    jarSupport.style.opacity = '0';
    jarSupport.style.visibility = 'hidden';
    jarSupport.hidden = true;
    jarSupport.setAttribute('aria-hidden', 'true');
    ['top', 'apron', 'back-left', 'back-right', 'front-left', 'front-right', 'shadow']
      .forEach(part => {
      const piece = document.createElement('span');
      piece.className = 'cinema-jar-support-' + part;
      jarSupport.append(piece);
    });
    world.append(jarSupport);
    const tableVase = document.createElement('img');
    tableVase.className = 'cinema-table-vase';
    tableVase.dataset.layer = 'garden-table-vase';
    tableVase.src = tools.assets.tableVase;
    tableVase.alt = '';
    tableVase.decoding = 'async';
    tableVase.style.zIndex = '4';
    tableVase.style.opacity = '0';
    tableVase.style.visibility = 'hidden';
    tableVase.hidden = true;
    tableVase.setAttribute('aria-hidden', 'true');
    world.append(tableVase);
    function make(key, source, start, end) {
      const image = document.createElement('img');
      image.className = 'cinema-photo-layer';
      image.dataset.layer = key;
      const depth = { background: 0, backdrop: 1, platform: 2, sofa: 3,
        decorFill: 4, decor: 4, tablesLeft: 5, tablesRight: 5, chairs: 6,
        linenLeft: 7, linenRight: 7, settingsLeft: 7, settingsRight: 7,
        flowersLeft: 7, flowersRight: 7, finishLeft: 8, finishRight: 8 };
      image.style.zIndex = String(depth[key] ?? 6);
      image.alt = '';
      image.decoding = 'async';
      image.src = source;
      image.style.opacity = '0';
      image.style.visibility = 'hidden';
      image.hidden = true;
      image.setAttribute('aria-hidden', 'true');
      world.append(image);
      return { image, key, source, start, end };
    }
    function setMask(layer, url) {
      layer.image.style.maskImage = `url("${url}")`;
      layer.image.style.webkitMaskImage = `url("${url}")`;
    }
    tools.prepare().then(({ masks, counts, masterSource }) => {
      referenceSource = masterSource || tools.assets.master;
      layers.forEach(layer => {
        if (layer.source === tools.assets.master) layer.image.src = referenceSource;
      });
      layers.forEach(layer => setMask(layer, masks[layer.key]));
      world.dataset.maskCounts = JSON.stringify(counts);
      ready = true;
      world.dataset.layersReady = 'true';
      render(lastProgress, lastStatic);
      notify();
    }).catch(() => {
      // Keep the empty venue on failure; do not reveal future furniture states.
      world.dataset.layersReady = 'error';
      notify();
    });
    function render(progress, staticMode = false) {
      lastProgress = progress;
      lastStatic = staticMode;
      if (ready) {
        background.image.style.opacity = '1';
        layers.forEach(layer => {
          const amount = staticMode ? 1 : fade(progress, layer.start, layer.end);
          layer.image.hidden = amount === 0;
          layer.image.style.visibility = amount === 0 ? 'hidden' : 'visible';
          layer.image.style.opacity = String(amount);
          layer.image.style.willChange = amount > 0 && amount < 1 ? 'opacity' : 'auto';
        });
        const supportAmount = staticMode ? 1 : fade(progress, .175, .215);
        jarSupport.hidden = supportAmount === 0;
        jarSupport.style.visibility = supportAmount === 0 ? 'hidden' : 'visible';
        jarSupport.style.opacity = String(supportAmount);
        tableVase.hidden = supportAmount === 0;
        tableVase.style.visibility = supportAmount === 0 ? 'hidden' : 'visible';
        tableVase.style.opacity = String(supportAmount);
      }
      let label = 'المكان قبل التجهيز', step = 0;
      stages.forEach((stage, i) => {
        if (progress >= stage[1]) { label = stage[3]; step = i + 1; }
      });
      if (progress >= .61) { label = 'امتداد الممر من المنصّة'; step = 10; }
      if (progress >= .69) { label = 'المزهريات'; step = 11; }
      if (progress >= .75) { label = 'الورد داخل المزهريات'; step = 12; }
      return { label, step };
    }
    return { render, referenceSource: () => referenceSource };
  }
  window.ShowGroupAssembly = { create, stages };
})();
