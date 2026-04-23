import Foundation

// MARK: - User Profile
struct UserProfile: Codable {
    let id: String
    var username: String?
    var xpPoints: Int
    var level: Int
    var currentStreak: Int
    var longestStreak: Int
    var totalCardsReviewed: Int
    var totalCorrect: Int
    var bestCombo: Int
    var totalCrits: Int

    enum CodingKeys: String, CodingKey {
        case id, username, level
        case xpPoints = "xp_points"
        case currentStreak = "current_streak"
        case longestStreak = "longest_streak"
        case totalCardsReviewed = "total_cards_reviewed"
        case totalCorrect = "total_correct"
        case bestCombo = "best_combo"
        case totalCrits = "total_crits"
    }
}

// MARK: - Deck
struct Deck: Codable, Identifiable {
    let id: String
    var topic: String
    var description: String?
    var cardCount: Int
    var status: String
    var createdAt: String
    var coverImageUrl: String?

    enum CodingKeys: String, CodingKey {
        case id, topic, description, status
        case cardCount = "card_count"
        case createdAt = "created_at"
        case coverImageUrl = "cover_image_url"
    }

    var coverURL: URL? {
        guard let urlStr = coverImageUrl else { return nil }
        return URL(string: urlStr)
    }
}

// MARK: - Flashcard
struct Flashcard: Codable, Identifiable {
    let id: String
    var front: String
    var back: String
    var explanation: String?
    var difficulty: Int
    var audioUrl: String?
    var orderIndex: Int

    enum CodingKeys: String, CodingKey {
        case id, front, back, explanation, difficulty
        case audioUrl = "audio_url"
        case orderIndex = "order_index"
    }
}

// MARK: - Card Progress
struct CardProgress: Codable {
    var easeFactor: Double
    var intervalDays: Int
    var repetitions: Int
    var nextReviewAt: String
    var correctStreak: Int
    var totalReviews: Int
    var totalCorrect: Int
    var masteryTier: Int

    enum CodingKeys: String, CodingKey {
        case repetitions
        case easeFactor = "ease_factor"
        case intervalDays = "interval_days"
        case nextReviewAt = "next_review_at"
        case correctStreak = "correct_streak"
        case totalReviews = "total_reviews"
        case totalCorrect = "total_correct"
        case masteryTier = "mastery_tier"
    }
}

// MARK: - Review Card (combined for review session)
struct ReviewCard: Identifiable {
    let id: String
    let flashcard: Flashcard
    var progress: CardProgress?
    var isNew: Bool
    var masteryTier: Int
}

// MARK: - Review Grade
enum ReviewGrade: String, CaseIterable {
    case again, hard, good, easy

    var label: String { rawValue.uppercased() }

    var sm2Value: Int {
        switch self {
        case .again: return 0
        case .hard: return 3
        case .good: return 4
        case .easy: return 5
        }
    }

    var isCorrect: Bool { self != .again }
}

// MARK: - Review Response from API
struct ReviewResponse: Codable {
    let xpAwarded: Int
    let isCrit: Bool
    let lootDrop: LootDrop?
    let wasCorrect: Bool
    let newMasteryTier: Int
    let masteryChanged: Bool
    let totalXp: Int
    let level: Int
}

struct LootDrop: Codable {
    let tier: String
    let xp: Int
}

// MARK: - Due Cards Response
struct DueCardsResponse: Codable {
    let dueCards: [DueCard]
    let newCards: [Flashcard]
    let totalDue: Int
    let totalNew: Int
}

struct DueCard: Codable {
    let progressId: String?
    let flashcard: Flashcard
    let masteryTier: Int
    let correctStreak: Int
    let totalReviews: Int
    let nextReviewAt: String
    let isOverdue: Bool
}

// MARK: - Auth
struct AuthSession {
    let accessToken: String
    let refreshToken: String
    let userId: String
}
