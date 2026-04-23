import SwiftUI

struct LoginView: View {
    @EnvironmentObject var authManager: AuthManager
    @State private var email = ""
    @State private var password = ""

    var body: some View {
        ZStack {
            PixelColor.bg.ignoresSafeArea()

            VStack(spacing: 24) {
                Spacer()

                // Logo
                HStack(spacing: 0) {
                    Text("study").foregroundColor(PixelColor.primary)
                    Text("pod").foregroundColor(PixelColor.fg)
                    Text(".ai").foregroundColor(PixelColor.accent)
                }
                .font(.pixel(16))

                Text("WELCOME BACK")
                    .font(.pixel(18))
                    .foregroundColor(PixelColor.fg)

                Text("Continue your quest")
                    .font(.subheadline)
                    .foregroundColor(PixelColor.muted)

                VStack(spacing: 16) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("EMAIL")
                            .font(.pixel(8))
                            .foregroundColor(PixelColor.muted)

                        TextField("your@email.com", text: $email)
                            .textFieldStyle(.plain)
                            .padding(14)
                            .background(PixelColor.surface)
                            .pixelBorder()
                            .foregroundColor(PixelColor.fg)
                            .autocapitalization(.none)
                            .keyboardType(.emailAddress)
                            .textContentType(.emailAddress)
                    }

                    VStack(alignment: .leading, spacing: 6) {
                        Text("PASSWORD")
                            .font(.pixel(8))
                            .foregroundColor(PixelColor.muted)

                        SecureField("••••••••", text: $password)
                            .textFieldStyle(.plain)
                            .padding(14)
                            .background(PixelColor.surface)
                            .pixelBorder()
                            .foregroundColor(PixelColor.fg)
                            .textContentType(.password)
                    }
                }

                if let error = authManager.error {
                    Text(error)
                        .font(.caption)
                        .foregroundColor(PixelColor.danger)
                        .padding(10)
                        .frame(maxWidth: .infinity)
                        .background(PixelColor.danger.opacity(0.1))
                        .pixelBorder(PixelColor.danger.opacity(0.3))
                }

                Button {
                    Task { await authManager.signIn(email: email, password: password) }
                } label: {
                    Group {
                        if authManager.isLoading {
                            ProgressView().tint(.white)
                        } else {
                            Text("LOG IN")
                                .font(.pixel(12))
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(PixelColor.primary)
                    .foregroundColor(.white)
                    .pixelBorder(PixelColor.primary)
                }
                .disabled(email.isEmpty || password.isEmpty || authManager.isLoading)
                .opacity(email.isEmpty || password.isEmpty ? 0.5 : 1)

                Spacer()
            }
            .padding(.horizontal, 24)
        }
    }
}
