var babel = require('babel');

module.exports = function(wallaby) {
  return {
    files: [
      'lib/**/*.js',
      'node_modules/fivetwelve/{*.js,**/*.js}'
    ],
    tests: [
      'test/**/*Test.js'
    ],

    compilers: {
      '**/*.js': wallaby.compilers.babel({
        babel: babel,
        stage: 0    // https://babeljs.io/docs/usage/experimental/
      })
    },

    env: {
      type: 'node',
      params: {
        //runner: '--harmony --harmony_arrow_functions',
        //env: 'PARAM1=true;PARAM2=false'
      }
    }
  };
};
