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
  { slug: 'audio', nome: 'Áudio', ordem: 1 },
  { slug: 'fotografia', nome: 'Fotografia', ordem: 2 },
  { slug: 'iluminacao', nome: 'Iluminação', ordem: 3 },
  { slug: 'perifericos', nome: 'Periféricos', ordem: 4 },
  { slug: 'energia', nome: 'Energia', ordem: 5 },
  { slug: 'home', nome: 'Home', ordem: 6 },
];

const PRODUTOS: ProdutoSeed[] = [
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
    imagens: ['/assets/p-recorder.jpg', '/assets/hero-deck.jpg', '/assets/p-headphones.jpg'],
    descricao:
      'Gravador de campo em alumínio anodizado, com pré-amplificadores de baixo ruído e captação em 32-bit float. Pensado para trabalho de terreno exigente.',
    badge: 'Novo',
    featured: true,
    vendidos: 142,
  },
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
    imagens: ['/assets/p-lamp.jpg', '/assets/hero-deck.jpg'],
    descricao:
      'Luz de mesa de perfil fino com temperatura ajustável e difusor contínuo. Sem cintilação, ideal para leitura e bancada de trabalho.',
    featured: true,
    vendidos: 96,
  },
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
    imagens: ['/assets/p-charger.jpg', '/assets/p-battery.jpg'],
    descricao:
      'Base de carregamento sem fios de perfil baixo, com alinhamento magnético e dissipação passiva em cerâmica.',
    badge: 'Últimas unidades',
    featured: true,
    vendidos: 211,
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
    imagens: ['/assets/p-headphones.jpg', '/assets/p-recorder.jpg'],
    descricao:
      'Auscultadores fechados de estúdio com cancelamento adaptativo e resposta calibrada por firmware. Almofadas substituíveis.',
    featured: true,
    vendidos: 178,
  },
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
    imagens: ['/assets/p-camera.jpg', '/assets/hero-deck.jpg'],
    descricao:
      'Corpo mirrorless compacto em liga de magnésio, com estabilização interna e captação de vídeo em 6K de 10 bits.',
    vendidos: 38,
  },
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
    imagens: ['/assets/p-keyboard.jpg', '/assets/hero-deck.jpg'],
    descricao:
      'Teclado mecânico 65% em alumínio fresado, com montagem gasket e switches substituíveis a quente.',
    featured: true,
    vendidos: 127,
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
    imagens: ['/assets/p-battery.jpg', '/assets/p-charger.jpg'],
    descricao:
      'Bateria portátil de carga rápida com leitura precisa de consumo e passagem de carga para portátil.',
    vendidos: 304,
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
    imagens: ['/assets/hero-deck.jpg', '/assets/p-recorder.jpg'],
    descricao:
      'Sistema de áudio modular com acabamento anodizado, encaixe magnético e resposta ajustável por firmware. A peça central da Série 07.',
    badge: 'Série 07',
    featured: true,
    vendidos: 64,
  },
];

export const seed = async (): Promise<void> => {
  const existentes = await query<{ count: string }>('SELECT count(*)::text AS count FROM produtos');
  if (Number(existentes.rows[0]?.count ?? 0) > 0) {
    logger.info('seed skipped: produtos already present');
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const catIds = new Map<string, string>();
    for (const cat of CATEGORIAS) {
      const { rows } = await client.query<{ id: string }>(
        `INSERT INTO categorias (slug, nome, ordem)
         VALUES ($1, $2, $3)
         ON CONFLICT (slug) DO UPDATE SET nome = EXCLUDED.nome
         RETURNING id`,
        [cat.slug, cat.nome, cat.ordem],
      );
      const id = rows[0]?.id;
      if (id === undefined) throw new Error(`categoria ${cat.slug} sem id`);
      catIds.set(cat.nome, id);
    }

    for (const p of PRODUTOS) {
      const categoriaId = catIds.get(p.categoria);
      if (categoriaId === undefined) throw new Error(`categoria em falta: ${p.categoria}`);

      const { rows } = await client.query<{ id: string }>(
        `INSERT INTO produtos (
           slug, sku, nome, marca, categoria_id,
           preco_centimos, preco_antigo_centimos, descricao, badge, featured, vendidos,
           variante_label, variante_opcoes, specs, imagens
         ) VALUES (
           $1,$2,$3,$4,$5,
           $6,$7,$8,$9,$10,$11,
           $12,$13::jsonb,$14::jsonb,$15::jsonb
         )
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
         ('admin@vantagem.pt', $1, 'Admin Vantagem', 'admin', '+351910000001', 'Lisboa'),
         ('cliente@vantagem.pt', $2, 'Cliente Demo', 'cliente', '+351910000002', 'Lisboa')
       ON CONFLICT (email) DO NOTHING`,
      [adminHash, clienteHash],
    );

    await client.query('COMMIT');
    logger.info('seed applied', {
      categorias: CATEGORIAS.length,
      produtos: PRODUTOS.length,
      marcas: [...new Set(PRODUTOS.map((p) => p.marca))].length,
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
