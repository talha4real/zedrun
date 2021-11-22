const axios = require("axios");
const fs = require('fs')
const puppeteer = require('puppeteer-extra')
const mongoose = require("mongoose");
const cheerio = require("cheerio");
const pretty = require("pretty");
const {MongoClient} = require('mongodb');

const uri = "mongodb://MongoAdmin:fd5198ba5f4d92ea27d172ed6c9134f27939840a6907c03aac@95.179.170.47:27107/InazumaDB?authSource=admin&readPreference=primary&appname=MongoDB%20Compass&directConnection=true&ssl=false";
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())

const client = new MongoClient(uri);

client.connect();

// listDatabases(client);


async function listDatabases(client){
    databasesList = await client.db().admin().listDatabases();

    console.log("Databases:");
    databasesList.databases.forEach(db => console.log(` - ${db.name}`));
};


let sortedarray=[];

const sleepz = (ms = 0) => {
    return new Promise(r => setTimeout(r, ms));
};
const racescolletion = [

];

const getActiveRaces = async(offset=0) =>{
    await sleepz(1000);
    const _result = await client.db("zedrun").dropDatabase();
    console.log(_result);
    // const proxy1 = 'http://test-country-UnitedStates_1:test@46.4.55.185:8603'
    let browser;
    try{
    let offset2=0;
    let proxylist = getProxyList();
    while(true){
    // await sleepz(200);
    try{
        let proxyx = proxylist[Math.floor(Math.random() * (9 - 0 + 1) + 0)];
        console.log(proxyx);
        proxyx= proxyx.split(':'); 
        browser = await puppeteer.launch({
        headless: false,
        args: [`--proxy-server=${proxyx[0]}:${parseInt(proxyx[1])}`,"--disable-setuid-sandbox","--no-sandbox",
        ],
        'ignoreHTTPSErrors': true
        });
        const page = await browser.newPage();
        await page.authenticate({        
            username: proxyx[2],
            password: proxyx[3]
        })
    
   
       
        await page.goto(`https://racing-api.zed.run/api/v1/races?offset=${offset2}&status=open`)
        const extractedText = await page.$eval('*', (el) => el.innerText);
        await sortRaces(JSON.parse(extractedText),browser);
        console.log(extractedText);
        offset2+=10;
        
        //await page.screenshot({ path: 'nytimes.png', fullPage: true })
        // page.close();
    }catch(e){
        console.log(e)
    } finally {
        await sleepz(2* 60 * 1000)
        await browser.close();
    }
    }
    }catch(e){
        console.log(e);
        browser.close();
        console.log(`end of the races`);
    }finally {
        await browser.close();
      }
    
    // await browser.close()

}

