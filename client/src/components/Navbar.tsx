'use client';

import { Settings, TrendingUpIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ModeToggle } from '@/components/mode-toggle';
import RatingHistoryModal from '@/components/RatingHistoryModal';

interface NavbarProps {
  onSettingsClick: () => void;
}

const Navbar = ({ onSettingsClick }: NavbarProps) => {
  return (
    <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-full mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <SidebarTrigger />
            <h1 className="text-xl font-semibold">AI Pasta</h1>
          </div>
          <div className="flex items-center space-x-2">
            <ModeToggle />
            <RatingHistoryModal>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="View Rating History"
              >
                <TrendingUpIcon className="h-4 w-4" />
                <span className="sr-only">Rating History</span>
              </Button>
            </RatingHistoryModal>
            <Button
              variant="ghost"
              size="icon"
              onClick={onSettingsClick}
              className="h-8 w-8"
            >
              <Settings className="h-4 w-4" />
              <span className="sr-only">Settings</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;