import { usePlayerStore } from "../stores/usePlayerStore";

export default function PlayerBar(){
  const {isPlaying,volume,togglePlay,setVolume,currentSong}=usePlayerStore();

  return(
  <>
    <div className="">

      <audio controls src={currentSong?.path}></audio>
    </div>
  </>)
}