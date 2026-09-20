import { describe, expect, it } from 'vitest';
import { AppError } from '../utils/errors.js';
import {
  exigirPdfComprovativo,
  PDF_MAX_BYTES,
  PDF_MIN_BYTES,
} from '../utils/pdfSeguro.js';

describe('pdfSeguro', () => {
  const pdfMinimo = Buffer.from(
    `%PDF-1.4
1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj
2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj
3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] >>endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000068 00000 n 
0000000125 00000 n 
trailer<< /Size 4 /Root 1 0 R >>
startxref
210
%%EOF
`.padEnd(PDF_MIN_BYTES, ' '),
  );

  it('aceita PDF estruturalmente válido', () => {
    expect(exigirPdfComprovativo(pdfMinimo, 'application/pdf')).toBe('application/pdf');
  });

  it('rejeita demasiado pequeno', () => {
    const pequeno = Buffer.from('%PDF-1.4\n%%EOF\n');
    expect(() => exigirPdfComprovativo(pequeno, 'application/pdf')).toThrow(AppError);
  });

  it('rejeita JPEG renomeado', () => {
    const jpeg = Buffer.alloc(PDF_MIN_BYTES, 0);
    jpeg[0] = 0xff;
    jpeg[1] = 0xd8;
    jpeg[2] = 0xff;
    expect(() => exigirPdfComprovativo(jpeg, 'application/pdf')).toThrow(AppError);
  });

  it('rejeita MIME falso', () => {
    expect(() => exigirPdfComprovativo(pdfMinimo, 'image/jpeg')).toThrow(AppError);
  });

  it('rejeita PDF com JavaScript', () => {
    const mau = Buffer.from(
      `%PDF-1.4
1 0 obj<< /JavaScript (app.alert) >>endobj
trailer<<>>
%%EOF
`.padEnd(PDF_MIN_BYTES, ' '),
    );
    expect(() => exigirPdfComprovativo(mau, 'application/pdf')).toThrow(AppError);
  });

  it('rejeita PDF sem %%EOF', () => {
    const incompleto = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\n'.padEnd(PDF_MIN_BYTES, 'x'));
    expect(() => exigirPdfComprovativo(incompleto, 'application/pdf')).toThrow(AppError);
  });

  it('respeita teto de tamanho', () => {
    expect(PDF_MAX_BYTES).toBe(5 * 1024 * 1024);
  });
});
