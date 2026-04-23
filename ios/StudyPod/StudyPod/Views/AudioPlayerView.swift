import SwiftUI

// MARK: - Full Player View (pushed onto nav stack)
struct AudioPlayerView: View {
    @ObservedObject var player = AudioPlayerManager.shared
    @Environment(\.dismiss) var dismiss

    var body: some View {
        ZStack {
            PixelColor.bg.ignoresSafeArea()

            VStack(spacing: 20) {
                // Cover Art
                if let coverUrl = player.currentItem?.coverUrl {
                    AsyncImage(url: coverUrl) { phase in
                        switch phase {
                        case .success(let image):
                            image.resizable().aspectRatio(1, contentMode: .fit)
                                .pixelBorder(PixelColor.primary.opacity(0.3))
                        default:
                            coverPlaceholder
                        }
                    }
                    .frame(width: 240, height: 240)
                } else {
                    coverPlaceholder
                        .frame(width: 240, height: 240)
                }

                // Track Info
                VStack(spacing: 6) {
                    Text(player.currentItem?.title ?? "No Track")
                        .font(.headline)
                        .foregroundColor(PixelColor.fg)
                        .lineLimit(2)
                        .multilineTextAlignment(.center)

                    Text(player.currentItem?.deckTopic ?? "")
                        .font(.caption)
                        .foregroundColor(PixelColor.muted)
                }

                // Progress Bar
                VStack(spacing: 4) {
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 2)
                                .fill(PixelColor.border)
                            RoundedRectangle(cornerRadius: 2)
                                .fill(PixelColor.primary)
                                .frame(width: geo.size.width * max(0, min(1, player.progress)))
                        }
                        .contentShape(Rectangle())
                        .gesture(
                            DragGesture(minimumDistance: 0)
                                .onChanged { value in
                                    let pct = value.location.x / geo.size.width
                                    player.seek(to: max(0, min(1, pct)) * player.duration)
                                }
                        )
                    }
                    .frame(height: 8)

                    HStack {
                        Text(AudioPlayerManager.formatTime(player.currentTime))
                            .font(.pixel(8))
                            .foregroundColor(PixelColor.muted)
                        Spacer()
                        Text(AudioPlayerManager.formatTime(player.duration))
                            .font(.pixel(8))
                            .foregroundColor(PixelColor.muted)
                    }
                }

                // Controls
                HStack(spacing: 32) {
                    Button { player.previous() } label: {
                        Image(systemName: "backward.fill")
                            .font(.title2)
                            .foregroundColor(player.hasPrevious ? PixelColor.fg : PixelColor.muted)
                    }
                    .disabled(!player.hasPrevious)

                    Button { player.togglePlayPause() } label: {
                        Image(systemName: player.isPlaying ? "pause.fill" : "play.fill")
                            .font(.system(size: 44))
                            .foregroundColor(PixelColor.accent)
                    }

                    Button { player.next() } label: {
                        Image(systemName: "forward.fill")
                            .font(.title2)
                            .foregroundColor(player.hasNext ? PixelColor.fg : PixelColor.muted)
                    }
                    .disabled(!player.hasNext)
                }

                // Speed control
                Button { player.cyclePlaybackRate() } label: {
                    Text("\(String(format: "%.2g", player.playbackRate))x")
                        .font(.pixel(10))
                        .foregroundColor(PixelColor.muted)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(PixelColor.surface)
                        .pixelBorder()
                }

                // Playlist count
                Text("\(player.currentIndex + 1) / \(player.playlist.count) cards")
                    .font(.pixel(8))
                    .foregroundColor(PixelColor.muted)

                Spacer()
            }
            .padding(24)
        }
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .principal) {
                Text("NOW PLAYING")
                    .font(.pixel(10))
                    .foregroundColor(PixelColor.xp)
            }
        }
    }

    var coverPlaceholder: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 4)
                .fill(PixelColor.surface)
            Image(systemName: "headphones")
                .font(.system(size: 48))
                .foregroundColor(PixelColor.primary.opacity(0.3))
        }
        .pixelBorder()
    }
}

// MARK: - Mini Player Bar (shown at bottom of tabs)
struct MiniPlayerBar: View {
    @ObservedObject var player = AudioPlayerManager.shared

