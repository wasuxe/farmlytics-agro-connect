import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Send, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Post {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    id: string;
    full_name: string;
    role: string;
    location: string | null;
  };
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string;
    role: string;
  };
}

const Community = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [commentContent, setCommentContent] = useState<{ [key: string]: string }>({});
  const [postComments, setPostComments] = useState<{ [key: string]: Comment[] }>({});
  const [showComments, setShowComments] = useState<{ [key: string]: boolean }>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCurrentUser();
    fetchPosts();
    
    const channel = supabase
      .channel('community-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_posts' }, fetchPosts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_comments' }, fetchPosts)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("community_posts")
      .select(`
        *,
        profiles:user_id (
          id,
          full_name,
          role,
          location
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error fetching posts", variant: "destructive" });
    } else {
      setPosts(data || []);
      data?.forEach(post => fetchComments(post.id));
    }
  };

  const fetchComments = async (postId: string) => {
    const { data, error } = await supabase
      .from("post_comments")
      .select(`
        *,
        profiles:user_id (
          full_name,
          role
        )
      `)
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setPostComments(prev => ({ ...prev, [postId]: data }));
    }
  };

  const createPost = async () => {
    if (!newPost.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("community_posts")
      .insert({ user_id: user.id, content: newPost });

    if (error) {
      toast({ title: "Error creating post", variant: "destructive" });
    } else {
      setNewPost("");
      toast({ title: "Post created successfully" });
    }
  };

  const deletePost = async (postId: string) => {
    const { error } = await supabase
      .from("community_posts")
      .delete()
      .eq("id", postId);

    if (error) {
      toast({ title: "Error deleting post", variant: "destructive" });
    } else {
      toast({ title: "Post deleted successfully" });
    }
  };

  const createComment = async (postId: string) => {
    const content = commentContent[postId];
    if (!content?.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("post_comments")
      .insert({ post_id: postId, user_id: user.id, content });

    if (error) {
      toast({ title: "Error adding comment", variant: "destructive" });
    } else {
      setCommentContent(prev => ({ ...prev, [postId]: "" }));
      fetchComments(postId);
    }
  };

  const toggleComments = (postId: string) => {
    setShowComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">Community Forum</h1>
          <Button onClick={() => navigate("/dashboard")} variant="outline">
            Back to Dashboard
          </Button>
        </div>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-primary">Create a Post</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Share your thoughts, ask questions, or discuss farming topics..."
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              className="min-h-[100px]"
            />
            <Button onClick={createPost} className="w-full">
              <Send className="mr-2 h-4 w-4" />
              Post
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id} className="border-primary/10">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Avatar className="cursor-pointer" onClick={() => navigate(`/profile/${post.profiles.id}`)}>
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {post.profiles.full_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p 
                          className="font-semibold text-foreground cursor-pointer hover:text-primary"
                          onClick={() => navigate(`/profile/${post.profiles.id}`)}
                        >
                          {post.profiles.full_name}
                        </p>
                        <div className="flex gap-2 text-sm text-muted-foreground">
                          <span className="capitalize">{post.profiles.role}</span>
                          {post.profiles.location && <span>• {post.profiles.location}</span>}
                          <span>• {new Date(post.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      {currentUserId === post.profiles.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deletePost(post.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
                    
                    <div className="pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleComments(post.id)}
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        {postComments[post.id]?.length || 0} Comments
                      </Button>
                    </div>

                    {showComments[post.id] && (
                      <div className="space-y-3 pt-4 border-t border-border">
                        <div className="space-y-2">
                          {postComments[post.id]?.map((comment) => (
                            <div key={comment.id} className="flex gap-3 pl-4">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                                  {comment.profiles.full_name[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="text-sm font-medium">{comment.profiles.full_name}</p>
                                <p className="text-sm text-muted-foreground">{comment.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2 pl-4">
                          <Textarea
                            placeholder="Write a comment..."
                            value={commentContent[post.id] || ""}
                            onChange={(e) => setCommentContent(prev => ({ ...prev, [post.id]: e.target.value }))}
                            className="min-h-[60px]"
                          />
                          <Button onClick={() => createComment(post.id)} size="sm">
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Community;