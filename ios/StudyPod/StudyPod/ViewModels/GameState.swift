import SwiftUI

@MainActor
class GameState: ObservableObject {
    @Published var profile: UserProfile?
    @Published var decks: [Deck] = []
    @Published var isLoading = false

    var level: Int { profile?.level ?? 1 }
    var xp: Int { profile?.xpPoints ?? 0 }
    var title: String { XPEngine.title(for: level) }
    var streak: Int { profile?.currentStreak ?? 0 }

    var xpProgress: Double {
        let currentLevelXp = XPEngine.xpForLevel(level)
        let nextLevelXp = XPEngine.xpForLevel(level + 1)
        let delta = nextLevelXp - currentLevelXp
        guard delta > 0 else { return 0 }
        return Double(xp - currentLevelXp) / Double(delta)
    }

    var xpToNextLevel: Int {
        XPEngine.xpForLevel(level + 1) - xp
    }

    func loadData() async {
        isLoading = true
        do {
            profile = try await SupabaseService.shared.fetchProfile()
            decks = try await SupabaseService.shared.fetchDecks()
        } catch {
            print("GameState load error: \(error)")
        }
        isLoading = false
    }

    func updateFromReview(_ response: ReviewResponse) {
        profile?.xpPoints = response.totalXp
        profile?.level = response.level
        if response.wasCorrect {
            profile?.totalCorrect = (profile?.totalCorrect ?? 0) + 1
        }
        profile?.totalCardsReviewed = (profile?.totalCardsReviewed ?? 0) + 1
        if response.isCrit {
            profile?.totalCrits = (profile?.totalCrits ?? 0) + 1
        }
    }
}
