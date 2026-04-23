import SwiftUI

// MARK: - Colors matching the web app
enum PixelColor {
    static let bg = Color(hex: "0B0E17")
    static let fg = Color(hex: "E8F0E8")
    static let primary = Color(hex: "7B5CFF")
    static let primaryHover = Color(hex: "9B7FFF")
    static let accent = Color(hex: "00E896")
    static let danger = Color(hex: "FF6B8A")
    static let xp = Color(hex: "FFD93D")
    static let surface = Color(hex: "151A2B")
    static let surfaceHover = Color(hex: "1E2540")
    static let muted = Color(hex: "6B7A99")
    static let border = Color(hex: "2A3352")
}

// MARK: - Pixel Font
extension Font {
    static func pixel(_ size: CGFloat) -> Font {
        .system(size: size, weight: .bold, design: .monospaced)
    }
}

// MARK: - Hex Color Extension
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: .alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r, g, b: UInt64
        (r, g, b) = ((int >> 16) & 0xFF, (int >> 8) & 0xFF, int & 0xFF)
        self.init(red: Double(r) / 255, green: Double(g) / 255, blue: Double(b) / 255)
    }
}

// MARK: - Pixel Border Modifier
struct PixelBorder: ViewModifier {
    var color: Color = PixelColor.border
    var lineWidth: CGFloat = 2

    func body(content: Content) -> some View {
        content
            .clipShape(RoundedRectangle(cornerRadius: 4))
            .overlay(
                RoundedRectangle(cornerRadius: 4)
                    .stroke(color, lineWidth: lineWidth)
            )
    }
}

extension View {
    func pixelBorder(_ color: Color = PixelColor.border) -> some View {
        modifier(PixelBorder(color: color))
    }
}

// MARK: - XP Helpers (matching web engine)
enum XPEngine {
    static func xpForLevel(_ level: Int) -> Int {
        guard level > 1 else { return 0 }
        return Int(40.0 * pow(Double(level), 1.85))
    }

    static func calculateLevel(_ xp: Int) -> Int {
        guard xp > 0 else { return 1 }
        return max(1, Int(pow(Double(xp) / 40.0, 1.0 / 1.85)))
    }

    static func title(for level: Int) -> String {
        switch level {
        case 50...: return "Grandmaster"
        case 40...: return "Mythic"
        case 30...: return "Legend"
        case 25...: return "Archmage"
        case 20...: return "Sorcerer"
        case 16...: return "Wizard"
        case 12...: return "Sage"
        case 8...: return "Scholar"
        case 5...: return "Student"
        case 3...: return "Apprentice"
        default: return "Noob"
        }
    }

    static func comboMultiplier(_ combo: Int) -> Int {
        if combo >= 10 { return 5 }
        if combo >= 7 { return 4 }
        if combo >= 5 { return 3 }
        if combo >= 3 { return 2 }
        return 1
    }

    static func comboLabel(_ combo: Int) -> String? {
        if combo >= 10 { return "UNSTOPPABLE" }
        if combo >= 7 { return "DOMINATING" }
        if combo >= 5 { return "ON FIRE" }
        if combo >= 3 { return "COMBO" }
        return nil
    }

    static func rollCrit() -> Bool {
        Double.random(in: 0...1) < 0.15
    }

    static let masteryNames = ["New", "Learning", "Familiar", "Known", "Mastered"]
}
