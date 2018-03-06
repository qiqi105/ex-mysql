const express=require('express');
const static=require('express-static');
const cookieParser=require('cookie-parser');
const cookieSession=require('cookie-session');
const bodyParser=require('body-parser');
const multer=require('multer');
const consolidate=require('consolidate');
const mysql=require('mysql');
const common=require('./libs/common.js');

var server=express();
server.listen(8081);

//1.解析cookie
server.use(cookieParser('sdfasl43kjoifguokn4lkhoifo4k3'));

//2.使用session
var arr=[];
for(var i=0;i<100000;i++){
  arr.push('keys_'+Math.random());
}
server.use(cookieSession({name: 'zns_sess_id', keys: arr, maxAge: 20*3600*1000}));

//3.post数据
server.use(bodyParser.urlencoded({extended: false}));
server.use(multer({dest: './www/uploads'}).any());

//4.配置模板引擎
//输出什么东西
server.set('view engine', 'html');
//模板文件放在哪儿
server.set('views', './template');
//哪种模板引擎
server.engine('html', consolidate.ejs);
//连接池，链接数据库
const db=mysql.createPool({host:'localhost',port:'3307',user:'root',password:'root',database:'blog'});
//接收用户请求

server.get('/', (req, res,next)=>{
	db.query('SELECT * FROM `banner_table`',(err,data)=>{
		if(err){
			res.status(500).send('database err 1banners').end();
		}else{
			res.banners=data;
			next();
		}
	});
    
});

server.get('/',(req,res,next)=>{
		db.query('SELECT title,summary,ID FROM `article_table`',(err,data)=>{
			if(err){
				res.status(500).send('database err 2articles').end();
			}else{
			res.articles=data;
			next();
			}
		});
});

server.get('/',(req,res)=>{
	
	res.render('index.ejs', {banners:res.banners,articles:res.articles});
});

server.get('/article',(req,res)=>{
	if(req.query.id){
		if(req.query.act=='like'){
			db.query(`UPDATE article_table SET n_like=n_like+1 WHERE ID=${req.query.id}`,(err,data)=>{
					if(err){
						res.status(500).send('数据库有点小问题').end();
					}else{
								db.query(`SELECT * FROM article_table WHERE id=${req.query.id} `,(err,data)=>{
								if(err){
									res.status(500).send('数据有问题').end();
								}else{
												if(data.length==0){
														res.status(404).send('你请求的页面不在了').end();
												}else{
													res.article=data[0];
													res.article.sDate=common.time2Date(res.article.post_time);
													res.render('conText.ejs',{article:res.article});
												}
									
								}
							});
					}
			});
		}else{
						db.query(`SELECT * FROM article_table WHERE id=${req.query.id} `,(err,data)=>{
						if(err){
							res.status(500).send('数据有问题').end();
						}else{
										if(data.length==0){
												res.status(404).send('你请求的页面不在了').end();
										}else{
											res.article=data[0];
											res.article.sDate=common.time2Date(res.article.post_time);
											res.render('conText.ejs',{article:res.article});
										}
							
						}
					});
		}
		
		
	}else{
		res.status(404).send('你请求的页面不在了').end();
	}
});
//4.static数据
server.use(static('./www'));

