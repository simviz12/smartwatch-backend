export class SentenceTokenizer {
  private buffer = '';
  private static readonly ABBREVIATIONS = ['dr.', 'dra.', 'sr.', 'sra.', 'ej.', 'etc.', 'p.ej.', 'aprox.', 'vs.'];

  public addToken(token: string): string[] {
    this.buffer += token;
    const completedSentences: string[] = [];

    // Check sentence boundaries: '.', '!', '?', or '\n'
    let match: RegExpExecArray | null;
    const sentenceEndRegex = /([.!?\n]+)(\s+|$)/g;

    let lastIndex = 0;
    while ((match = sentenceEndRegex.exec(this.buffer)) !== null) {
      const boundaryPos = match.index + match[1].length;
      const candidate = this.buffer.substring(lastIndex, boundaryPos).trim();

      // Check if candidate ends with an abbreviation
      const lower = candidate.toLowerCase();
      const isAbbr = SentenceTokenizer.ABBREVIATIONS.some((abbr) => lower.endsWith(abbr));

      // Check for ellipsis (...)
      const isEllipsis = candidate.endsWith('...') && !match[2];

      if (!isAbbr && !isEllipsis && candidate.length > 0) {
        completedSentences.push(candidate);
        lastIndex = match.index + match[0].length;
      }
    }

    if (lastIndex > 0) {
      this.buffer = this.buffer.substring(lastIndex);
    }

    return completedSentences;
  }

  public flush(): string | null {
    const trimmed = this.buffer.trim();
    this.buffer = '';
    return trimmed.length > 0 ? trimmed : null;
  }
}
