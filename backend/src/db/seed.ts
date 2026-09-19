import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { closePool, pool, query } from '../config/database.js';
import { logger } from '../utils/logger.js';

interface CategoriaSeed {
  slug: string;
  nome: string;
  ordem: number;
}

interface ProdutoSeed {
  slug: string;
  sku: string;
  nome: string;
  marca: string;
  categoria: string;
  preco: number;
  precoAntigo?: number;
  stock: number;
  specs: string[];
  varianteLabel: string;
  varianteOpcoes: string[];
  imagens: string[];
  descricao: string;
  badge?: string;
  featured?: boolean;
  vendidos: number;
}

const CATEGORIAS: CategoriaSeed[] = [
  { slug: 'computadores', nome: 'Computadores', ordem: 1 },
  { slug: 'telemoveis', nome: 'Telemóveis', ordem: 2 },
  { slug: 'tablets', nome: 'Tablets', ordem: 3 },
  { slug: 'armazenamento', nome: 'Armazenamento', ordem: 4 },
  { slug: 'monitores', nome: 'Monitores', ordem: 5 },
  { slug: 'audio', nome: 'Áudio', ordem: 6 },
  { slug: 'fotografia', nome: 'Fotografia', ordem: 7 },
  { slug: 'perifericos', nome: 'Periféricos', ordem: 8 },
  { slug: 'rede', nome: 'Rede', ordem: 9 },
  { slug: 'energia', nome: 'Energia', ordem: 10 },
  { slug: 'iluminacao', nome: 'Iluminação', ordem: 11 },
  { slug: 'home', nome: 'Home', ordem: 12 },
];

const img = (...paths: string[]) => paths;

