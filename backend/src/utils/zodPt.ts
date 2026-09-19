import { z } from 'zod';

export const mapaZodPt: z.ZodErrorMap = (issue, ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      if (issue.received === 'undefined' || issue.received === 'null') {
        return { message: 'Este campo é obrigatório.' };
      }
      return { message: 'O valor deste campo não é válido.' };
    case z.ZodIssueCode.too_small:
      if (issue.type === 'string') {
        return { message: `Escreve pelo menos ${String(issue.minimum)} caracteres.` };
      }
      if (issue.type === 'number') {
        return { message: `O valor mínimo é ${String(issue.minimum)}.` };
      }
      if (issue.type === 'array') {
        return { message: 'Adiciona pelo menos um item.' };
      }
      return { message: 'O valor é demasiado pequeno.' };
    case z.ZodIssueCode.too_big:
      if (issue.type === 'string') {
        return { message: `Usa no máximo ${String(issue.maximum)} caracteres.` };
      }
      if (issue.type === 'number') {
        return { message: `O valor máximo é ${String(issue.maximum)}.` };
      }
      return { message: 'O valor é demasiado grande.' };
    case z.ZodIssueCode.invalid_string:
      if (issue.validation === 'email') return { message: 'Indica um email válido.' };
      if (issue.validation === 'uuid') return { message: 'Identificador inválido.' };
      if (issue.validation === 'url') return { message: 'Ligação inválida.' };
      return { message: 'O texto não está no formato correcto.' };
    case z.ZodIssueCode.invalid_enum_value:
      return { message: 'Essa opção não é válida.' };
    case z.ZodIssueCode.custom:
      return { message: issue.message || 'Valor inválido.' };
    default:
      return { message: ctx.defaultError === 'Required' ? 'Este campo é obrigatório.' : ctx.defaultError };
  }
};

z.setErrorMap(mapaZodPt);
