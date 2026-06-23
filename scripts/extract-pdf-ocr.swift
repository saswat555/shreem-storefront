import Foundation
import PDFKit
import Vision
import AppKit

guard CommandLine.arguments.count >= 3 else {
  fputs("Usage: swift extract-pdf-ocr.swift input.pdf output.txt\n", stderr)
  exit(2)
}

let input = URL(fileURLWithPath: CommandLine.arguments[1])
let output = URL(fileURLWithPath: CommandLine.arguments[2])

guard let document = PDFDocument(url: input) else {
  fputs("Could not open PDF: \(input.path)\n", stderr)
  exit(1)
}

let request = VNRecognizeTextRequest()
request.recognitionLevel = .accurate
request.usesLanguageCorrection = true
request.recognitionLanguages = ["en-IN", "en-US"]

var pages: [String] = []

for index in 0..<document.pageCount {
  guard let page = document.page(at: index) else { continue }
  let bounds = page.bounds(for: .mediaBox)
  let scale: CGFloat = 2.0
  let width = max(1, Int(bounds.width * scale))
  let height = max(1, Int(bounds.height * scale))
  let image = NSImage(size: NSSize(width: width, height: height))

  image.lockFocus()
  NSColor.white.setFill()
  NSRect(x: 0, y: 0, width: width, height: height).fill()
  if let context = NSGraphicsContext.current?.cgContext {
    context.saveGState()
    context.scaleBy(x: scale, y: scale)
    page.draw(with: .mediaBox, to: context)
    context.restoreGState()
  }
  image.unlockFocus()

  guard
    let tiff = image.tiffRepresentation,
    let bitmap = NSBitmapImageRep(data: tiff),
    let cgImage = bitmap.cgImage
  else {
    pages.append("\n\n--- PAGE \(index + 1) ---\n[OCR image render failed]")
    continue
  }

  let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])

  do {
    try handler.perform([request])
    let text = (request.results ?? [])
      .compactMap { $0.topCandidates(1).first?.string }
      .joined(separator: "\n")
    pages.append("\n\n--- PAGE \(index + 1) ---\n\(text)")
    print("OCR page \(index + 1)/\(document.pageCount): \(text.count) chars")
  } catch {
    pages.append("\n\n--- PAGE \(index + 1) ---\n[OCR failed: \(error.localizedDescription)]")
  }
}

try pages.joined(separator: "\n").write(to: output, atomically: true, encoding: .utf8)
print("Wrote \(output.path)")
