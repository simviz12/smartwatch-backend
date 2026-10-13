import { SentenceTokenizer } from '../../src/modules/chat/domain/sentence-tokenizer';

describe('SentenceTokenizer for Voice Mode', () => {
  it('should split simple sentences by punctuation', () => {
    const tokenizer = new SentenceTokenizer();
    const sentences = tokenizer.addToken('Hola. ¿Cómo estás hoy? Me alegra escucharte!');

    expect(sentences).toEqual(['Hola.', '¿Cómo estás hoy?', 'Me alegra escucharte!']);
  });

  it('should handle streaming tokens and preserve abbreviations without premature splitting', () => {
    const tokenizer = new SentenceTokenizer();

    expect(tokenizer.addToken('El ')).toEqual([]);
    expect(tokenizer.addToken('Dr. ')).toEqual([]);
    expect(tokenizer.addToken('Pérez ')).toEqual([]);
    expect(tokenizer.addToken('llegó hoy. ')).toEqual(['El Dr. Pérez llegó hoy.']);
  });

  it('should flush remaining text when completed', () => {
    const tokenizer = new SentenceTokenizer();
    tokenizer.addToken('Respiremos juntos');
    const flushed = tokenizer.flush();

    expect(flushed).toBe('Respiremos juntos');
  });
});
