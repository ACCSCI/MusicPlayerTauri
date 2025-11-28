import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/posts/')({
  component: PostsComponent,
})

function PostsComponent(){
    return (<h1>This is a Post</h1>)
}