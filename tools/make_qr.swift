// Laver QR-kode til appen med logoet i midten. Kør: swift tools/make_qr.swift <adresse> <fil.png> [logo.png]
import AppKit
import CoreImage
let url = CommandLine.arguments[1], out = CommandLine.arguments[2]
let f = CIFilter(name: "CIQRCodeGenerator")!
f.setValue(url.data(using: .utf8), forKey: "inputMessage")
f.setValue("H", forKey: "inputCorrectionLevel")
let qr = f.outputImage!
let moduler = Int(qr.extent.width), kant = 4, px = 1200
let skala = CGFloat(px) / CGFloat(moduler + 2 * kant)
let stor = qr.transformed(by: CGAffineTransform(scaleX: skala, y: skala))
let ctx = CGContext(data: nil, width: px, height: px, bitsPerComponent: 8, bytesPerRow: 0,
                    space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
ctx.setFillColor(.white); ctx.fill(CGRect(x: 0, y: 0, width: px, height: px))
ctx.interpolationQuality = .none
let cg = CIContext().createCGImage(stor, from: stor.extent)!
let k = CGFloat(kant) * skala
ctx.draw(cg, in: CGRect(x: k, y: k, width: stor.extent.width, height: stor.extent.height))
if CommandLine.arguments.count > 3, let logo = NSImage(contentsOfFile: CommandLine.arguments[3]) {
  // Logoet fylder ca. 38 % af bredden (ca. 9 % af fladen) – fejlrettelse "H" klarer op til ca. 30 %
  var r = NSRect(origin: .zero, size: logo.size)
  let lg = logo.cgImage(forProposedRect: &r, context: nil, hints: nil)!
  let w = CGFloat(px) * 0.38, h = w * CGFloat(lg.height) / CGFloat(lg.width), luft = CGFloat(px) * 0.015
  let boks = CGRect(x: (CGFloat(px) - w) / 2 - luft, y: (CGFloat(px) - h) / 2 - luft, width: w + 2 * luft, height: h + 2 * luft)
  ctx.setFillColor(.white)
  ctx.addPath(CGPath(roundedRect: boks, cornerWidth: luft * 1.5, cornerHeight: luft * 1.5, transform: nil)); ctx.fillPath()
  ctx.interpolationQuality = .high
  ctx.draw(lg, in: boks.insetBy(dx: luft, dy: luft))
}
try! NSBitmapImageRep(cgImage: ctx.makeImage()!).representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: out))
