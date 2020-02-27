module.exports = {
  publicPath: process.env.NODE_ENV === 'production' 
    ? '//mikatalk.github.io/tv-networks-prerolls/'
    : `/`,
  devServer: {
    hot: false,
    liveReload: true
  },
  pages: {
    index: 'src/index.js',
    netflix: 'src/netflix.js',
    hulu: 'src/hulu.js',
    hbo: 'src/hbo.js'
  }
}