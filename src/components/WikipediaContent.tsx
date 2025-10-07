import { useState, useEffect } from 'react'
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

  // Automatically fetch content when component mounts or title/pageid changes
  useEffect(() => {
    if (title && pageid) {
      fetchContent()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, pageid])

  const fetchContent = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Fetch page content using MediaWiki API with HTML formatting preserved
      // Use parse action to get properly formatted HTML with links and styling
      // Remove section=0 to get all sections, not just the first one
      const apiUrl = `https://en.wikipedia.org/w/api.php?action=parse&format=json&pageid=${pageid}&prop=text&disableeditsection=true&origin=*`
      
      const response = await fetch(apiUrl)
      const data = await response.json()
      
      if (data.parse?.text?.['*']) {
        let htmlContent = data.parse.text['*']
        
        // Process the content to add proper Wikipedia-style formatting
        htmlContent = processWikipediaContent(htmlContent)
        setContent(htmlContent)
      } else {
        // Fallback to extracts if parse fails - get full article content
        const fallbackUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&pageids=${pageid}&prop=extracts&exsectionformat=wiki&explaintext=false&exintro=false&origin=*`
        const fallbackResponse = await fetch(fallbackUrl)
        const fallbackData = await fallbackResponse.json()
        
        if (fallbackData.query?.pages?.[pageid]) {
          const page = fallbackData.query.pages[pageid]
          let htmlContent = page.extract || ''
          htmlContent = processWikipediaContent(htmlContent)
          setContent(htmlContent)
        } else {
          setError('Article content not found')
        }
      }
    } catch (err) {
      setError('Failed to fetch article content')
      console.error('Content fetch error:', err)
    }
    
    setIsLoading(false)
  }

  const processWikipediaContent = (html: string): string => {
    if (!html) return ''
    
    let processed = html
    
    // Remove all media elements (images, audio, video, etc.)
    processed = processed.replace(/<img[^>]*>/g, '')
    processed = processed.replace(/<video[^>]*>.*?<\/video>/gs, '')
    processed = processed.replace(/<audio[^>]*>.*?<\/audio>/gs, '')
    processed = processed.replace(/<figure[^>]*>.*?<\/figure>/gs, '')
    processed = processed.replace(/<picture[^>]*>.*?<\/picture>/gs, '')
    processed = processed.replace(/<source[^>]*>/g, '')
    processed = processed.replace(/<embed[^>]*>/g, '')
    processed = processed.replace(/<object[^>]*>.*?<\/object>/gs, '')
    
    // Remove thumbs and gallery content
    processed = processed.replace(/<div[^>]*class="[^"]*thumb[^"]*"[^>]*>.*?<\/div>/gs, '')
    processed = processed.replace(/<div[^>]*class="[^"]*gallery[^"]*"[^>]*>.*?<\/div>/gs, '')
    processed = processed.replace(/<div[^>]*class="[^"]*floatright[^"]*"[^>]*>.*?<\/div>/gs, '')
    processed = processed.replace(/<div[^>]*class="[^"]*floatleft[^"]*"[^>]*>.*?<\/div>/gs, '')
    
    // Remove Wikipedia-specific navigation elements and metadata
    processed = processed.replace(/<div[^>]*class="[^"]*navbox[^"]*"[^>]*>.*?<\/div>/gs, '')
    processed = processed.replace(/<div[^>]*class="[^"]*mw-references[^"]*"[^>]*>.*?<\/div>/gs, '')
    processed = processed.replace(/<div[^>]*class="[^"]*reflist[^"]*"[^>]*>.*?<\/div>/gs, '')
    processed = processed.replace(/<table[^>]*class="[^"]*navbox[^"]*"[^>]*>.*?<\/table>/gs, '')
    
    // Remove all variations of infobox content - comprehensive removal
    processed = processed.replace(/<table[^>]*class="[^"]*infobox[^"]*"[^>]*>.*?<\/table>/gs, '')
    processed = processed.replace(/<div[^>]*class="[^"]*infobox[^"]*"[^>]*>.*?<\/div>/gs, '')
    processed = processed.replace(/<table[^>]*class="[^"]*vcard[^"]*"[^>]*>.*?<\/table>/gs, '')
    processed = processed.replace(/<table[^>]*class="[^"]*biography[^"]*"[^>]*>.*?<\/table>/gs, '')
    processed = processed.replace(/<table[^>]*class="[^"]*plainrowheaders[^"]*"[^>]*>.*?<\/table>/gs, '')
    processed = processed.replace(/<table[^>]*class="[^"]*wikitable[^"]*"[^>]*style="[^"]*float:\s*right[^"]*"[^>]*>.*?<\/table>/gs, '')
    processed = processed.replace(/<aside[^>]*class="[^"]*infobox[^"]*"[^>]*>.*?<\/aside>/gs, '')
    
    // Clean up edit links and other interface elements
    processed = processed.replace(/<span[^>]*class="[^"]*mw-editsection[^"]*"[^>]*>.*?<\/span>/gs, '')
    processed = processed.replace(/<div[^>]*class="[^"]*mw-parser-output[^"]*"[^>]*>/g, '<div class="mw-parser-output wikipedia-content">')
    
    // Ensure internal Wikipedia links have full URLs and proper styling
    processed = processed.replace(
      /<a\s+href="\/wiki\/([^"]*)"([^>]*)>/g,
      '<a href="https://en.wikipedia.org/wiki/$1" class="wikipedia-link" target="_blank" rel="noopener noreferrer"$2>'
    )
    
    // Style external links properly
    processed = processed.replace(
      /<a\s+href="([^"]*)"([^>]*(?:class="[^"]*external[^"]*"[^>]*))>/g,
      '<a href="$1" class="wikipedia-link" target="_blank" rel="noopener noreferrer"$2>'
    )
    
    // Add class to all other links that don't already have wikipedia-link class
    processed = processed.replace(
      /<a\s+href="([^"]*)"(?![^>]*class="[^"]*wikipedia-link[^"]*")([^>]*)>/g,
      '<a href="$1" class="wikipedia-link"$2>'
    )
    
    // Convert citation markers to superscript with Codex styling  
    processed = processed.replace(
      /<sup[^>]*><a[^>]*href="[^"]*#[^"]*"[^>]*>\[(\d+)\]<\/a><\/sup>/g,
      '<sup><a href="#citation-$1" class="wikipedia-citation">[$1]</a></sup>'
    )
    
    // Handle citation references that may not be in sup tags
    processed = processed.replace(
      /<a[^>]*href="[^"]*#[^"]*"[^>]*>\[(\d+)\]<\/a>/g,
      '<sup><a href="#citation-$1" class="wikipedia-citation">[$1]</a></sup>'
    )
    
    // Process headings to match Wikipedia hierarchy exactly
    processed = processed.replace(/<h1([^>]*)>/g, '<h1 class="wikipedia-heading-2"$1>')
    processed = processed.replace(/<h2([^>]*)>/g, '<h2 class="wikipedia-heading-2"$1>')
    processed = processed.replace(/<h3([^>]*)>/g, '<h3 class="wikipedia-heading-3"$1>')
    processed = processed.replace(/<h4([^>]*)>/g, '<h4 class="wikipedia-heading-4"$1>')
    processed = processed.replace(/<h5([^>]*)>/g, '<h5 class="wikipedia-heading-4"$1>')
    processed = processed.replace(/<h6([^>]*)>/g, '<h6 class="wikipedia-heading-4"$1>')
    
    // Format paragraphs with proper spacing
    processed = processed.replace(/<p(?!\s+class="[^"]*wikipedia-paragraph[^"]*")([^>]*)>/g, '<p class="wikipedia-paragraph"$1>')
    
    // Completely remove bold and italic formatting from Wikipedia content
    // This ensures clean, uniformly formatted text without unwanted styling
    processed = processed.replace(/<b[^>]*>/g, '')
    processed = processed.replace(/<\/b>/g, '')
    processed = processed.replace(/<strong[^>]*>/g, '')
    processed = processed.replace(/<\/strong>/g, '')
    processed = processed.replace(/<i[^>]*>/g, '')
    processed = processed.replace(/<\/i>/g, '')
    processed = processed.replace(/<em[^>]*>/g, '')
    processed = processed.replace(/<\/em>/g, '')
    
    // Handle tables properly
    processed = processed.replace(/<table(?!\s+class="[^"]*wikipedia-table[^"]*")([^>]*)>/g, '<table class="wikipedia-table"$1>')
    
    // Handle lists properly  
    processed = processed.replace(/<ul(?!\s+class="[^"]*wikipedia-list[^"]*")([^>]*)>/g, '<ul class="wikipedia-list"$1>')
    processed = processed.replace(/<ol(?!\s+class="[^"]*wikipedia-list[^"]*")([^>]*)>/g, '<ol class="wikipedia-list wikipedia-list-numbered"$1>')
    
    // Remove any script tags for security
    processed = processed.replace(/<script[^>]*>.*?<\/script>/gs, '')
    
    // Remove style attributes that might conflict with our styling
    processed = processed.replace(/\sstyle="[^"]*"/g, '')
    
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
              'Refresh Content'
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
            Content will load automatically...
          </div>
        )}
      </CardContent>
    </Card>
  )
}