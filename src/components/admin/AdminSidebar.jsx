import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, BarChart3, Users2, Phone, GitBranch,
  Layers, FileText, Briefcase, BookOpen, Search, Newspaper,
  FlaskConical, Bot, Plug, Activity, UserCog, Settings, Database
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const NAV_ITEMS = [
  { label: "Overview", path: "/admin", icon: LayoutDashboard },
  { label: "Analytics", path: "/admin/analytics", icon: BarChart3 },
  { label: "Leads", path: "/admin/leads", icon: Users2 },
  { label: "Numbers", path: "/admin/numbers", icon: Phone },
  { label: "Decision Trees", path: "/admin/decision-trees", icon: GitBranch },
  { label: "Custom Fields", path: "/admin/custom-fields", icon: Database },
  { label: "Landing Pages", path: "/admin/landing-pages", icon: Layers },
  { label: "Pages", path: "/admin/pages", icon: FileText },
  { label: "Sponsors", path: "/admin/sponsors", icon: Users2 },
  { label: "Services", path: "/admin/services", icon: Briefcase },
  { label: "Blog Manager", path: "/admin/blog", icon: BookOpen },
  { label: "SEO Manager", path: "/admin/seo", icon: Search },
  { label: "Advertorials", path: "/admin/advertorials", icon: Newspaper },
  { label: "Experiments", path: "/admin/experiments", icon: FlaskConical },
  { label: "ChatBot", path: "/admin/chatbot", icon: Bot },
  { label: "Integrations", path: "/admin/integrations", icon: Plug },
  { label: "Tracking", path: "/admin/tracking", icon: Activity },
  { label: "Users", path: "/admin/users", icon: UserCog },
  { label: "Site Settings", path: "/admin/settings", icon: Settings },
];

export default function AdminSidebar({ collapsed, onToggle }) {
  const location = useLocation();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))] border-r border-[hsl(var(--sidebar-border))] transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Brand */}
      <Link
        to="/admin"
        className="flex items-center gap-3 px-4 h-16 border-b border-[hsl(var(--sidebar-border))] flex-shrink-0"
      >
        <img
          src="https://checkacase.com/wp-content/uploads/2023/11/CAC-Logo-White.png"
          alt="Check A Case"
          className={`h-7 w-auto transition-all ${collapsed ? "hidden" : ""}`}
        />
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
            CA
          </div>
        )}
      </Link>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-3">
        <nav className="space-y-0.5 px-2">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.path === "/admin"
                ? location.pathname === "/admin"
                : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                title={item.label}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-primary))]"
                    : "text-[hsl(var(--sidebar-foreground))]/70 hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-foreground))]"
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="p-3 border-t border-[hsl(var(--sidebar-border))] text-xs text-center opacity-50 hover:opacity-100 transition-opacity"
      >
        {collapsed ? "→" : "← Collapse"}
      </button>
    </aside>
  );
}