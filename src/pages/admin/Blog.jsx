import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BlogPostList from "@/components/admin/blog/BlogPostList";
import BlogPostEditor from "@/components/admin/blog/BlogPostEditor";
import BlogSeoWizard from "@/components/admin/blog/BlogSeoWizard";

export default function Blog() {
  const [view, setView] = useState({ mode: "list", post: null }); // mode: list | edit | new

  if (view.mode === "edit" || view.mode === "new") {
    return (
      <BlogPostEditor
        post={view.post}
        onBack={() => setView({ mode: "list", post: null })}
        onSaved={(p) => setView({ mode: "edit", post: p })}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Blog Manager</h1>
          <p className="text-muted-foreground mt-1">Manage posts, schedule publishing, and generate content at scale.</p>
        </div>
      </div>

      <Tabs defaultValue="posts">
        <TabsList>
          <TabsTrigger value="posts">All Posts</TabsTrigger>
          <TabsTrigger value="seo-wizard">Programmatic SEO</TabsTrigger>
        </TabsList>
        <TabsContent value="posts" className="mt-4">
          <BlogPostList
            onEdit={(post) => setView({ mode: "edit", post })}
            onNew={() => setView({ mode: "new", post: null })}
          />
        </TabsContent>
        <TabsContent value="seo-wizard" className="mt-4">
          <BlogSeoWizard onPostsCreated={() => setView({ mode: "list", post: null })} />
        </TabsContent>
      </Tabs>
    </div>
  );
}