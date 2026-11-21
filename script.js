/* Curated gallery, filtering, accessible image viewer and mobile navigation. */
'use strict';

// Asset paths stay relative so the same files work on the existing host.
const photos = [
  ['12.jpeg', 'spaces', 'احتفال بين الخضرة والورد'],
  ['8.jpeg', 'stages', 'ورديّ بتفاصيل ذهبية'],
  ['14.jpeg', 'details', 'تفاصيل الطاولة والورد'],
  ['WhatsApp Image 2026-11-18 at 11.49.20 AM.jpeg', 'stages', 'الضوء والورد في مشهد واحد'],
  ['WhatsApp Image 2026-11-18 at 11.49.21 AM.jpeg', 'details', 'الشموع والورد الوردي'],
  ['WhatsApp Image 2026-11-18 at 11.49.17 AM.jpeg', 'spaces', 'جلسات في الهواء الطلق'],
  ['24.jpeg', 'spaces', 'ألوان تحت ضوء النهار'],
  ['33.jpeg', 'stages', 'مدخل بطابع خاص'],
  ['16.jpeg', 'details', 'تفاصيل بلون الشمس'],
  ['WhatsApp Image 2026-11-18 at 11.49.22 AM (1).jpeg', 'spaces', 'تناسق المساحة والتفاصيل'],
  ['WhatsApp Image 2026-11-18 at 11.49.22 AM.jpeg', 'details', 'ورد على ضوء الشموع'],
  ['WhatsApp Image 2026-11-18 at 11.49.19 AM (2).jpeg', 'stages', 'أركان تحكي المناسبة'],
  ['1.jpeg', 'stages', 'استقبال بألوان الورد'],
  ['2.jpeg', 'spaces', 'تنسيق حول المسبح'],
  ['11.jpeg', 'details', 'طاولة بين الأشجار'],
  ['13.jpeg', 'stages', 'كوشة بتفاصيل كلاسيكية'],
  ['18.jpeg', 'stages', 'ركن استقبال أخضر'],
  ['19.jpeg', 'spaces', 'أجواء المساء'],
  ['20.jpeg', 'details', 'الورد على الطاولة'],
  ['21.jpeg', 'stages', 'تنسيق هادئ للمشهد الرئيسي'],
  ['22.jpeg', 'stages', 'ركن بتدرّجات خضراء'],
  ['23.jpeg', 'spaces', 'جلسة مضيئة'],
  ['25.jpeg', 'stages', 'خلفية بألوان مرحة'],
  ['26.jpeg', 'stages', 'تفاصيل المدخل'],
  ['27.jpeg', 'details', 'لمسات تراثية'],
  ['28.jpeg', 'details', 'تنسيق طاولات المساء'],
  ['29.jpeg', 'details', 'تجهيزات الضيافة'],
  ['30.jpeg', 'stages', 'ورد وألوان'],
  ['31.jpeg', 'spaces', 'تفاصيل استقبال الضيوف'],
  ['32.jpeg', 'spaces', 'مشهد احتفال داخلي'],
  ['3.jpeg', 'stages', 'الورد في مقدّمة المشهد'],
  ['4.jpeg', 'details', 'ركن من شو قروب'],
  ['5.jpeg', 'details', 'تقديم بتفاصيل خاصة'],
  ['6.jpeg', 'spaces', 'أجواء حديقة'],
  ['7.jpeg', 'spaces', 'ألوان وتنسيق'],
  ['9.jpeg', 'details', 'تفاصيل الورد'],
  ['10.jpeg', 'stages', 'خلفية كلاسيكية'],
];
const gallery = document.getElementById('gallery');
const more = document.getElementById('show-more');
const dialog = document.getElementById('lightbox');
const viewer = document.getElementById('lightbox-photo');
let activeFilter = 'all';
let visibleCount = 6;
let activePhoto = 0;
let lastTrigger = null;

function selectedPhotos() {
  return photos.filter(photo => activeFilter === 'all' || photo[1] === activeFilter);
}

