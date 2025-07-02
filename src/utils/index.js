export function createMap(width, height, dpiRatio) {
    const canvas = document.createElement('canvas')
        canvas.width = width * dpiRatio
        canvas.height = height * dpiRatio
        canvas.style.width = width + 'px'
        canvas.style.height = height + 'px'
        canvas.style.position = 'absolute'
        canvas.style.top = '0'
        canvas.style.left = '0'
        canvas.style.outline = 'none'
        return canvas
}

export function s8() {
        return (((1 + Math.random()) * 0x100000000) | 0).toString(16).substring(1)
}
