const express = require('express')
const app = express()
const path = require('path')
const bodypaser = require('body-parser')
const cookieParser = require('cookie-parser')

app.use(express.static(path.join(__dirname, 'pages')))
app.use(express.static(path.join(__dirname)))
app.use(bodypaser.urlencoded({ extended: true }))
app.use(cookieParser()) //req.cookies

const userList = [{ username: 'zx', password: 'zx' }]
const SESSION_ID = 'connect.sid'
const SessionUser = {}

app.post('/api/login', function(req, res) {
  const { username, password } = req.body
  const user = userList.find(user => user.username === username) || {}
  if (user.password === password) {
    const cookie = Math.random() + Date.now()
    SessionUser[cookie] = user
    // 添加cookie
    res.cookie(SESSION_ID, cookie)
    // res.cookie(SESSION_ID, cookie, {httpOnly: true}) 前端不能操作cookie,并不能解决XSS，但是可以降低受损的范围
    res.json({ code: 0 })
  } else {
    res.json({ code: 1, error: '用户不存在' })
  }
})

// 反射型， /home?type=<script>alert(1)</script>
// {httpOnly: true}) 前端不能操作cookie,并不能解决XSS，但是可以降低受损的范围
// 诱导用户自己点开某些链接
// 查询参数 预防方法，使用encodeURIComponent对输入url encode
app.get('/home', function(req, res) {
  const type = req.query.type
  res.send(`${encodeURIComponent(type)}`)
})

// 评论信息，用户输入的部分
let comments = [{ username: 'zx', content: 'zxzx' }]
app.get('/api/list', function(req, res) {
  res.json({ code: 0, comments })
})

// 存储型XSS，恶意脚本存在服务器上，所有人都被影响了
// 客户端上传的时候，先校验过滤一下
// 服务器在过滤一下
// 在使用上传的内容时，也就是输出的时候过滤
function encodeHtml(str) {
  str.replace(/&/g, '&amp;')
  str.replace(/"/g, '&quot;')
  str.replace(/'/g, '&apos;')
  str.replace(/</g, '&lt;')
  str.replace(/>/g, '&gt;')
  return str
}
app.post('/api/addContent', function(req, res) {
  const r = SessionUser[req.cookies[SESSION_ID]] || {}
  const username = r.username
  if (username) {
    const content = encodeHtml(req.body.content)
    comments.push({ username, content })
    res.json({ code: 0 })
  } else {
    res.json({ code: 1, error: '未登录' })
  }
})
app.listen(3000)