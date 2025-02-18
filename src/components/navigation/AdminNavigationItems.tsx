
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, Activity, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const AdminNavigationItems = () => {
  const location = useLocation();

  const items = [
    {
      title: "Users",
      href: "/admin",
      icon: Users
    },
    {
      title: "Monitoring",
      href: "/monitoring",
      icon: Activity
    }
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className={cn(
            "flex items-center text-sm font-medium transition-colors",
            location.pathname.startsWith('/admin')
              ? "text-primary"
              : "text-muted-foreground"
          )}
        >
          Admin
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px] bg-background">
        {items.map((item) => (
          <DropdownMenuItem key={item.href} asChild>
            <Link
              to={item.href}
              className={cn(
                "flex w-full items-center px-2 py-2",
                location.pathname === item.href
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.title}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
