let express = require("express");

let path = require("path");
let md5 = require("md5");
let query = require("./model.js");
let fs = require("fs");
let moment = require("moment");

let controller = {};

//返回的数据
let resData = {};
//待评论的数量
let heldCounts = 0;
//评论数
let commentLength;

//一个多少条
let pageSize = 10;

function getStatus(){
    let status = [
        {"key":"drafted",'text':'草稿'},
        {"key":'published','text':'已发布'},
        {"key":"trashed",'text':'已废弃'}
    ]
    return status;
}

//渲染主页
controller.index = ((req,res) => {
    //渲染页面之前从数据库中查询数据
    //获取文章数量
    let sql1 = 'select count(*) as postsCounts from posts';
    //获取文章中草稿数量
    let sql2 = "select count(*) as draftedCounts from posts where status = 'drafted'";

    let sql3 = 'select count(*) as categoryCounts from category';

    let sql4 = "select count(*) as commentsCounts from comments;";

    let sql5 = "select count(*) as heldCounts from comments where status = 'held'";

    async function data(){
        let postsCounts = await query(sql1);
        let draftedCounts = await query(sql2);
        let categoryCounts = await query(sql3);
        let commentsCounts = await query(sql4);
        let heldCounts = await query(sql5);

        let data = await Promise.all([ postsCounts, draftedCounts,  categoryCounts, commentsCounts, heldCounts]);
        data.forEach((ele) => {
            //将返回的结果合并到resData对象
            Object.assign(resData,ele[0]);
            console.log(resData);          
        })
        res.render('index.html',{
            "resData":resData,
            "nickname":req.session.nickname,
            "photo":req.session.photo
        });
    }
    data();
    
})

//跳转登录页面
controller.login = ((req,res) => {
    res.render('login.html');
})

//获取登录表单的用户信息
controller.getLoginData = async (req,res) => {
    //获取表单数据信息
    let {email,password} = req.body;
    console.log(email);
    console.log(password);
    //对密码进行加密处理
    // let str = "!!!!***";
    // password = md5(str+password);
    let sql = `select * from users where email = '${email}' and password = '${password}'`;
    //返回成功后的结果
    let data = await query(sql);
    console.log(data[0]);
    if(data[0] == undefined){
        let errMessage = {"code":-1,"message":'密码错误'};
        res.json(errMessage);
    }

    //保存当前登录的用户
    req.session.uid = data[0].user_id;
    req.session.nickname = data[0].nickname;
    req.session.photo = data[0].photo;

    let message = {"code":200,"message":'登录成功'};
    res.json(message);

}

//跳转到用户列表
controller.users = (req,res) => {
    res.render('users.html',{
        nickname:req.session.nickname,
        photo:req.session.photo
    });
}

//获取用户表的总记录数
controller.totalCounts = async (req,res) => {
    let sql = "select count(*) as counts from users";
    let data = await query(sql);
    let totalPage = Math.ceil(data[0].counts / pageSize);
    res.json({totalPage:totalPage})
}

//用户列表
controller.usersList = async (req,res) => {
    //获取当前的页码数
    let page = req.query.page;
    //从第几页开始
    let start = parseInt((page - 1) * pageSize);
    let sql = `select * from users limit ${start},${pageSize}`;
    let rows = await query(sql);
    res.json({"data":rows});
}

//跳转文章页面
controller.posts = async (req,res) => {
    status = getStatus();
    let sql = 'select cat_id,cat_name from category';
    let data = await query(sql);
    res.render('posts.html',{
        caregoryData:data,
        postStatus:status,
        nickname:req.session.nickname,
        photo:req.session.photo
    });
}

//获取文章列表分页信息
controller.getPostsData = async (req,res) => {
    //获取查询参数
    let {cat_id,status} = req.query;
    console.log(cat_id);
    console.log(status);

    let where = '1=1';
    if(cat_id){
        where += ` and p1.cat_id = ${cat_id}`;
    }

    if(status){
        where += ` and p1.status = '${status}'`;
    }

     //获取当前传过来的当前页的页码数
     let currentPage = req.query.currentPage;
    //从第几条开始
    let offset = Math.ceil(currentPage-1)*pageSize;
    
    let sql = `SELECT p1.*,u1.nickname,c1.cat_name FROM posts AS p1 
                LEFT JOIN users AS u1 ON p1.user_id = u1.user_id 
                LEFT JOIN category AS c1 ON p1.cat_id = c1.cat_id where ${where} group by post_id desc LIMIT ${offset},${pageSize} `;
    let data = await query(sql);
    res.json(data);
   
}

