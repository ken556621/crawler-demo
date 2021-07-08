const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");

const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const iconv = require("iconv-lite");

const app = express();
const port = 3005;

app.use(cors())
app.use(bodyParser.urlencoded({
    extended: true
}))
app.use(bodyParser.json())





// 一般請求
app.get("/get-stock-normal", async (req, res) => {
    try {
        const resData = await axios.get(`https://www.twse.com.tw/exchangeReport/STOCK_DAY?response=json&date=20210601&stockNo=2331&_=1625479308550`);

        res.send(resData.data)

    } catch (error) {
        console.error(error);
    }
})

// 避免短時間太常發送請求
app.get("/get-stock-prevent", async (req, res) => {
    const sleep = (ms) => {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    const result = []

    for (let i = 0; i < 10; i++) {
        try {
            await sleep(5000);
            const resData = await axios.get(`https://www.twse.com.tw/exchangeReport/STOCK_DAY?response=json&date=20210601&stockNo=2331&_=1625479308550`);

            result.push(resData.data)
            console.log(i, "Count");

        } catch (error) {
            console.error(error);
        }
    }

    res.send(result)
})

// 網頁原始碼取得資料
app.get("/get-stock-html", async (req, res) => {
    try {
        const targetPageHtml = await axios.get(`https://tw.stock.yahoo.com/d/s/company_2331.html`, {
            responseType: "arraybuffer",
            transformResponse: [data => {
                return iconv.decode(Buffer.from(data), "big5")
            }]
        });

        let $ = await cheerio.load(targetPageHtml.data);

        const industry = await $("table table:nth-child(1) > tbody > tr:nth-child(2) > td:nth-child(2)").text();
        const startDate = await $("table table:nth-child(1) > tbody > tr:nth-child(3) > td:nth-child(2)").text();
        const listedDate = await $("table table:nth-child(1) > tbody > tr:nth-child(4) > td:nth-child(2)").text();
        const shareCapital = await $("table table:nth-child(1) > tbody > tr:nth-child(8) > td:nth-child(2)").text();
        const revenueProportion = await $("table table:nth-child(1) > tbody > tr:nth-child(11) > td:nth-child(2)").text();
        const factory = await $("table table:nth-child(1) > tbody > tr:nth-child(13) > td:nth-child(2)").text();

        const result = {
            industry,
            startDate,
            listedDate,
            shareCapital,
            revenueProportion,
            factory
        };

        res.send(result)

    } catch (error) {
        console.error(error);
    }
})

// Pupeeteer
app.get("/get-stock-pupeeteer", async (req, res) => {
    // 示範臉書登入後爬取粉絲頁資料
})


app.listen(port, () => {
    console.log(`App is listening on http://localhost:${port}`)
});