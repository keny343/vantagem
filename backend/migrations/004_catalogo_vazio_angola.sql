-- Catálogo vazio: os artigos passam a ser criados só no painel.
-- Preços passam a ser lidos como Kwanzas (a unidade na base continua a ser 1/100).

DELETE FROM favoritos;
DELETE FROM avaliacoes;
DELETE FROM stock;
DELETE FROM produtos;

UPDATE cupons
   SET minimo_centimos = 1000000,
       descricao = '10% sobre o subtotal (mínimo 10 000 Kz).'
 WHERE codigo = 'VANTAGEM10';

UPDATE utilizadores
   SET telefone = '+244923000001',
       cidade = 'Luanda'
 WHERE email = 'admin@vantagem.pt';

UPDATE utilizadores
   SET telefone = '+244923000002',
       cidade = 'Luanda'
 WHERE email = 'cliente@vantagem.pt';
