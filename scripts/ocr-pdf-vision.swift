import AppKit
import Foundation
import PDFKit
import Vision

func usage() -> Never {
  fputs("Usage: swift scripts/ocr-pdf-vision.swift input.pdf output.txt [pageLimit]\n", stderr)
  exit(2)
}

let args = CommandLine.arguments
guard args.count >= 3 else {
  usage()
}

let inputURL = URL(fileURLWithPath: args[1])
let outputURL = URL(fileURLWithPath: args[2])
let pageLimit = args.count >= 4 ? Int(args[3]) : nil

guard let document = PDFDocument(url: inputURL) else {
  fputs("Could not open PDF: \(inputURL.path)\n", stderr)
  exit(1)
}

let totalPages = document.pageCount
let pagesToRead = min(pageLimit ?? totalPages, totalPages)
var output: [String] = []

func cgImage(for page: PDFPage, scale: CGFloat = 2.4) -> CGImage? {
  let pageRect = page.bounds(for: .mediaBox)
  let width = Int(pageRect.width * scale)
  let height = Int(pageRect.height * scale)

  guard
    let colorSpace = CGColorSpace(name: CGColorSpace.sRGB),
    let context = CGContext(
      data: nil,
      width: width,
      height: height,
      bitsPerComponent: 8,
      bytesPerRow: 0,
      space: colorSpace,
      bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
    )
  else {
    return nil
  }

  context.setFillColor(NSColor.white.cgColor)
  context.fill(CGRect(x: 0, y: 0, width: width, height: height))
  context.saveGState()
  context.scaleBy(x: scale, y: scale)
  page.draw(with: .mediaBox, to: context)
  context.restoreGState()

  return context.makeImage()
}

for pageIndex in 0..<pagesToRead {
  autoreleasepool {
    guard let page = document.page(at: pageIndex), let image = cgImage(for: page) else {
      output.append("\n-- Page \(pageIndex + 1) --\n[OCR failed: page could not be rendered]\n")
      return
    }

    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = true
    request.recognitionLanguages = ["en-IN", "en-US", "hi-IN"]

    let handler = VNImageRequestHandler(cgImage: image, options: [:])

    do {
      try handler.perform([request])
      let lines = (request.results ?? []).compactMap { observation in
        observation.topCandidates(1).first?.string
      }
      output.append("\n-- Page \(pageIndex + 1) of \(totalPages) --\n")
      output.append(lines.joined(separator: "\n"))
      output.append("\n")
      print("OCR page \(pageIndex + 1)/\(pagesToRead)")
    } catch {
      output.append("\n-- Page \(pageIndex + 1) --\n[OCR failed: \(error.localizedDescription)]\n")
    }
  }
}

do {
  try output.joined(separator: "\n").write(to: outputURL, atomically: true, encoding: .utf8)
  print("Wrote \(outputURL.path)")
} catch {
  fputs("Could not write output: \(error.localizedDescription)\n", stderr)
  exit(1)
}
