import * as echarts from 'echarts'
import { jsPDF } from 'jspdf'
import type { RuntimeOption } from './runtimeOption'
import { translate } from '@/i18n/translate'
import { logError } from './logger'
import { dataUrlToBlob, downloadBlob } from './download'

export interface ChartLike {
  getDataURL(options?: Record<string, unknown>): string
  getWidth(): number
  getHeight(): number
}

export interface ExportSize {
  preset: string
  width: number | null
  height: number | null
}

const DEFAULT_BACKGROUND = '#FFFFFF'

function backgroundFor(option: RuntimeOption): string {
  const value = option.backgroundColor
  return typeof value === 'string' && value.trim() && value !== 'transparent'
    ? value
    : DEFAULT_BACKGROUND
}

function safeName(name: string): string {
  return name.replace(/[\\/:*?"<>|]+/g, '-').trim() || 'chart'
}

function hasCustomSize(size: ExportSize): boolean {
  return Boolean(size.width && size.width > 0 && size.height && size.height > 0)
}

function renderOffscreen(option: RuntimeOption, width: number, height: number, renderer: 'canvas' | 'svg') {
  const host = document.createElement('div')
  host.style.cssText = `position:fixed;left:-10000px;top:0;width:${width}px;height:${height}px;visibility:hidden;`
  document.body.appendChild(host)
  const instance = echarts.init(host, undefined, { renderer, width, height })
  instance.setOption({ ...option, animation: false } as never, true)
  return { instance, host }
}

function imageUrl(chart: ChartLike | null, option: RuntimeOption, size: ExportSize, type: 'png' | 'jpeg'): string {
  if (hasCustomSize(size)) {
    const { instance, host } = renderOffscreen(option, size.width!, size.height!, 'canvas')
    try {
      return instance.getDataURL({ type, pixelRatio: 1, backgroundColor: backgroundFor(option) })
    } finally {
      instance.dispose()
      host.remove()
    }
  }
  if (!chart) throw new Error(translate('runtime.chartNotReady'))
  return chart.getDataURL({ type, pixelRatio: 2, backgroundColor: backgroundFor(option) })
}

function svgUrl(chart: ChartLike | null, option: RuntimeOption, size: ExportSize): string {
  const width = hasCustomSize(size) ? size.width! : (chart?.getWidth?.() ?? 960)
  const height = hasCustomSize(size) ? size.height! : (chart?.getHeight?.() ?? 540)
  const { instance, host } = renderOffscreen(option, width, height, 'svg')
  try {
    return instance.getSvgDataURL()
  } finally {
    instance.dispose()
    host.remove()
  }
}

function exportPng(chart: ChartLike | null, option: RuntimeOption, name: string, size: ExportSize): string | null {
  try {
    const url = imageUrl(chart, option, size, 'png')
    downloadBlob(dataUrlToBlob(url), `${safeName(name)}.png`, 'image/png')
    return null
  } catch (error) {
    return logError('chartExport.png', error)
  }
}

function exportSvg(chart: ChartLike | null, option: RuntimeOption, name: string, size: ExportSize): string | null {
  try {
    const url = svgUrl(chart, option, size)
    downloadBlob(dataUrlToBlob(url), `${safeName(name)}.svg`, 'image/svg+xml')
    return null
  } catch (error) {
    return logError('chartExport.svg', error)
  }
}

function exportPdf(chart: ChartLike | null, option: RuntimeOption, name: string, size: ExportSize): string | null {
  let url: string
  try {
    url = imageUrl(chart, option, size, 'png')
  } catch (error) {
    return logError('chartExport.pdf', error)
  }
  const image = new Image()
  image.onload = () => {
    try {
      const orientation = image.width >= image.height ? 'landscape' : 'portrait'
      const pdf = new jsPDF({ orientation, unit: 'px', format: [image.width, image.height] })
      pdf.addImage(url, 'PNG', 0, 0, image.width, image.height)
      pdf.save(`${safeName(name)}.pdf`)
    } catch (error) {
      logError('chartExport.pdf', error)
    }
  }
  image.onerror = () => logError('chartExport.pdf', translate('runtime.imageDataUnavailable'))
  image.src = url
  return null
}

export function exportChart(
  kind: 'png' | 'svg' | 'pdf',
  chart: ChartLike | null,
  option: RuntimeOption,
  name: string,
  size: ExportSize,
) {
  if (kind === 'png') return exportPng(chart, option, name, size)
  if (kind === 'svg') return exportSvg(chart, option, name, size)
  return exportPdf(chart, option, name, size)
}