// Build gallery content from the curated list without HTML string injection.
function renderGallery() {
  const selected = selectedPhotos();
  gallery.replaceChildren();
  selected.slice(0, visibleCount).forEach((photo, index) => {
    const article = document.createElement('article');
    article.className = 'work';
    const figure = document.createElement('figure');
    const button = document.createElement('button');
    button.setAttribute('aria-label', 'تكبير الصورة: ' + photo[2]);
    const img = document.createElement('img');
    img.src = 'images/' + photo[0];
    img.alt = photo[2];
    img.loading = 'lazy';
    img.decoding = 'async';
    const zoom = document.createElement('span');
    zoom.className = 'zoom';
    zoom.textContent = '＋';
    zoom.setAttribute('aria-hidden', 'true');
    button.append(img, zoom);
    button.addEventListener('click', () => openPhoto(index, button));
    const caption = document.createElement('figcaption');
    const title = document.createElement('span');
    title.textContent = photo[2];
    const number = document.createElement('small');
    number.textContent = String(index + 1).padStart(2, '0');
    caption.append(title, number);
    figure.append(button, caption);
    article.append(figure);
    gallery.append(article);
  });
  more.hidden = selected.length <= visibleCount;
  document.getElementById('gallery-status').textContent =
    'عرض ' + Math.min(visibleCount, selected.length) + ' من ' + selected.length + ' صورة';
  document.dispatchEvent(new Event('showgroup:gallery-updated'));
}

function updateViewer() {
  const selected = selectedPhotos();
  const photo = selected[activePhoto];
  viewer.src = 'images/' + photo[0];
  viewer.alt = photo[2];
  document.getElementById('lightbox-caption').textContent =
    photo[2] + ' — ' + (activePhoto + 1) + ' / ' + selected.length;
}

function openPhoto(index, trigger) {
  activePhoto = index;
  lastTrigger = trigger;
  updateViewer();
  dialog.showModal();
  document.body.classList.add('modal-open');
}

function stepPhoto(direction) {
  activePhoto = (activePhoto + direction + selectedPhotos().length) % selectedPhotos().length;
  updateViewer();
}

document.querySelectorAll('[data-filter]').forEach(button => {
  button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    visibleCount = 6;
    document.querySelectorAll('[data-filter]').forEach(item => {
      item.setAttribute('aria-pressed', String(item === button));
    });
    renderGallery();
  });
});
more.addEventListener('click', () => {
  const firstNewIndex = Math.min(visibleCount, selectedPhotos().length - 1);
  visibleCount += 6;
  renderGallery();
  gallery.children[firstNewIndex]?.querySelector('button').focus({ preventScroll: true });
});
document.getElementById('close-lightbox').addEventListener('click', () => dialog.close());
document.getElementById('previous-photo').addEventListener('click', () => stepPhoto(-1));
document.getElementById('next-photo').addEventListener('click', () => stepPhoto(1));
dialog.addEventListener('close', () => {
  document.body.classList.remove('modal-open');
  lastTrigger?.focus({ preventScroll: true });
});
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const box = dialog.getBoundingClientRect();
  if (event.clientX < box.left || event.clientX > box.right ||
      event.clientY < box.top || event.clientY > box.bottom) dialog.close();
});
dialog.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    stepPhoto(event.key === 'ArrowLeft' ? 1 : -1);
  }
});

// Keep mobile menu state aligned with its accessible expanded state.
const menu = document.querySelector('.menu-toggle');
const navigation = document.getElementById('navigation');
function closeMenu() {
  navigation.classList.remove('open');
  menu.setAttribute('aria-expanded', 'false');
}
menu.addEventListener('click', () => {
  const open = navigation.classList.toggle('open');
  menu.setAttribute('aria-expanded', String(open));
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && navigation.classList.contains('open')) {
    closeMenu();
    menu.focus();
  }
});
document.getElementById('year').textContent = new Date().getFullYear();
renderGallery();
