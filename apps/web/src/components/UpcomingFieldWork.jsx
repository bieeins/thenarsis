import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  Calendar, MapPin, Clock, ArrowRight, User, Package, AlertCircle, CalendarX2, Link as LinkIcon, Image as ImageIcon, ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { useUpcomingEvents } from '@/hooks/useUpcomingEvents.js';
import pb from '@/lib/pocketbaseClient.js';
import { validateAndFormatDesignLink } from '@/lib/validateAndFormatDesignLink.js';

const UpcomingFieldWork = () => {
  const { events, hasAnyEvents, loading, error } = useUpcomingEvents();
  const [enrichedEvents, setEnrichedEvents] = useState([]);

  useEffect(() => {
    // Enrich events with design links
    const fetchDesignLinks = async () => {
      if (!events || events.length === 0) {
        setEnrichedEvents([]);
        return;
      }

      try {
        const orderIds = events.map(e => `"${e.order_id}"`).join(',');
        const dWorks = await pb.collection('design_work').getFullList({
          filter: `order_id ?= [${orderIds}]`,
          $autoCancel: false
        });

        const updated = events.map(ev => {
          const matchingDesign = dWorks.find(dw => dw.order_id === ev.order_id);
          const linkInfo = matchingDesign?.design_file_link ? validateAndFormatDesignLink(matchingDesign.design_file_link) : null;
          return { ...ev, designLinkInfo: linkInfo };
        });

        setEnrichedEvents(updated);
      } catch (err) {
        // Fallback to basic events if fetch fails
        setEnrichedEvents(events);
      }
    };

    if (!loading) {
      fetchDesignLinks();
    }
  }, [events, loading]);

  const getStatusBadge = (status) => {
    const s = status || 'Unknown';
    switch(s.toLowerCase()) {
      case 'pending': 
        return <Badge className="bg-[#FBBF24]/15 text-[#B45309] dark:text-[#FBBF24] border-[#FBBF24]/30">{s}</Badge>;
      case 'in progress': 
        return <Badge className="bg-[#3B82F6]/15 text-[#1D4ED8] dark:text-[#3B82F6] border-[#3B82F6]/30">{s}</Badge>;
      case 'completed': 
        return <Badge className="bg-[#10B981]/15 text-[#047857] dark:text-[#10B981] border-[#10B981]/30">{s}</Badge>;
      case 'cancelled': 
        return <Badge className="bg-[#EF4444]/15 text-[#B91C1C] dark:text-[#EF4444] border-[#EF4444]/30">{s}</Badge>;
      default: 
        return <Badge className="bg-muted text-muted-foreground border-transparent">{s}</Badge>;
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 pt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-2xl p-5 border border-border">
              <Skeleton className="h-6 w-3/4 mb-3" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-destructive/5 rounded-2xl border border-destructive/10 text-center">
          <AlertCircle className="w-10 h-10 text-destructive mb-3" />
          <h4 className="text-foreground font-semibold">Unable to load upcoming events</h4>
          <p className="text-muted-foreground text-sm mt-1">{error}</p>
        </div>
      );
    }

    if (!hasAnyEvents || enrichedEvents.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-12 bg-muted/20 rounded-2xl border border-dashed border-border text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <CalendarX2 className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <h4 className="text-xl font-bold text-foreground mb-1">No upcoming field work</h4>
          <p className="text-muted-foreground max-w-sm">You have no events scheduled for the next 7 days. Enjoy your free time!</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 pt-2">
        {enrichedEvents.map((event) => (
          <div key={event.assignment_id} className="bg-card rounded-2xl p-5 border shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start gap-3 mb-4">
              <h3 className="font-bold text-lg leading-tight text-foreground line-clamp-2">
                {event.event_name || 'Unnamed Event'}
              </h3>
              <div className="shrink-0">{getStatusBadge(event.status)}</div>
            </div>

            <div className="space-y-3 mb-5 flex-1">
              <div className="flex items-start gap-2.5 text-sm">
                <User className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <span className="text-foreground font-medium line-clamp-1">{event.customer_name || 'Unknown Customer'}</span>
              </div>
              
              <div className="flex items-start gap-2.5 text-sm">
                <Calendar className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="text-foreground font-medium bg-primary/10 px-2 py-0.5 rounded-md text-primary">
                  {event.event_date ? format(new Date(event.event_date), 'MMM dd, yyyy') : 'No Date'}
                </span>
              </div>
              
              <div className="flex items-start gap-2.5 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <span className="text-muted-foreground">
                  {event.event_time ? format(new Date(event.event_time), 'HH:mm') : 'Time not set'}
                </span>
              </div>
              
              <div className="flex items-start gap-2.5 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <span className="text-muted-foreground line-clamp-2" title={event.event_location || 'No Location'}>
                  {event.event_location || 'No Location specified'}
                </span>
              </div>
            </div>

            {/* Design Link Area */}
            {event.designLinkInfo?.isValid && (
              <div className="mb-4 bg-muted p-3 rounded-xl border flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center shrink-0 shadow-sm border">
                    {event.designLinkInfo.isImage ? <ImageIcon className="w-4 h-4 text-primary" /> : <LinkIcon className="w-4 h-4 text-primary" />}
                  </div>
                  <div className="truncate text-xs">
                    <p className="font-semibold text-foreground">Assets Linked</p>
                    <a href={event.designLinkInfo.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate block">
                      {event.designLinkInfo.url}
                    </a>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-border mt-auto flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-md max-w-[60%] truncate">
                <Package className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{event.package_name || 'Standard Package'}</span>
              </div>
              <Button asChild size="sm" variant="default" className="shrink-0 group rounded-xl">
                <Link to={`/crew/events/${event.assignment_id}`}>
                  View Details <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border pb-5 bg-card gap-4">
        <div>
          <CardTitle className="text-xl">Upcoming Field Work (Next 7 Days)</CardTitle>
          <CardDescription className="text-base mt-1">Events requiring your presence on-site</CardDescription>
        </div>
        <Button asChild variant="outline" className="shrink-0 group">
          <Link to="/crew/events-directory">
            View Directory
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="p-6 bg-muted/10">
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default UpcomingFieldWork;