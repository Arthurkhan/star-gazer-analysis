
import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContentLarge,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogScrollArea,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  saveBusinessContext,
  getBusinessContext,
  COMMON_CURRENCIES,
  getDefaultCurrency,
  type BusinessContext,
} from '@/utils/businessContext'
import type { BusinessType } from '@/types/businessTypes'
import {
  MapPin,
  Clock,
  Trophy,
  Target,
  FileText,
} from 'lucide-react'

interface BusinessDetailsDialogProps {
  businessName: string;
  businessType: BusinessType;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DELIVERY_APPS = ['UberEats', 'DoorDash', 'Grubhub', 'Deliveroo', 'JustEat', 'Other']

export function BusinessDetailsDialog({
  businessName,
  businessType,
  isOpen,
  onOpenChange,
}: BusinessDetailsDialogProps) {
  // Main context state for structured data
  const [context, setContext] = useState<BusinessContext>({
    businessType,
    location: {
      country: '',
      city: '',
      neighborhood: '',
    },
    operatingDays: [],
    peakHours: '',
    averageTransaction: '',
    seatingCapacity: undefined,
    currency: 'USD',
    specialties: [],
    priceRange: 'medium',
    customerTypes: [],
    mainCompetitors: [],
    uniqueSellingPoints: [],
    onlinePresence: {
      website: false,
      instagram: false,
      facebook: false,
      googleMyBusiness: false,
      deliveryApps: [],
    },
    currentChallenges: [],
    businessGoals: '',
    additionalContext: '',
  })

  // Raw string states for comma-separated fields to allow normal typing
  const [rawInputs, setRawInputs] = useState({
    specialties: '',
    customerTypes: '',
    mainCompetitors: '',
    uniqueSellingPoints: '',
    currentChallenges: '',
  })

  useEffect(() => {
    if (isOpen && businessName !== 'all') {
      const savedContext = getBusinessContext(businessName)
      if (savedContext) {
        setContext(prevContext => ({
          ...prevContext,
          ...savedContext,
          businessType,
          currency: savedContext.currency || 'USD',
        }))

        // Set raw inputs from saved arrays
        setRawInputs({
          specialties: savedContext.specialties?.join(', ') || '',
          customerTypes: savedContext.customerTypes?.join(', ') || '',
          mainCompetitors: savedContext.mainCompetitors?.join(', ') || '',
          uniqueSellingPoints: savedContext.uniqueSellingPoints?.join(', ') || '',
          currentChallenges: savedContext.currentChallenges?.join(', ') || '',
        })
      }
    }
  }, [businessName, businessType, isOpen])

  const handleSave = () => {
    if (businessName !== 'all') {
      // Process raw inputs into arrays before saving
      const processedContext = {
        ...context,
        specialties: rawInputs.specialties.split(',').map(s => s.trim()).filter(s => s),
        customerTypes: rawInputs.customerTypes.split(',').map(s => s.trim()).filter(s => s),
        mainCompetitors: rawInputs.mainCompetitors.split(',').map(s => s.trim()).filter(s => s),
        uniqueSellingPoints: rawInputs.uniqueSellingPoints.split(',').map(s => s.trim()).filter(s => s),
        currentChallenges: rawInputs.currentChallenges.split(',').map(s => s.trim()).filter(s => s),
      }

      saveBusinessContext(businessName, processedContext)
      onOpenChange(false)
    }
  }

  const updateRawInput = (field: keyof typeof rawInputs, value: string) => {
    setRawInputs({
      ...rawInputs,
      [field]: value,
    })
  }

  const updateLocation = (field: 'country' | 'city' | 'neighborhood', value: string) => {
    const newLocation = {
      ...context.location,
      [field]: value,
    }

    // Auto-update currency when country changes
    if (field === 'country' && value) {
      const defaultCurrency = getDefaultCurrency(value)
      if (context.currency === 'USD' || !context.currency) {
        setContext({
          ...context,
          location: newLocation,
          currency: defaultCurrency,
        })
        return
      }
    }

    setContext({
      ...context,
      location: newLocation,
    })
  }

  const updateOnlinePresence = (field: keyof typeof context.onlinePresence, value: boolean | string[]) => {
    setContext({
      ...context,
      onlinePresence: {
        ...context.onlinePresence,
        [field]: value,
      },
    })
  }

  const toggleOperatingDay = (day: string) => {
    const currentDays = context.operatingDays || []
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day]
    setContext({ ...context, operatingDays: newDays })
  }

