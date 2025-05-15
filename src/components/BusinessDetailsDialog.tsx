import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { saveBusinessContext, getBusinessContext, BusinessContext } from '@/utils/businessContext';
import { BusinessType } from '@/types/businessTypes';

interface BusinessDetailsDialogProps {
  businessName: string;
  businessType: BusinessType;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BusinessDetailsDialog({
  businessName,
  businessType,
  isOpen,
  onOpenChange
}: BusinessDetailsDialogProps) {
  const [context, setContext] = useState<BusinessContext>({
    businessType,
    location: {
      country: '',
      city: ''
    },
    hoursType: 'standard',
    specialties: [],
    priceRange: 'medium',
    customerTypes: []
  });

  useEffect(() => {
    // Load existing context if available
    if (isOpen && businessName !== 'all') {
      const savedContext = getBusinessContext(businessName);
      if (savedContext) {
        setContext({...savedContext, businessType}); // Update with current businessType
      } else {
        // Reset to defaults with current businessType
        setContext({
          businessType,
          location: {
            country: '',
            city: ''
          },
          hoursType: 'standard',
          specialties: [],
          priceRange: 'medium',
          customerTypes: []
        });
      }
    }
  }, [businessName, businessType, isOpen]);

  const handleSave = () => {
    if (businessName !== 'all') {
      saveBusinessContext(businessName, context);
      onOpenChange(false);
    }
  };

  const handleSpecialtiesChange = (value: string) => {
    setContext({
      ...context,
      specialties: value.split(',').map(s => s.trim()).filter(s => s)
    });
  };

  const handleCustomerTypesChange = (value: string) => {
    setContext({
      ...context,
      customerTypes: value.split(',').map(s => s.trim()).filter(s => s)
    });
  };

  if (businessName === 'all') {
    return null; // Don't render for "All Businesses"
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Business Details</DialogTitle>
          <DialogDescription>
            Add details about {businessName} to enhance analysis and recommendations.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="country">Country</Label>
              <Input 
                id="country"
                value={context.location?.country || ''} 
                onChange={(e) => setContext({
                  ...context, 
                  location: {...(context.location || {}), country: e.target.value}
                })}
                placeholder="e.g. United States" 
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="city">City</Label>
              <Input 
                id="city"
                value={context.location?.city || ''} 
                onChange={(e) => setContext({
                  ...context, 
                  location: {...(context.location || {}), city: e.target.value}
                })}
                placeholder="e.g. New York" 
              />
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="price-range">Price Range</Label>
            <Select 
              value={context.priceRange || 'medium'}
              onValueChange={(value) => setContext({...context, priceRange: value as any})}
            >
              <SelectTrigger id="price-range">
                <SelectValue placeholder="Select price range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="budget">Budget ($)</SelectItem>
                <SelectItem value="medium">Mid-range ($$)</SelectItem>
                <SelectItem value="premium">Premium ($$$)</SelectItem>
                <SelectItem value="luxury">Luxury ($$$$)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="hours-type">Business Hours</Label>
            <Select 
              value={context.hoursType || 'standard'}
              onValueChange={(value) => setContext({...context, hoursType: value as any})}
            >
              <SelectTrigger id="hours-type">
                <SelectValue placeholder="Select hours profile" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard (9am-5pm)</SelectItem>
                <SelectItem value="extended">Extended (early/late)</SelectItem>
                <SelectItem value="evening">Evening/Night</SelectItem>
                <SelectItem value="24hour">24 Hours</SelectItem>
                <SelectItem value="weekends">Weekends Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="specialties">Business Specialties</Label>
            <Input 
              id="specialties"
              value={context.specialties?.join(', ') || ''} 
              onChange={(e) => handleSpecialtiesChange(e.target.value)}
              placeholder="e.g. espresso, pastries, breakfast (comma separated)" 
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="customer-types">Main Customer Types</Label>
            <Input 
              id="customer-types"
              value={context.customerTypes?.join(', ') || ''} 
              onChange={(e) => handleCustomerTypesChange(e.target.value)}
              placeholder="e.g. tourists, business, families (comma separated)" 
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Details</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
