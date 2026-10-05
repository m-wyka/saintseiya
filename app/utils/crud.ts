type CrudFieldKind = 'text' | 'textarea' | 'number' | 'checkbox' | 'select' | 'image' | 'url';

export interface CrudField {
  key: string;
  label: string;
  kind: CrudFieldKind;
  hint?: string;
  required?: boolean;
  options?: { value: string | number; label: string }[];
}

export interface CrudColumn {
  key: string;
  label: string;
  alignsRight?: boolean;
}
