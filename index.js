let express = require("express");
let artTemplate = require('art-template');
let expressArtTemplate = require('express-art-template');
let path = require("path");
let route = require('./route.js');
let session = require("express-session");
let apiRoute = require('./apiRoute.js');
let cors = require("cors");
let app = express();



//配置模板引擎
app.set('views', path.join(__dirname, 'views'));
app.engine('.html', expressArtTemplate);
app.set('view engine', 'html');


app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

app.use(session({
    name:'SESSIONID',  // session会话名称在cookie中的值
    secret:'%#%￥#……%￥', // 必填项，用户session会话加密（防止用户篡改cookie）
    cookie:{  //设置session在cookie中的其他选项配置
      path:'/',
      secure:false,  //默认为false, true 只针对于域名https协议
      maxAge:60000*24, 
    }
}))


//配置中间件
app.use('/public',express.static(__dirname + '/public/'));

//允许跨域
app.use(cors());

//挂载当前路由
app.use('/api',apiRoute);

//对用户进行登录验证
app.use(function(req,res,next){
  let path = ['/login','/loginOut','/getLoginData'];
  if(!path.includes(req.url)){
    //进行登录验证
    if(req.session.uid){
      next();
    }else{
      res.redirect('/login');
    }
  }else {
    next();
  }
})

app.use(route);


app.listen(7070,() => {
    console.log('服务已启动');
})