// Laver QR-kode til appen. Kør: swift tools/make_qr.swift <adresse> <fil.png>
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
try! NSBitmapImageRep(cgImage: ctx.makeImage()!).representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: out))
