import { Document, InvalidDocumentError } from './document.js';

describe('Document', () => {
  describe('CPF', () => {
    it('aceita um CPF válido sem pontuação', () => {
      const document = Document.create('52998224725');

      expect(document.value).toBe('52998224725');
      expect(document.type).toBe('CPF');
    });

    it('aceita um CPF válido com pontuação e guarda só os dígitos', () => {
      expect(Document.create('529.982.247-25').value).toBe('52998224725');
    });

    it('aceita CPF cujo dígito verificador é 0', () => {
      expect(Document.create('123.456.789-09').value).toBe('12345678909');
    });

    it('formata o CPF para exibição', () => {
      expect(Document.create('52998224725').format()).toBe('529.982.247-25');
    });

    it('rejeita CPF com o primeiro dígito verificador errado', () => {
      expect(() => Document.create('529.982.247-35')).toThrow(
        InvalidDocumentError,
      );
    });

    it('rejeita CPF com o segundo dígito verificador errado', () => {
      expect(() => Document.create('529.982.247-26')).toThrow(
        InvalidDocumentError,
      );
    });

    it('rejeita CPF com todos os dígitos iguais', () => {
      // 111.111.111-11 passa no cálculo, mas não é um CPF válido.
      expect(() => Document.create('111.111.111-11')).toThrow(
        InvalidDocumentError,
      );
    });
  });

  describe('CNPJ', () => {
    it('aceita um CNPJ numérico válido', () => {
      const document = Document.create('11.222.333/0001-81');

      expect(document.value).toBe('11222333000181');
      expect(document.type).toBe('CNPJ');
      expect(document.format()).toBe('11.222.333/0001-81');
    });

    it('aceita um CNPJ alfanumérico válido, em maiúsculas', () => {
      const document = Document.create('12.abc.345/01de-35');

      expect(document.value).toBe('12ABC34501DE35');
      expect(document.type).toBe('CNPJ');
    });

    it('rejeita CNPJ com dígito verificador errado', () => {
      expect(() => Document.create('11.222.333/0001-82')).toThrow(
        InvalidDocumentError,
      );
    });

    it('rejeita CNPJ com todos os caracteres iguais', () => {
      expect(() => Document.create('00.000.000/0000-00')).toThrow(
        InvalidDocumentError,
      );
    });
  });

  describe('formato', () => {
    it.each(['', '123', '5299822472', '529982247250', 'abc.def.ghi-jk'])(
      'rejeita "%s", que não tem tamanho de CPF nem de CNPJ válido',
      (input) => {
        expect(() => Document.create(input)).toThrow(InvalidDocumentError);
      },
    );

    it('rejeita CPF com letras', () => {
      expect(() => Document.create('5299822472A')).toThrow(
        InvalidDocumentError,
      );
    });
  });

  describe('igualdade', () => {
    it('é igual a outro documento com o mesmo valor, formatado ou não', () => {
      expect(
        Document.create('529.982.247-25').equals(
          Document.create('52998224725'),
        ),
      ).toBe(true);
    });
  });
});
