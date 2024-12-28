import express from 'express'
import multer from 'multer'
import ffmpeg from 'fluent-ffmpeg'
import cors from 'cors'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()

// CORS 配置
app.use(cors())

// 静态文件服务
app.use(express.static(join(__dirname, '../dist')))

// Multer 配置
const upload = multer({ 
  dest: 'uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  }
})

// 确保上传目录存在
const uploadsDir = join(__dirname, 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// API 路由
app.get('/health', (req, res) => {
  res.send('Server is running')
})

app.post('/convert', upload.single('video'), (req, res) => {
  console.log('收到转换请求')
  
  if (!req.file) {
    console.log('没有接收到文件')
    return res.status(400).send('没有上传文件')
  }

  console.log('文件信息:', req.file)

  const inputPath = req.file.path
  const outputPath = `${inputPath}.mp3`

  ffmpeg(inputPath)
    .toFormat('mp3')
    .on('start', (commandLine) => {
      console.log('FFmpeg 开始转换:', commandLine)
    })
    .on('progress', (progress) => {
      console.log('转换进度:', progress)
    })
    .on('end', () => {
      console.log('转换完成')
      res.download(outputPath, () => {
        try {
          fs.unlinkSync(inputPath)
          fs.unlinkSync(outputPath)
          console.log('临时文件清理完成')
        } catch (err) {
          console.error('清理临时文件失败:', err)
        }
      })
    })
    .on('error', (err) => {
      console.error('FFmpeg 转换错误:', err)
      res.status(500).send(`转换错误: ${err.message}`)
      try {
        fs.unlinkSync(inputPath)
        console.log('错误后清理输入文件完成')
      } catch (cleanupErr) {
        console.error('清理临时文件失败:', cleanupErr)
      }
    })
    .save(outputPath)
})

// 所有其他请求返回 index.html
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '../dist/index.html'))
})

const PORT = 3002
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`)
}) 