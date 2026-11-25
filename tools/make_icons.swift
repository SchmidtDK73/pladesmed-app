// Laver app-ikoner (bilen fra logoet på cremefarvet baggrund). Kør: swift tools/make_icons.swift <logo-fil>
import AppKit
let src = NSImage(contentsOfFile: CommandLine.arguments[1])!
var r = NSRect(origin: .zero, size: src.size)
let cg = src.cgImage(forProposedRect: &r, context: nil, hints: nil)!
// Bilen ligger ca. i x 140-770, y 470-830 i det originale 1774x887 logo
let car = cg.cropping(to: CGRect(x: 140, y: 465, width: 630, height: 360))!
for s in [180, 192, 512] {
  let ctx = CGContext(data: nil, width: s, height: s, bitsPerComponent: 8, bytesPerRow: 0,
                      space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
  ctx.setFillColor(CGColor(red: 0.969, green: 0.945, blue: 0.89, alpha: 1)); ctx.fill(CGRect(x: 0, y: 0, width: s, height: s))
  let w = Double(s) * 0.8, h = w * 360 / 630
  ctx.interpolationQuality = .high
  ctx.draw(car, in: CGRect(x: (Double(s) - w) / 2, y: (Double(s) - h) / 2, width: w, height: h))
  // dæk den røde streg øverst til højre i udsnittet
  ctx.fill(CGRect(x: (Double(s) - w) / 2 + w * 0.65, y: (Double(s) - h) / 2 + h * 0.86, width: w * 0.36, height: h * 0.15))
  let rep = NSBitmapImageRep(cgImage: ctx.makeImage()!)
  try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: "icons/icon-\(s).png"))
}
