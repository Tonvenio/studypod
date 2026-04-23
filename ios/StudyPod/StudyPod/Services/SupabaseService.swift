import Foundation

// MARK: - Supabase Configuration
enum SupabaseConfig {
    // Reads from Info.plist or falls back to local dev defaults
    static let url: String = {
        Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as? String
            ?? "http://127.0.0.1:54421"
    }()

    static let anonKey: String = {
        Bundle.main.object(forInfoDictionaryKey: "SUPABASE_ANON_KEY") as? String
            ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
    }()

    static let webAppUrl: String = {
        Bundle.main.object(forInfoDictionaryKey: "WEB_APP_URL") as? String
            ?? "http://127.0.0.1:3011"
    }()
}

// MARK: - Supabase Client
actor SupabaseService {
    static let shared = SupabaseService()

    private var accessToken: String?
    private var refreshToken: String?
    private var userId: String?

    private init() {}

    var isAuthenticated: Bool {
        accessToken != nil
    }

    var currentUserId: String? {
        userId
    }

    // MARK: - Auth

    func signIn(email: String, password: String) async throws -> String {
        let url = URL(string: "\(SupabaseConfig.url)/auth/v1/token?grant_type=password")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(SupabaseConfig.anonKey, forHTTPHeaderField: "apikey")

        let body: [String: String] = ["email": email, "password": password]
        request.httpBody = try JSONEncoder().encode(body)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            let errorBody = String(data: data, encoding: .utf8) ?? "Unknown error"
            throw SupabaseError.authFailed(errorBody)
        }

        let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        guard let token = json?["access_token"] as? String,
              let refresh = json?["refresh_token"] as? String,
              let user = json?["user"] as? [String: Any],
              let uid = user["id"] as? String else {
            throw SupabaseError.invalidResponse
        }

        self.accessToken = token
        self.refreshToken = refresh
        self.userId = uid

        return uid
    }

    func signOut() {
        accessToken = nil
        refreshToken = nil
        userId = nil
    }

    // MARK: - REST Helpers

    private func authorizedRequest(_ path: String, method: String = "GET", body: Data? = nil, query: String? = nil) -> URLRequest {
        var urlString = "\(SupabaseConfig.url)/rest/v1/\(path)"
        if let query = query { urlString += "?\(query)" }
        var request = URLRequest(url: URL(string: urlString)!)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(SupabaseConfig.anonKey, forHTTPHeaderField: "apikey")
        if let token = accessToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        if method == "POST" || method == "PATCH" {
            request.setValue("return=representation", forHTTPHeaderField: "Prefer")
        }
        request.httpBody = body
        return request
    }

    // MARK: - Profile

    func fetchProfile() async throws -> UserProfile {
        guard let uid = userId else { throw SupabaseError.notAuthenticated }
        let request = authorizedRequest("profiles", query: "id=eq.\(uid)&select=*")
        let (data, _) = try await URLSession.shared.data(for: request)
        let profiles = try JSONDecoder().decode([UserProfile].self, from: data)
        guard let profile = profiles.first else { throw SupabaseError.notFound }
        return profile
    }

    // MARK: - Decks

    func fetchDecks() async throws -> [Deck] {
        guard let uid = userId else { throw SupabaseError.notAuthenticated }
        let request = authorizedRequest("decks", query: "user_id=eq.\(uid)&select=*&order=created_at.desc&limit=20")
        let (data, _) = try await URLSession.shared.data(for: request)
        return try JSONDecoder().decode([Deck].self, from: data)
    }

    // MARK: - Flashcards

    func fetchFlashcards(deckId: String) async throws -> [Flashcard] {
        let request = authorizedRequest("flashcards", query: "deck_id=eq.\(deckId)&select=*&order=order_index.asc")
        let (data, _) = try await URLSession.shared.data(for: request)
        return try JSONDecoder().decode([Flashcard].self, from: data)
    }

    // MARK: - Card Progress

    func fetchCardProgress(flashcardId: String) async throws -> CardProgress? {
        guard let uid = userId else { throw SupabaseError.notAuthenticated }
        let request = authorizedRequest("card_progress", query: "user_id=eq.\(uid)&flashcard_id=eq.\(flashcardId)&select=*")
        let (data, _) = try await URLSession.shared.data(for: request)
        let results = try JSONDecoder().decode([CardProgress].self, from: data)
        return results.first
    }

    func fetchDueCards(deckId: String) async throws -> [ReviewCard] {
        guard let uid = userId else { throw SupabaseError.notAuthenticated }
        let now = ISO8601DateFormatter().string(from: Date())

        // Fetch due cards
        let dueRequest = authorizedRequest("card_progress",
            query: "user_id=eq.\(uid)&next_review_at=lte.\(now)&select=*,flashcards!inner(*)")
        let (dueData, _) = try await URLSession.shared.data(for: dueRequest)

        // Parse due cards (nested join)
        var reviewCards: [ReviewCard] = []
        if let jsonArray = try JSONSerialization.jsonObject(with: dueData) as? [[String: Any]] {
            for item in jsonArray {
                guard let fcData = item["flashcards"] as? [String: Any],
                      let fcId = fcData["id"] as? String,
                      let deckIdVal = fcData["deck_id"] as? String,
                      deckIdVal == deckId else { continue }

                let fc = Flashcard(
                    id: fcId,
                    front: fcData["front"] as? String ?? "",
                    back: fcData["back"] as? String ?? "",
                    explanation: fcData["explanation"] as? String,
                    difficulty: fcData["difficulty"] as? Int ?? 3,
                    audioUrl: fcData["audio_url"] as? String,
                    orderIndex: fcData["order_index"] as? Int ?? 0
                )
                let progress = CardProgress(
                    easeFactor: item["ease_factor"] as? Double ?? 2.5,
                    intervalDays: item["interval_days"] as? Int ?? 0,
                    repetitions: item["repetitions"] as? Int ?? 0,
                    nextReviewAt: item["next_review_at"] as? String ?? "",
                    correctStreak: item["correct_streak"] as? Int ?? 0,
                    totalReviews: item["total_reviews"] as? Int ?? 0,
                    totalCorrect: item["total_correct"] as? Int ?? 0,
                    masteryTier: item["mastery_tier"] as? Int ?? 0
                )
                reviewCards.append(ReviewCard(
                    id: fcId, flashcard: fc, progress: progress,
                    isNew: false, masteryTier: progress.masteryTier
                ))
            }
        }

        // Fetch new cards (no progress yet)
        let allCards = try await fetchFlashcards(deckId: deckId)
        let reviewedIds = Set(reviewCards.map(\.id))

        // Get all progress IDs for this user
        let progressRequest = authorizedRequest("card_progress", query: "user_id=eq.\(uid)&select=flashcard_id")
        let (progressData, _) = try await URLSession.shared.data(for: progressRequest)
        var allProgressIds = Set<String>()
        if let arr = try JSONSerialization.jsonObject(with: progressData) as? [[String: Any]] {
            for item in arr {
                if let fid = item["flashcard_id"] as? String { allProgressIds.insert(fid) }
            }
        }

        let newCards = allCards.filter { !reviewedIds.contains($0.id) && !allProgressIds.contains($0.id) }
        for card in newCards.prefix(10) {
            reviewCards.append(ReviewCard(
                id: card.id, flashcard: card, progress: nil,
                isNew: true, masteryTier: 0
            ))
        }

        return reviewCards
    }

    // MARK: - Submit Review

    func submitReview(flashcardId: String, grade: ReviewGrade, answerTimeMs: Int, comboCount: Int, sessionCardIndex: Int) async throws -> ReviewResponse {
        guard let uid = userId else { throw SupabaseError.notAuthenticated }

        let url = URL(string: "\(SupabaseConfig.webAppUrl)/api/review")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        // Pass auth cookie as header for API route
        if let token = accessToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let body: [String: Any] = [
            "flashcardId": flashcardId,
            "grade": grade.rawValue,
            "answerTimeMs": answerTimeMs,
            "comboCount": comboCount,
            "sessionCardIndex": sessionCardIndex
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            // Fallback: do local-only review
            return ReviewResponse(
                xpAwarded: grade.isCorrect ? 8 : 3,
                isCrit: false, lootDrop: nil,
                wasCorrect: grade.isCorrect,
                newMasteryTier: 0, masteryChanged: false,
                totalXp: 0, level: 1
            )
        }

        return try JSONDecoder().decode(ReviewResponse.self, from: data)
    }
}

// MARK: - Errors

enum SupabaseError: LocalizedError {
    case authFailed(String)
    case invalidResponse
    case notAuthenticated
    case notFound

    var errorDescription: String? {
        switch self {
        case .authFailed(let msg): return "Auth failed: \(msg)"
        case .invalidResponse: return "Invalid server response"
        case .notAuthenticated: return "Not signed in"
        case .notFound: return "Not found"
        }
    }
}
