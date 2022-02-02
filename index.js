const request = require("request-promise")
const cheerio = require("cheerio")
const fs = require("fs")
const json2csv = require("json2csv").Parser;


// Mongodb database connection
const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://mohit:PmhczUCDrALQO3vf@cluster0.vx7ib.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true },);
client.connect();
console.log("Connected correctly to server");
const db = client.db("stackoverflowdb");
const col = db.collection("question");

// async function 
(async ()=>{

    let data=[]
    const site="https://stackoverflow.com/questions?page=";

    // scrapping over 20 pages
    for (let i = 1; i < 20; i++){
        console.log("page"+" "+i);
        const response = await request({
            uri: site+i,
            headers:{
                "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
                "accept-encoding": "gzip, deflate, br",
                "accept-language": "en-US,en;q=0.9",
            },
            gzip:true,
        });

        
        let $= cheerio.load(response)
        $('div[class="question-summary"]').each( function(index){

            // extracting required data using Jquery ( titile , url, upvotes, views count, answers count of questions)
            let title=$(this).find('div[class="summary"]>h3>a').text();
            let link="https://stackoverflow.com"+$(this).find('div[class="summary"]>h3>a').attr('href');
            let views = $(this).find('div[class="statscontainer"]>div[class=" views"]').text();
            let upvotes = $(this).find('div[class="statscontainer"]>div[class="stats"]>div[class="vote"]>div[class="votes"]>span>strong').text();
            let answers = $(this).find('div[class="statscontainer"]>div[class="stats"]>div:nth-child(2)>strong').text();


            data.push({ title, link, views, upvotes, answers});

            // making colection to insert in database
            let questionDocument = {
                "title": title,
                 "link": link,                                                                                                                                 
                 "views": views,                                                                                                                               
                 "upvotes": upvotes,
                 "answers": answers,
            }
            // inserting data to mongodb databse
            const p = col.insertOne(questionDocument);

        });
    }

    // creating csv file from collected data
    const j2cp = new json2csv();
    const csv = j2cp.parse(data);

    // writing stack.csv file for stackoverflow question
    fs.writeFileSync("./stack.csv",csv,"utf-8");

})();

client.close();
