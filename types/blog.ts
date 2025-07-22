export interface BlogPost {
  _id: string;
  title: string
  content: string
  excerpt: string
  image: string
  date: string
  author: string
  category: string
  status: "draft" | "published"
  likes: number
  views: number
}

export interface BlogComment {
  id: string
  postId: string
  author: {
    id: string
    name: string
    avatar?: string
  }
  content: string
  date: string
  likes: number
}
