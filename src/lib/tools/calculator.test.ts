import { describe, it, expect } from 'vitest';
import { calculator } from './calculator';
import type { ToolExecutionOptions } from 'ai';

const mockOptions: ToolExecutionOptions = {
  toolCallId: 'test-call-id',
  messages: [],
};

describe('calculator', () => {
  it('should add two numbers', async () => {
    const result = await calculator.execute?.({ operation: 'add', a: 5, b: 3 }, mockOptions);
    expect(result).toBe(8);
  });

  it('should subtract two numbers', async () => {
    const result = await calculator.execute?.({ operation: 'subtract', a: 10, b: 4 }, mockOptions);
    expect(result).toBe(6);
  });

  it('should multiply two numbers', async () => {
    const result = await calculator.execute?.({ operation: 'multiply', a: 6, b: 7 }, mockOptions);
    expect(result).toBe(42);
  });

  it('should divide two numbers', async () => {
    const result = await calculator.execute?.({ operation: 'divide', a: 15, b: 3 }, mockOptions);
    expect(result).toBe(5);
  });

  it('should handle division with decimals', async () => {
    const result = await calculator.execute?.({ operation: 'divide', a: 10, b: 4 }, mockOptions);
    expect(result).toBe(2.5);
  });

  it('should throw error when dividing by zero', async () => {
    await expect(
      calculator.execute?.({ operation: 'divide', a: 10, b: 0 }, mockOptions)
    ).rejects.toThrow('Division by zero is not allowed');
  });

  it('should handle negative numbers', async () => {
    const result = await calculator.execute?.({ operation: 'add', a: -5, b: 3 }, mockOptions);
    expect(result).toBe(-2);
  });
});
