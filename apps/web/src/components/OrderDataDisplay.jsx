import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calendar, MapPin, User, FileText, Activity, Phone, Mail, Users } from 'lucide-react';
import { format } from 'date-fns';

const OrderDataDisplay = ({ order, assignmentDate, assignedBy }) => {
  if (!order) return null;

  const product = order.expand?.product_id;

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="bg-secondary text-secondary-foreground pb-6">
          <div className="flex justify-between items-start gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider opacity-80 mb-1">Event Name</p>
              <CardTitle className="text-2xl leading-tight">{order.event_name}</CardTitle>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-background/20 rounded-full whitespace-nowrap">
              {order.status}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x border-b">
            <div className="p-6 space-y-4 bg-card text-card-foreground">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Event Details
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-muted-foreground block text-xs">Date</span>
                  <span className="font-medium">
                    {order.event_date ? format(new Date(order.event_date), 'EEEE, MMMM dd, yyyy') : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Location</span>
                  <span className="font-medium flex items-start gap-1">
                    <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    {order.event_location || 'N/A'}
                  </span>
                </div>
                {(order.number_of_guests || order.guests) && (
                  <div>
                    <span className="text-muted-foreground block text-xs">Expected Guests</span>
                    <span className="font-medium flex items-center gap-1">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      {order.number_of_guests || order.guests}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 space-y-4 bg-muted/10 text-card-foreground">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Customer Info
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-muted-foreground block text-xs">Name</span>
                  <span className="font-medium">{order.customer_name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Contact</span>
                  <div className="space-y-1 mt-1">
                    <span className="font-medium flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      {order.phone_number || 'N/A'}
                    </span>
                    {(order.email || order.customer_email) && (
                      <span className="font-medium flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        {order.email || order.customer_email}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-card text-card-foreground space-y-6">
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-primary" />
                Package & Requirements
              </h3>
              <div className="bg-muted/30 p-4 rounded-xl border border-border space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Package Type</span>
                    <span className="font-semibold text-base">{product?.package_name || 'Custom Package'}</span>
                  </div>
                </div>
                {product?.description && (
                  <div>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Package Description</span>
                    <div 
                      className="text-sm text-foreground/80 prose prose-sm max-w-none prose-p:leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: product.description }}
                    />
                  </div>
                )}
                {(order.special_requests || order.notes) && (
                  <div className="pt-2">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Special Requests / Notes</span>
                    <p className="text-sm italic border-l-2 border-primary/50 pl-3 py-1">
                      {order.special_requests || order.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                <span>Assigned: <strong className="text-foreground font-medium">{assignmentDate ? format(new Date(assignmentDate), 'MMM dd, yyyy') : 'N/A'}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>Assigned By: <strong className="text-foreground font-medium">{assignedBy || 'Admin'}</strong></span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderDataDisplay;