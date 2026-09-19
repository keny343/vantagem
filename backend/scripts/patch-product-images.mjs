import fs from 'node:fs';

const path = new URL('../src/db/seed.ts', import.meta.url);
let src = fs.readFileSync(path, 'utf8');

const map = {
  'nb-pro-14': ['/assets/p-laptop-pro.jpg', '/assets/p-mon-4k.jpg', '/assets/p-ssd-nvme.jpg'],
  'nb-air-13': ['/assets/p-laptop-air.jpg', '/assets/p-mon-office.jpg'],
  'desk-tower-x': ['/assets/p-desktop.jpg', '/assets/p-ssd-nvme.jpg', '/assets/p-hdd-35.jpg'],
  'mini-pc-n1': ['/assets/p-mini-pc.jpg', '/assets/p-ssd-nvme.jpg'],
  'nb-gamer-16': ['/assets/p-laptop-gamer.jpg', '/assets/p-keyboard.jpg', '/assets/p-mouse.jpg'],
  'workstation-w7': ['/assets/p-workstation.jpg', '/assets/p-mon-4k.jpg', '/assets/p-hdd-nas.jpg'],
  'phone-v50': ['/assets/p-phone-flagship.jpg', '/assets/p-charger.jpg', '/assets/p-battery.jpg'],
  'phone-v30': ['/assets/p-phone-mid.jpg', '/assets/p-battery.jpg'],
  'nova-fold': ['/assets/p-phone-fold.jpg', '/assets/p-tablet-pro.jpg'],
  'nova-se': ['/assets/p-phone-se.jpg', '/assets/p-charger.jpg'],
  'apex-edge': ['/assets/p-phone-cam.jpg', '/assets/p-camera.jpg'],
  'phone-rugged': ['/assets/p-phone-rugged.jpg', '/assets/p-battery.jpg'],
  'tab-pro-11': ['/assets/p-tablet-pro.jpg', '/assets/p-keyboard.jpg', '/assets/p-laptop-air.jpg'],
  'tab-lite-10': ['/assets/p-tablet-lite.jpg', '/assets/p-headphones.jpg'],
  'tab-draw-13': ['/assets/p-tablet-draw.jpg', '/assets/p-lamp.jpg'],
  'ssd-nvme-1t': ['/assets/p-ssd-nvme.jpg', '/assets/p-ssd-sata.jpg'],
  'ssd-nvme-2t': ['/assets/p-ssd-nvme.jpg', '/assets/p-laptop-pro.jpg'],
  'hdd-4t': ['/assets/p-hdd-35.jpg', '/assets/p-hdd.jpg'],
  'hdd-8t-nas': ['/assets/p-hdd-nas.jpg', '/assets/p-router.jpg'],
  'ssd-ext-1t': ['/assets/p-ssd-ext.jpg', '/assets/p-battery.jpg'],
  'hdd-ext-5t': ['/assets/p-hdd-ext.jpg', '/assets/p-charger.jpg'],
  'ssd-sata-1t': ['/assets/p-ssd-sata.jpg', '/assets/p-hdd-35.jpg'],
  'mon-27-4k': ['/assets/p-mon-4k.jpg', '/assets/p-laptop-pro.jpg', '/assets/p-lamp.jpg'],
  'mon-32-ultrawide': ['/assets/p-mon-ultra.jpg', '/assets/p-keyboard.jpg'],
  'mon-24-office': ['/assets/p-mon-office.jpg', '/assets/p-laptop-air.jpg'],
  'orb-04': ['/assets/p-recorder.jpg', '/assets/hero-deck.jpg', '/assets/p-headphones.jpg'],
  'aur-900': ['/assets/p-headphones.jpg', '/assets/p-recorder.jpg'],
  'deck-07': ['/assets/hero-deck.jpg', '/assets/p-recorder.jpg'],
  'buds-tws-3': ['/assets/p-buds.jpg', '/assets/p-phone-mid.jpg'],
  'soundbar-s2': ['/assets/p-soundbar.jpg', '/assets/p-headphones.jpg'],
  'klr-x1': ['/assets/p-camera.jpg', '/assets/p-lens.jpg'],
  'action-cam-a4': ['/assets/p-actioncam.jpg', '/assets/p-battery.jpg'],
  'lens-35-f18': ['/assets/p-lens.jpg', '/assets/p-camera.jpg'],
  'vnt-k65': ['/assets/p-keyboard.jpg', '/assets/hero-deck.jpg'],
  'mouse-mx8': ['/assets/p-mouse.jpg', '/assets/p-keyboard.jpg'],
  'webcam-4k': ['/assets/p-webcam.jpg', '/assets/p-mon-office.jpg'],
  'hub-usb4': ['/assets/p-hub.jpg', '/assets/p-ssd-ext.jpg'],
  'router-wifi7': ['/assets/p-router.jpg', '/assets/p-mesh.jpg'],
  'mesh-trio': ['/assets/p-mesh.jpg', '/assets/p-router.jpg'],
  'switch-2g5': ['/assets/p-switch.jpg', '/assets/p-hdd-nas.jpg'],
  'mag-15': ['/assets/p-charger.jpg', '/assets/p-phone-flagship.jpg'],
  'pwr-10': ['/assets/p-battery.jpg', '/assets/p-charger.jpg'],
  'gan-100': ['/assets/p-gan.jpg', '/assets/p-laptop-air.jpg'],
  'ups-600': ['/assets/p-ups.jpg', '/assets/p-router.jpg'],
  'lum-2': ['/assets/p-lamp.jpg', '/assets/hero-deck.jpg'],
  'strip-rgb-5m': ['/assets/p-led-strip.jpg', '/assets/p-mon-4k.jpg'],
  'smart-plug-4': ['/assets/p-smartplug.jpg', '/assets/p-router.jpg'],
  'cam-doorbell': ['/assets/p-doorbell.jpg', '/assets/p-phone-mid.jpg'],
};

let updated = 0;
const missing = [];

for (const [slug, imgs] of Object.entries(map)) {
  const re = new RegExp(`(slug: '${slug}',[\\s\\S]*?imagens: )img\\([^)]*\\)`, 'm');
  const next = src.replace(re, (_, pre) => {
    updated += 1;
    return `${pre}img(${imgs.map((i) => `'${i}'`).join(', ')})`;
  });
  if (next === src) missing.push(slug);
  src = next;
}

fs.writeFileSync(path, src);
console.log(JSON.stringify({ updated, total: Object.keys(map).length, missing }, null, 2));
