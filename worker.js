const fs = require('fs')
const JSONStream = require('JSONStream')
const {Builder, By, Key, until} = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;


const transformStream = JSONStream.stringify();
const outputStream = fs.createWriteStream( "./data.json" );
transformStream.pipe( outputStream );

class Worker {
	constructor(url) {
		const option = new chrome.Options().addArguments('--proxy-server=socks5://127.0.0.1:9050')
		this.url = url
		this.driver = new Builder().forBrowser('chrome').setChromeOptions(option).build()

	}

	async _clickInElementLocated(locator) {
		await this.driver.wait(until.elementLocated(locator)).then(async element => await element.click())
	}
	
	async _extractText(element) {
		return Promise.resolve(element.getText()).then(el => el.trim())
		
	}

	async _processCpuData(cpu, index, cpusDataGroups) {
		console.log(cpu)
		const kk = {"Model": cpu}
		for (const cpuDataGroup of cpusDataGroups) {
			const rows = await cpuDataGroup.findElements(By.css('tr.highlighted'))
			for (const row of rows) {
				const key = await this._extractText(await row.findElement(By.css('div.row-text')))
				const v = (await row.findElements(By.css('span.tablesaw-cell-content')))[index]
				const value = await this._extractText(v)
				if (value == '') continue
				kk[key] = value
			}
		}
		transformStream.write(kk)
	}
	
	async start() {
		try {
			await this.driver.get(this.url);
			await this._clickInElementLocated(By.css('a.products'))
			await this._clickInElementLocated(By.css('a.compare-all-btn'))
			await this._clickInElementLocated(By.css('a.compare-tab-contents'))
	
			const cpusNames = await Promise.all((await this.driver.findElements(By.css('#arkproductlink-1 > a'))).map(el => el.getText()))
			const cpusDataGroups = await this.driver.findElements(By.css('div.col-xs-12.table-responsive.hidden-lg.hidden-bg tbody'))
	
			for (const [index, cpu] of cpusNames.entries()) {
				await this._processCpuData(cpu, index, cpusDataGroups)
			}
			transformStream.end()
	
	
		} catch(error) {
			console.log(error)
		} finally {
		}
	}

}

const test = new Worker('https://www.intel.com/content/www/us/en/products/details/processors/core/i9.html')

Promise.resolve(test.start())



// Promise.resolve(example('https://www.intel.com/content/www/us/en/products/details/processors/core/i9.html'))