import { create } from 'zustand'
import { invoke } from '@tauri-apps/api/core'

interface Song{
  path:string
  name:string
}


interface PlayerState{
  // Data
  isPlaying:boolean
  volume:number
  playlist:Song[]
  currentSong:Song|null

  // Action
  togglePlay:()=>void
  setVolume:(val:number)=>void
  playSong:(song:Song)=>void

  // Async Action
  scanMusic:(path:string)=>Promise<void>
}

export const usePlayerStore = create<PlayerState>((set,get)=>({
  isPlaying:false,
  volume:100,
  playlist:[],
  currentSong:null,

  togglePlay:()=>set((state)=>({isPlaying:!state.isPlaying})),

  setVolume:(val)=>set({volume:val}),
  playSong:(song)=>set({currentSong:song,isPlaying:true}),

  scanMusic:async(path)=>{
    try{
      const songs:[Song]=await invoke('scan_music',{target_dir:path});
      set({playlist:songs})
    }catch(e){
      console.error("Rust翻车了:",e);
    }
  }
}))