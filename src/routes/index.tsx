import { createFileRoute } from '@tanstack/react-router'
import { open,ask } from '@tauri-apps/plugin-dialog';
import { convertFileSrc } from '@tauri-apps/api/core';
import { useState } from 'react';
export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  const [musicSet,setMusicSet]=useState(()=>new Set<string>([]));
  const addMusic=(song:string)=>{
    setMusicSet((prevSet:Set<string>)=>{
      const newSet = new Set(prevSet);
      newSet.add(song);
      return newSet;
    })
  }
  const removeMusic=(song:string)=>{
    setMusicSet((prevSet:Set<string>)=>{
      const newSet = new Set(prevSet);
      newSet.delete(song);
      return newSet;
    })
  }
  const clearAll=()=>{
    setMusicSet(new Set());
  }
  async function chooseFile() {
    const files = await open({
      multiple: true,
      directory: false,
    });
    console.log("你选中的文件：", files);
    files?.forEach(item=>{
      addMusic(item);
    });
  }

  return (
    <div className="p-2">
      <h3>Welcome Home!</h3>

      <button className="btn btn-primary" onClick={chooseFile}>
        选择文件
      </button>
      <ul className="menu bg-base-200 rounded-box w-56">
        {Array.from(musicSet).map((song:string)=>{
         return  (
         <li key={song}>
          {song}
          <audio controls src={convertFileSrc(song)}></audio>
          </li>
        )
        })}
      </ul>
     
    </div>
  )
}
