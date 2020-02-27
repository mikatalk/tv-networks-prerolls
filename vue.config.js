module.exports = {
  publicPath: process.env.NODE_ENV === 'production' 
    ? '/article-assets/replicating-network-prerolls-animations-with-fragment-shaders/dist/'
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