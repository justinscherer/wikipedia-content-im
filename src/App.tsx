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
    <div className="min-h-screen bg-background p-3 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="text-center space-y-1 sm:space-y-2">
          <h1 className="text-xl sm:text-3xl font-bold text-foreground leading-tight">
            Wikipedia Content Importer
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground px-2">
            Search and import Wikipedia content with proper formatting
          </p>
        </div>

        {/* Search Section */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-base sm:text-lg">Search Wikipedia Articles</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
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