    var body: some View {
        if player.currentItem != nil {
            NavigationLink(destination: AudioPlayerView()) {
                HStack(spacing: 10) {
                    // Mini cover
                    if let coverUrl = player.currentItem?.coverUrl {
                        AsyncImage(url: coverUrl) { phase in
                            switch phase {
                            case .success(let image):
                                image.resizable().aspectRatio(1, contentMode: .fill)
                                    .frame(width: 40, height: 40)
                                    .clipShape(RoundedRectangle(cornerRadius: 4))
                            default:
                                miniCoverPlaceholder
                            }
                        }
                    } else {
                        miniCoverPlaceholder
                    }

                    // Title
                    VStack(alignment: .leading, spacing: 2) {
                        Text(player.currentItem?.title ?? "")
                            .font(.caption)
                            .fontWeight(.semibold)
                            .foregroundColor(PixelColor.fg)
                            .lineLimit(1)
                        Text(player.currentItem?.deckTopic ?? "")
                            .font(.caption2)
                            .foregroundColor(PixelColor.muted)
                            .lineLimit(1)
                    }

                    Spacer()

                    // Play/Pause
                    Button { player.togglePlayPause() } label: {
                        Image(systemName: player.isPlaying ? "pause.fill" : "play.fill")
                            .font(.title3)
                            .foregroundColor(PixelColor.accent)
                            .frame(width: 44, height: 44)
                    }

                    // Next
                    Button { player.next() } label: {
                        Image(systemName: "forward.fill")
                            .font(.caption)
                            .foregroundColor(player.hasNext ? PixelColor.fg : PixelColor.muted)
                            .frame(width: 44, height: 44)
                    }
                    .disabled(!player.hasNext)
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(PixelColor.surface)
                .overlay(
                    // Progress line at top
                    GeometryReader { geo in
                        Rectangle()
                            .fill(PixelColor.primary)
                            .frame(width: geo.size.width * player.progress, height: 2)
                    },
                    alignment: .topLeading
                )
            }
            .buttonStyle(.plain)
        }
    }

    var miniCoverPlaceholder: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 4)
                .fill(PixelColor.border)
            Image(systemName: "headphones")
                .font(.caption)
                .foregroundColor(PixelColor.muted)
        }
        .frame(width: 40, height: 40)
    }
}

// MARK: - Playlist View
struct PlaylistView: View {
    @ObservedObject var player = AudioPlayerManager.shared
    @Environment(\.dismiss) var dismiss

    var body: some View {
        ZStack {
            PixelColor.bg.ignoresSafeArea()

            ScrollView {
                LazyVStack(spacing: 4) {
                    ForEach(Array(player.playlist.enumerated()), id: \.element.id) { index, item in
                        Button { player.skipTo(index: index) } label: {
                            HStack(spacing: 12) {
                                // Track number or playing indicator
                                if index == player.currentIndex && player.isPlaying {
                                    Image(systemName: "speaker.wave.2.fill")
                                        .font(.caption)
                                        .foregroundColor(PixelColor.accent)
                                        .frame(width: 24)
                                } else {
                                    Text("\(index + 1)")
                                        .font(.pixel(8))
                                        .foregroundColor(PixelColor.muted)
                                        .frame(width: 24)
                                }

                                VStack(alignment: .leading, spacing: 2) {
                                    Text(item.title)
                                        .font(.caption)
                                        .fontWeight(index == player.currentIndex ? .bold : .regular)
                                        .foregroundColor(index == player.currentIndex ? PixelColor.accent : PixelColor.fg)
                                        .lineLimit(1)
                                    Text(item.subtitle)
                                        .font(.caption2)
                                        .foregroundColor(PixelColor.muted)
                                        .lineLimit(1)
                                }

                                Spacer()
                            }
                            .padding(.horizontal, 14)
                            .padding(.vertical, 10)
                            .background(index == player.currentIndex ? PixelColor.primary.opacity(0.1) : Color.clear)
                        }
                    }
                }
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .principal) {
                Text("PLAYLIST (\(player.playlist.count))")
                    .font(.pixel(10))
                    .foregroundColor(PixelColor.xp)
            }
        }
    }
}
