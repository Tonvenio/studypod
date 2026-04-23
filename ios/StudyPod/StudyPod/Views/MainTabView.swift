import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var authManager: AuthManager
    @EnvironmentObject var gameState: GameState
    @StateObject private var audioPlayer = AudioPlayerManager.shared

    var body: some View {
        VStack(spacing: 0) {
            TabView {
                DashboardView()
                    .tabItem {
                        Image(systemName: "gamecontroller.fill")
                        Text("Base")
                    }

                DecksView()
                    .tabItem {
                        Image(systemName: "rectangle.stack.fill")
                        Text("Decks")
                    }

                ProfileView()
                    .tabItem {
                        Image(systemName: "person.fill")
                        Text("Profile")
                    }
            }
            .tint(PixelColor.accent)

            // Mini player bar
            MiniPlayerBar(player: audioPlayer)
        }
        .onAppear {
            Task { await gameState.loadData() }

            let appearance = UITabBarAppearance()
            appearance.configureWithOpaqueBackground()
            appearance.backgroundColor = UIColor(PixelColor.surface)
            UITabBar.appearance().standardAppearance = appearance
            UITabBar.appearance().scrollEdgeAppearance = appearance
        }
    }
}
