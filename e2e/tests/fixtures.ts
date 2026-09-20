import { Buffer } from 'node:buffer';

/** PDF mínimo válido (≥512 B) aceite por pdfSeguro. */
export const PDF_COMPROVATIVO = Buffer.from(
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
`.padEnd(512, ' '),
);

export const ADMIN = {
  email: process.env.ADMIN_EMAIL ?? 'admin@e2e.vantagem.test',
  password: process.env.ADMIN_PASSWORD ?? 'E2eAdminPass99',
};
