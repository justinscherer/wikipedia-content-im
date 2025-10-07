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
        const searchUrl = new URL('https://en.wikipedia.org/api/rest_v1/page/summary/')
        const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&generator=prefixsearch&prop=extracts|pageimages&exintro=&exlimit=max&exsentences=2&piprop=thumbnail&pithumbsize=100&gpssearch=${encodeURIComponent(query)}&gpslimit=5&origin=*`
        
        const response = await fetch(apiUrl)
        const data = await response.json()
        
        if (data.query?.pages) {
          const pages = Object.values(data.query.pages) as SearchResult[]
          setResults(pages.slice(0, 5))
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

  const handleArticleClick = (result: SearchResult) => {
    onArticleSelect(result.title, result.pageid)
    setQuery(result.title)
    setShowResults(false)
  }

  return (
    <div className="relative w-full max-w-md">
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
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {result.extract}
                    </p>
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