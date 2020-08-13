let express = require("express");
let route = express.Router();
let query = require('./model.js');
let moment = require("moment");

//获取所有的分类
route.get('/getCategory',async(req,res) => {
    let sql = 'select * from category where cat_id > 1';
    let rows = await query(sql);
    res.json(rows);
})

//获取分类的内容数据
route.get('/getPost',async (req,res) => {
    let sql = `select p1.*,p2.cat_name,p3.nickname from posts p1 left join category p2 on p1.cat_id = p2.cat_id
                left join users p3 on p1.user_id = p3.user_id limit 0,5`;
    let rows = await query(sql);
    //将图片的路径转化为/回显
    rows.forEach(element => {
        if(element.feature){
            element.feature = 'http://127.0.0.1:7070'+element.feature.replace('./','/');
        }

        //转化时间日期
        element.created = moment(new Date(element.created)).format("YYYY-MM-DD HH:mm:ss");
    });
    res.json(rows);

})

//获取文章列表数据
route.get('/getPostList',async (req,res) => {
    let {cat_id,currentPage,pageSize} = req.query;
    //从第几页开始
    let offset = (currentPage-1)*pageSize;
    let sql = `select p1.*,p2.nickname from posts p1 left join users p2 on p1.user_id = p2.user_id where cat_id = ${cat_id} limit ${offset},${pageSize}`;
    let rows = await query(sql);

    let sql2 = `select cat_name from category where cat_id = ${cat_id}`;
    let rows2 = await query(sql2);

    rows.forEach((ele) => {
        //如果存在头像
        if(ele.feature){
            ele.feature = 'http://127.0.0.1:7070'+ele.feature.replace('./','/');
        }
        //转化时间日期
        ele.created = moment(new Date(ele.created)).format("YYYY-MM-DD");
    })
    res.json({
        artData:rows,
        cat_name:rows2[0].cat_name
    });
})

//获取对应文章id的详情内容
route.get('/getCommentData', async (req,res) => {
    let post_id = req.query.post_id;

    let sql = `select p1.*,p2.cat_name,p3.nickname from posts p1 left join category p2 on p1.cat_id = p2.cat_id 
                left join users p3 on p1.user_id = p3.user_id where p1.post_id = ${post_id}`;

    let sql2 = `select count(*) as commentCounts from comments where post_id = ${post_id}`;

    let rows = await query(sql);
    let rows2 = query(sql2);

    let result = await Promise.all([rows,rows2]); // [[{}],[{}]]

    rows.forEach((ele) => {
        ele.created = moment(new Date(ele.created)).format("YYYY-MM-DD");
    })
   
    //获取第一个对象
    obj = result[0][0];
    obj.commentCounts = result[1][0].commentCounts;

    res.json(obj);

   
})


//修改点赞次数
route.post('/updLikes',async (req,res) => {
    let post_id = req.query.post_id;
    console.log(post_id);
    let sql = `select likes from posts where post_id = ${post_id}`;
    let rows = await query(sql);
    let likes = rows[0].likes +1;
    let sql2 = `update posts set likes = '${likes}' where post_id = ${post_id}`;
    let result = await query(sql2);
    console.log(result);
    //说明更新成功
    if(result.affectedRows > 0){
        res.json(likes);
    }
})

//获取轮播图的数据信息
route.get('/getSwipeData', async (req,res) => {
    let sql = "select * from swipe order by swipe_id desc limit 0,3";
    let rows = await query(sql);
    rows.forEach((ele) => {
        if(ele.img){
            ele.img = 'http://127.0.0.1:7070'+ele.img.replace('./','/');
        }
    })
    res.json(rows);
})



module.exports = route;