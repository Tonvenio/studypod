import SwiftUI

@MainActor
class AuthManager: ObservableObject {
    @Published var isAuthenticated = false
    @Published var isLoading = false
    @Published var error: String?
    @Published var userId: String?

    func checkSession() {
        Task {
            isAuthenticated = await SupabaseService.shared.isAuthenticated
            userId = await SupabaseService.shared.currentUserId
        }
    }

    func signIn(email: String, password: String) async {
        isLoading = true
        error = nil
        do {
            let uid = try await SupabaseService.shared.signIn(email: email, password: password)
            userId = uid
            isAuthenticated = true
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }

    func signOut() {
        Task {
            await SupabaseService.shared.signOut()
            isAuthenticated = false
            userId = nil
        }
    }
}
