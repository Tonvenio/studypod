import SwiftUI

struct ProfileView: View {
    @EnvironmentObject var authManager: AuthManager
    @EnvironmentObject var gameState: GameState

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    // Level badge
                    VStack(spacing: 8) {
                        Text("LV.\(gameState.level)")
                            .font(.pixel(32))
                            .foregroundColor(PixelColor.primary)

                        Text(gameState.title.uppercased())
                            .font(.pixel(12))
                            .foregroundColor(PixelColor.accent)

                        Text("\(gameState.xp) total XP")
                            .font(.pixel(8))
                            .foregroundColor(PixelColor.muted)
                    }
                    .padding(24)
                    .frame(maxWidth: .infinity)
                    .background(PixelColor.surface)
                    .pixelBorder()

                    // Stats
                    VStack(spacing: 0) {
                        statRow("Cards reviewed", value: "\(gameState.profile?.totalCardsReviewed ?? 0)")
                        Divider().background(PixelColor.border)
                        statRow("Accuracy", value: {
                            let total = gameState.profile?.totalCardsReviewed ?? 0
                            let correct = gameState.profile?.totalCorrect ?? 0
                            return total > 0 ? "\(Int(Double(correct) / Double(total) * 100))%" : "0%"
                        }())
                        Divider().background(PixelColor.border)
                        statRow("Best combo", value: "\(gameState.profile?.bestCombo ?? 0)x")
                        Divider().background(PixelColor.border)
                        statRow("Total crits", value: "\(gameState.profile?.totalCrits ?? 0)")
                        Divider().background(PixelColor.border)
                        statRow("Current streak", value: "\(gameState.streak) days")
                        Divider().background(PixelColor.border)
                        statRow("Longest streak", value: "\(gameState.profile?.longestStreak ?? 0) days")
                    }
                    .background(PixelColor.surface)
                    .pixelBorder()

                    // Sign out
                    Button {
                        authManager.signOut()
                    } label: {
                        Text("SIGN OUT")
                            .font(.pixel(10))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(PixelColor.danger.opacity(0.15))
                            .foregroundColor(PixelColor.danger)
                            .pixelBorder(PixelColor.danger.opacity(0.3))
                    }
                }
                .padding(16)
            }
            .background(PixelColor.bg)
            .navigationTitle("")
            .toolbar {
                ToolbarItem(placement: .principal) {
                    Text("PROFILE")
                        .font(.pixel(12))
                        .foregroundColor(PixelColor.xp)
                }
            }
        }
    }

    func statRow(_ label: String, value: String) -> some View {
        HStack {
            Text(label)
                .foregroundColor(PixelColor.muted)
            Spacer()
            Text(value)
                .fontWeight(.semibold)
                .foregroundColor(PixelColor.fg)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
    }
}
