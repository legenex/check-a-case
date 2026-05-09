import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, Edit, Archive, ExternalLink, Clock, Cpu } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const STATUS_COLORS = {
  published: "bg-green-100 text-green-700",
  draft: "bg-gray-100 text-gray-600",
  scheduled: "bg-blue-100 text-blue-700",
  archived: "bg-red-100 text-red-600",
};

const TABS = ["all", "draft", "published", "scheduled", "archived"];

export default function BlogPostList({ onEdit, onNew }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: () => base44.entities.BlogPost.list("-updated_date", 200),
  });

  const archiveMut = useMutation({
    mutationFn: (id) => base44.entities.BlogPost.update(id, { status: "archived" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blog-posts"] }),
  });

  const filtered = posts.filter((p) => {
    const matchTab = activeTab === "all" || p.status === activeTab;
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.author || "").toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-3 py-1 rounded-full text-sm font-medium capitalize transition-colors ${
                activeTab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {t} {t === "all" ? `(${posts.length})` : `(${posts.filter((p) => p.status === t).length})`}
            </button>
          ))}
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search posts…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
          <Button onClick={onNew} size="sm" className="gap-1 whitespace-nowrap">
            <Plus className="w-4 h-4" /> New Post
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center space-y-3">
            <p className="text-4xl">📝</p>
            <p className="font-semibold text-foreground">No posts yet</p>
            <p className="text-muted-foreground text-sm">Create your first post or use the Programmatic SEO wizard.</p>
            <Button onClick={onNew} size="sm"><Plus className="w-4 h-4 mr-1" />New Post</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((post) => (
            <Card key={post.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-start gap-4">
                {post.hero_image_url && (
                  <img src={post.hero_image_url} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0 hidden sm:block" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">{post.title}</p>
                      <p className="text-sm text-muted-foreground truncate">/{post.slug}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge className={`text-xs ${STATUS_COLORS[post.status]}`}>{post.status}</Badge>
                      {post.generated_by_ai && <Cpu className="w-3.5 h-3.5 text-purple-400" title="AI Generated" />}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                    {post.author && <span>{post.author}</span>}
                    {post.category && <span className="bg-muted px-2 py-0.5 rounded">{post.category}</span>}
                    {post.read_time_minutes > 0 && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.read_time_minutes}m read</span>}
                    {post.updated_date && <span>Updated {formatDistanceToNow(new Date(post.updated_date), { addSuffix: true })}</span>}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {post.status === "published" && (
                    <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer"
                      className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <button onClick={() => onEdit(post)}
                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  {post.status !== "archived" && (
                    <button onClick={() => { if (confirm("Archive this post?")) archiveMut.mutate(post.id); }}
                      className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                      <Archive className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}