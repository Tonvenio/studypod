import SwiftUI

struct ReviewSessionView: View {
    let deckId: String
    let deckTopic: String

    @EnvironmentObject var gameState: GameState
    @Environment(\.dismiss) var dismiss

    @State private var cards: [ReviewCard] = []
    @State private var currentIndex = 0
    @State private var isFlipped = false
    @State private var isLoading = true
    @State private var isEmpty = false

    // Gamification
    @State private var combo = 0
    @State private var bestCombo = 0
    @State private var totalXpSession = 0
    @State private var correctCount = 0
    @State private var critsLanded = 0
    @State private var cardsLeveledUp = 0

    // Animations
    @State private var showCrit = false
    @State private var showComboLabel: String?
    @State private var showXpFloat: Int?
    @State private var showLoot: LootDrop?
    @State private var showMasteryUp: Int?
    @State private var shakeOffset: CGFloat = 0
    @State private var flipTime = Date()

    // Timer
    @State private var speedTimer: Double = 0
    @State private var timerActive = false
    @State private var timerRef: Timer?

    // Session complete
    @State private var isComplete = false

    var currentCard: ReviewCard? {
        guard currentIndex < cards.count else { return nil }
        return cards[currentIndex]
    }

    var body: some View {
        ZStack {
            PixelColor.bg.ignoresSafeArea()

            if isLoading {
                loadingView
            } else if isEmpty {
                emptyView
            } else if isComplete {
                summaryView
            } else if let card = currentCard {
                reviewView(card: card)
            }

            // Overlays
            if showCrit {
                critOverlay
            }
            if let label = showComboLabel {
                comboOverlay(label)
            }
            if let loot = showLoot {
                lootOverlay(loot)
            }
            if let tier = showMasteryUp {
                masteryOverlay(tier)
            }
        }
        .navigationBarBackButtonHidden(true)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button("Exit") { dismiss() }
                    .foregroundColor(PixelColor.muted)
            }
            ToolbarItem(placement: .principal) {
                HStack(spacing: 8) {
                    if combo >= 2 {
                        Text("\(combo)x")
                            .font(.pixel(10))
                            .foregroundColor(PixelColor.accent)
                    }
                    Text("+\(totalXpSession) XP")
                        .font(.pixel(8))
                        .foregroundColor(PixelColor.xp)
                }
            }
        }
        .task { await loadCards() }
        .onDisappear { stopTimer() }
    }

    // MARK: - Loading

    var loadingView: some View {
        VStack(spacing: 16) {
            ProgressView().tint(PixelColor.primary)
            Text("LOADING QUEST...")
                .font(.pixel(10))
                .foregroundColor(PixelColor.muted)
        }
    }

    var emptyView: some View {
        VStack(spacing: 16) {
            Text("NO QUESTS AVAILABLE")
                .font(.pixel(12))
                .foregroundColor(PixelColor.xp)
            Text("All cards are up to date!")
                .foregroundColor(PixelColor.muted)
            Button("RETURN TO BASE") { dismiss() }
                .font(.pixel(10))
                .padding(.horizontal, 24)
                .padding(.vertical, 14)
                .background(PixelColor.primary)
                .foregroundColor(.white)
                .pixelBorder(PixelColor.primary)
        }
    }

    // MARK: - Review

    func reviewView(card: ReviewCard) -> some View {
        VStack(spacing: 12) {
            // Progress
            HStack {
                Text("\(currentIndex + 1)/\(cards.count)")
                    .font(.pixel(8))
                    .foregroundColor(PixelColor.muted)

                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 2).fill(PixelColor.border)
                        RoundedRectangle(cornerRadius: 2).fill(PixelColor.primary)
                            .frame(width: geo.size.width * CGFloat(currentIndex + 1) / CGFloat(cards.count))
                    }
                }
                .frame(height: 6)

                if !isFlipped {
                    Text(String(format: "%.1fs", speedTimer))
                        .font(.pixel(8))
                        .foregroundColor(speedTimer <= 5 ? PixelColor.accent : speedTimer <= 10 ? PixelColor.xp : PixelColor.muted)
                        .monospacedDigit()
                }
            }
            .padding(.horizontal)

            // Mastery stars + new badge
            HStack {
                if card.isNew {
                    Text("NEW")
                        .font(.pixel(7))
                        .foregroundColor(PixelColor.primary)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(PixelColor.primary.opacity(0.15))
                }
                Text(String(repeating: "★", count: card.masteryTier) + String(repeating: "☆", count: 4 - card.masteryTier))
                    .font(.system(size: 12))
                    .foregroundColor(PixelColor.xp)
                Spacer()
                // Loot countdown
                let untilLoot = 25 - ((correctCount + currentIndex) % 25)
                if untilLoot <= 5 {
                    Text("CHEST IN \(untilLoot)!")
                        .font(.pixel(7))
                        .foregroundColor(PixelColor.xp)
                }
            }
            .padding(.horizontal)

            // Card
            ZStack {
                // Front
                if !isFlipped {
                    cardFace(
                        label: "QUESTION",
                        labelColor: PixelColor.primary,
                        text: card.flashcard.front,
                        hint: "TAP TO REVEAL",
                        borderColor: PixelColor.border
                    )
                    .transition(.opacity)
                }

                // Back
                if isFlipped {
                    VStack(spacing: 12) {
                        Text("ANSWER")
                            .font(.pixel(8))
                            .foregroundColor(PixelColor.accent)

                        Text(card.flashcard.back)
                            .font(.body)
                            .fontWeight(.medium)
                            .multilineTextAlignment(.center)

                        if let explanation = card.flashcard.explanation, !explanation.isEmpty {
                            Divider().background(PixelColor.border)
                            Text(explanation)
                                .font(.caption)
                                .foregroundColor(PixelColor.muted)
                                .multilineTextAlignment(.center)
                        }
                    }
                    .padding(20)
                    .frame(maxWidth: .infinity, minHeight: 200)
                    .background(PixelColor.surface)
                    .pixelBorder(PixelColor.primary.opacity(0.4))
                    .transition(.opacity)
                }
            }
            .onTapGesture {
                if !isFlipped {
                    withAnimation(.easeInOut(duration: 0.3)) {
                        isFlipped = true
                        flipTime = Date()
                        timerActive = false
                    }
                }
            }
            .offset(x: shakeOffset)
            .padding(.horizontal)

            // XP float
            if let xp = showXpFloat {
                Text("+\(xp) XP")
                    .font(.pixel(14))
                    .foregroundColor(PixelColor.xp)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
            }

            Spacer()

            // Grade buttons
            if isFlipped {
                gradeButtons
                    .transition(.move(edge: .bottom))
                    .padding(.horizontal)
            }

            Text(combo >= 3 ? "\(XPEngine.comboMultiplier(combo))x COMBO ACTIVE" : "TAP CARD TO FLIP")
                .font(.pixel(7))
                .foregroundColor(PixelColor.muted)
                .padding(.bottom, 8)
        }
        .onChange(of: currentIndex) {
            isFlipped = false
            speedTimer = 0
            timerActive = true
        }
        .onAppear {
            timerActive = true
            startTimer()
        }
    }

    func cardFace(label: String, labelColor: Color, text: String, hint: String, borderColor: Color) -> some View {
        VStack(spacing: 16) {
            Text(label)
                .font(.pixel(8))
                .foregroundColor(labelColor)

            Text(text)
                .font(.title3)
                .fontWeight(.semibold)
                .multilineTextAlignment(.center)

            Text(hint)
                .font(.pixel(7))
                .foregroundColor(PixelColor.muted)
        }
        .padding(20)
        .frame(maxWidth: .infinity, minHeight: 200)
        .background(PixelColor.surface)
        .pixelBorder(borderColor)
    }

    var gradeButtons: some View {
        HStack(spacing: 8) {
            gradeButton(.again, label: "AGAIN", color: PixelColor.danger)
            gradeButton(.hard, label: "HARD", color: PixelColor.xp, textColor: PixelColor.bg)
            gradeButton(.good, label: "GOOD", color: PixelColor.primary)
            gradeButton(.easy, label: "EASY", color: PixelColor.accent, textColor: PixelColor.bg)
        }
    }

    func gradeButton(_ grade: ReviewGrade, label: String, color: Color, textColor: Color = .white) -> some View {
        Button {
            Task { await submitGrade(grade) }
        } label: {
            Text(label)
                .font(.pixel(10))
                .foregroundColor(textColor)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(color)
                .pixelBorder(color)
        }
    }

    // MARK: - Overlays

    var critOverlay: some View {
        VStack(spacing: 4) {
            Text("CRITICAL!")
                .font(.pixel(28))
                .foregroundColor(PixelColor.danger)
            Text("3x XP")
                .font(.pixel(14))
                .foregroundColor(PixelColor.xp)
        }
        .transition(.scale.combined(with: .opacity))
    }

    func comboOverlay(_ label: String) -> some View {
        VStack(spacing: 4) {
            Text("\(label)!")
                .font(.pixel(20))
                .foregroundColor(PixelColor.accent)
            Text("\(XPEngine.comboMultiplier(combo))x MULTIPLIER")
                .font(.pixel(10))
                .foregroundColor(PixelColor.accent)
        }
        .transition(.scale.combined(with: .opacity))
    }

    func lootOverlay(_ loot: LootDrop) -> some View {
        VStack(spacing: 8) {
            Text("MYSTERY CHEST")
                .font(.pixel(10))
                .foregroundColor(PixelColor.muted)
            Text(loot.tier == "gold" ? "👑" : loot.tier == "silver" ? "🎁" : "📦")
                .font(.system(size: 48))
            Text(loot.tier.uppercased() + " CHEST")
                .font(.pixel(14))
                .foregroundColor(loot.tier == "gold" ? PixelColor.xp : loot.tier == "silver" ? PixelColor.primary : PixelColor.accent)
            Text("+\(loot.xp) XP")
                .font(.pixel(12))
                .foregroundColor(PixelColor.xp)
        }
        .padding(32)
        .background(PixelColor.surface)
        .pixelBorder()
        .transition(.scale.combined(with: .opacity))
    }

    func masteryOverlay(_ tier: Int) -> some View {
        VStack(spacing: 4) {
            Text("MASTERY UP!")
                .font(.pixel(10))
                .foregroundColor(PixelColor.xp)
            Text(String(repeating: "★", count: tier) + String(repeating: "☆", count: 4 - tier))
                .font(.title3)
            Text(XPEngine.masteryNames[safe: tier] ?? "")
                .font(.caption)
                .foregroundColor(PixelColor.muted)
        }
        .padding(16)
        .background(PixelColor.xp.opacity(0.15))
        .pixelBorder(PixelColor.xp.opacity(0.3))
        .transition(.move(edge: .bottom).combined(with: .opacity))
    }

    // MARK: - Summary

    var summaryView: some View {
        ScrollView {
            VStack(spacing: 16) {
                let accuracy = cards.isEmpty ? 0 : Int(Double(correctCount) / Double(cards.count) * 100)
                let perfect = correctCount == cards.count && !cards.isEmpty

                Text(perfect ? "PERFECT CLEAR!" : "QUEST COMPLETE!")
                    .font(.pixel(16))
                    .foregroundColor(PixelColor.xp)
                    .padding(.top, 24)

                // Stats grid
                LazyVGrid(columns: [.init(), .init()], spacing: 8) {
                    summaryStatBox(value: "+\(totalXpSession)", label: "XP EARNED", color: PixelColor.accent)
                    summaryStatBox(value: "\(accuracy)%", label: "ACCURACY", color: PixelColor.primary)
                    summaryStatBox(value: "\(bestCombo)x", label: "BEST COMBO", color: PixelColor.xp)
                    summaryStatBox(value: "\(critsLanded)", label: "CRITS LANDED", color: PixelColor.danger)
                }

                // XP bar
                VStack(spacing: 4) {
                    HStack {
                        Text("LV.\(gameState.level) \(gameState.title)")
                            .font(.pixel(8))
                            .foregroundColor(PixelColor.muted)
                        Spacer()
                        Text("\(gameState.xpToNextLevel) XP to next")
                            .font(.pixel(7))
                            .foregroundColor(PixelColor.muted)
                    }
                    XPBarView(progress: gameState.xpProgress, isImminent: false)
                }
                .padding(16)
                .background(PixelColor.surface)
                .pixelBorder()

                HStack(spacing: 12) {
                    Button {
                        resetSession()
                        Task { await loadCards() }
                    } label: {
                        Text("REVIEW AGAIN")
                            .font(.pixel(10))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(PixelColor.primary)
                            .foregroundColor(.white)
                            .pixelBorder(PixelColor.primary)
                    }

                    Button { dismiss() } label: {
                        Text("RETURN")
                            .font(.pixel(10))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(PixelColor.surface)
                            .foregroundColor(PixelColor.fg)
                            .pixelBorder()
                    }
                }
            }
            .padding(16)
        }
        .background(PixelColor.bg)
    }

    func summaryStatBox(value: String, label: String, color: Color) -> some View {
        VStack(spacing: 6) {
            Text(value)
                .font(.pixel(18))
                .foregroundColor(color)
            Text(label)
                .font(.pixel(7))
                .foregroundColor(PixelColor.muted)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .background(PixelColor.surface)
        .pixelBorder()
    }

    // MARK: - Logic

    func loadCards() async {
        isLoading = true
        do {
            cards = try await SupabaseService.shared.fetchDueCards(deckId: deckId)
            isEmpty = cards.isEmpty
        } catch {
            print("Load cards error: \(error)")
            isEmpty = true
        }
        isLoading = false
    }

    func submitGrade(_ grade: ReviewGrade) async {
        guard let card = currentCard else { return }
        let answerTimeMs = Int(Date().timeIntervalSince(flipTime) * 1000)

        do {
            let response = try await SupabaseService.shared.submitReview(
                flashcardId: card.id,
                grade: grade,
                answerTimeMs: answerTimeMs,
                comboCount: grade.isCorrect ? combo + 1 : 0,
                sessionCardIndex: currentIndex
            )

            gameState.updateFromReview(response)
            totalXpSession += response.xpAwarded

            // XP float
            if response.xpAwarded > 0 {
                withAnimation { showXpFloat = response.xpAwarded }
                DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
                    withAnimation { showXpFloat = nil }
                }
            }

            // Crit
            if response.isCrit {
                critsLanded += 1
                withAnimation(.spring()) { showCrit = true }
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
                    withAnimation { showCrit = false }
                }
            }

            // Loot
            if let loot = response.lootDrop {
                let delay: Double = response.isCrit ? 1.3 : 0.3
                DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
                    withAnimation(.spring()) { showLoot = loot }
                    DispatchQueue.main.asyncAfter(deadline: .now() + 2.5) {
                        withAnimation { showLoot = nil }
                    }
                }
            }

            // Mastery
            if response.masteryChanged && response.newMasteryTier > card.masteryTier {
                cardsLeveledUp += 1
                withAnimation { showMasteryUp = response.newMasteryTier }
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                    withAnimation { showMasteryUp = nil }
                }
            }

            // Combo
            if grade.isCorrect {
                combo += 1
                correctCount += 1
                bestCombo = max(bestCombo, combo)

                if let label = XPEngine.comboLabel(combo), combo >= 3 {
                    // Shake
                    withAnimation(.easeInOut(duration: 0.1).repeatCount(5)) {
                        shakeOffset = 4
                    }
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                        shakeOffset = 0
                    }

                    withAnimation(.spring()) { showComboLabel = label }
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) {
                        withAnimation { showComboLabel = nil }
                    }
                }
            } else {
                combo = 0
            }
        } catch {
            print("Review submit error: \(error)")
            // Local fallback: apply basic XP
            let fallbackXp = grade.isCorrect ? 8 : 3
            totalXpSession += fallbackXp
            if grade.isCorrect {
                combo += 1
                correctCount += 1
                bestCombo = max(bestCombo, combo)
            } else {
                combo = 0
            }
        }

        // Advance
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
            if currentIndex < cards.count - 1 {
                currentIndex += 1
            } else {
                withAnimation { isComplete = true }
            }
        }
    }

    func resetSession() {
        currentIndex = 0
        isFlipped = false
        isComplete = false
        combo = 0
        bestCombo = 0
        totalXpSession = 0
        correctCount = 0
        critsLanded = 0
        cardsLeveledUp = 0
    }

    func startTimer() {
        timerRef?.invalidate()
        timerRef = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { _ in
            if timerActive {
                speedTimer += 0.1
            }
        }
    }

    func stopTimer() {
        timerRef?.invalidate()
        timerRef = nil
    }
}

// MARK: - Safe Array Access
extension Array {
    subscript(safe index: Int) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}
