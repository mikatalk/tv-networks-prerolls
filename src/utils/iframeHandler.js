/**
 * This demo is going to be hosted in iframe and needs to be responsive
 */

const handleResize = () => {
  const canvas = document.querySelector('canvas')
  try {
    window.parent.postMessage({
      'event-type': 'iframe-content-resize',
      width: canvas.clientWidth, 
      height: canvas.clientWidth,
    },
    document.location.origin)
  } catch (e) {
    // nothing to do here
  }
}

export const iframeHandler = () => {
  handleResize()
  window.addEventListener('resize', handleResize)
}
