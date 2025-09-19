'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ThumbsUpIcon, ThumbsDownIcon, TrendingUpIcon, Trash2Icon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ResponseRating {
  messageId: string;
  model: string;
  rating: 'like' | 'dislike';
  timestamp: number;
  messageText: string;
}

interface ModelStats {
  model: string;
  likes: number;
  dislikes: number;
  total: number;
  likeRatio: number;
}

interface RatingHistoryModalProps {
  children: React.ReactNode;
}

const RatingHistoryModal = ({ children }: RatingHistoryModalProps) => {
  const [ratings, setRatings] = useState<ResponseRating[]>([]);
  const [modelStats, setModelStats] = useState<ModelStats[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadRatings();
    }
  }, [isOpen]);

  const loadRatings = () => {
    try {
      const savedRatings = localStorage.getItem('ai-chat-ratings');
      if (savedRatings) {
        const parsed: ResponseRating[] = JSON.parse(savedRatings);
        setRatings(parsed);

        // Calculate model stats
        const stats: { [key: string]: { likes: number; dislikes: number } } = {};

        parsed.forEach(rating => {
          if (!stats[rating.model]) {
            stats[rating.model] = { likes: 0, dislikes: 0 };
          }
          if (rating.rating === 'like') {
            stats[rating.model].likes++;
          } else {
            stats[rating.model].dislikes++;
          }
        });

        const modelStatsArray = Object.entries(stats).map(([model, data]) => ({
          model,
          likes: data.likes,
          dislikes: data.dislikes,
          total: data.likes + data.dislikes,
          likeRatio: data.likes + data.dislikes > 0 ? (data.likes / (data.likes + data.dislikes)) * 100 : 0
        }));

        // Sort by like ratio (descending), then by total ratings
        modelStatsArray.sort((a, b) => {
          if (b.likeRatio !== a.likeRatio) {
            return b.likeRatio - a.likeRatio;
          }
          return b.total - a.total;
        });

        setModelStats(modelStatsArray);
      }
    } catch (error) {
      console.error('Error loading ratings from localStorage:', error);
    }
  };

  const clearAllRatings = () => {
    if (confirm('Are you sure you want to clear all rating history? This action cannot be undone.')) {
      localStorage.removeItem('ai-chat-ratings');
      setRatings([]);
      setModelStats([]);
    }
  };

  const clearModelRatings = (model: string) => {
    if (confirm(`Are you sure you want to clear all ratings for ${model}?`)) {
      try {
        const savedRatings = localStorage.getItem('ai-chat-ratings');
        if (savedRatings) {
          const parsed: ResponseRating[] = JSON.parse(savedRatings);
          const filtered = parsed.filter(rating => rating.model !== model);
          localStorage.setItem('ai-chat-ratings', JSON.stringify(filtered));
          loadRatings(); // Reload the data
        }
      } catch (error) {
        console.error('Error clearing model ratings:', error);
      }
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return <Badge variant="default" className="bg-yellow-500 text-white">🥇 #1</Badge>;
      case 1:
        return <Badge variant="default" className="bg-gray-400 text-white">🥈 #2</Badge>;
      case 2:
        return <Badge variant="default" className="bg-orange-600 text-white">🥉 #3</Badge>;
      default:
        return <Badge variant="outline">#{index + 1}</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <TrendingUpIcon className="h-5 w-5" />
              Rating History & Model Performance
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllRatings}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2Icon className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-6">
          {/* Model Performance Summary */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Model Performance Ranking</h3>
            {modelStats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUpIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No rating data yet. Start rating model responses to see performance metrics!</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Rank</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead className="text-center w-24">👍 Likes</TableHead>
                      <TableHead className="text-center w-24">👎 Dislikes</TableHead>
                      <TableHead className="text-center w-24">Total</TableHead>
                      <TableHead className="text-center w-32">Like Ratio</TableHead>
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modelStats.map((stat, index) => (
                      <TableRow key={stat.model}>
                        <TableCell>
                          {getRankBadge(index)}
                        </TableCell>
                        <TableCell className="font-medium">{stat.model}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <ThumbsUpIcon className="h-4 w-4 text-green-600" />
                            <span className="font-semibold text-green-600">{stat.likes}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <ThumbsDownIcon className="h-4 w-4 text-red-600" />
                            <span className="font-semibold text-red-600">{stat.dislikes}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-semibold">{stat.total}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-semibold">{stat.likeRatio.toFixed(1)}%</span>
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500 transition-all"
                                style={{ width: `${stat.likeRatio}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => clearModelRatings(stat.model)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2Icon className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Recent Ratings */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Recent Ratings ({ratings.length} total)</h3>
            {ratings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No rating history found.</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead>Model</TableHead>
                      <TableHead className="w-20">Rating</TableHead>
                      <TableHead className="w-32">Date</TableHead>
                      <TableHead>Message Preview</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ratings
                      .sort((a, b) => b.timestamp - a.timestamp)
                      .map((rating, index) => (
                        <TableRow key={`${rating.messageId}-${index}`}>
                          <TableCell className="font-medium">{rating.model}</TableCell>
                          <TableCell>
                            {rating.rating === 'like' ? (
                              <ThumbsUpIcon className="h-4 w-4 text-green-600 fill-current" />
                            ) : (
                              <ThumbsDownIcon className="h-4 w-4 text-red-600 fill-current" />
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(rating.timestamp)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                            {rating.messageText}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RatingHistoryModal;