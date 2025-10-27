require('dotenv').config()
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const { Queue, Worker } = require('bullmq')
const IORedis = require('ioredis')
const { createClient } = require('@supabase/supabase-js')

const app = express()
app.use(cors()); app.use(bodyParser.json())
const PORT = process.env.PORT || 4000
const supabase = createClient(process.env.SUPABASE_URL,process.env.SUPABASE_KEY)
const connection = new IORedis(process.env.REDIS_URL)

const imageQueue = new Queue('imageQueue',{connection})
const musicQueue = new Queue('musicQueue',{connection})
const videoQueue = new Queue('videoQueue',{connection})

new Worker('imageQueue', async job => ({ url:'https://via.placeholder.com/1024.png?text='+encodeURIComponent(job.data.prompt) }),{connection})
new Worker('musicQueue', async job => ({ url:'https://www.sample-videos.com/audio/mp3/crowd-cheering.mp3' }),{connection})
new Worker('videoQueue', async job => ({ url:'https://www.sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4' }),{connection})

app.get('/health',(req,res)=>res.json({ok:true}))
app.post('/api/generate-image', async(req,res)=>{if(!req.body.prompt) return res.status(400).json({error:'prompt required'}); const job=await imageQueue.add('imgJob',{prompt:req.body.prompt}); const result=await job.waitUntilFinished(); res.json(result)})
app.post('/api/generate-music', async(req,res)=>{if(!req.body.prompt) return res.status(400).json({error:'prompt required'}); const job=await musicQueue.add('musicJob',{prompt:req.body.prompt}); const result=await job.waitUntilFinished(); res.json(result)})
app.post('/api/generate-video', async(req,res)=>{if(!req.body.prompt) return res.status(400).json({error:'prompt required'}); const job=await videoQueue.add('videoJob',{prompt:req.body.prompt}); const result=await job.waitUntilFinished(); res.json(result)})
app.listen(PORT,()=>console.log('Backend listening on',PORT))