const sortRaces = async(races,browser) =>{

    
    let count = 0;
    races.forEach(async element => {
        try{
        // if(racescolletion.includes(element.raec.id)){
        //     continue;
        // }
        let race = {};
        race["id"] = element.race_id;
        race["city"] = element.city;
        race["class"] = element.class;
        race["country"] = element.country;
        race["status"] = element.status;
        race["name"] = element.name;
        race["fee"] = element.fee;
        race["length"] = element["length"];
        race["prize"] = element["prize"];
        race["start_time"] = element["start_time"];
        race["gates"] = element["gates"];
        race['openGates'] = ''
        race['totalWinPercentage'] = ''
        race['winPercentageByDistance'] = ''
        race['totalOddsPercentage'] = ''
        race['oddsByDistance'] = ''
        race['horses'] = [];
        for (const item in race["gates"]) {
            //console.log("1",race["gates"][item].horse_id)
            let horseid = race["gates"][item].horse_id;
            let horsestatus = race["gates"][item].status;
            let stats = await getHorseData(horseid,browser)
            // console.log(await getHorseData(horseid,browser))
            let obj = {
                horse_id: horseid,
                stats: await stats,
            }
            race['horses'].push(obj);
        }
        // sortedarray.push(race);
        // console.log(race); 
        count++;
        console.log(count);
        await sleepz(1000);
        const result = await client.db("zedrun").collection("zed.run").insertOne({...race})
        console.log(result);  
        // sortedarray.push(race);

        if(count == races.length){
            console.log("sortedarray"); 
            // const result = await client.db("zedrun").collection("races").insertOne({"id":"1","races": sortedarray})
            // const result = await client.db("KKDB").collection("Collections").findOne({})
            console.log(result);  
                // fs.writeFile(`./config/races.json`, JSON.stringify(sortedarray), (err) => {
                //     if (err) {
                //         // throw err;
                //         return false;
                //     }
                //     console.log("JSON data is saved.");

                // });
               browser.close(); 
        }  
         
        
    }catch(e){
        console.log(e);
        browser.close();
    }
    });
    // console.log(sortedarray);


}
const getHorseData = async(horseid,browser) =>{
    let page = await browser.newPage();
    try{
    await page.setDefaultNavigationTimeout(0);
    await page.goto(`https://knowyourhorses.com/horses/${horseid}`);
    await page.waitForSelector('div div.justify-content-around').then( async()=>{
        // console.log(`found`);
    
    })
    let text = await page.evaluate(() => Array.from(document.querySelectorAll('div div.justify-content-around'), element => element.textContent));
    await page.waitForSelector('[data-controller="chart"]').then( async()=>{
        console.log(`--Found a Chart`);
    
    })
    await page.waitForSelector('[data-controller="chart"]').then( async()=>{
        console.log(`--Found another Chart`);
    
    })
    let text2 = await page.evaluate(() => Array.from(document.querySelectorAll('[data-controller="chart"]'), element => { return `${element.getAttribute('data-chart-y-axis-label-value')} + ${element.getAttribute('data-chart-tally-value') }`}));
    //  console.log(text2);
    let tobj = {}
    text2.forEach(element => {
        let val = element.split("+");
        let name = val[0];
        let data2 = val[1];
        data2 = JSON.parse(data2.trim());
        // console.log(name);
        // console.log(data2);
        tobj = {
            ...tobj,
            [name]: data2
        }
    });


    let val =text[0].split("\n");
    let temp = [];
     page.close();
    val.forEach(element => {
        if(!element.trim()==""){
            //console.log(element.trim());
            let elem = element.trim();
            temp.push(elem);
        }
    });
    let ob = {
        ...tobj
    };
    for(let i = 0 ; i < temp.length;i+=2){
        ob = {
            ...ob,
            [temp[i+1]] : temp[i]
        }
    }
    return ob;
    }catch(e){
        console.log(e);
        console.log(`no data found for this`);
        page.close();
        return {};
    }

}

getActiveRaces();
setInterval(()=>{
    
    getActiveRaces();

},[100 * 60 * 1000])




// const getMax = async(slug = "cool-cats-nft")=>{
//     let offset = 0;
//     let obj = [];
//     axios.get(`https://api.zed.run/api/v1/stud/horses?offset=${offset}&gen[]=1&gen[]=268&horse_name=&sort_by=created_by_desc`).then( async(res)=>{

//     console.log(res);

//     const browser = await puppeteer.launch({
//         headless: false,
//         args: ["--disable-setuid-sandbox","--no-sandbox"],
//         'ignoreHTTPSErrors': true
//     });

//     console.log(res.data.length);
//     let horsesdata = [];
//     for(let j=0;j< 5
//         //res.data.length
//         ;j++){
//         try{
//         let page = await browser.newPage();
//         await page.setDefaultNavigationTimeout(0);
//         const navigationPromise = page.waitForNavigation({waitUntil: "domcontentloaded"});
//         await page.goto(`https://knowyourhorses.com/horses/${res.data[j].horse_id}`);
//         await page.waitForSelector('div div.justify-content-around').then( async()=>{
//             console.log(`found`);
        
//         })
//         let text = await page.evaluate(() => Array.from(document.querySelectorAll('div div.justify-content-around'), element => element.textContent));
//         // console.log(text[0].split("\n"));
//         let val =text[0].split("\n");
//         let temp = [];
//         page.close();
//         val.forEach(element => {
//             if(!element.trim()==""){
//                 //console.log(element.trim());
//                 let elem = element.trim();
//                 temp.push(elem);
//             }
//         });
//         let ob = {
//             ...res.data[j]
//         };
//         for(let i = 0 ; i < temp.length;i+=2){
//             ob = {
//                 ...ob,
//                 [temp[i+1]] : temp[i]
//             }
//         }
//         horsesdata.push(ob);
       
//         }catch(e){
//             console.log(`failed for this one`);
//         }

//     }
//     console.log(horsesdata);
//     console.log(`writing to the file:`);
//     fs.writeFile(`./config/horses.json`, JSON.stringify(horsesdata), (err) => {
//         if (err) {
//             // throw err;
//             return false;
//         }
//         console.log("JSON data is saved.");

//     });
//     browser.close();
    

// })
// }

// // getMax();
const getProxyList= ()=>{
    var proxies = "";

    proxies = fs.readFileSync("proxies.txt", "utf8");
	var proxyList = proxies.split(/\r\n|\r|\n/);
	if (proxyList[proxyList.length - 1] === "") {
		proxyList.pop();
	}
    console.log(proxyList);
	return proxyList; 
}
