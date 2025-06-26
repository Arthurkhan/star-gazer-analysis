
import React from 'react'
import type { Review } from '@/types/reviews'
import { extractStaffMentions_sync } from '@/utils/dataUtils'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { UserIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface StaffMentionsProps {
  reviews: Review[];
  loading: boolean;
}

const StaffMentions: React.FC<StaffMentionsProps> = ({ reviews, loading }) => {
  const staffMentions = extractStaffMentions_sync(reviews)

  return (
    <div>
      <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
        Staff Mentioned {loading && <span className="text-sm font-normal text-gray-500">(AI-enhanced)</span>}
      </h3>

      {staffMentions.length === 0 ? (
        <div className="p-6 text-center bg-gray-50 dark:bg-gray-700/20 rounded-lg border">
          <UserIcon className="mx-auto h-10 w-10 text-gray-400 dark:text-gray-500 mb-2" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-300">No Staff Identified</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Our AI couldn't identify specific staff mentioned by name in the reviews.
          </p>
        </div>
      ) : (
        <Accordion type="single" collapsible className="w-full">
          {staffMentions.map((staff, index) => (
            <AccordionItem key={index} value={`staff-${index}`}>
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center">
                    <span className="font-medium text-gray-900 dark:text-white">{staff.name}</span>
                    <Badge className={`ml-2 ${
                      staff.sentiment === 'positive'
                        ? 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300'
                        : staff.sentiment === 'negative'
                        ? 'bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-600 dark:text-gray-300'
                    }`}>
                      {staff.sentiment}
                    </Badge>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {staff.count} mention{staff.count !== 1 ? 's' : ''}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pl-1 pt-2 pb-3">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Review Quotes:
                  </h4>
                  <ul className="space-y-2">
                    {staff.examples && staff.examples.map((example, idx) => (
                      <li key={idx} className="text-sm border-l-2 pl-3 py-1 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300">
                        "{example}"
                      </li>
                    ))}
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  )
}

export default StaffMentions
