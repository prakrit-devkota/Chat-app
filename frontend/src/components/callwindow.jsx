import { useState,useRef,useEffect } from "react";
import { Mic, MicOff, Phone, Video, VideoOff, X } from "lucide-react";

export default function CallWindow({ user, onClose }) {
	const [micEnabled, setMicEnabled] = useState(true);
	const [videoEnabled, setVideoEnabled] = useState(true)
    const [videoStream, setVideoStream] = useState(null);
    const videoRef = useRef(null);
    const [error, setError] = useState(null);
	const username = user?.username ?? "Unknown";
	const displayName = username.charAt(0).toUpperCase() + username.slice(1);
    useEffect(() => {
		let stream;
		let cancelled = false;

        async function getMedia() {
            try {
				stream = await navigator.mediaDevices.getUserMedia({
                    video: videoEnabled,
                    audio: micEnabled,
                });
				if (cancelled) {
					stream.getTracks().forEach((track) => track.stop());
					return;
				}
                setVideoStream(stream);
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Error accessing media devices:", err);
				if (!cancelled) {
					setError("Unable to access camera or microphone.");
				}
            }
        }
        getMedia();
        return () => {
            cancelled = true;
            stream?.getTracks().forEach((track) => track.stop());
        };
    }, [micEnabled, videoEnabled]);

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
			<section
				aria-labelledby="call-window-title"
				className="relative flex h-[80vh] w-[80vw] flex-col items-center justify-center overflow-hidden rounded-xl bg-slate-950 text-white shadow-2xl"
			>
				<video
					ref={videoRef}
					autoPlay
					muted
					playsInline
					className={`absolute inset-0 h-full w-full object-cover ${videoEnabled ? "" : "hidden"}`}
				/>
				<div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/60" />
				{error && (
					<p role="alert" className="absolute top-16 rounded-lg bg-black/60 px-4 py-2 text-sm text-white">
						{error}
					</p>
				)}
				<button
					type="button"
					onClick={onClose}
					aria-label="Close call window"
					title="Close"
					className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-slate-300 hover:bg-white/10 hover:text-white"
				>
					<X aria-hidden="true" size={20} />
				</button>

				{(!videoEnabled || !videoStream) && (
					<div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-800 text-slate-400">
						{videoEnabled ? (
							<span className="text-4xl font-semibold text-white">
								{username.charAt(0).toUpperCase() || "?"}
							</span>
						) : (
							<VideoOff aria-hidden="true" size={32} />
						)}
					</div>
				)}
				<div className="absolute left-6 top-6 rounded-lg bg-black/35 px-4 py-3 text-white backdrop-blur-sm">
					<h2 id="call-window-title" className="text-xl font-semibold">
						{displayName}
					</h2>
					<p className="mt-1 text-sm text-slate-200">
						{videoEnabled ? "Video on" : "Video off"}
						<span className="px-2 text-slate-400">·</span>
						{micEnabled ? "Microphone on" : "Microphone muted"}
					</p>
				</div>


				<div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-4">
					<button
						type="button"
						onClick={() => setMicEnabled((enabled) => !enabled)}
						aria-label={micEnabled ? "Mute microphone" : "Unmute microphone"}
						aria-pressed={!micEnabled}
						title={micEnabled ? "Mute microphone" : "Unmute microphone"}
						className={`flex h-14 w-14 items-center justify-center rounded-full transition-colors ${
							micEnabled
								? "bg-white/10 text-white hover:bg-white/20"
								: "bg-white text-slate-900 hover:bg-slate-200"
						}`}
					>
						{micEnabled ? <Mic aria-hidden="true" size={22} /> : <MicOff aria-hidden="true" size={22} />}
					</button>

					<button
						type="button"
						onClick={() => setVideoEnabled((enabled) => !enabled)}
						aria-label={videoEnabled ? "Turn camera off" : "Turn camera on"}
						aria-pressed={videoEnabled}
						title={videoEnabled ? "Turn camera off" : "Turn camera on"}
						className={`flex h-14 w-14 items-center justify-center rounded-full transition-colors ${
							videoEnabled
								? "bg-white/10 text-white hover:bg-white/20"
								: "bg-white text-slate-900 hover:bg-slate-200"
						}`}
					>
						{videoEnabled ? <Video aria-hidden="true" size={22} /> : <VideoOff aria-hidden="true" size={22} />}
					</button>

					<button
						type="button"
						onClick={onClose}
						aria-label="End call"
						title="End call"
						className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-600 text-white transition-colors hover:bg-rose-700"
					>
						<Phone aria-hidden="true" className="rotate-[135deg]" size={22} />
					</button>
				</div>
			</section>
		</div>
	);
}
