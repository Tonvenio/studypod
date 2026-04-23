import SwiftUI

@main
struct StudyPodApp: App {
    @StateObject private var authManager = AuthManager()
    @StateObject private var gameState = GameState()

    var body: some Scene {
        WindowGroup {
            Group {
                if authManager.isAuthenticated {
                    MainTabView()
                        .environmentObject(authManager)
                        .environmentObject(gameState)
                } else {
                    LoginView()
                        .environmentObject(authManager)
                }
            }
            .preferredColorScheme(.dark)
            .onAppear {
                authManager.checkSession()
            }
        }
    }
}
