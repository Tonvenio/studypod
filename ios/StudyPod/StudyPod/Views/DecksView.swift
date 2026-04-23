import SwiftUI

struct DecksView: View {
    @EnvironmentObject var gameState: GameState

    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVStack(spacing: 8) {
                    ForEach(gameState.decks) { deck in
                        NavigationLink(destination: ReviewSessionView(deckId: deck.id, deckTopic: deck.topic)) {
                            DeckRow(deck: deck)
                        }
                    }
                }
                .padding(16)
            }
            .background(PixelColor.bg)
            .navigationTitle("")
            .toolbar {
                ToolbarItem(placement: .principal) {
                    Text("DECKS")
                        .font(.pixel(12))
                        .foregroundColor(PixelColor.xp)
                }
            }
            .refreshable {
                await gameState.loadData()
            }
        }
    }
}
