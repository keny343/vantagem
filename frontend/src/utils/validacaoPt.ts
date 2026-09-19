import type { FormEvent } from 'react';

const mensagemDe = (el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): string => {
  if (el.validity.valueMissing) return 'Este campo é obrigatório.';
  if (el.validity.typeMismatch && el.type === 'email') return 'Indica um email válido.';
  if (el.validity.typeMismatch) return 'O valor não está no formato correcto.';
  if (el.validity.tooShort) return 'O texto é demasiado curto.';
  if (el.validity.tooLong) return 'O texto é demasiado longo.';
  if (el.validity.rangeUnderflow) return 'O valor é demasiado baixo.';
  if (el.validity.rangeOverflow) return 'O valor é demasiado alto.';
  if (el.validity.patternMismatch) return 'O formato não é válido.';
  if (el.validity.stepMismatch) return 'O valor não é aceite.';
  if (el.validity.badInput) return 'Introduz um número válido.';
  return 'Corrige este campo.';
};

export const onInvalidPt = (e: FormEvent): void => {
  const t = e.target;
  if (
    !(t instanceof HTMLInputElement || t instanceof HTMLSelectElement || t instanceof HTMLTextAreaElement)
  ) {
    return;
  }
  t.setCustomValidity(mensagemDe(t));
};

export const onInputPt = (e: FormEvent): void => {
  const t = e.target;
  if (t instanceof HTMLInputElement || t instanceof HTMLSelectElement || t instanceof HTMLTextAreaElement) {
    t.setCustomValidity('');
  }
};
