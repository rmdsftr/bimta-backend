module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: './',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },

  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/**/*.module.ts',   
    '!src/main.ts',      
  ],
  coveragePathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',      
    '\\.d\\.ts$'            
  ],

  coverageDirectory: './coverage',
  testEnvironment: 'node',
};
