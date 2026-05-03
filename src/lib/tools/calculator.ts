import { tool } from 'ai';
import { z } from 'zod';

const calculatorInputSchema = z.object({
  operation: z.enum(['add', 'subtract', 'multiply', 'divide']).describe('The arithmetic operation to perform'),
  a: z.number().describe('The first number'),
  b: z.number().describe('The second number'),
});

export const calculator = tool({
  description: 'Perform basic arithmetic operations (addition, subtraction, multiplication, division)',
  inputSchema: calculatorInputSchema,
  execute: async ({ operation, a, b }) => {
    switch (operation) {
      case 'add':
        return a + b;
      case 'subtract':
        return a - b;
      case 'multiply':
        return a * b;
      case 'divide':
        if (b === 0) {
          throw new Error('Division by zero is not allowed');
        }
        return a / b;
    }
  },
});
