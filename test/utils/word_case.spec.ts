import { toTitleCase } from '../../src/utils/word_case';

describe('toTitleCase', () => {
  describe('Basic Functionality', () => {
    it('should convert lowercase string to title case', () => {
      expect(toTitleCase('hello world')).toBe('Hello World');
    });

    it('should handle single word', () => {
      expect(toTitleCase('hello')).toBe('Hello');
    });

    it('should handle already title case string', () => {
      expect(toTitleCase('Hello World')).toBe('Hello World');
    });

    it('should convert all uppercase to title case', () => {
      expect(toTitleCase('HELLO WORLD')).toBe('Hello World');
    });

    it('should handle mixed case input', () => {
      expect(toTitleCase('hElLo WoRlD')).toBe('Hello World');
    });

    it('should handle empty string', () => {
      expect(toTitleCase('')).toBe('');
    });
  });

  describe('Multiple Words', () => {
    it('should handle three words', () => {
      expect(toTitleCase('hello world test')).toBe('Hello World Test');
    });

    it('should handle many words', () => {
      expect(toTitleCase('this is a long sentence')).toBe('This Is A Long Sentence');
    });

    it('should handle single letter words', () => {
      expect(toTitleCase('a b c d e')).toBe('A B C D E');
    });
  });

  describe('Whitespace Handling', () => {
    it('should handle multiple spaces between words', () => {
      expect(toTitleCase('hello  world')).toBe('Hello World');
    });

    it('should handle leading spaces', () => {
      expect(toTitleCase('  hello world')).toBe('Hello World');
    });

    it('should handle trailing spaces', () => {
      expect(toTitleCase('hello world  ')).toBe('Hello World');
    });

    it('should handle tabs', () => {
      expect(toTitleCase('hello\tworld')).toBe('Hello\tworld');
    });

    it('should handle newlines', () => {
      expect(toTitleCase('hello\nworld')).toBe('Hello\nworld');
    });

    it('should handle mixed whitespace', () => {
      expect(toTitleCase('hello  \t\n  world')).toBe('Hello \t\n World');
    });

    it('should filter out empty strings from split', () => {
      expect(toTitleCase('   hello   world   ')).toBe('Hello World');
    });
  });

  describe('Special Characters', () => {
    it('should handle hyphenated words', () => {
      expect(toTitleCase('hello-world test')).toBe('Hello-world Test');
    });

    it('should handle underscored words', () => {
      expect(toTitleCase('hello_world test')).toBe('Hello_world Test');
    });

    it('should handle apostrophes', () => {
      expect(toTitleCase("don't stop")).toBe("Don't Stop");
    });

    it('should handle numbers', () => {
      expect(toTitleCase('hello 123 world')).toBe('Hello 123 World');
    });

    it('should handle punctuation', () => {
      expect(toTitleCase('hello, world!')).toBe('Hello, World!');
    });
  });

  describe('Edge Cases', () => {
    it('should handle string with only spaces', () => {
      expect(toTitleCase('   ')).toBe('');
    });

    it('should handle very long strings', () => {
      const longString = 'word '.repeat(100).trim();
      const expected = 'Word '.repeat(100).trim();
      expect(toTitleCase(longString)).toBe(expected);
    });

    it('should handle single character', () => {
      expect(toTitleCase('a')).toBe('A');
      expect(toTitleCase('z')).toBe('Z');
    });

    it('should handle string with numbers only', () => {
      expect(toTitleCase('123')).toBe('123');
    });

    it('should handle string starting with number', () => {
      expect(toTitleCase('123abc')).toBe('123abc');
    });
  });

  describe('Unicode and International Characters', () => {
    it('should handle accented characters', () => {
      expect(toTitleCase('café résumé')).toBe('Café Résumé');
    });

    it('should handle German umlauts', () => {
      expect(toTitleCase('über schön')).toBe('Über Schön');
    });

    it('should handle Spanish characters', () => {
      expect(toTitleCase('niño año')).toBe('Niño Año');
    });

    it('should handle Cyrillic characters', () => {
      expect(toTitleCase('привет мир')).toBe('Привет Мир');
    });
  });

  describe('Real-world Use Cases', () => {
    it('should format names correctly', () => {
      expect(toTitleCase('john doe')).toBe('John Doe');
      expect(toTitleCase('JANE SMITH')).toBe('Jane Smith');
    });

    it('should format titles correctly', () => {
      expect(toTitleCase('the quick brown fox')).toBe('The Quick Brown Fox');
    });

    it('should format addresses correctly', () => {
      expect(toTitleCase('main street')).toBe('Main Street');
    });

    it('should format book titles', () => {
      expect(toTitleCase('to kill a mockingbird')).toBe('To Kill A Mockingbird');
    });
  });

  describe('Filter Boolean', () => {
    it('should filter out empty strings after split', () => {
      const input = 'hello   world';
      const result = toTitleCase(input);
      expect(result).toBe('Hello World');
      expect(result).not.toContain('  ');
    });

    it('should handle consecutive spaces', () => {
      expect(toTitleCase('a     b     c')).toBe('A B C');
    });
  });

  describe('Map and Join', () => {
    it('should properly map each word', () => {
      const input = 'one two three';
      const result = toTitleCase(input);
      const words = result.split(' ');
      
      words.forEach(word => {
        expect(word[0]).toBe(word[0].toUpperCase());
      });
    });

    it('should join words with single space', () => {
      const result = toTitleCase('hello world test');
      expect(result.split(' ').length).toBe(3);
    });
  });

  describe('Type Handling', () => {
    it('should handle string type only', () => {
      const result = toTitleCase('test');
      expect(typeof result).toBe('string');
    });

    it('should return string for any string input', () => {
      expect(typeof toTitleCase('anything')).toBe('string');
    });
  });

  describe('Performance', () => {
    it('should handle large strings efficiently', () => {
      const largeString = 'word '.repeat(10000).trim();
      const startTime = Date.now();
      toTitleCase(largeString);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Immutability', () => {
    it('should not modify original string', () => {
      const original = 'hello world';
      const result = toTitleCase(original);
      
      expect(original).toBe('hello world');
      expect(result).toBe('Hello World');
      expect(result).not.toBe(original);
    });
  });
});