const PRODUTOS: ProdutoSeed[] = [
  // —— Computadores ——
  {
    slug: 'nb-pro-14',
    sku: 'VNT-NB14',
    nome: 'Portátil NB-Pro 14',
    marca: 'Apex',
    categoria: 'Computadores',
    preco: 1299,
    precoAntigo: 1449,
    stock: 14,
    specs: ['Ryzen 7', '16 GB RAM', '512 GB SSD', '14" OLED'],
    varianteLabel: 'RAM',
    varianteOpcoes: ['16 GB', '32 GB'],
    imagens: img('/assets/p-laptop-pro.jpg', '/assets/p-mon-4k.jpg', '/assets/p-ssd-nvme.jpg'),
    descricao:
      'Ultrabook de 14" com ecrã OLED, chassis em alumínio e autonomia para um dia completo de trabalho.',
    badge: 'Novo',
    featured: true,
    vendidos: 86,
  },
  {
    slug: 'nb-air-13',
    sku: 'VNT-NA13',
    nome: 'Portátil Air 13',
    marca: 'Apex',
    categoria: 'Computadores',
    preco: 899,
    stock: 22,
    specs: ['Intel Core Ultra 5', '16 GB', '512 GB SSD', '1,1 kg'],
    varianteLabel: 'Cor',
    varianteOpcoes: ['Prata', 'Grafite'],
    imagens: img('/assets/p-laptop-air.jpg', '/assets/p-mon-office.jpg'),
    descricao: 'Portátil leve para produtividade diária, com teclado retroiluminado e Wi-Fi 6E.',
    featured: true,
    vendidos: 154,
  },
  {
    slug: 'desk-tower-x',
    sku: 'VNT-DTX',
    nome: 'Desktop Tower X',
    marca: 'Forge',
    categoria: 'Computadores',
    preco: 1599,
    stock: 8,
    specs: ['Ryzen 9', '32 GB DDR5', 'RTX 4070', '1 TB NVMe'],
    varianteLabel: 'GPU',
    varianteOpcoes: ['RTX 4060', 'RTX 4070'],
    imagens: img('/assets/p-desktop.jpg', '/assets/p-ssd-nvme.jpg', '/assets/p-hdd-35.jpg'),
    descricao: 'Torre compacta para criação e gaming, com refrigeração a ar silenciosa e USB4.',
    badge: 'Performance',
    featured: true,
    vendidos: 41,
  },
  {
    slug: 'mini-pc-n1',
    sku: 'VNT-MPC1',
    nome: 'Mini PC N1',
    marca: 'Forge',
    categoria: 'Computadores',
    preco: 449,
    stock: 31,
    specs: ['N100', '16 GB', '512 GB SSD', 'Vesa'],
    varianteLabel: 'RAM',
    varianteOpcoes: ['8 GB', '16 GB'],
    imagens: img('/assets/p-mini-pc.jpg', '/assets/p-ssd-nvme.jpg'),
    descricao: 'Mini PC para escritório e HTPC, montagem VESA e consumo abaixo de 15 W em idle.',
    vendidos: 203,
  },
  {
    slug: 'nb-gamer-16',
    sku: 'VNT-NG16',
    nome: 'Portátil Gamer 16',
    marca: 'Forge',
    categoria: 'Computadores',
    preco: 1899,
    precoAntigo: 2099,
    stock: 6,
    specs: ['i7-14700HX', '16 GB', 'RTX 4060', '240 Hz'],
    varianteLabel: 'Armazenamento',
    varianteOpcoes: ['1 TB', '2 TB'],
    imagens: img('/assets/p-laptop-gamer.jpg', '/assets/p-keyboard.jpg', '/assets/p-mouse.jpg'),
    descricao: 'Portátil gaming 16" com ecrã 240 Hz e teclado com percurso curto para FPS.',
    badge: 'Promo',
    featured: true,
    vendidos: 67,
  },
  {
    slug: 'workstation-w7',
    sku: 'VNT-WS7',
    nome: 'Workstation W7',
    marca: 'Klar',
    categoria: 'Computadores',
    preco: 2499,
    stock: 4,
    specs: ['Threadripper', '64 GB ECC', '2× 2 TB NVMe', 'Quadro'],
    varianteLabel: 'RAM',
    varianteOpcoes: ['64 GB', '128 GB'],
    imagens: img('/assets/p-workstation.jpg', '/assets/p-mon-4k.jpg', '/assets/p-hdd-nas.jpg'),
    descricao: 'Estação de trabalho para edição 4K/8K e CAD, com ECC e armazenamento RAID software.',
    vendidos: 12,
  },

  // —— Telemóveis ——
  {
    slug: 'phone-v50',
    sku: 'VNT-PH50',
    nome: 'Vantia Phone V50',
    marca: 'Vantia',
    categoria: 'Telemóveis',
    preco: 799,
    precoAntigo: 899,
    stock: 28,
    specs: ['6,7" AMOLED 120 Hz', '256 GB', '50 MP', 'IP68'],
    varianteLabel: 'Armazenamento',
    varianteOpcoes: ['128 GB', '256 GB', '512 GB'],
    imagens: img('/assets/p-phone-flagship.jpg', '/assets/p-charger.jpg', '/assets/p-battery.jpg'),
    descricao: 'Flagship com ecrã LTPO, carga de 65 W e três anos de actualizações de segurança.',
    badge: 'Novo',
    featured: true,
    vendidos: 312,
  },
  {
    slug: 'phone-v30',
    sku: 'VNT-PH30',
    nome: 'Vantia Phone V30',
    marca: 'Vantia',
    categoria: 'Telemóveis',
    preco: 449,
    stock: 45,
    specs: ['6,5" OLED', '128 GB', '5G', 'NFC'],
    varianteLabel: 'Cor',
    varianteOpcoes: ['Preto', 'Verde', 'Branco'],
    imagens: img('/assets/p-phone-mid.jpg', '/assets/p-battery.jpg'),
    descricao: 'Gama média equilibrada para o dia a dia, com leitor de impressões sob o ecrã.',
    featured: true,
    vendidos: 421,
  },
  {
    slug: 'nova-fold',
    sku: 'VNT-NF1',
    nome: 'Nova Fold',
    marca: 'Nova',
    categoria: 'Telemóveis',
    preco: 1699,
    stock: 5,
    specs: ['Ecrã flexível 7,6"', '512 GB', 'S Pen', 'IPX8'],
    varianteLabel: 'Cor',
    varianteOpcoes: ['Grafite', 'Creme'],
    imagens: img('/assets/p-phone-fold.jpg', '/assets/p-tablet-pro.jpg'),
    descricao: 'Dobrável tipo livro com multitasking e caneta incluída no pack premium.',
    badge: 'Premium',
    featured: true,
    vendidos: 29,
  },
  {
    slug: 'nova-se',
    sku: 'VNT-NSE',
    nome: 'Nova SE',
    marca: 'Nova',
    categoria: 'Telemóveis',
    preco: 329,
    stock: 60,
    specs: ['6,1"', '8 GB / 128 GB', '90 Hz', 'Dual SIM'],
    varianteLabel: 'Capacidade',
    varianteOpcoes: ['128 GB', '256 GB'],
    imagens: img('/assets/p-phone-se.jpg', '/assets/p-charger.jpg'),
    descricao: 'Entrada acessível 5G com ecrã fluido e bateria de 5000 mAh.',
    vendidos: 508,
  },
  {
    slug: 'apex-edge',
    sku: 'VNT-AE1',
    nome: 'Apex Edge',
    marca: 'Apex',
    categoria: 'Telemóveis',
    preco: 999,
    stock: 11,
    specs: ['Snapdragon 8', '12 GB', 'Leica optics', 'Wireless 50 W'],
    varianteLabel: 'Cor',
    varianteOpcoes: ['Titânio', 'Preto'],
    imagens: img('/assets/p-phone-cam.jpg', '/assets/p-camera.jpg'),
    descricao: 'Telemóvel fotográfico com zoom óptico e processamento computacional avançado.',
    vendidos: 94,
  },
  {
    slug: 'phone-rugged',
    sku: 'VNT-PRG',
    nome: 'Phone Rugged R2',
    marca: 'Forge',
    categoria: 'Telemóveis',
    preco: 389,
    stock: 19,
    specs: ['IP69K', 'MIL-STD', 'Torch LED', '5560 mAh'],
    varianteLabel: 'Cor',
    varianteOpcoes: ['Laranja', 'Preto'],
    imagens: img('/assets/p-phone-rugged.jpg', '/assets/p-battery.jpg'),
    descricao: 'Telemóvel reforçado para obra e outdoor, com botão de emergência programável.',
    badge: 'Resistente',
    vendidos: 73,
  },

  // —— Tablets ——
  {
    slug: 'tab-pro-11',
    sku: 'VNT-TP11',
    nome: 'Tablet Pro 11',
    marca: 'Apex',
    categoria: 'Tablets',
    preco: 749,
    stock: 16,
    specs: ['11" LCD 120 Hz', '256 GB', 'Caneta', 'Teclado opcional'],
    varianteLabel: 'Wi-Fi / 5G',
    varianteOpcoes: ['Wi-Fi', '5G'],
    imagens: img('/assets/p-tablet-pro.jpg', '/assets/p-keyboard.jpg', '/assets/p-laptop-air.jpg'),
    descricao: 'Tablet de produtividade com suporte a caneta de baixa latência e desktop mode.',
    featured: true,
    vendidos: 118,
  },
  {
    slug: 'tab-lite-10',
    sku: 'VNT-TL10',
    nome: 'Tablet Lite 10',
    marca: 'Vantia',
    categoria: 'Tablets',
    preco: 249,
    stock: 40,
    specs: ['10,1"', '4 GB / 128 GB', 'Quad speakers', 'Kids mode'],
    varianteLabel: 'Cor',
    varianteOpcoes: ['Cinza', 'Azul'],
    imagens: img('/assets/p-tablet-lite.jpg', '/assets/p-headphones.jpg'),
    descricao: 'Tablet familiar para streaming e estudos, com perfil parental e capa opcional.',
    vendidos: 267,
  },
  {
    slug: 'tab-draw-13',
    sku: 'VNT-TD13',
    nome: 'Tablet Draw 13',
    marca: 'Klar',
    categoria: 'Tablets',
    preco: 1099,
    stock: 7,
    specs: ['13" Paper-like', '4096 níveis', 'USB-C DP', '16 GB'],
    varianteLabel: 'Caneta',
    varianteOpcoes: ['Standard', 'Pro'],
    imagens: img('/assets/p-tablet-draw.jpg', '/assets/p-lamp.jpg'),
    descricao: 'Tabela gráfica com textura mate para ilustração e anotação PDF em ecrã grande.',
    vendidos: 35,
  },

  // —— Armazenamento (HDD / SSD) ——
  {
    slug: 'ssd-nvme-1t',
    sku: 'VNT-SN1T',
    nome: 'SSD NVMe 1 TB',
    marca: 'Forge',
    categoria: 'Armazenamento',
    preco: 89,
    precoAntigo: 109,
    stock: 120,
    specs: ['PCIe 4.0', '7000 MB/s', 'DRAM cache', 'Heatsink'],
    varianteLabel: 'Capacidade',
    varianteOpcoes: ['500 GB', '1 TB', '2 TB'],
    imagens: img('/assets/p-ssd-nvme.jpg', '/assets/p-ssd-sata.jpg'),
    descricao: 'SSD M.2 Gen4 com dissipador incluído, ideal para upgrade de portátil e desktop.',
    badge: 'Best-seller',
    featured: true,
    vendidos: 890,
  },
  {
    slug: 'ssd-nvme-2t',
    sku: 'VNT-SN2T',
    nome: 'SSD NVMe 2 TB',
    marca: 'Forge',
    categoria: 'Armazenamento',
    preco: 159,
    stock: 74,
    specs: ['PCIe 4.0', '7400 MB/s', 'TBW 1200', 'PS5 ready'],
    varianteLabel: 'Capacidade',
    varianteOpcoes: ['2 TB', '4 TB'],
    imagens: img('/assets/p-ssd-nvme.jpg', '/assets/p-laptop-pro.jpg'),
    descricao: 'SSD de alta capacidade compatível com consolas e workstations.',
    featured: true,
    vendidos: 412,
  },
  {
    slug: 'hdd-4t',
    sku: 'VNT-H4T',
    nome: 'HDD 4 TB 7200 rpm',
    marca: 'Forge',
    categoria: 'Armazenamento',
    preco: 99,
    stock: 55,
    specs: ['3,5"', '7200 rpm', '256 MB cache', 'SATA III'],
    varianteLabel: 'Capacidade',
    varianteOpcoes: ['2 TB', '4 TB', '8 TB'],
    imagens: img('/assets/p-hdd-35.jpg', '/assets/p-hdd.jpg'),
    descricao: 'Disco rígido para arquivo e NAS doméstico, com firmware CMR.',
    featured: true,
    vendidos: 336,
  },
  {
    slug: 'hdd-8t-nas',
    sku: 'VNT-H8N',
    nome: 'HDD NAS 8 TB',
    marca: 'Nova',
    categoria: 'Armazenamento',
    preco: 189,
    stock: 27,
    specs: ['CMR', '5400 rpm', '256 MB', '3 anos garantia'],
    varianteLabel: 'Capacidade',
    varianteOpcoes: ['4 TB', '8 TB', '12 TB'],
    imagens: img('/assets/p-hdd-nas.jpg', '/assets/p-router.jpg'),
    descricao: 'Disco optimizado para RAID e funcionamento 24/7 em NAS.',
    badge: 'NAS',
    vendidos: 148,
  },
  {
    slug: 'ssd-ext-1t',
    sku: 'VNT-SX1',
    nome: 'SSD Externo 1 TB',
    marca: 'Vantia',
    categoria: 'Armazenamento',
    preco: 119,
    stock: 48,
    specs: ['USB-C 10 Gb/s', 'IP55', '1050 MB/s', 'Criptografia'],
    varianteLabel: 'Cor',
    varianteOpcoes: ['Preto', 'Prata'],
    imagens: img('/assets/p-ssd-ext.jpg', '/assets/p-battery.jpg'),
    descricao: 'SSD portátil com encriptação por hardware e cabo USB-C incluído.',
    vendidos: 275,
  },
  {
    slug: 'hdd-ext-5t',
    sku: 'VNT-HX5',
    nome: 'HDD Externo 5 TB',
    marca: 'Vantia',
    categoria: 'Armazenamento',
    preco: 129,
    stock: 33,
    specs: ['USB 3.2', '2,5"', 'Backup software', 'Slim'],
    varianteLabel: 'Capacidade',
    varianteOpcoes: ['2 TB', '5 TB'],
    imagens: img('/assets/p-hdd-ext.jpg', '/assets/p-charger.jpg'),
    descricao: 'Disco externo fino para backups de fotos e vídeos em viagem.',
    vendidos: 198,
  },
  {
    slug: 'ssd-sata-1t',
    sku: 'VNT-SS1',
    nome: 'SSD SATA 1 TB',
    marca: 'Forge',
    categoria: 'Armazenamento',
    preco: 69,
    stock: 90,
    specs: ['2,5"', '560 MB/s', 'TLC', 'Adaptador 2,5"'],
    varianteLabel: 'Capacidade',
    varianteOpcoes: ['500 GB', '1 TB', '2 TB'],
    imagens: img('/assets/p-ssd-sata.jpg', '/assets/p-hdd-35.jpg'),
    descricao: 'Upgrade clássico SATA para PCs mais antigos sem slot M.2.',
    vendidos: 640,
  },

  // —— Monitores ——
  {
    slug: 'mon-27-4k',
    sku: 'VNT-M27K',
    nome: 'Monitor 27" 4K',
    marca: 'Lumen Co',
    categoria: 'Monitores',
    preco: 449,
    stock: 18,
    specs: ['IPS 4K', '99% sRGB', 'USB-C 65 W', 'HDR400'],
    varianteLabel: 'Suporte',
    varianteOpcoes: ['Standard', 'Ergonómico'],
    imagens: img('/assets/p-mon-4k.jpg', '/assets/p-laptop-pro.jpg', '/assets/p-lamp.jpg'),
    descricao: 'Monitor de produtividade com hub USB-C e ajuste de altura.',
    featured: true,
    vendidos: 132,
  },
  {
    slug: 'mon-32-ultrawide',
    sku: 'VNT-M32U',
    nome: 'Monitor Ultrawide 34"',
    marca: 'Lumen Co',
    categoria: 'Monitores',
    preco: 599,
    stock: 9,
    specs: ['3440×1440', '144 Hz', '1 ms', 'FreeSync'],
    varianteLabel: 'Curvatura',
    varianteOpcoes: ['1500R', 'Plano'],
    imagens: img('/assets/p-mon-ultra.jpg', '/assets/p-keyboard.jpg'),
    descricao: 'Ultrawide para multitasking e gaming casual, com PIP/PBP.',
    badge: 'Curvo',
    vendidos: 77,
  },
  {
    slug: 'mon-24-office',
    sku: 'VNT-M24',
    nome: 'Monitor Office 24"',
    marca: 'Vantia',
    categoria: 'Monitores',
    preco: 149,
    stock: 52,
    specs: ['Full HD IPS', '75 Hz', 'VESA', 'Flicker-free'],
    varianteLabel: 'Entradas',
    varianteOpcoes: ['HDMI', 'HDMI + DP'],
    imagens: img('/assets/p-mon-office.jpg', '/assets/p-laptop-air.jpg'),
    descricao: 'Monitor de escritório com painel IPS e modos de conforto visual.',
    vendidos: 410,
  },

  // —— Áudio (originais + extras) ——
  {
    slug: 'orb-04',
    sku: 'VNT-ORB04',
    nome: 'Gravador ORB-04',
    marca: 'Órbita Labs',
    categoria: 'Áudio',
    preco: 129,
    precoAntigo: 149,
    stock: 42,
    specs: ['32-bit float', 'Entrada XLR', '20 h de bateria', 'USB-C'],
    varianteLabel: 'Acabamento',
    varianteOpcoes: ['Preto', 'Grafite', 'Titânio'],
    imagens: img('/assets/p-recorder.jpg', '/assets/hero-deck.jpg', '/assets/p-headphones.jpg'),
    descricao:
      'Gravador de campo em alumínio anodizado, com pré-amplificadores de baixo ruído e captação em 32-bit float.',
    badge: 'Novo',
    featured: true,
    vendidos: 142,
  },
  {
    slug: 'aur-900',
    sku: 'VNT-AUR900',
    nome: 'Auscultadores AUR-900',
    marca: 'Vantia',
    categoria: 'Áudio',
    preco: 259,
    precoAntigo: 299,
    stock: 18,
    specs: ['ANC adaptativo', '40 h', 'LDAC', 'Multipoint'],
    varianteLabel: 'Cor',
    varianteOpcoes: ['Preto', 'Grafite'],
    imagens: img('/assets/p-headphones.jpg', '/assets/p-recorder.jpg'),
    descricao: 'Auscultadores fechados com cancelamento adaptativo e almofadas substituíveis.',
    featured: true,
    vendidos: 178,
  },
  {
    slug: 'deck-07',
    sku: 'VNT-DK07',
    nome: 'Deck Modular VNTG-07',
    marca: 'Órbita Labs',
    categoria: 'Áudio',
    preco: 899,
    stock: 9,
    specs: ['DAC 32-bit', 'Latência 4 ms', 'AES/COAX/OPT', 'Firmware aberto'],
    varianteLabel: 'Configuração',
    varianteOpcoes: ['Base', 'Base + Módulo Phono'],
    imagens: img('/assets/hero-deck.jpg', '/assets/p-recorder.jpg'),
    descricao: 'Sistema de áudio modular com encaixe magnético e resposta ajustável por firmware.',
    badge: 'Série 07',
    featured: true,
    vendidos: 64,
  },
  {
    slug: 'buds-tws-3',
    sku: 'VNT-BT3',
    nome: 'Buds TWS 3',
    marca: 'Vantia',
    categoria: 'Áudio',
    preco: 99,
    stock: 70,
    specs: ['ANC', 'IP54', '36 h total', 'App EQ'],
    varianteLabel: 'Cor',
    varianteOpcoes: ['Preto', 'Branco', 'Lilás'],
    imagens: img('/assets/p-buds.jpg', '/assets/p-phone-mid.jpg'),
    descricao: 'Auricular true wireless com cancelamento activo e estojo USB-C.',
    vendidos: 520,
  },
  {
    slug: 'soundbar-s2',
    sku: 'VNT-SB2',
    nome: 'Soundbar S2',
    marca: 'Órbita Labs',
    categoria: 'Áudio',
    preco: 349,
    stock: 12,
    specs: ['3.1.2', 'Dolby Atmos', 'HDMI eARC', 'Sub sem fios'],
    varianteLabel: 'Acabamento',
    varianteOpcoes: ['Preto', 'Cinza'],
    imagens: img('/assets/p-soundbar.jpg', '/assets/p-headphones.jpg'),
    descricao: 'Barra de som com Atmos virtual e subwoofer sem fios para sala até 40 m².',
    vendidos: 58,
  },

  // —— Fotografia ——
  {
    slug: 'klr-x1',
    sku: 'VNT-KLRX1',
    nome: 'Câmara KLR-X1',
    marca: 'Klar',
    categoria: 'Fotografia',
    preco: 1349,
    stock: 5,
    specs: ['APS-C 26 MP', 'Vídeo 6K', 'IBIS 5 eixos', 'Dupla ranhura'],
    varianteLabel: 'Kit',
    varianteOpcoes: ['Só corpo', 'Com 18-55 mm'],
    imagens: img('/assets/p-camera.jpg', '/assets/p-lens.jpg'),
    descricao: 'Corpo mirrorless compacto com estabilização interna e vídeo 6K 10-bit.',
    featured: true,
    vendidos: 38,
  },
  {
    slug: 'action-cam-a4',
    sku: 'VNT-ACA4',
    nome: 'Action Cam A4',
    marca: 'Klar',
    categoria: 'Fotografia',
    preco: 279,
    stock: 25,
    specs: ['5.3K60', 'IP68', 'HyperSmooth', 'Ecrã frente'],
    varianteLabel: 'Pack',
    varianteOpcoes: ['Base', 'Adventure'],
    imagens: img('/assets/p-actioncam.jpg', '/assets/p-battery.jpg'),
    descricao: 'Câmara de acção com estabilização electrónica e montagens versáteis.',
    vendidos: 165,
  },
  {
    slug: 'lens-35-f18',
    sku: 'VNT-L35',
    nome: 'Objectiva 35 mm f/1.8',
    marca: 'Klar',
    categoria: 'Fotografia',
    preco: 429,
    stock: 14,
    specs: ['APS-C', 'AF STM', 'Filtro 52 mm', 'Peso 170 g'],
    varianteLabel: 'Encaixe',
    varianteOpcoes: ['X-mount', 'E-mount'],
    imagens: img('/assets/p-lens.jpg', '/assets/p-camera.jpg'),
    descricao: 'Prime luminosa para retrato e rua, com AF silencioso para vídeo.',
    vendidos: 52,
  },

  // —— Periféricos ——
  {
    slug: 'vnt-k65',
    sku: 'VNT-K65',
    nome: 'Teclado K65',
    marca: 'Vantia',
    categoria: 'Periféricos',
    preco: 189,
    stock: 24,
    specs: ['Hot-swap', 'Montagem gasket', '8 kHz polling', 'QMK'],
    varianteLabel: 'Switch',
    varianteOpcoes: ['Linear', 'Tátil', 'Clicky'],
    imagens: img('/assets/p-keyboard.jpg', '/assets/hero-deck.jpg'),
    descricao: 'Teclado mecânico 65% em alumínio fresado com switches hot-swap.',
    featured: true,
    vendidos: 127,
  },
  {
    slug: 'mouse-mx8',
    sku: 'VNT-MX8',
    nome: 'Rato MX-8',
    marca: 'Vantia',
    categoria: 'Periféricos',
    preco: 79,
    stock: 55,
    specs: ['26K DPI', 'Wireless 2.4 / BT', '70 h', 'Ergonómico'],
    varianteLabel: 'Cor',
    varianteOpcoes: ['Preto', 'Branco'],
    imagens: img('/assets/p-mouse.jpg', '/assets/p-keyboard.jpg'),
    descricao: 'Rato sem fios de precisão com sensor óptico de alto DPI e botões programáveis.',
    featured: true,
    vendidos: 244,
  },
  {
    slug: 'webcam-4k',
    sku: 'VNT-WC4',
    nome: 'Webcam 4K Pro',
    marca: 'Klar',
    categoria: 'Periféricos',
    preco: 149,
    stock: 30,
    specs: ['4K30', 'Auto-frame', 'Dual mic', 'Clip universal'],
    varianteLabel: 'Montagem',
    varianteOpcoes: ['Monitor', 'Tripé'],
    imagens: img('/assets/p-webcam.jpg', '/assets/p-mon-office.jpg'),
    descricao: 'Webcam para streaming e reuniões com enquadramento automático.',
    vendidos: 183,
  },
  {
    slug: 'hub-usb4',
    sku: 'VNT-HU4',
    nome: 'Hub USB4 8-em-1',
    marca: 'Carga',
    categoria: 'Periféricos',
    preco: 119,
    stock: 38,
    specs: ['HDMI 8K', '2× USB-C', 'SD/microSD', '100 W PD'],
    varianteLabel: 'Acabamento',
    varianteOpcoes: ['Alumínio', 'Preto'],
    imagens: img('/assets/p-hub.jpg', '/assets/p-ssd-ext.jpg'),
    descricao: 'Dock portátil USB4 para portáteis modernos com passagem de carga.',
    vendidos: 201,
  },

  // —— Rede ——
  {
    slug: 'router-wifi7',
    sku: 'VNT-RW7',
    nome: 'Router Wi-Fi 7',
    marca: 'Nova',
    categoria: 'Rede',
    preco: 329,
    stock: 15,
    specs: ['BE9300', '2,5 GbE', 'Mesh ready', 'VPN'],
    varianteLabel: 'Pack',
    varianteOpcoes: ['1 unidade', 'Pack 2 (mesh)'],
    imagens: img('/assets/p-router.jpg', '/assets/p-mesh.jpg'),
    descricao: 'Router Wi-Fi 7 com Multi-Link Operation e portas 2,5 GbE.',
    featured: true,
    vendidos: 91,
  },
  {
    slug: 'mesh-trio',
    sku: 'VNT-MT3',
    nome: 'Sistema Mesh Trio',
    marca: 'Nova',
    categoria: 'Rede',
    preco: 279,
    stock: 20,
    specs: ['Wi-Fi 6', 'Cobertura 500 m²', 'App', 'Parental'],
    varianteLabel: 'Nós',
    varianteOpcoes: ['2 nós', '3 nós'],
    imagens: img('/assets/p-mesh.jpg', '/assets/p-router.jpg'),
    descricao: 'Mesh doméstico com roaming transparente e QoS por aplicação.',
    vendidos: 144,
  },
  {
    slug: 'switch-2g5',
    sku: 'VNT-SW5',
    nome: 'Switch 2.5G 5 portas',
    marca: 'Forge',
    categoria: 'Rede',
    preco: 89,
    stock: 26,
    specs: ['5× 2.5 GbE', 'Fanless', 'Metal', 'Plug & play'],
    varianteLabel: 'Fonte',
    varianteOpcoes: ['Externa', 'PoE in'],
    imagens: img('/assets/p-switch.jpg', '/assets/p-hdd-nas.jpg'),
    descricao: 'Switch multi-gigabit silencioso para NAS e workstations.',
    vendidos: 66,
  },

  // —— Energia ——
  {
    slug: 'mag-15',
    sku: 'VNT-MAG15',
    nome: 'Base MAG-15',
    marca: 'Carga',
    categoria: 'Energia',
    preco: 49,
    stock: 3,
    specs: ['15 W Qi2', 'Encaixe magnético', 'Cerâmica', 'Cabo 1,5 m'],
    varianteLabel: 'Cor',
    varianteOpcoes: ['Grafite', 'Areia'],
    imagens: img('/assets/p-charger.jpg', '/assets/p-phone-flagship.jpg'),
    descricao: 'Base de carregamento sem fios Qi2 com dissipação passiva em cerâmica.',
    badge: 'Últimas unidades',
    featured: true,
    vendidos: 211,
  },
  {
    slug: 'pwr-10',
    sku: 'VNT-PWR10',
    nome: 'Bateria PWR-10',
    marca: 'Carga',
    categoria: 'Energia',
    preco: 59,
    stock: 61,
    specs: ['10 000 mAh', '65 W PD', 'Ecrã OLED', '2× USB-C'],
    varianteLabel: 'Capacidade',
    varianteOpcoes: ['10 000 mAh', '20 000 mAh'],
    imagens: img('/assets/p-battery.jpg', '/assets/p-charger.jpg'),
    descricao: 'Power bank de carga rápida com passagem de carga para portátil.',
    vendidos: 304,
  },
  {
    slug: 'gan-100',
    sku: 'VNT-G100',
    nome: 'Carregador GaN 100 W',
    marca: 'Carga',
    categoria: 'Energia',
    preco: 69,
    stock: 44,
    specs: ['100 W', '2× USB-C + USB-A', 'PPS', 'Compacto'],
    varianteLabel: 'Cor',
    varianteOpcoes: ['Branco', 'Preto'],
    imagens: img('/assets/p-gan.jpg', '/assets/p-laptop-air.jpg'),
    descricao: 'Carregador de viagem GaN para portátil e telemóvel em simultâneo.',
    featured: true,
    vendidos: 388,
  },
  {
    slug: 'ups-600',
    sku: 'VNT-U600',
    nome: 'UPS 600 VA',
    marca: 'Forge',
    categoria: 'Energia',
    preco: 89,
    stock: 17,
    specs: ['600 VA / 360 W', 'AVR', 'USB monitor', '4 tomadas'],
    varianteLabel: 'Autonomia',
    varianteOpcoes: ['Standard', 'Extended'],
    imagens: img('/assets/p-ups.jpg', '/assets/p-router.jpg'),
    descricao: 'UPS de secretária para PC e router, com software de encerramento seguro.',
    vendidos: 102,
  },

  // —— Iluminação / Home ——
  {
    slug: 'lum-2',
    sku: 'VNT-LUM2',
    nome: 'Luminária LUM-2',
    marca: 'Lumen Co',
    categoria: 'Iluminação',
    preco: 84,
    stock: 7,
    specs: ['2700–6500 K', 'CRI 96', 'Controlo tátil', 'Braço articulado'],
    varianteLabel: 'Cor',
    varianteOpcoes: ['Antracite', 'Alumínio'],
    imagens: img('/assets/p-lamp.jpg', '/assets/hero-deck.jpg'),
    descricao: 'Luz de mesa com temperatura ajustável e difusor contínuo sem cintilação.',
    featured: true,
    vendidos: 96,
  },
  {
    slug: 'strip-rgb-5m',
    sku: 'VNT-SR5',
    nome: 'Fita LED RGB 5 m',
    marca: 'Lumen Co',
    categoria: 'Iluminação',
    preco: 39,
    stock: 80,
    specs: ['Matter / Zigbee', '16 M cores', 'IP20', 'App'],
    varianteLabel: 'Comprimento',
    varianteOpcoes: ['2 m', '5 m'],
    imagens: img('/assets/p-led-strip.jpg', '/assets/p-mon-4k.jpg'),
    descricao: 'Fita inteligente para ambientação de secretária e TV.',
    vendidos: 455,
  },
  {
    slug: 'smart-plug-4',
    sku: 'VNT-SP4',
    nome: 'Smart Plug Pack 4',
    marca: 'Nova',
    categoria: 'Home',
    preco: 49,
    stock: 65,
    specs: ['Wi-Fi', 'Medição energia', 'Schedules', '16 A'],
    varianteLabel: 'Pack',
    varianteOpcoes: ['2 un.', '4 un.'],
    imagens: img('/assets/p-smartplug.jpg', '/assets/p-router.jpg'),
    descricao: 'Tomadas inteligentes com medição de consumo e integração Matter.',
    vendidos: 290,
  },
  {
    slug: 'cam-doorbell',
    sku: 'VNT-CDB',
    nome: 'Campainha com Câmara',
    marca: 'Nova',
    categoria: 'Home',
    preco: 159,
    stock: 21,
    specs: ['2K HDR', 'Visão nocturna', 'Chime', 'Local storage'],
    varianteLabel: 'Alimentação',
    varianteOpcoes: ['Bateria', 'Com fios'],
    imagens: img('/assets/p-doorbell.jpg', '/assets/p-phone-mid.jpg'),
    descricao: 'Campainha com vídeo 2K, detecção de pessoa e armazenamento local.',
    vendidos: 87,
  },
];

