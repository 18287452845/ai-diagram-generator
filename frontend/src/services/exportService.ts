export interface ExportOptions {
  format: 'svg' | 'png' | 'pdf' | 'xml'
  quality?: number
  background?: string
  scale?: number
}

export const exportService = {
  /**
   * Export Draw.io diagram via postMessage API
   */
  async exportDrawioSVG(editorRef: any): Promise<Blob> {
    if (!editorRef?.exportDiagram) {
      throw new Error('Draw.io editor reference not available')
    }

    return await editorRef.exportDiagram({
      format: 'svg',
      scale: 1,
      border: 0,
      transparent: false,
    })
  },

  /**
   * Export Draw.io diagram as PNG
   */
  async exportDrawioPNG(
    editorRef: any,
    options: { scale?: number; background?: string; transparent?: boolean } = {}
  ): Promise<Blob> {
    if (!editorRef?.exportDiagram) {
      throw new Error('Draw.io editor reference not available')
    }

    const { scale = 2, background = 'white', transparent = false } = options

    return await editorRef.exportDiagram({
      format: 'png',
      scale,
      border: 0,
      background,
      transparent,
    })
  },

  /**
   * Export Draw.io XML code
   */
  exportXML(code: string): Blob {
    return new Blob([code], { type: 'application/xml' })
  },

  /**
   * Download blob as file
   */
  downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  },

  /**
   * Export and download Draw.io diagram
   */
  async export(
    code: string,
    exportFormat: 'svg' | 'png' | 'xml',
    filename: string,
    editorRef?: any
  ): Promise<void> {
    let blob: Blob
    let fullFilename: string

    switch (exportFormat) {
      case 'svg':
        blob = await this.exportDrawioSVG(editorRef)
        fullFilename = filename.endsWith('.svg') ? filename : `${filename}.svg`
        break
      case 'png':
        blob = await this.exportDrawioPNG(editorRef, {})
        fullFilename = filename.endsWith('.png') ? filename : `${filename}.png`
        break
      case 'xml':
        blob = this.exportXML(code)
        fullFilename = filename.endsWith('.drawio') ? filename : `${filename}.drawio`
        break
      default:
        throw new Error(`Unsupported format: ${exportFormat}`)
    }

    this.downloadBlob(blob, fullFilename)
  },
}

export default exportService