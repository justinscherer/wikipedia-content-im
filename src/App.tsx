import { useState } from 'react'
import { WikipediaSearch } from '@/components/WikipediaSearch'
import { WikipediaContent } from '@/components/WikipediaContent'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function App() {
  const [selectedArticle, setSelectedArticle] = useState<{
    title: string
    pageid: number
  } | null>(null)

  const handleArticleSelect = (title: string, pageid: number) => {
    setSelectedArticle({ title, pageid })
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Wikipedia Content Importer
          </h1>
          <p className="text-muted-foreground">
            Prototype for Figma plugin development - Search and import Wikipedia content with proper formatting
          </p>
        </div>

        {/* Search Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Search Wikipedia Articles</CardTitle>
          </CardHeader>
          <CardContent>
            <WikipediaSearch onArticleSelect={handleArticleSelect} />
          </CardContent>
        </Card>

        {/* Content Display */}
        {selectedArticle && (
          <WikipediaContent
            title={selectedArticle.title}
            pageid={selectedArticle.pageid}
          />
        )}

        {/* Instructions */}
        {!selectedArticle && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <h2 className="text-xl font-semibold">How to Use</h2>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto font-semibold">
                      1
                    </div>
                    <h3 className="font-medium">Search Articles</h3>
                    <p className="text-muted-foreground">
                      Type to search Wikipedia articles with live suggestions
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto font-semibold">
                      2
                    </div>
                    <h3 className="font-medium">Select Article</h3>
                    <p className="text-muted-foreground">
                      Click on any search result to view the article
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto font-semibold">
                      3
                    </div>
                    <h3 className="font-medium">Import Content</h3>
                    <p className="text-muted-foreground">
                      Get formatted content with preserved Wikipedia links and citations
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Features Demo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Plugin Features Demonstrated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-3">
                <h3 className="font-medium text-primary">✓ Wikipedia API Integration</h3>
                <ul className="space-y-1 text-muted-foreground ml-4">
                  <li>• Real-time search using MediaWiki API</li>
                  <li>• Content fetching with proper formatting</li>
                  <li>• Link preservation with HTML destinations</li>
                </ul>
                
                <h3 className="font-medium text-primary">✓ Codex Design System</h3>
                <ul className="space-y-1 text-muted-foreground ml-4">
                  <li>• Wikipedia blue links (#0645ad)</li>
                  <li>• Clean, professional interface</li>
                  <li>• Accessible color contrasts</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-medium text-primary">✓ Content Formatting</h3>
                <ul className="space-y-1 text-muted-foreground ml-4">
                  <li>• Citations as superscript blue links</li>
                  <li>• No underlines on links (hover only)</li>
                  <li>• Structured text with proper hierarchy</li>
                </ul>
                
                <h3 className="font-medium text-primary">✓ Figma Integration Ready</h3>
                <ul className="space-y-1 text-muted-foreground ml-4">
                  <li>• Copy formatted HTML for text boxes</li>
                  <li>• Preserved link destinations</li>
                  <li>• Export-ready content structure</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default App