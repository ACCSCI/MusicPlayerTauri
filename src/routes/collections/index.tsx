import { createFileRoute } from '@tanstack/react-router';
import { usePlayerStore } from '../../stores/usePlayerStore';
export const Route = createFileRoute('/collections/')({
  component: CollectionsComponent,
})

function CollectionsComponent(){
    const {currentSong,playList} = usePlayerStore();
    return (<>
    <h1>Collections</h1>
    <ul>{playList.map(song=><li key={song.path}><button>{song.name}</button></li>)}</ul>
    </>)
}