//获取总记录数
controller.postTotalCount = async (req,res) => {
    //获取查询的参数
    let {cat_id,status} = req.query;
    let where = '1=1';
    if(cat_id){
        where += ` and cat_id = ${cat_id}`;
    }

    if(status){
        where += ` and status = '${status}'`;
    }

    let sql = `select count(*) as counts from posts where ${where}`;
    let data = await query(sql);
    let totalPage = parseInt(data[0].counts/pageSize)
    res.json({"totalPage":totalPage});
}

//文章列表无刷新删除
controller.delPost = async (req,res) => {
    //获取当前的id
    let post_id = req.body.post_id;
    console.log(post_id);
    let sql = `delete from posts where post_id = ${post_id}`;
    let data = await query(sql);   
    let message = {"code":200,"message":'删除成功'};
    res.json(message);
}

//进入文章列表
controller.addPost = async (req,res) => {
    status = getStatus();
    let sql = 'select cat_id,cat_name from category';
    let data = await query(sql);
    res.render('post-add.html',{
        caregoryData:data,
        postStatus:status,
        nickname:req.session.nickname,
        photo:req.session.photo
    });
}

//添加文章
controller.addPosts = async (req,res) => {
    //获取当前登录用户
    let user_id = req.session.uid;
    let {title,content,category,created,status,feature} = req.body;
    console.log(req.body);
    let sql = `insert into posts(title,content,cat_id,created,status,feature,user_id)
    values('${title}','${content}','${category}','${created}','${status}','${feature}',${user_id})`;
    let result = await query(sql);
    if(result.affectedRows > 0){
        let message = {"code":200,'message':'新增成功'};
        res.json(message);
    }
}

//获取文件路径
controller.getFilePath = (req,res) => {
    //如果该文件有数据信息
    if(req.file){
        console.log(req.file);
        let {originalname,destination,filename} = req.file;
        //获取文件名的后缀
        let original = originalname.substring(originalname.indexOf("."));
        //获取原来的图片路径
        let oldPath = destination +'/'+filename;
        //获取新的图片路径
        let newPath = destination+"/"+ filename + original;
    
        //重命名图片的路径
        fs.rename(oldPath,newPath,(err) =>{
            if(err){throw err;}
            res.json({"filePath":newPath});
        })
    }
}

//文章列表编辑
controller.editPost = async (req,res) => {
    //获取当前要编辑的文章id
    let post_id = req.query.post_id;
    status = getStatus();
    let sql = 'select cat_id,cat_name from category';
    let data = await query(sql);
    //查询当前编辑id的整条数据信息
    let sql2 = `select * from posts where post_id = ${post_id}`;
    let resData = await query(sql2);

    //转化时间日期时间
    resData[0].created = moment(new Date(resData[0].created)).format("YYYY-MM-DD HH:mm:ss");
    //修改图片路径图片让图片回显
    resData[0].feature = resData[0].feature.replace('./','/');
    console.log(resData[0].feature);

    res.render('post-edit.html',{
        caregoryData:data,
        postStatus:status,
        resData:resData[0],
        "nickname":req.session.nickname,
        "photo":req.session.photo
    });
}

//文章编辑入库
controller.updatePost = async (req,res) => {
    //接收前台传过来的表单数据
    let {post_id,title,content,category,created,status,feature} = req.body;
    console.log(req.body);
    let sql = `update posts set title = '${title}',content = '${content}',cat_id = ${category},created = '${created}',status = '${status}',feature = '${feature}' where post_id = ${post_id}`;
    console.log(sql);
    console.log(feature);
    let result = await query(sql);
    if(result.affectedRows > 0){
        let message = {"code":200,'message':'编辑成功'};
        res.json(message);
    }else {
        res.json({'code':-1,'message':'编辑失败'});
    }
}

//进入个人中心
controller.intoProfile = async (req,res) => {
    let user_id = req.session.uid;
    let sql = `select * from users where user_id = ${user_id}`;
    let rows = await query(sql);
    // rows[0].photo = rows[0].photo.replace()
    res.render('profile.html',{
        userData:rows[0],
        nickname:req.session.nickname,
        nickname:req.session.nickname,
        photo:req.session.photo
    });
}


