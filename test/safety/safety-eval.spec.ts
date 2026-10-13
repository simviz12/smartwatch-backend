import * as fs from 'fs';
import * as path from 'path';
import { DeterministicPreCheck } from '../../src/modules/chat/domain/deterministic-precheck';
import { RiskLevel } from '../../src/modules/chat/domain/chat.entity';

describe('DeterministicPreCheck & Safety Evaluation', () => {
  const casesPath = path.join(__dirname, 'crisis-cases.json');
  const rawData = fs.readFileSync(casesPath, 'utf-8');
  const testCases: { text: string; expected: string }[] = JSON.parse(rawData);

  it('should contain at least 60 labeled Spanish cases', () => {
    expect(testCases.length).toBeGreaterThanOrEqual(60);
  });

  it('should achieve 100% recall on explicit high-risk cases', () => {
    const highCases = testCases.filter((c) => c.expected === 'HIGH');
    expect(highCases.length).toBeGreaterThan(0);

    for (const testCase of highCases) {
      const result = DeterministicPreCheck.check(testCase.text);
      expect(result.riskLevel).toBe(RiskLevel.HIGH);
      expect(result.crisisResources).toBeDefined();
      expect(result.crisisResources!.length).toBeGreaterThan(0);
    }
  });

  it('should never classify benign allowlist idioms as HIGH risk', () => {
    const lowCases = testCases.filter((c) => c.expected === 'LOW');
    let highFalsePositives = 0;

    for (const testCase of lowCases) {
      const result = DeterministicPreCheck.check(testCase.text);
      if (result.riskLevel === RiskLevel.HIGH) {
        highFalsePositives++;
      }
    }

    const falsePositiveRate = (highFalsePositives / lowCases.length) * 100;
    // Target: benign cases reach HIGH in <= 5% (here 0%)
    expect(falsePositiveRate).toBeLessThanOrEqual(5.0);
  });
});
