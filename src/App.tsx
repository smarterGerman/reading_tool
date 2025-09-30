import { useEffect, useState } from 'react'
import './App.css'
import ReadingTool from './ReadingTool'
import { extractSentences } from './data-extraction'

function App() {
  const [sentences, setSentences] = useState<null | string[]>(null)
  const [audioUrl, setAudioUrl] = useState<null | string>(null)
  const [error, setError] = useState<null | string>(null)

  const queryParameters = new URLSearchParams(window.location.search)
  const jsonURL = queryParameters.get("json")
  const sectionId = queryParameters.get("id")

  if (!jsonURL && !sectionId) {
    return <ReadingTool />
  }

  if(!jsonURL) {
    return (<p>Integration is not configured correctly: parameter "json" is missing!</p>)
  }

  if(!sectionId) {
    return (<p>Integration is not configured correctly: parameter "id" is missing!</p>)
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(jsonURL as string)
        if (!response.ok) {
          throw new Error(`Unsuccessful status code: ${response.status} ${response.statusText}`)
        }
        const data = await response.json();
        const result = extractSentences(data, sectionId as string)
        if(!result) {
          throw new Error(`No sentences for key ${sectionId}`)
        }
        setSentences(result.sentences)
        setAudioUrl(result.audioUrl)
      } catch (e: any) {
        console.error(e.message)
        setError("Error retrieving lesson data. Check your internet connection.")
      }
    }

    fetchData()
  }, [])

  if(error) {
    return <><p>{error}</p></>
  }

  if(!sentences) {
    return <><p>Loading...</p></>
  }

  return <ReadingTool sentences={sentences} audioUrl={audioUrl} />
}

export default App