controller.pwdReset = (req,res) => {
    res.render('password-reset.html',{
        "nickname":req.session.nickname,
        "photo":req.session.photo
    });
}

//修改用户密码
controller.updPwd = async (req,res) => {
    let {oldPwd,password} = req.body;
    let user_id = req.session.uid;
    let sql = `select * from users where password = ${oldPwd} and user_id = ${user_id}`;
    let rows = await query(sql);
    //如果当前输入的旧密码查询不到数据,则提示密码错误
    console.log(rows[0]);
    if(rows[0] == undefined){
        res.json({"code":-1,'message':'密码错误'});
    }
    let sql2 = `update users set password = ${password} where user_id = ${user_id}`;
    let result = await query(sql2);
    //修改成功
    if(result.affectedRows > 0){
        res.json({'code':200,'message':'密码更正成功'});
    }else {
        res.json({"code":-2,'message':'服务器正忙,请稍后再试'});
    }
    

}


//修改用户信息
controller.updUserInfo = async (req,res) => {
    let {nickname,intro,photo} = req.body;
    let user_id = req.session.uid;
    photo = photo.replace("/",'./');
    let sql = `update users set nickname = '${nickname}',intro = '${intro}',photo = '${photo}' where user_id = ${user_id}`;
    console.log(sql);
    let result = await query(sql);
    //修改成功
    if(result.affectedRows > 0){
        //修改后将修改后的昵称保存到session中
        req.session.nickname = nickname;
        res.json({'code':200,'message':'修改成功'});
    }else {
        res.json({'code':-1,'message':"服务器正忙，请稍后再试"});
    }

}

//添加新用户
controller.addUser = async (req,res) => {
    let {email,nickname,password} = req.body;
    let photo = './public/uploads/c5fbdf176fdce11718c155fd25958201.png';
    let sql = `insert into users(email,nickname,password,status,photo) values('${email}','${nickname}','${password}','activated','${photo}')`;
    let result = await query(sql);
    if(result.affectedRows > 0){
        res.json({'code':200,'message':'新增成功'});
    }else{
        res.json({'code':-1,'message':'服务器正忙,请稍候再试'});
    }
}

//退出登录
controller.loginOut = (req,res) => {
    //清空session记录
    req.session.destroy(function(err){
        if(err){
            throw err;
        }
    })
    // 打回到登录页面
    res.redirect('/login');
}

//用户列表的无刷新删除
controller.delUser = async (req,res) => {
    let {user_id} = req.body;
    console.log(user_id);
    let sql = `delete from users where user_id = ${user_id}`;
    let result = await query(sql);
    if(result.affectedRows > 0){
        res.json({'code':200,'message':'删除成功'});
    }else {
        res.json({'code':200,'message':'服务器正忙，请稍后再试'});
    }


}

//编辑用户信息
controller.editUser = async (req,res) => {
    let {email,nickname,user_id} = req.body;
    let sql = `update users set email = '${email}',nickname = '${nickname}' where user_id = ${user_id}`;
    let result = await query(sql);
    if(result.affectedRows > 0){
        res.json({'code':200,'message':'修改成功'});
    }else {
        res.json({'code':200,'message':'服务器正忙,请稍后再试'});
    }

}

//获取当前用户的信息
controller.getUserInfo = async(req,res) => {
    let user_id = req.query.user_id;
    console.log(user_id);
    let sql = `select * from users where user_id =  ${user_id}`;
    let rows = await query(sql);
    console.log(rows);
    res.json(rows[0]);
}

//进入评论主页
controller.intoComment = (req,res) => {
    res.render('comments.html',{
        nickname:req.session.nickname,
        photo:req.session.photo
    });
}

//获取评论总条数
controller.getCommentCounts = async (req,res) => {
    let sql = "select count(*) as commentsCounts from comments";
    let rows = await query(sql);

    let totalPage = Math.ceil(rows[0].commentsCounts / pageSize);
    res.json({"totalPage":totalPage});

}

//获取评论表的数据信息
controller.getCommentData = async (req,res) => {
    //获取当前页
    let currentPage = req.query.currentPage;
    let offset = parseInt(currentPage-1)*pageSize;
    let sql = `select c1.*,c2.title from comments c1 inner join posts c2 on c1.post_id = c2.post_id limit ${offset},${pageSize}`;
    let rows = await query(sql);
    res.json({'data':rows});
}


