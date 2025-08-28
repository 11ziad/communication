import { useState } from 'react'
import VideoChat from './VideoChat'
 
function App() {
  const [count, setCount] = useState(0)

  return (
    <>
       <VideoChat></VideoChat>
    </>
  )
}

export default App
