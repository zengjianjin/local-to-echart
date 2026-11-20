import * as echarts from 'echarts'

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function triggerUrlDownload(url, filename) {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
}

export function exportPNG(chart, filename) {
  const url = chart.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#ffffff' })
  triggerUrlDownload(url, filename)
}

export function exportSVG(chart, filename) {
  // getDataURL({ type: 'svg' }) only works on an SVG-renderer chart. The live
  // chart uses the canvas renderer, so that call silently returns a PNG data
  // URL -- saved as .svg, browsers report "no style information". Re-render
  // the same option into a detached SVG-renderer instance (SSR mode) instead.
  const option = chart.getOption()
  const width = chart.getWidth() || 800
  const height = chart.getHeight() || 400
  const svgChart = echarts.init(null, null, { renderer: 'svg', ssr: true, width, height })
  try {
    svgChart.setOption({ ...option, backgroundColor: option.backgroundColor || '#ffffff' }, true)
    let svg = svgChart.renderToSVGString()
    if (!svg.trimStart().startsWith('<?xml')) {
      svg = `<?xml version="1.0" encoding="UTF-8"?>\n${svg}`
    }
    triggerBlobDownload(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), filename)
  } finally {
    svgChart.dispose()
  }
}

export async function exportPDF(chart, title, filename) {
  const { jsPDF } = await import('jspdf')
  const url = chart.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#ffffff' })
  const image = new Image()
  await new Promise((resolve, reject) => {
    image.onload = resolve
    image.onerror = reject
    image.src = url
  })
  const width = 280
  const height = (image.height / image.width) * width
  const pdf = new jsPDF({ orientation: height > width ? 'portrait' : 'landscape', unit: 'mm', format: [width, height] })
  pdf.addImage(url, 'PNG', 0, 0, width, height)
  pdf.setProperties({ title: title || 'local-to-echarts 导出' })
  pdf.save(filename)
}

export function exportCSV(dataset, filename) {
  const escape = (value) => {
    const text = value === null || value === undefined ? '' : String(value)
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  const lines = [
    dataset.columns.map(escape).join(','),
    ...dataset.rows.map((row) => dataset.columns.map((col) => escape(row[col])).join(',')),
  ]
  triggerBlobDownload(new Blob([`\uFEFF${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8' }), filename)
}

export function exportJSON(data, filename) {
  triggerBlobDownload(
    new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' }),
    filename,
  )
}

export function safeFilename(name) {
  return String(name || 'chart').replace(/[\\/:*?"<>|]/g, '_').slice(0, 60)
}
