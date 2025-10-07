# Converting to Figma Plugin

This guide explains how to transform your Wikipedia Content Importer prototype into a functional Figma plugin.

## Overview

Your current web application demonstrates the core functionality needed for a Figma plugin. The main changes required are:
1. Adding Figma plugin manifest and configuration
2. Adapting the UI for Figma's plugin panel
3. Integrating with Figma's API to insert content
4. Building and packaging for Figma

## Required Files for Figma Plugin

### 1. Plugin Manifest (`manifest.json`)

Create this file in your project root:

```json
{
  "name": "Wikipedia Content Importer",
  "id": "your-plugin-id",
  "api": "1.0.0",
  "main": "dist/code.js",
  "ui": "dist/ui.html",
  "capabilities": [],
  "enabledInDev": true,
  "enablePrivatePluginApi": false,
  "build": "",
  "permissions": ["currentuser"],
  "networkAccess": {
    "allowedDomains": [
      "https://en.wikipedia.org",
      "https://*.wikimedia.org"
    ]
  }
}
```

### 2. Plugin Code (`src/plugin/code.ts`)

The main plugin logic that runs in Figma's sandbox:

```typescript
// This runs in Figma's main thread
figma.showUI(__html__, { 
  width: 400, 
  height: 600,
  themeColors: true 
});

// Listen for messages from the UI
figma.ui.onmessage = (msg) => {
  if (msg.type === 'insert-content') {
    const { content, title } = msg;
    
    // Create a text node
    const textNode = figma.createText();
    
    // Load fonts first (required for text nodes)
    figma.loadFontAsync({ family: "Inter", style: "Regular" })
      .then(() => {
        // Set the content
        textNode.characters = content;
        
        // Position the text node
        textNode.x = figma.viewport.center.x;
        textNode.y = figma.viewport.center.y;
        
        // Add to current page
        figma.currentPage.appendChild(textNode);
        
        // Select the new node
        figma.currentPage.selection = [textNode];
        figma.viewport.scrollAndZoomIntoView([textNode]);
        
        // Notify UI of success
        figma.ui.postMessage({ 
          type: 'content-inserted', 
          success: true 
        });
      })
      .catch((error) => {
        figma.ui.postMessage({ 
          type: 'content-inserted', 
          success: false, 
          error: error.message 
        });
      });
  }
  
  if (msg.type === 'resize') {
    figma.ui.resize(msg.width, msg.height);
  }
  
  if (msg.type === 'close') {
    figma.closePlugin();
  }
};
```

### 3. UI Integration (`src/components/FigmaIntegration.tsx`)

Add a component to handle Figma-specific functionality:

```typescript
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface FigmaIntegrationProps {
  content: string;
  title: string;
}

export function FigmaIntegration({ content, title }: FigmaIntegrationProps) {
  const [isInserting, setIsInserting] = useState(false);

  const insertToFigma = () => {
    setIsInserting(true);
    
    // Send message to Figma plugin code
    parent.postMessage({
      pluginMessage: {
        type: 'insert-content',
        content: content,
        title: title
      }
    }, '*');
  };

  // Listen for responses from Figma
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.pluginMessage?.type === 'content-inserted') {
        setIsInserting(false);
        if (event.data.pluginMessage.success) {
          toast.success('Content inserted into Figma!');
        } else {
          toast.error('Failed to insert content: ' + event.data.pluginMessage.error);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Insert to Figma</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Insert this Wikipedia content as a text layer in your Figma design.
        </p>
        <Button 
          onClick={insertToFigma}
          disabled={isInserting}
          className="w-full"
        >
          {isInserting ? 'Inserting...' : 'Insert Text Layer'}
        </Button>
      </CardContent>
    </Card>
  );
}
```

## Build Configuration

### 1. Update `package.json`

Add build scripts for the plugin:

```json
{
  "scripts": {
    "build": "vite build",
    "build:plugin": "npm run build:ui && npm run build:code",
    "build:ui": "vite build --config vite.ui.config.ts",
    "build:code": "vite build --config vite.code.config.ts"
  },
  "devDependencies": {
    "@figma/plugin-typings": "^1.75.0"
  }
}
```

### 2. Vite Config for UI (`vite.ui.config.ts`)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: 'index.html',
      output: {
        entryFileNames: 'ui.js',
        assetFileNames: 'ui.css'
      }
    }
  }
});
```

### 3. Vite Config for Plugin Code (`vite.code.config.ts`)

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    lib: {
      entry: 'src/plugin/code.ts',
      name: 'code',
      fileName: 'code',
      formats: ['iife']
    },
    rollupOptions: {
      output: {
        extend: true
      }
    }
  }
});
```

## Development Workflow

### 1. Install Figma Plugin Development Tools

```bash
npm install -g @figma/create-plugin
npm install @figma/plugin-typings
```

### 2. Development Process

1. **Develop in Browser**: Use your current setup for rapid prototyping
2. **Test in Figma**: 
   - Build the plugin: `npm run build:plugin`
   - In Figma Desktop, go to Plugins → Development → Import plugin from manifest
   - Select your `manifest.json` file
3. **Iterate**: Make changes and rebuild as needed

### 3. Publishing to Figma Community

1. **Prepare Assets**: Create plugin icon (128x128px) and cover image
2. **Test Thoroughly**: Ensure compatibility across different Figma files
3. **Submit for Review**: Use Figma's plugin submission process
4. **Community Guidelines**: Follow Figma's plugin development guidelines

## Key Considerations

### API Limitations
- Figma plugins run in a sandboxed environment
- Network requests must be declared in manifest
- Some browser APIs may not be available

### UI Constraints
- Plugin UI is typically smaller (300-500px wide)
- Consider responsive design for different panel sizes
- Follow Figma's design system guidelines

### Performance
- Minimize bundle size for faster loading
- Optimize API calls and caching
- Consider lazy loading for large datasets

## Next Steps

1. Create the plugin structure files above
2. Modify your existing components to work in Figma's constraints
3. Add the Figma integration component to your content display
4. Test the plugin in Figma Desktop
5. Refine UX for the plugin panel size
6. Submit to Figma Community when ready

Your current Wikipedia Content Importer already demonstrates the core functionality - the main work is adapting it to Figma's plugin architecture and constraints.