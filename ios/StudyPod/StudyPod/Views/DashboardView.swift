import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var gameState: GameState

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    // Player card
                    HStack(spacing: 12) {
                        // Level
                        VStack(spacing: 4) {
                            Text("LV.\(gameState.level)")
                                .font(.pixel(20))
                                .foregroundColor(PixelColor.primary)
                            Text(gameState.title)
                                .font(.pixel(8))
                                .foregroundColor(PixelColor.accent)
                        }
                        .frame(width: 100)

                        // XP bar
                        VStack(alignment: .leading, spacing: 4) {
                            XPBarView(progress: gameState.xpProgress, isImminent: gameState.xpProgress > 0.8)
                            Text("\(gameState.xpToNextLevel) XP to next level")
                                .font(.pixel(7))
                                .foregroundColor(PixelColor.muted)
                        }
                    }
                    .padding(16)
                    .background(PixelColor.surface)
                    .pixelBorder()

                    // Stats row
                    HStack(spacing: 8) {
                        StatBox(label: "STREAK", value: "\(gameState.streak)", color: PixelColor.accent, icon: "flame.fill")
                        StatBox(label: "REVIEWED", value: "\(gameState.profile?.totalCardsReviewed ?? 0)", color: PixelColor.primary, icon: "checkmark.circle.fill")
                        StatBox(label: "BEST COMBO", value: "\(gameState.profile?.bestCombo ?? 0)x", color: PixelColor.xp, icon: "bolt.fill")
                    }

                    // Decks
                    if gameState.decks.isEmpty && !gameState.isLoading {
                        VStack(spacing: 12) {
                            Image(systemName: "rectangle.stack.badge.plus")
                                .font(.system(size: 40))
                                .foregroundColor(PixelColor.muted)
                            Text("No decks yet")
                                .foregroundColor(PixelColor.muted)
                            Text("Create decks on the web app")
                                .font(.caption)
                                .foregroundColor(PixelColor.muted.opacity(0.7))
                        }
                        .padding(40)
                    } else {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("YOUR DECKS")
                                .font(.pixel(10))
                                .foregroundColor(PixelColor.xp)
                                .padding(.top, 8)

                            ForEach(gameState.decks) { deck in
                                NavigationLink(destination: ReviewSessionView(deckId: deck.id, deckTopic: deck.topic)) {
                                    DeckRow(deck: deck, onPlay: {
                                        Task {
                                            let cards = try? await SupabaseService.shared.fetchFlashcards(deckId: deck.id)
                                            if let cards = cards {
                                                AudioPlayerManager.shared.loadDeckPlaylist(
                                                    deckId: deck.id,
                                                    deckTopic: deck.topic,
                                                    cards: cards,
                                                    coverUrl: deck.coverURL
                                                )
                                                AudioPlayerManager.shared.play()
                                            }
                                        }
                                    })
                                }
                            }
                        }
                    }
                }
                .padding(16)
            }
            .background(PixelColor.bg)
            .navigationTitle("")
            .toolbar {
                ToolbarItem(placement: .principal) {
                    HStack(spacing: 0) {
                        Text("study").foregroundColor(PixelColor.primary)
                        Text("pod").foregroundColor(PixelColor.fg)
                        Text(".ai").foregroundColor(PixelColor.accent)
                    }
                    .font(.pixel(12))
                }
            }
            .refreshable {
                await gameState.loadData()
            }
        }
    }
}

// MARK: - Subviews

struct StatBox: View {
    let label: String
    let value: String
    let color: Color
    let icon: String

    var body: some View {
        VStack(spacing: 6) {
            Image(systemName: icon)
                .foregroundColor(color)
            Text(value)
                .font(.pixel(14))
                .foregroundColor(color)
            Text(label)
                .font(.pixel(6))
                .foregroundColor(PixelColor.muted)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14)
        .background(PixelColor.surface)
        .pixelBorder()
    }
}

struct XPBarView: View {
    let progress: Double
    let isImminent: Bool

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: 3)
                    .fill(PixelColor.border)

                RoundedRectangle(cornerRadius: 3)
                    .fill(PixelColor.xp)
                    .frame(width: geo.size.width * max(0, min(1, progress)))
            }
        }
        .frame(height: 10)
        .opacity(isImminent ? 1 : 0.85)
        .animation(isImminent ? .easeInOut(duration: 0.8).repeatForever(autoreverses: true) : .default, value: isImminent)
    }
}

struct DeckRow: View {
    let deck: Deck
    var onPlay: (() -> Void)?

    var body: some View {
        HStack(spacing: 12) {
            // Cover image
            if let coverURL = deck.coverURL {
                AsyncImage(url: coverURL) { phase in
                    switch phase {
                    case .success(let image):
                        image.resizable().aspectRatio(1, contentMode: .fill)
                            .frame(width: 48, height: 48)
                            .clipShape(RoundedRectangle(cornerRadius: 4))
                    default:
                        deckCoverPlaceholder
                    }
                }
            } else {
                deckCoverPlaceholder
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(deck.topic)
                    .font(.headline)
                    .foregroundColor(PixelColor.fg)
                Text("\(deck.cardCount) cards")
                    .font(.caption)
                    .foregroundColor(PixelColor.muted)
            }
            Spacer()

            if let onPlay = onPlay {
                Button { onPlay() } label: {
                    Image(systemName: "headphones")
                        .font(.body)
                        .foregroundColor(PixelColor.accent)
                        .frame(width: 36, height: 36)
                }
                .buttonStyle(.plain)
            }

            Text("REVIEW")
                .font(.pixel(8))
                .foregroundColor(PixelColor.bg)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(PixelColor.primary)
                .pixelBorder(PixelColor.primary)
        }
        .padding(14)
        .background(PixelColor.surface)
        .pixelBorder()
    }

    var deckCoverPlaceholder: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 4)
                .fill(PixelColor.border)
            Image(systemName: "rectangle.stack.fill")
                .font(.caption)
                .foregroundColor(PixelColor.muted)
        }
        .frame(width: 48, height: 48)
    }
}
