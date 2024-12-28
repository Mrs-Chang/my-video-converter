import { useState } from 'react'
import './App.css'

const SERVER_URL = 'http://150.158.123.96:3001'

function App() {
  const [videoFile, setVideoFile] = useState(null)
  const [converting, setConverting] = useState(false)
  const [error, setError] = useState(null)

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file && file.type.includes('video')) {
      setVideoFile(file)
      setError(null)
    } else {
      setError('请选择有效的视频文件')
      setVideoFile(null)
    }
  }

  const handleConvert = async () => {
    if (!videoFile) {
      setError('请先选择视频文件')
      return
    }

    setConverting(true)
    try {
      console.log('开始发送请求...')
      const formData = new FormData()
      formData.append('video', videoFile)
      
      const response = await fetch(`${SERVER_URL}/convert`, {
        method: 'POST',
        body: formData,
      }).catch(error => {
        console.error('网络请求错误:', error)
        throw new Error(`网络请求失败: ${error.message}`)
      })

      console.log('请求已发送，等待响应...')

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`服务器错误: ${errorText}`)
      }

      // 下载转换后的文件
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${videoFile.name.split('.')[0]}.mp3`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('详细错误信息:', err)
      setError('转换过程中出现错误：' + err.message)
    } finally {
      setConverting(false)
    }
  }

  return (
    <div className="converter-container">
      <h1>视频转音频工具</h1>
      <p className="description">将MP4视频转换为MP3音频文件</p>
      
      <div className="upload-section">
        <label className="file-label">
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="file-input"
          />
          <span className="file-button">选择视频文件</span>
        </label>
        {videoFile && (
          <p className="file-info">
            已选择文件: {videoFile.name}
          </p>
        )}
      </div>

      {error && <p className="error-message">{error}</p>}

      <button
        onClick={handleConvert}
        disabled={!videoFile || converting}
        className="convert-button"
      >
        {converting ? '转换中...' : '开始转换'}
      </button>
    </div>
  )
}

export default App
