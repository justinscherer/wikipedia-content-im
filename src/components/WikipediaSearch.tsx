import { useState, useEffect, useRef } from 'react'
import { MagnifyingGlass } from '@phosphor-icons/react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface SearchResult {
  pageid: number
  title: string
  extract: string
  thumbnail?: {
    source: string
  }
}

interface WikipediaSearchProps {
  onArticleSelect: (title: string, pageid: number) => void
}

export function WikipediaSearch({ onArticleSelect }: WikipediaSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      setShowResults(false)
      return
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(async () => {
      setIsLoading(true)
      try {
        // Use OpenSearch API for reliable search results
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=${encodeURIComponent(query)}&limit=8&origin=*`
        
        const searchResponse = await fetch(searchUrl)
        const searchData = await searchResponse.json()
        
        if (searchData && searchData[1] && searchData[1].length > 0) {
          const titles = searchData[1]
          const descriptions = searchData[2] || []
          
          // Get additional page info including thumbnails and page IDs
          const titlesParam = titles.slice(0, 5).map((title: string) => encodeURIComponent(title)).join('|')
          const pageInfoUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&titles=${titlesParam}&prop=pageimages&piprop=thumbnail&pithumbsize=100&origin=*`
          
          let thumbnailData: any = {}
          try {
            const pageResponse = await fetch(pageInfoUrl)
            const pageData = await pageResponse.json()
            if (pageData.query?.pages) {
              Object.values(pageData.query.pages).forEach((page: any) => {
                if (page.title && page.thumbnail) {
                  thumbnailData[page.title] = page.thumbnail
                }
              })
            }
          } catch (thumbError) {
            console.log('Thumbnail fetch failed, continuing without images')
          }
          
          // Create results with the data we have
          const processedResults = titles.slice(0, 5).map((title: string, index: number) => ({
            pageid: Math.abs(title.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0)), // Simple hash for pageid
            title: title,
            extract: processExtractForDisplay(descriptions[index] || ''),
            thumbnail: thumbnailData[title] || undefined
          }))
          
          setResults(processedResults)
          setShowResults(true)
        } else {
          setResults([])
          setShowResults(false)
        }
      } catch (error) {
        console.error('Search failed:', error)
        setResults([])
        setShowResults(false)
      }
      setIsLoading(false)
    }, 300)
  }, [query])

  // Handle click outside to close results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    if (showResults) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showResults])

  const processExtractForDisplay = (extract: string): string => {
    if (!extract) return ''
    
    // Clean up the extract while preserving basic formatting
    let processed = extract
    
    // If it's already HTML, process it
    if (processed.includes('<')) {
      // Remove citation markers for cleaner display
      processed = processed.replace(/\[\d+\]/g, '')
      
      // Convert basic formatting
      processed = processed.replace(/<b>(.*?)<\/b>/g, '<strong>$1</strong>')
      processed = processed.replace(/<i>(.*?)<\/i>/g, '<em>$1</em>')
      
      // Remove any remaining HTML tags except for basic formatting
      processed = processed.replace(/<(?!\/?(?:strong|em|b|i)\b)[^>]*>/g, '')
    } else {
      // It's plain text, just clean up citation markers
      processed = processed.replace(/\[\d+\]/g, '')
    }
    
    // Truncate if too long for display
    if (processed.length > 150) {
      processed = processed.substring(0, 150) + '...'
    }
    
    return processed
  }

  const handleArticleClick = async (result: SearchResult) => {
    // Close search results immediately
    setShowResults(false)
    setQuery(result.title)
    setResults([]) // Clear results to ensure clean state
    
    // Get the actual page ID for the article
    try {
      const pageIdUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(result.title)}&origin=*`
      const response = await fetch(pageIdUrl)
      const data = await response.json()
      
      if (data.query?.pages) {
        const pageData = Object.values(data.query.pages)[0] as any
        if (pageData && pageData.pageid) {
          onArticleSelect(result.title, pageData.pageid)
        } else {
          // Fallback to hash-based ID if real pageid not found
          onArticleSelect(result.title, result.pageid)
        }
      } else {
        onArticleSelect(result.title, result.pageid)
      }
    } catch (error) {
      console.error('Failed to get page ID:', error)
      onArticleSelect(result.title, result.pageid)
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search Wikipedia articles..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-4"
          onFocus={() => query.length >= 2 && setShowResults(true)}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {showResults && results.length > 0 && (
        <Card className="absolute z-50 w-full mt-1 max-h-80 overflow-y-auto">
          <CardContent className="p-0">
            {results.map((result) => (
              <div
                key={result.pageid}
                className="search-result-item border-b last:border-b-0"
                onClick={() => handleArticleClick(result)}
              >
                <div className="flex items-start gap-3">
                  {result.thumbnail && (
                    <img
                      src={result.thumbnail.source}
                      alt=""
                      className="w-12 h-12 object-cover rounded flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm text-foreground mb-1 truncate">
                      {result.title}
                    </h3>
                    <div className="text-xs text-muted-foreground line-clamp-2">
                      {result.extract.includes('<') ? (
                        <span dangerouslySetInnerHTML={{ __html: result.extract }} />
                      ) : (
                        result.extract
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {showResults && results.length === 0 && !isLoading && query.length >= 2 && (
        <Card className="absolute z-50 w-full mt-1">
          <CardContent className="p-4 text-center text-muted-foreground text-sm">
            No articles found for "{query}"
          </CardContent>
        </Card>
      )}
    </div>
  )
}