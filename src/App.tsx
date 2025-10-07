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


      </div>
    </div>
  )
}

export default App