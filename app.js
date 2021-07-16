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



// 104 求職網站抓取資料示範

const fetchFrontendJob = async (targetPage) => {
    const resData = await axios.get(`https://www.104.com.tw/jobs/search/?keyword=%E5%89%8D%E7%AB%AF%E5%B7%A5%E7%A8%8B%E5%B8%AB&order=1&jobsource=2018indexpoc&ro=${targetPage}`);

    const $ = await cheerio.load(resData.data);

    const jobTitle = [];
    const companyTitle = [];

    const formatData = (data) => {
        return data.replace("\n", "").trim();
    }

    await $("article li a").each((i, newData) => {
        const formatedData = formatData($(newData).text());
        companyTitle.push(formatedData)
    });

    await $("#js-job-content > article > div.b-block__left > h2 > a").each((i, newData) => {
        jobTitle.push($(newData).text())
    });

    return { companyTitle, jobTitle }
}

app.get("/get-frontend-jobs", async (req, res) => {
    const result = [];

    const combineJobAndCompany = (jobList, companyList) => {
        return jobList.map((item, i) => {
            return {
                jobTitle: item,
                companyTitle: companyList[i]
            }
        })
    };

    for (let i = 0; i < 5; i++) {
        const {
            companyTitle,
            jobTitle
        } = await fetchFrontendJob(i);

        const combinedData = combineJobAndCompany(jobTitle, companyTitle);

        result.push(...combinedData)
    }

    res.send(result)
})


app.listen(port, () => {
    console.log(`App is listening on http://localhost:${port}`)
});