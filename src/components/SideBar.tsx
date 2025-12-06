import {ClipboardPaste} from 'lucide-react'
export default function SideBar() {
  return (
    <div className="flex flex-col items-center">
      {/* 导航 */}
      <ul className="flex justify-evenly w-full my-2">
        <li>
          <a>首页</a>
        </li>
        <li>
          <a>探索</a>
        </li>
        <li>
          <a>设置</a>
        </li>
      </ul>
      {/* 导航 */}

      {/* 在线音乐 */}
      <div className="divider">在线音乐</div>
      <div className="flex">
        <input
          type="text"
          placeholder="Type here"
          className="input-lg bg-white rounded-3xl"
        />
        <button className="btn btn-circle">
          <ClipboardPaste />
        </button>
      </div>
      {/* 在线音乐 */}

      {/* 本地音乐 */}
      <div className="divider">本地音乐</div>
      <div className='flex gap-2'>
        <button className="btn ">Default</button>
        <button className="btn ">Default</button>
      </div>
      {/* 本地音乐 */}

      {/* 歌单 */}
      <div className="divider">歌单</div>
        <div className="flex flex-col">
          <button className="btn">❤我喜欢</button>
        </div>
      {/* 歌单 */}
    </div>
  );
}
