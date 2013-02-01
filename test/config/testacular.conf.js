basePath = '../../';

files = [
  JASMINE,
  JASMINE_ADAPTER,
  'lib/angular-*.js',
  'test/lib/angular-mocks.js',
  'test/lib/service-mocks.js',
  'test/lib/jsonrpc-mocks.js',
  'js/*.js',
  'js/**/*.js',
  'test/unit/**/*.js'
];

autoWatch = true;

browsers = ['Chrome'];

junitReporter = {
  outputFile: 'test_out/unit.xml',
  suite: 'unit'
};