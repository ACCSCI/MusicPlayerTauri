import { convertFileSrc } from "@tauri-apps/api/core";
import { usePlayerStore } from "../stores/usePlayerStore";

export default function PlayerBar() {
  const { isPlaying, volume, togglePlay, setVolume, currentSong } =
    usePlayerStore();

  return (
    <>
      <div className="">
        <h1>{currentSong?.name}</h1>
        <audio
          controls
          src={currentSong?.path ? convertFileSrc(currentSong?.path) : ""}
          autoPlay
        ></audio>
      </div>
    </>
  );
}
