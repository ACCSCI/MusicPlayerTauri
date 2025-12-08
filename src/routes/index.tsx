import { createFileRoute, Link } from '@tanstack/react-router'
import { open,ask } from '@tauri-apps/plugin-dialog';
import { convertFileSrc, invoke } from '@tauri-apps/api/core';
import { useState } from 'react';
import { usePlayerStore } from '../stores/usePlayerStore';
export const Route = createFileRoute('/')({
  component: Index,
})



function Index() {


  return (
    <>
      <h1>本来无一物，何处惹尘埃。</h1>
      <h2>想来点什么？</h2>
      <input type="text" placeholder="Xlarge" className="input input-xl" />
    </>
  )
}