  const toggleDeliveryApp = (app: string) => {
    const currentApps = context.onlinePresence?.deliveryApps || []
    const newApps = currentApps.includes(app)
      ? currentApps.filter(a => a !== app)
      : [...currentApps, app]
    updateOnlinePresence('deliveryApps', newApps)
  }

  const currencySymbol = COMMON_CURRENCIES.find(c => c.code === context.currency)?.symbol || '$'

  if (businessName === 'all') {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContentLarge>
        <DialogHeader>
          <DialogTitle>Business Details for {businessName}</DialogTitle>
          <DialogDescription>
            Provide comprehensive details to help AI generate more accurate and actionable recommendations.
          </DialogDescription>
        </DialogHeader>

        <DialogScrollArea>
          <Tabs defaultValue="location" className="w-full">
            <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full">
              <TabsTrigger value="location" className="text-xs sm:text-sm">
                <MapPin className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Location</span>
                <span className="sm:hidden">Loc</span>
              </TabsTrigger>
              <TabsTrigger value="operations" className="text-xs sm:text-sm">
                <Clock className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Operations</span>
                <span className="sm:hidden">Ops</span>
              </TabsTrigger>
              <TabsTrigger value="market" className="text-xs sm:text-sm">
                <Trophy className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Market</span>
                <span className="sm:hidden">Mkt</span>
              </TabsTrigger>
              <TabsTrigger value="goals" className="text-xs sm:text-sm">
                <Target className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Goals</span>
                <span className="sm:hidden">Goal</span>
              </TabsTrigger>
            </TabsList>

          <TabsContent value="location" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={context.location?.country || ''}
                  onChange={(e) => updateLocation('country', e.target.value)}
                  placeholder="e.g. Thailand"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={context.location?.city || ''}
                  onChange={(e) => updateLocation('city', e.target.value)}
                  placeholder="e.g. Bangkok"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="neighborhood">Neighborhood/District</Label>
                <Input
                  id="neighborhood"
                  value={context.location?.neighborhood || ''}
                  onChange={(e) => updateLocation('neighborhood', e.target.value)}
                  placeholder="e.g. Sukhumvit"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Operating Days</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DAYS_OF_WEEK.map(day => (
                  <div key={day} className="flex items-center space-x-2">
                    <Checkbox
                      id={day}
                      checked={context.operatingDays?.includes(day) || false}
                      onCheckedChange={() => toggleOperatingDay(day)}
                    />
                    <Label htmlFor={day} className="text-sm font-normal cursor-pointer">
                      {day.slice(0, 3)}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="peak-hours">Peak Business Hours</Label>
              <Input
                id="peak-hours"
                value={context.peakHours || ''}
                onChange={(e) => setContext({...context, peakHours: e.target.value})}
                placeholder="e.g. 12pm-2pm, 6pm-9pm"
              />
            </div>
          </TabsContent>

          <TabsContent value="operations" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price-range">Price Range</Label>
                <Select
                  value={context.priceRange || 'medium'}
                  onValueChange={(value: 'budget' | 'medium' | 'premium' | 'luxury') => setContext({...context, priceRange: value})}
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

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={context.currency || 'USD'}
                  onValueChange={(value) => setContext({...context, currency: value})}
                >
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_CURRENCIES.map(currency => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.code} ({currency.symbol}) - {currency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="avg-transaction">Average Transaction</Label>
              <Input
                id="avg-transaction"
                value={context.averageTransaction || ''}
                onChange={(e) => setContext({...context, averageTransaction: e.target.value})}
                placeholder={`e.g. ${currencySymbol}15-20`}
              />
            </div>

            {(businessType === 'cafe' || businessType === 'bar') && (
              <div className="space-y-2">
                <Label htmlFor="seating">Seating Capacity</Label>
                <Input
                  id="seating"
                  type="number"
                  value={context.seatingCapacity || ''}
                  onChange={(e) => setContext({...context, seatingCapacity: parseInt(e.target.value) || undefined})}
                  placeholder="e.g. 50"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="specialties">Business Specialties</Label>
              <Textarea
                id="specialties"
                value={rawInputs.specialties}
                onChange={(e) => updateRawInput('specialties', e.target.value)}
                placeholder="e.g. espresso, pastries, breakfast (comma separated)"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-types">Main Customer Types</Label>
              <Textarea
                id="customer-types"
                value={rawInputs.customerTypes}
                onChange={(e) => updateRawInput('customerTypes', e.target.value)}
                placeholder="e.g. tourists, business professionals, students (comma separated)"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Online Presence</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="website"
                    checked={context.onlinePresence?.website || false}
                    onCheckedChange={(checked) => updateOnlinePresence('website', checked)}
                  />
                  <Label htmlFor="website" className="cursor-pointer">Website</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="instagram"
                    checked={context.onlinePresence?.instagram || false}
                    onCheckedChange={(checked) => updateOnlinePresence('instagram', checked)}
                  />
                  <Label htmlFor="instagram" className="cursor-pointer">Instagram</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="facebook"
                    checked={context.onlinePresence?.facebook || false}
                    onCheckedChange={(checked) => updateOnlinePresence('facebook', checked)}
                  />
                  <Label htmlFor="facebook" className="cursor-pointer">Facebook</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="google"
                    checked={context.onlinePresence?.googleMyBusiness || false}
                    onCheckedChange={(checked) => updateOnlinePresence('googleMyBusiness', checked)}
                  />
                  <Label htmlFor="google" className="cursor-pointer">Google My Business</Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Delivery Apps</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {DELIVERY_APPS.map(app => (
                  <div key={app} className="flex items-center space-x-2">
                    <Checkbox
                      id={app}
                      checked={context.onlinePresence?.deliveryApps?.includes(app) || false}
                      onCheckedChange={() => toggleDeliveryApp(app)}
                    />
                    <Label htmlFor={app} className="text-sm font-normal cursor-pointer">
                      {app}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="market" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="competitors">Main Competitors</Label>
              <Textarea
                id="competitors"
                value={rawInputs.mainCompetitors}
                onChange={(e) => updateRawInput('mainCompetitors', e.target.value)}
                placeholder="e.g. Starbucks, Blue Bottle Coffee (comma separated)"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="usp">Unique Selling Points</Label>
              <Textarea
                id="usp"
                value={rawInputs.uniqueSellingPoints}
                onChange={(e) => updateRawInput('uniqueSellingPoints', e.target.value)}
                placeholder="What makes your business special? (comma separated)"
                rows={3}
              />
            </div>
          </TabsContent>

          <TabsContent value="goals" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="challenges">Current Challenges</Label>
              <Textarea
                id="challenges"
                value={rawInputs.currentChallenges}
                onChange={(e) => updateRawInput('currentChallenges', e.target.value)}
                placeholder="e.g. low weekday traffic, staff retention, online visibility (comma separated)"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="goals">Business Goals (Next 3-6 months)</Label>
              <Textarea
                id="goals"
                value={context.businessGoals || ''}
                onChange={(e) => setContext({...context, businessGoals: e.target.value})}
                placeholder="What are your main objectives for the near future?"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="additional">
                <FileText className="w-4 h-4 inline mr-1" />
                Additional Context for AI
              </Label>
              <Textarea
                id="additional"
                value={context.additionalContext || ''}
                onChange={(e) => setContext({...context, additionalContext: e.target.value})}
                placeholder="Any other information that might help AI understand your business better? (e.g., recent renovations, seasonal patterns, special events, local community involvement, etc.)"
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                This information will be used to provide more personalized and relevant recommendations.
              </p>
            </div>
          </TabsContent>
          </Tabs>
        </DialogScrollArea>

        <DialogFooter className="flex justify-between mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Details</Button>
        </DialogFooter>
      </DialogContentLarge>
    </Dialog>
  )
}
