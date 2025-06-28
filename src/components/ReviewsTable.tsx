import { useState, useEffect, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog'
import { type Review, reviewFieldAccessor } from '@/types/reviews'
import { formatDistanceToNow } from 'date-fns'
import {
  Search,
  Eye,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Filter,
} from 'lucide-react'
import { MobileReviewsList } from '@/components/reviews/MobileReviewCard'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

interface ReviewsTableProps {
  reviews: Review[]
}

const ReviewsTable = ({ reviews }: ReviewsTableProps) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRating, setFilterRating] = useState('all')
  const [filterTimeframe, setFilterTimeframe] = useState('all')
  const [filterResponse, setFilterResponse] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState('desc')
  const [filteredReviews, setFilteredReviews] = useState<Review[]>(reviews)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [reviewsPerPage, setReviewsPerPage] = useState(25)
  const [virtualizedView, setVirtualizedView] = useState(true)
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // Check if we're on a mobile device
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Apply filters and sorting when dependencies change
  useEffect(() => {
    let results = [...reviews]

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      results = results.filter(
        review =>
          review.text?.toLowerCase().includes(term) ||
          (review.textTranslated &&
            review.textTranslated.toLowerCase().includes(term)) ||
          review.name?.toLowerCase().includes(term),
      )
    }

    // Apply rating filter
    if (filterRating !== 'all') {
      results = results.filter(
        review => review.stars === parseInt(filterRating),
      )
    }

    // Apply timeframe filter
    if (filterTimeframe !== 'all') {
      const now = new Date()
      const cutoffDate = new Date()

      switch (filterTimeframe) {
        case '30days':
          cutoffDate.setDate(now.getDate() - 30)
          break
        case '3months':
          cutoffDate.setMonth(now.getMonth() - 3)
          break
        case '6months':
          cutoffDate.setMonth(now.getMonth() - 6)
          break
        case '1year':
          cutoffDate.setFullYear(now.getFullYear() - 1)
          break
        default:
          break
      }

      results = results.filter(
        review => new Date(review.publishedAtDate) >= cutoffDate,
      )
    }

    // Apply response filter
    if (filterResponse !== 'all') {
      if (filterResponse === 'yes') {
        results = results.filter(review => {
          const responseText = reviewFieldAccessor.getResponseText(review)
          return responseText && responseText.trim().length > 0
        })
      } else {
        results = results.filter(review => {
          const responseText = reviewFieldAccessor.getResponseText(review)
          return !responseText || responseText.trim().length === 0
        })
      }
    }

    // Apply sorting
    results.sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.publishedAtDate || 0).getTime()
        const dateB = new Date(b.publishedAtDate || 0).getTime()
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
      } else if (sortBy === 'rating') {
        return sortOrder === 'desc' ? b.stars - a.stars : a.stars - b.stars
      } else {
        // Default to date sorting
        const dateA = new Date(a.publishedAtDate || 0).getTime()
        const dateB = new Date(b.publishedAtDate || 0).getTime()
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
      }
    })

    setFilteredReviews(results)
    setCurrentPage(1) // Reset to first page when filters change
  }, [
    reviews,
    searchTerm,
    filterRating,
    filterTimeframe,
    filterResponse,
    sortBy,
    sortOrder,
  ])

  // Calculate pagination
  const indexOfLastReview = currentPage * reviewsPerPage
  const indexOfFirstReview = indexOfLastReview - reviewsPerPage
  const currentReviews = filteredReviews.slice(
    indexOfFirstReview,
    indexOfLastReview,
  )
  const totalPages = Math.ceil(filteredReviews.length / reviewsPerPage)

  // Format date
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return `${formatDistanceToNow(date, { addSuffix: true })}`
    } catch (e) {
      return 'Unknown date'
    }
  }

  // Toggle sort order
  const toggleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc') // Default to descending when changing columns
    }
  }

  // Open dialog with full review
  const openReviewDialog = (review: Review) => {
    setSelectedReview(review)
    setIsDialogOpen(true)
  }

  // Toggle between virtualized and paginated view
  const toggleView = useCallback(() => {
    setVirtualizedView(!virtualizedView)
    // When switching to virtualized view, increase rows per page
    setReviewsPerPage(virtualizedView ? 25 : 1000)
  }, [virtualizedView])

  // Handle "Show All" button click
  const handleShowAll = useCallback(() => {
    setReviewsPerPage(filteredReviews.length || 1000)
    setVirtualizedView(false)
  }, [filteredReviews.length])

  // Mobile filter content
  const filterContent = (
    <div className='space-y-4 p-4'>
      <div className='space-y-4'>
        <Select value={filterRating} onValueChange={setFilterRating}>
          <SelectTrigger className='w-full'>
            <SelectValue placeholder='Filter by rating' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All ratings</SelectItem>
            <SelectItem value='5'>5 stars</SelectItem>
            <SelectItem value='4'>4 stars</SelectItem>
            <SelectItem value='3'>3 stars</SelectItem>
            <SelectItem value='2'>2 stars</SelectItem>
            <SelectItem value='1'>1 star</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterTimeframe} onValueChange={setFilterTimeframe}>
          <SelectTrigger className='w-full'>
            <SelectValue placeholder='Filter by timeframe' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All time</SelectItem>
            <SelectItem value='30days'>Last 30 days</SelectItem>
            <SelectItem value='3months'>Last 3 months</SelectItem>
            <SelectItem value='6months'>Last 6 months</SelectItem>
            <SelectItem value='1year'>Last year</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterResponse} onValueChange={setFilterResponse}>
          <SelectTrigger className='w-full'>
            <SelectValue placeholder='Filter by response' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All reviews</SelectItem>
            <SelectItem value='yes'>Has response</SelectItem>
            <SelectItem value='no'>No response</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={sortBy}
          onValueChange={value => {
            setSortBy(value)
            setSortOrder('desc')
          }}
        >
          <SelectTrigger className='w-full'>
            <SelectValue placeholder='Sort by' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='date'>Date</SelectItem>
            <SelectItem value='rating'>Rating</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  return (
    <Card className='shadow-md border-0 dark:bg-gray-800 mb-8'>
      <CardHeader>
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
          <div>
            <CardTitle>Reviews</CardTitle>
            <CardDescription>
              {filteredReviews.length} reviews match your filters
            </CardDescription>
          </div>
          <div className='flex items-center gap-2 w-full sm:w-auto'>
            <Select
              value={reviewsPerPage.toString()}
              onValueChange={value => setReviewsPerPage(parseInt(value))}
              disabled={isMobile}
            >
              <SelectTrigger className='w-[100px] sm:w-[130px]'>
                <SelectValue placeholder='Per page' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='10'>10</SelectItem>
                <SelectItem value='25'>25</SelectItem>
                <SelectItem value='50'>50</SelectItem>
                <SelectItem value='100'>100</SelectItem>
              </SelectContent>
            </Select>
            {!isMobile && (
              <>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={toggleView}
                  className='whitespace-nowrap hidden lg:inline-flex'
                >
                  {virtualizedView ? 'Paginated View' : 'Virtual Scroll'}
                </Button>
                <Button
                  variant='secondary'
                  size='sm'
                  onClick={handleShowAll}
                  className='whitespace-nowrap hidden md:inline-flex'
                >
                  Show All
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {/* Search & Filters */}
          <div className='flex flex-col md:flex-row gap-4'>
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-2.5 h-4 w-4 text-gray-400' />
              <Input
                placeholder='Search reviews...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='pl-10'
              />
            </div>

            {/* Mobile Filters */}
            {isMobile && (
              <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant='outline'
                    size='sm'
                    className='w-full sm:w-auto'
                  >
                    <Filter className='h-4 w-4 mr-2' />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side='bottom' className='h-[70vh]'>
                  <SheetHeader>
                    <SheetTitle>Filter Reviews</SheetTitle>
                  </SheetHeader>
                  {filterContent}
                </SheetContent>
              </Sheet>
            )}

            {/* Desktop Filters */}
            {!isMobile && (
              <div className='flex gap-4 flex-wrap md:flex-nowrap'>
                <Select value={filterRating} onValueChange={setFilterRating}>
                  <SelectTrigger className='w-[140px] lg:w-[180px]'>
                    <SelectValue placeholder='Filter by rating' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All ratings</SelectItem>
                    <SelectItem value='5'>5 stars</SelectItem>
                    <SelectItem value='4'>4 stars</SelectItem>
                    <SelectItem value='3'>3 stars</SelectItem>
                    <SelectItem value='2'>2 stars</SelectItem>
                    <SelectItem value='1'>1 star</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filterTimeframe}
                  onValueChange={setFilterTimeframe}
                >
                  <SelectTrigger className='w-[140px] lg:w-[180px]'>
                    <SelectValue placeholder='Filter by timeframe' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All time</SelectItem>
                    <SelectItem value='30days'>Last 30 days</SelectItem>
                    <SelectItem value='3months'>Last 3 months</SelectItem>
                    <SelectItem value='6months'>Last 6 months</SelectItem>
                    <SelectItem value='1year'>Last year</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filterResponse}
                  onValueChange={setFilterResponse}
                >
                  <SelectTrigger className='w-[140px] lg:w-[180px]'>
                    <SelectValue placeholder='Filter by response' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All reviews</SelectItem>
                    <SelectItem value='yes'>Has response</SelectItem>
                    <SelectItem value='no'>No response</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Mobile Reviews List */}
          {isMobile ? (
            <MobileReviewsList
              reviews={currentReviews}
              onViewFull={openReviewDialog}
            />
          ) : (
            /* Desktop Table */
            <div className='rounded-md border overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-[30%] min-w-[200px]'>
                      Reviewer
                    </TableHead>
                    <TableHead className='w-[45%] min-w-[300px]'>
                      Review
                    </TableHead>
                    <TableHead
                      className='w-[15%] cursor-pointer min-w-[120px]'
                      onClick={() => toggleSort('date')}
                    >
                      <div className='flex items-center gap-1'>
                        Date
                        {sortBy === 'date' ? (
                          sortOrder === 'desc' ? (
                            <ChevronDown className='h-4 w-4' />
                          ) : (
                            <ChevronUp className='h-4 w-4' />
                          )
                        ) : (
                          <ArrowUpDown className='h-4 w-4 opacity-50' />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className='w-[10%] text-right min-w-[80px]'>
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentReviews.length > 0 ? (
                    currentReviews.map((review, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className='space-y-1'>
                            <div className='text-xs text-gray-500 font-medium'>
                              {review.title}
                            </div>
                            <div className='font-medium'>{review.name}</div>
                            <div className='flex items-center'>
                              <span className='text-yellow-500 font-medium'>
                                {review.stars} ★
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='max-w-md truncate'>
                            {review.textTranslated || review.text}
                          </div>
                          {review.responseFromOwnerText && (
                            <div className='mt-1 text-xs text-gray-500 italic max-w-md truncate'>
                              Response: {review.responseFromOwnerText}
                            </div>
                          )}
                          <Button
                            variant='ghost'
                            size='sm'
                            className='mt-1 flex items-center gap-1 text-xs'
                            onClick={() => openReviewDialog(review)}
                          >
                            <Eye className='h-3 w-3' /> View Full Review
                          </Button>
                        </TableCell>
                        <TableCell className='whitespace-nowrap'>
                          {formatDate(review.publishedAtDate)}
                        </TableCell>
                        <TableCell className='text-right'>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant='ghost' size='sm'>
                                ···
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              <DropdownMenuItem
                                onClick={() =>
                                  window.open(review.reviewUrl, '_blank')
                                }
                              >
                                View Original
                              </DropdownMenuItem>
                              {!review.responseFromOwnerText && (
                                <DropdownMenuItem>
                                  Draft Response
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className='text-center h-24 text-gray-500'
                      >
                        No reviews found matching your filters
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='flex flex-col sm:flex-row items-center justify-between gap-4 py-4'>
              <div className='text-sm text-gray-500 text-center sm:text-left'>
                Showing {indexOfFirstReview + 1} to{' '}
                {Math.min(indexOfLastReview, filteredReviews.length)} of{' '}
                {filteredReviews.length} reviews
              </div>
              <div className='flex items-center gap-2 sm:gap-4'>
                <div className='flex items-center gap-1'>
                  <span className='text-sm text-gray-500 hidden sm:inline'>
                    Page
                  </span>
                  <Select
                    value={currentPage.toString()}
                    onValueChange={value => setCurrentPage(parseInt(value))}
                  >
                    <SelectTrigger className='w-[60px] sm:w-[70px] h-9'>
                      <SelectValue placeholder='Page' />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: totalPages }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className='text-sm text-gray-500'>of {totalPages}</span>
                </div>
                <div className='flex space-x-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className='text-xs sm:text-sm'
                  >
                    Previous
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className='text-xs sm:text-sm'
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      {/* Full Review Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className='max-w-[95vw] sm:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 pr-8'>
              <span className='text-yellow-500 font-medium'>
                {selectedReview?.stars} ★
              </span>
              <span className='truncate'>{selectedReview?.name}'s Review</span>
            </DialogTitle>
            <DialogDescription className='flex flex-col'>
              <span className='font-medium'>{selectedReview?.title}</span>
              <span>
                {selectedReview && formatDate(selectedReview.publishedAtDate)}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 py-4'>
            {/* Original language review text */}
            <div className='space-y-2'>
              <h3 className='font-medium text-sm sm:text-base'>
                Original Review:
              </h3>
              <p className='text-xs sm:text-sm whitespace-pre-line bg-gray-50 dark:bg-gray-900 p-3 rounded-md border'>
                {selectedReview?.text}
              </p>
            </div>

            {/* Translated text when available */}
            {selectedReview?.textTranslated && (
              <div className='space-y-2'>
                <h3 className='font-medium text-sm sm:text-base'>
                  Translated Review:
                </h3>
                <p className='text-xs sm:text-sm whitespace-pre-line bg-blue-50 dark:bg-blue-950/30 p-3 rounded-md border border-blue-100 dark:border-blue-900'>
                  {selectedReview.textTranslated}
                </p>
              </div>
            )}

            {/* Owner's response when available */}
            {selectedReview?.responseFromOwnerText && (
              <div className='space-y-2 border-t pt-4'>
                <h3 className='font-medium flex items-center text-sm sm:text-base'>
                  <span className='bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs px-2 py-1 rounded-full mr-2'>
                    Owner Response
                  </span>
                </h3>
                <p className='text-xs sm:text-sm whitespace-pre-line bg-green-50 dark:bg-green-950/30 p-3 rounded-md border border-green-100 dark:border-green-900'>
                  {selectedReview?.responseFromOwnerText}
                </p>
              </div>
            )}

            {/* Additional review metadata */}
            <div className='pt-2 mt-4 border-t'>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-500'>
                <div>
                  <span className='font-medium'>Review Date:</span>{' '}
                  {selectedReview &&
                    new Date(
                      selectedReview.publishedAtDate,
                    ).toLocaleDateString()}
                </div>
                <div>
                  <span className='font-medium'>Original Language:</span>{' '}
                  {selectedReview?.originalLanguage || 'Unknown'}
                </div>
              </div>
            </div>

            <div className='pt-4 flex flex-col sm:flex-row gap-2 sm:justify-between'>
              {selectedReview?.reviewUrl && (
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() =>
                    window.open(selectedReview.reviewUrl, '_blank')
                  }
                  className='w-full sm:w-auto'
                >
                  View Original Source
                </Button>
              )}
              <DialogClose asChild>
                <Button className='w-full sm:w-auto'>Close</Button>
              </DialogClose>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export default ReviewsTable
