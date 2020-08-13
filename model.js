let mysql = require("mysql");

var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'newsTopLine',
    password : '123456',
    database : 'newsTopLine'
});

//测试数据库的连接
connection.connect(function(err){
    if(err){throw err;}
    console.log('mysql连接成功');
})


let query = function(sql){
    return new Promise((resolve,reject) => {
        connection.query(sql,(err,rows,fields) => {
            if(err){
                reject(err);
            }
            resolve(rows);
        })
    });
}

module.exports = query;