import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowSquareOut, Spinner } from '@phosphor-icons/react'

interface WikipediaContentProps {
  title: string
  pageid: number
}

interface WikipediaPage {
  title: string
  extract: string
  content: {
    [key: string]: any
  }
}

export function WikipediaContent({ title, pageid }: WikipediaContentProps) {
  const [content, setContent] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchContent = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Fetch page content using MediaWiki API with HTML formatting preserved
      const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&pageids=${pageid}&prop=extracts&exsectionformat=wiki&explaintext=false&origin=*`
      
      const response = await fetch(apiUrl)
      const data = await response.json()
      
      if (data.query?.pages?.[pageid]) {
        const page = data.query.pages[pageid]
        let htmlContent = page.extract || ''
        
        // Process the content to add proper Wikipedia-style formatting
        htmlContent = processWikipediaContent(htmlContent)
        setContent(htmlContent)
      } else {
        setError('Article content not found')
      }
    } catch (err) {
      setError('Failed to fetch article content')
      console.error('Content fetch error:', err)
    }
    
    setIsLoading(false)
  }

  const processWikipediaContent = (html: string): string => {
    if (!html) return ''
    
    // First, ensure we have proper HTML structure
    let processed = html
    
    // Convert Wikipedia links to proper Codex format while preserving original styling
    processed = processed.replace(
      /<a\s+href="([^"]*)"([^>]*)>([^<]*)<\/a>/g,
      '<a href="$1" class="wikipedia-link"$2>$3</a>'
    )
    
    // Convert citation markers to superscript with Codex styling
    processed = processed.replace(
      /\[(\d+)\]/g,
      '<sup><a href="#citation-$1" class="wikipedia-citation">[$1]</a></sup>'
    )
    
    // Ensure internal Wikipedia links have full URLs
    processed = processed.replace(
      /href="\/wiki\//g,
      'href="https://en.wikipedia.org/wiki/'
    )
    
    // Process headings to match Wikipedia hierarchy exactly
    processed = processed.replace(/<h2([^>]*)>/g, '<h2 class="wikipedia-heading-2"$1>')
    processed = processed.replace(/<h3([^>]*)>/g, '<h3 class="wikipedia-heading-3"$1>')
    processed = processed.replace(/<h4([^>]*)>/g, '<h4 class="wikipedia-heading-4"$1>')
    processed = processed.replace(/<h5([^>]*)>/g, '<h5 class="wikipedia-heading-4"$1>')
    processed = processed.replace(/<h6([^>]*)>/g, '<h6 class="wikipedia-heading-4"$1>')
    
    // Format paragraphs with proper spacing - preserve existing classes
    processed = processed.replace(/<p(\s+[^>]*)?>/g, (match, attrs) => {
      const classAttr = attrs && attrs.includes('class=') ? attrs : (attrs || '') + ' class="wikipedia-paragraph"'
      return `<p${classAttr.includes('wikipedia-paragraph') ? attrs || '' : classAttr}>`
    })
    processed = processed.replace(/<p>/g, '<p class="wikipedia-paragraph">')
    
    // Handle bold and italic text with Wikipedia styling - preserve existing formatting
    processed = processed.replace(/<b(\s+[^>]*)?>/g, '<strong class="wikipedia-bold"$1>')
    processed = processed.replace(/<\/b>/g, '</strong>')
    processed = processed.replace(/<i(\s+[^>]*)?>/g, '<em class="wikipedia-italic"$1>')
    processed = processed.replace(/<\/i>/g, '</em>')
    
    // Handle strong and em tags that might already exist
    processed = processed.replace(/<strong(?!\s+class="wikipedia-bold")([^>]*)>/g, '<strong class="wikipedia-bold"$1>')
    processed = processed.replace(/<em(?!\s+class="wikipedia-italic")([^>]*)>/g, '<em class="wikipedia-italic"$1>')
    
    // Handle Wikipedia-specific elements like infoboxes, tables, etc.
    // Keep table formatting intact
    processed = processed.replace(/<table([^>]*)>/g, '<table class="wikipedia-table"$1>')
    
    // Handle lists properly
    processed = processed.replace(/<ul([^>]*)>/g, '<ul class="wikipedia-list"$1>')
    processed = processed.replace(/<ol([^>]*)>/g, '<ol class="wikipedia-list wikipedia-list-numbered"$1>')
    
    // Handle div elements that might contain special formatting
    processed = processed.replace(/<div([^>]*class="[^"]*mw-[^"]*"[^>]*)>/g, '<div$1>')
    
    return processed
  }

  const copyToClipboard = () => {
    if (content) {
      // Create a clean text version for copying
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = content
      const textContent = tempDiv.textContent || tempDiv.innerText || ''
      navigator.clipboard.writeText(textContent)
    }
  }

  const copyFormattedHtml = () => {
    if (content) {
      navigator.clipboard.writeText(content)
    }
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold">{title}</CardTitle>
        <div className="flex gap-2">
          <Button
            onClick={fetchContent}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            {isLoading ? (
              <>
                <Spinner className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Import Content'
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            asChild
          >
            <a
              href={`https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center"
            >
              <ArrowSquareOut className="w-4 h-4 mr-2" />
              View on Wikipedia
            </a>
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-md">
            {error}
          </div>
        )}
        
        {content && (
          <div className="space-y-4">
            <div className="flex gap-2 mb-4">
              <Button onClick={copyToClipboard} variant="outline" size="sm">
                Copy Text
              </Button>
              <Button onClick={copyFormattedHtml} variant="outline" size="sm">
                Copy HTML
              </Button>
            </div>
            
            <div
              className="wikipedia-content border rounded-md p-6 bg-muted/20"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        )}
        
        {!content && !isLoading && !error && (
          <div className="text-center py-8 text-muted-foreground">
            Click "Import Content" to fetch the Wikipedia article content
          </div>
        )}
      </CardContent>
    </Card>
  )
}