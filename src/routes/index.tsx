import { createFileRoute, Link } from '@tanstack/react-router'
import { open,ask } from '@tauri-apps/plugin-dialog';
import { convertFileSrc, invoke } from '@tauri-apps/api/core';
import { useState } from 'react';
export const Route = createFileRoute('/')({
  component: Index,
})


interface MusicFile{
  name:string;
  path:string;
}

function Index() {
  const [musicSet,setMusicSet]=useState(()=>new Set<string>([]));
  const addMusic=(song:string)=>{
    setMusicSet((prevSet:Set<string>)=>new Set([...prevSet,song]));
  }
  const removeMusic=(song:string)=>{
    setMusicSet((prevSet:Set<string>)=>new Set([...prevSet].filter(item=>item!=song)));
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

  async function scanDir(){
    const dir = await open({
      multiple:false,
      directory:true,
    });

    const musics:[MusicFile]=await invoke('scan_music',{target_dir:dir});

    musics.forEach((i)=>addMusic(i.path));
  }

  return (
    <>
      <ul className="flex justify-around">
        <li>
            <Link to="/" >
              Home
            </Link>
        </li>
        <li>
            <Link to="/about" >
              About
            </Link>
        </li>
      
        <li>
            <Link to="/posts" >
              Posts
            </Link>
        </li>
      </ul>
      <hr />
      <div className="p-2">
        <h3>Welcome Home!</h3>
        <button className="btn btn-primary" onClick={chooseFile}>
          选择文件
        </button>
        <button className="btn btn-primary" onClick={scanDir}>
          选择文件夹
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
    </>
  )
}



