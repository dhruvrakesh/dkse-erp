import { useState } from "react"
import { NavLink, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  TrendingUp,
  FileText,
  Settings,
  Database,
  Inbox,
  User,
  LogOut,
  BarChart3,
  ClipboardList,
  Tag,
  Plus,
  Minus,
  AlertTriangle
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const mainItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Item Master", url: "/items", icon: Package },
  { title: "Stock Operations", url: "/stock", icon: ShoppingCart },
  { title: "Stock Summary", url: "/stock-summary", icon: BarChart3 },
  { title: "Stock Analytics", url: "/stock-analytics", icon: TrendingUp },
  { title: "Opening Stock", url: "/opening-stock", icon: Inbox },
  { title: "Opening Stock Summary", url: "/opening-stock-summary", icon: ClipboardList },
  { title: "Stock Alerts", url: "/stock-alerts", icon: AlertTriangle },
  { title: "Legacy Data", url: "/legacy", icon: Database },
]

const settingsItems = [
  { title: "Categories", url: "/categories", icon: Tag },
  { title: "Settings", url: "/settings", icon: Settings },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const { user, isAdmin, signOut } = useAuth()
  const location = useLocation()
  const currentPath = location.pathname
  const collapsed = state === "collapsed"

  const isActive = (path: string) => currentPath === path
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-accent text-accent-foreground font-medium" : "hover:bg-accent/50"

  return (
    <Sidebar
      className={collapsed ? "w-14" : "w-60"}
      collapsible="icon"
    >
      <SidebarTrigger className="m-2 self-end" />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>ERP System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="px-3 py-2 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4" />
                {!collapsed && (
                  <>
                    <span className="truncate">{user?.email}</span>
                    {isAdmin && <Badge variant="secondary" className="text-xs">Admin</Badge>}
                  </>
                )}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className={collapsed ? "w-8 h-8 p-0" : "w-full justify-start"}
                onClick={signOut}
              >
                <LogOut className="h-4 w-4" />
                {!collapsed && <span className="ml-2">Sign Out</span>}
              </Button>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  )
}