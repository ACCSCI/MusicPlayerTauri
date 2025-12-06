import { usePlayerStore } from "../stores/usePlayerStore";

export default function PlayerBar(){
  const {isPlaying,volume,togglePlay,setVolume}=usePlayerStore();

  return(
  <>
    <div className="">

      <audio controls></audio>
    </div>
  </>)
}