export const seed = async (): Promise<void> => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('O seed de demonstração não corre em produção.');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const catIds = new Map<string, string>();
    for (const cat of CATEGORIAS) {
      const { rows } = await client.query<{ id: string }>(
        `INSERT INTO categorias (slug, nome, ordem)
         VALUES ($1, $2, $3)
         ON CONFLICT (slug) DO UPDATE SET nome = EXCLUDED.nome, ordem = EXCLUDED.ordem
         RETURNING id`,
        [cat.slug, cat.nome, cat.ordem],
      );
      const id = rows[0]?.id;
      if (id === undefined) throw new Error(`categoria ${cat.slug} sem id`);
      catIds.set(cat.nome, id);
    }

    for (const p of [] as typeof PRODUTOS) {
      const categoriaId = catIds.get(p.categoria);
      if (categoriaId === undefined) throw new Error(`categoria em falta: ${p.categoria}`);

      const { rows } = await client.query<{ id: string }>(
        `INSERT INTO produtos (
           slug, sku, nome, marca, categoria_id,
           preco_centimos, preco_antigo_centimos, descricao, badge, featured, vendidos,
           variante_label, variante_opcoes, specs, imagens, activo, updated_at
         ) VALUES (
           $1,$2,$3,$4,$5,
           $6,$7,$8,$9,$10,$11,
           $12,$13::jsonb,$14::jsonb,$15::jsonb, true, now()
         )
         ON CONFLICT (slug) DO UPDATE SET
           sku = EXCLUDED.sku,
           nome = EXCLUDED.nome,
           marca = EXCLUDED.marca,
           categoria_id = EXCLUDED.categoria_id,
           preco_centimos = EXCLUDED.preco_centimos,
           preco_antigo_centimos = EXCLUDED.preco_antigo_centimos,
           descricao = EXCLUDED.descricao,
           badge = EXCLUDED.badge,
           featured = EXCLUDED.featured,
           vendidos = EXCLUDED.vendidos,
           variante_label = EXCLUDED.variante_label,
           variante_opcoes = EXCLUDED.variante_opcoes,
           specs = EXCLUDED.specs,
           imagens = EXCLUDED.imagens,
           activo = true,
           updated_at = now()
         RETURNING id`,
        [
          p.slug,
          p.sku,
          p.nome,
          p.marca,
          categoriaId,
          Math.round(p.preco * 100),
          p.precoAntigo !== undefined ? Math.round(p.precoAntigo * 100) : null,
          p.descricao,
          p.badge ?? null,
          p.featured ?? false,
          p.vendidos,
          p.varianteLabel,
          JSON.stringify(p.varianteOpcoes),
          JSON.stringify(p.specs),
          JSON.stringify(p.imagens),
        ],
      );
      const produtoId = rows[0]?.id;
      if (produtoId === undefined) throw new Error(`produto ${p.slug} sem id`);

      await client.query(
        `INSERT INTO stock (produto_id, quantidade) VALUES ($1, $2)
         ON CONFLICT (produto_id) DO UPDATE SET quantidade = EXCLUDED.quantidade, actualizado_em = now()`,
        [produtoId, p.stock],
      );
    }

    const adminHash = await bcrypt.hash('AdminDemo!2026', 12);
    const clienteHash = await bcrypt.hash('ClienteDemo!2026', 12);

    await client.query(
      `INSERT INTO utilizadores (email, password_hash, nome, perfil, telefone, cidade)
       VALUES
         ('admin@vantagem.pt', $1, 'Admin Vantagem', 'admin', '+244923000001', 'Luanda'),
         ('cliente@vantagem.pt', $2, 'Cliente Demo', 'cliente', '+244923000002', 'Luanda')
       ON CONFLICT (email) DO NOTHING`,
      [adminHash, clienteHash],
    );

    await client.query(
      `UPDATE utilizadores SET telefone = '+244923000001', cidade = 'Luanda' WHERE email = 'admin@vantagem.pt'`,
    );
    await client.query(
      `UPDATE utilizadores SET telefone = '+244923000002', cidade = 'Luanda' WHERE email = 'cliente@vantagem.pt'`,
    );

    await client.query('COMMIT');
    logger.info('seed applied', {
      categorias: CATEGORIAS.length,
      produtos: 0,
      marcas: 0,
    });
  } catch (erro) {
    await client.query('ROLLBACK');
    throw erro;
  } finally {
    client.release();
  }
};

const direct =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (direct) {
  try {
    await seed();
  } catch (erro) {
    logger.error('seed failed', { message: erro instanceof Error ? erro.message : String(erro) });
    process.exitCode = 1;
  } finally {
    await closePool();
  }
}
