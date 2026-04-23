import AVFoundation
import MediaPlayer
import SwiftUI

// MARK: - Playlist Item
struct PlaylistItem: Identifiable {
    let id: String
    let title: String
    let subtitle: String
    let audioUrl: URL
    let coverUrl: URL?
    let deckId: String
    let deckTopic: String
}

// MARK: - Audio Player Manager
@MainActor
class AudioPlayerManager: ObservableObject {
    static let shared = AudioPlayerManager()

    @Published var playlist: [PlaylistItem] = []
    @Published var currentIndex: Int = 0
    @Published var isPlaying = false
    @Published var progress: Double = 0
    @Published var duration: Double = 0
    @Published var currentTime: Double = 0
    @Published var playbackRate: Float = 1.0

    private var player: AVPlayer?
    private var timeObserver: Any?

    var currentItem: PlaylistItem? {
        guard currentIndex >= 0, currentIndex < playlist.count else { return nil }
        return playlist[currentIndex]
    }

    var hasNext: Bool { currentIndex < playlist.count - 1 }
    var hasPrevious: Bool { currentIndex > 0 }

    private init() {
        setupAudioSession()
        setupRemoteCommands()
    }

    // MARK: - Audio Session

    private func setupAudioSession() {
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .spokenAudio)
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            print("Audio session error: \(error)")
        }
    }

    // MARK: - Playlist Management

    func loadDeckPlaylist(deckId: String, deckTopic: String, cards: [Flashcard], coverUrl: URL?) {
        playlist = cards.compactMap { card in
            guard let urlString = card.audioUrl, let url = URL(string: urlString) else { return nil }
            return PlaylistItem(
                id: card.id,
                title: "Card \(card.orderIndex + 1): \(card.front)",
                subtitle: deckTopic,
                audioUrl: url,
                coverUrl: coverUrl,
                deckId: deckId,
                deckTopic: deckTopic
            )
        }
        currentIndex = 0
        if !playlist.isEmpty {
            loadCurrentItem()
        }
    }

    func addToPlaylist(_ item: PlaylistItem) {
        playlist.append(item)
    }

    func clearPlaylist() {
        stop()
        playlist.removeAll()
        currentIndex = 0
    }

    // MARK: - Playback Controls

    func play() {
        if player == nil && !playlist.isEmpty {
            loadCurrentItem()
        }
        player?.play()
        player?.rate = playbackRate
        isPlaying = true
        updateNowPlaying()
    }

    func pause() {
        player?.pause()
        isPlaying = false
        updateNowPlaying()
    }

    func togglePlayPause() {
        isPlaying ? pause() : play()
    }

    func stop() {
        player?.pause()
        removeTimeObserver()
        player = nil
        isPlaying = false
        progress = 0
        currentTime = 0
        duration = 0
    }

    func next() {
        guard hasNext else { return }
        currentIndex += 1
        loadCurrentItem()
        if isPlaying { play() }
    }

    func previous() {
        // If more than 3 seconds in, restart current track
        if currentTime > 3 {
            seek(to: 0)
            return
        }
        guard hasPrevious else { return }
        currentIndex -= 1
        loadCurrentItem()
        if isPlaying { play() }
    }

    func skipTo(index: Int) {
        guard index >= 0, index < playlist.count else { return }
        currentIndex = index
        loadCurrentItem()
        play()
    }

    func seek(to time: Double) {
        let cmTime = CMTime(seconds: time, preferredTimescale: 600)
        player?.seek(to: cmTime)
        currentTime = time
        if duration > 0 { progress = time / duration }
    }

    func setPlaybackRate(_ rate: Float) {
        playbackRate = rate
        if isPlaying { player?.rate = rate }
    }

    func cyclePlaybackRate() {
        let rates: [Float] = [1.0, 1.25, 1.5, 1.75, 2.0]
        let idx = rates.firstIndex(of: playbackRate) ?? 0
        setPlaybackRate(rates[(idx + 1) % rates.count])
    }

    // MARK: - Private

    private func loadCurrentItem() {
        guard let item = currentItem else { return }

        removeTimeObserver()
        let playerItem = AVPlayerItem(url: item.audioUrl)

        if player == nil {
            player = AVPlayer(playerItem: playerItem)
        } else {
            player?.replaceCurrentItem(with: playerItem)
        }

        // Observe time
        timeObserver = player?.addPeriodicTimeObserver(
            forInterval: CMTime(seconds: 0.25, preferredTimescale: 600),
            queue: .main
        ) { [weak self] time in
            guard let self = self else { return }
            Task { @MainActor in
                self.currentTime = time.seconds
                if let dur = self.player?.currentItem?.duration.seconds, dur.isFinite, dur > 0 {
                    self.duration = dur
                    self.progress = time.seconds / dur
                }
            }
        }

        // Observe end of track
        NotificationCenter.default.removeObserver(self, name: .AVPlayerItemDidPlayToEndTime, object: nil)
        NotificationCenter.default.addObserver(
            forName: .AVPlayerItemDidPlayToEndTime,
            object: playerItem,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor in
                guard let self = self else { return }
                if self.hasNext {
                    self.next()
                } else {
                    self.isPlaying = false
                    self.updateNowPlaying()
                }
            }
        }

        updateNowPlaying()
    }

    private func removeTimeObserver() {
        if let observer = timeObserver {
            player?.removeTimeObserver(observer)
            timeObserver = nil
        }
    }

    // MARK: - Now Playing / Lock Screen

    private func setupRemoteCommands() {
        let center = MPRemoteCommandCenter.shared()

        center.playCommand.addTarget { [weak self] _ in
            Task { @MainActor in self?.play() }
            return .success
        }
        center.pauseCommand.addTarget { [weak self] _ in
            Task { @MainActor in self?.pause() }
            return .success
        }
        center.nextTrackCommand.addTarget { [weak self] _ in
            Task { @MainActor in self?.next() }
            return .success
        }
        center.previousTrackCommand.addTarget { [weak self] _ in
            Task { @MainActor in self?.previous() }
            return .success
        }
        center.changePlaybackPositionCommand.addTarget { [weak self] event in
            guard let event = event as? MPChangePlaybackPositionCommandEvent else { return .commandFailed }
            Task { @MainActor in self?.seek(to: event.positionTime) }
            return .success
        }
    }

    private func updateNowPlaying() {
        guard let item = currentItem else { return }

        var info: [String: Any] = [
            MPMediaItemPropertyTitle: item.title,
            MPMediaItemPropertyArtist: "studypod.ai",
            MPMediaItemPropertyAlbumTitle: item.deckTopic,
            MPNowPlayingInfoPropertyElapsedPlaybackTime: currentTime,
            MPMediaItemPropertyPlaybackDuration: duration,
            MPNowPlayingInfoPropertyPlaybackRate: isPlaying ? playbackRate : 0,
        ]

        // Load cover art async
        if let coverUrl = item.coverUrl {
            Task {
                if let (data, _) = try? await URLSession.shared.data(from: coverUrl),
                   let image = UIImage(data: data) {
                    let artwork = MPMediaItemArtwork(boundsSize: image.size) { _ in image }
                    info[MPMediaItemPropertyArtwork] = artwork
                    MPNowPlayingInfoCenter.default().nowPlayingInfo = info
                }
            }
        }

        MPNowPlayingInfoCenter.default().nowPlayingInfo = info
    }

    // MARK: - Formatting

    static func formatTime(_ seconds: Double) -> String {
        guard seconds.isFinite else { return "0:00" }
        let m = Int(seconds) / 60
        let s = Int(seconds) % 60
        return "\(m):\(String(format: "%02d", s))"
    }
}
