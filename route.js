let express = require("express");
let route = express.Router();
let controller = require("./controller.js");
let multer = require('multer');

//定义文件上传的地址
let upload = multer({
    dest:'./public/uploads'
})

//用户主页
route.get('/index',controller.index);

//登录
route.get('/login',controller.login);

//获取表单数据
route.post('/getLoginData',controller.getLoginData);

//跳转到用户列表
route.get('/users',controller.users);

//用户列表
route.get('/usersList',controller.usersList);

//获取用户表总的记录数
route.get('/totalCounts',controller.totalCounts);

//渲染文章页面
route.get('/posts',controller.posts);

//获取文章列表分页的数据
route.get('/getPostsData',controller.getPostsData);

//获取文章总的记录数
route.get('/postTotalCount',controller.postTotalCount);

//文章列表无刷新删除
route.post('/delPost',controller.delPost);

route.get('/addPost',controller.addPost);

//添加文章
route.post('/addPosts',controller.addPosts);

//获取文件路径,指定上传的文件
route.post('/getFilePath',upload.single('feature'),controller.getFilePath);

//文章列表编辑
route.get('/editPost',controller.editPost);

//文章编辑入库
route.post('/updatePost',controller.updatePost);

//进入个人中心
route.get('/intoProfile',controller.intoProfile);


route.get('/pwdReset',controller.pwdReset);

//修改用户密码
route.post('/updPwd',controller.updPwd);

//修改用户信息
route.post('/updUserInfo',controller.updUserInfo);

//添加用户
route.post('/addUser',controller.addUser);

//退出登录
route.get('/loginOut',controller.loginOut);

//用户无刷新删除
route.post('/delUser',controller.delUser);

//编辑用户信息
route.post('/editUser',controller.editUser);

//通过用户id获取用户信息
route.get('/getUserInfo',controller.getUserInfo);

//进入评论主页
route.get('/intoComment',controller.intoComment);

//获取评论总表的总条数
route.get('/getCommentCounts',controller.getCommentCounts);

//获取评论表的数据
route.get('/getCommentData',controller.getCommentData);

//评论表数据的无刷新删除
route.post('/delComment',controller.delComment);

//进入分类主页
route.get('/intoCategory',controller.intoCategory);

//实现分类数据入库
route.post('/addCatgory',controller.addCatgory);

//分类主页的无刷新删除
route.post('/delCategoies',controller.delCategoies);

//通过id获取分类列表数据
route.get('/getCatData',controller.getCatData);

//编辑分类列表数据
route.post('/editCatInfo',controller.editCatInfo);

//进入图片轮播页面
route.get('/intoSlides',controller.intoSlides);

//添加轮播内容入库
route.post('/addSlides',controller.addSlides);

//轮播主页的无刷新删除
route.post('/delSwipes',controller.delSwipes);


//进入导航菜单页面
route.get('/intoNavMenus',controller.intoNavMenus);

//新增导航菜单入库
route.post('/addNavMenu',controller.addNavMenu);



module.exports = route;