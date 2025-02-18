
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, Activity, Settings } from 'lucide-react';
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
    <nav className="flex items-center space-x-4 lg:space-x-6">
      {items.map((item) => (
        <Link
          key={item.href}
          to={item.href}
          className={cn(
            "flex items-center text-sm font-medium transition-colors hover:text-primary",
            location.pathname === item.href
              ? "text-primary"
              : "text-muted-foreground"
          )}
        >
          <item.icon className="h-4 w-4 mr-2" />
          {item.title}
        </Link>
      ))}
    </nav>
  );
};
