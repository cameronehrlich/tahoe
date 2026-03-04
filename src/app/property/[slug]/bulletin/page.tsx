"use client";

import { useEffect, useState } from "react";
import { useProperty } from "@/hooks/use-property";
import { api, BulletinPostWithAuthor } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function BulletinPage() {
  const { propertyId, isAdmin, loading } = useProperty();
  const [posts, setPosts] = useState<BulletinPostWithAuthor[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", body: "" });

  const fetchPosts = async () => {
    if (!propertyId) return;
    const data = await api.getBulletin(propertyId);
    setPosts(data.posts);
  };

  useEffect(() => {
    fetchPosts();
  }, [propertyId]);

  const handleCreate = async () => {
    if (!propertyId || !newPost.title) return;
    try {
      await api.createBulletinPost(propertyId, newPost);
      toast.success("Post created");
      setShowCreate(false);
      setNewPost({ title: "", body: "" });
      fetchPosts();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Admin Bulletin</h2>
        {isAdmin && (
          <Button onClick={() => setShowCreate(true)} className="bg-emerald-600 hover:bg-emerald-700">
            New Post
          </Button>
        )}
      </div>

      {posts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No bulletin posts yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{post.title}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  by {post.author.fullName} — {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </p>
              </CardHeader>
              {post.body && (
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{post.body}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Bulletin Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={newPost.title}
                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                placeholder="Post title"
              />
            </div>
            <div>
              <Label>Body</Label>
              <Textarea
                value={newPost.body}
                onChange={(e) => setNewPost({ ...newPost, body: e.target.value })}
                placeholder="Post content..."
                rows={4}
              />
            </div>
            <Button onClick={handleCreate} className="w-full bg-emerald-600 hover:bg-emerald-700">
              Create Post
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