//评论表数据的无刷新删除
controller.delComment = async (req,res) => {
    let {comment_id} = req.body;
    console.log(comment_id);
    let sql = `delete from comments where comment_id = ${comment_id}`;
    let result = await query(sql);
    if(result.affectedRows > 0){
        res.json({'code':200,'message':'删除成功'});
    }else {
        res.json({'code':-1,'message':'服务器正忙，请稍候再试'});
    }
}

//进入分类主页
controller.intoCategory = async (req,res) => {
    //获取数据
    let sql = 'select * from category';
    let rows = await query(sql);
    res.render('categories.html',{
        'data':rows,
        nickname:req.session.nickname,
        photo:req.session.photo
    });
}

//实现分类数据入库
controller.addCatgory = async (req,res) => {
    let {name,classname} = req.body;
    let sql = `insert into category(cat_name,classname) values('${name}','${classname}')`;
    let result = await query(sql);
    if(result.affectedRows > 0){
        res.json({'code':200,'message':'新增成功'});
    }else {
        res.json({'code':-1,'message':'服务器正忙,请稍后再试'});
    }
   
}

//实现分类主页的无刷新删除
controller.delCategoies = async (req,res) => {
    let {cat_id} = req.body;
    let sql = `delete from category where cat_id = ${cat_id}`;
    let result = await query(sql);
    if(result.affectedRows > 0){
        res.json({'code':200,'message':'删除成功'});
    }else {
        res.json({'code':-1,'message':'服务器正忙,请稍后再试'});
    }
}

//通过id获取分类数据
controller.getCatData = async (req,res) => {
    let cat_id = req.query.cat_id;
    console.log(cat_id);
    let sql = `select * from category where cat_id = ${cat_id}`;
    let rows = await query(sql);
    res.json(rows[0]);
}

//编辑分类列表数据
controller.editCatInfo =  async(req,res) => {
    let {cat_id,cat_name,className} = req.body;
    let sql = `update category set cat_name = '${cat_name}',classname = '${className}' where cat_id = ${cat_id}`;
    let result = await query(sql);
    if(result.affectedRows > 0){
        res.json({'code':200,'message':'编辑成功'});
    }else {
        res.json({'code':-1,'message':'服务器正忙,请稍后再试'});
    }
}

//进入图片轮播页面
controller.intoSlides = async (req,res) => {
  let sql = 'select * from swipe';
  let rows = await query(sql);
  rows.forEach((ele) => {
      if(ele.img){
        ele.img = ele.img.replace('./',"/");
      }
  })
  res.render('slides.html',{
      'data':rows,
      "nickname":req.session.nickname,
      "photo":req.session.photo
  })
}

//添加轮播内容入库
controller.addSlides = async(req,res) =>{
    //接受表单数据信息
    let {text,link,feature} = req.body;
    console.log(feature);
    let sql = `insert into swipe(text,link,img) values('${text}','${link}','${feature}')`;
    let result = await query(sql);
    if(result.affectedRows >0){
        res.json({'code':200,"message":'新增成功'});
    }else {
        res.json({'code':-1,"message":'服务器正忙，请稍候再试'});
    }
}

//轮播主页的无刷新删除
controller.delSwipes = async (req,res) => {
    //获取前台传过来的要删除的id
    let {swipe_id} = req.body;
    console.log(swipe_id);
    let sql = `delete from swipe where swipe_id = ${swipe_id}`;
    let result =  await query(sql);
    if(result.affectedRows > 0){
        res.json({'code':200,'message':'删除成功'});
    }else {
        res.json({'code':-1,'message':'服务器正忙,请稍后再试'});
    }
}

//进入菜单主页
controller.intoNavMenus = async (req,res) => {
    let sql = "select cat_name from category ";
    let sql2 = 'select text,link from swipe';
    let rows = await query(sql);
    let rows2 = await query(sql2);
    res.render('nav-menus.html',{
        'cat_name':rows[0].cat_name,
        'text':rows2[0].text,
        'link':rows2[0].link,
        "nickname":req.session.nickname,
        "photo":req.session.photo
    });
}

//新增导航菜单入库
controller.addNavMenu = async(req,res) => {
    
}


module.exports = controller;