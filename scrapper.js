import fs from 'fs'
import process from 'process'
import JSONStream from 'JSONStream'
import chrome from 'selenium-webdriver/chrome.js'
import IntelProcessor from './models/intel_processor.js'
import {Builder, By, until} from 'selenium-webdriver'
import 'dotenv/config'
import * as _ from 'chromedriver'



const option = new chrome.Options().addArguments('--headless',process.env.proxy)

class Scrapper {

	static scrappyAll() {
		const urls = Object.entries(Scrapper.processors())

		for (const url of urls) {
			const scrapper = new Scrapper(...url)
			Promise.resolve(scrapper.start())
		}
	}

	static createDriver() {
		return new Builder().forBrowser('chrome').setChromeOptions(option).build()
	}

	static createJSONStreamWriter(fileName) {
		const file = fs.createWriteStream(fileName)
		const jsonStreamWriter = JSONStream.stringifyObject()
		jsonStreamWriter.pipe(file)
		return jsonStreamWriter
	}

	static async updateURLs() {
		const jsonStreamWriter = Scrapper.createJSONStreamWriter('./src/cpus_data/processors.json')
		const panels = {
			"Intel Cores": 'PanelLabel122139',
			"Pentium": 'PanelLabel29862',
			"Intel Processors": 'PanelLabel231726',
			"Celeron": 'PanelLabel43521',
			"Xeon": 'PanelLabel595',
			"Xeon Phi": 'PanelLabel75557',
			"Itanium": 'PanelLabel451',
			"Atom": 'PanelLabel29035',
			"Quark": 'PanelLabel79047'
		}
		
		const driver = Scrapper.createDriver()
		await driver.get('https://ark.intel.com/content/www/us/en/ark.html');
		await driver.wait(until.elementLocated(By.css('div.products div.product-row a.ark-accessible-color')))
			
		const urls = Object.values(panels).map(async label => {
			const selector = `div.products[data-parent-panel-key="${label}"] a.ark-accessible-color`
			const elements = await driver.findElements(By.css(selector))
			return elements.map(el => el.getAttribute('href'))
		})


		for await(const [index, links] of (await Promise.all(urls)).entries()) {
			const serie = Object.keys(panels)[index]
			jsonStreamWriter.write([serie, await Promise.all(links)])
		}
		
		jsonStreamWriter.end()
		await driver.close()
	}

	static processors() {
		const file = fs.readFileSync('./src/cpus_data/processors.json')
		return JSON.parse(file)
	}

	constructor(serie, urls) {
		this.link = `./src/cpus_data/cpus/${serie}.json`
		const outputStream = fs.createWriteStream(this.link);
		this.transformStream = JSONStream.stringify();
		this.transformStream.pipe( outputStream );
		this.urls = urls
		this.driver = Scrapper.createDriver()

	}

	async _clickInElementLocated(locator) {
		await new Promise(r => setTimeout(r, 1500)) 
		await this.driver.wait(until.elementLocated(locator), 2500)
						 .then(async element => await element.click())
						 .catch(() => {return})
	}
	
	async _extractText(element) {
		try {
			const text = await element.getText()
			return text.trim()
		} catch (error) {
			return ''
		}
	}
	
	async start() {
		try {
			const selecteds = []
			const maxCpus = 199

			// Select processors to compare
			for (const url of this.urls) {
				await this.driver.get(url)
				const checkMarks = await this.driver.findElements(By.css('label.containerCB.component span.checkmark'))
				let count = await this._extractText(await this.driver.findElement(By.css('a.compare-tab-contents.compare-now span.compare-count')))
				if (!count) count = 0

				let counter = 0
				for (const checkMark of checkMarks) {
					let remaining = maxCpus - count -1
					if (counter <= remaining) {
						await checkMark.click()
						counter++
						continue
					}

					await checkMark.click()
					const compareElement = await this.driver.findElement(By.css('a.compare-tab-contents.compare-now'))
					const compareLink = await compareElement.getAttribute('href')
					selecteds.push(compareLink)

					await this._clickInElementLocated(By.css('a.clear-link.ark-accessible-color'))
					counter = 0
					count = 0
				}
			}

			const compareElement = await this.driver.findElement(By.css('a.compare-tab-contents.compare-now'))
			const compareLink = await compareElement.getAttribute('href')
			selecteds.push(compareLink)



			for await (let selected of selecteds) {
				selected = selected.replace(',47933', '').replace(',58664', '')
								   .replace(',47932', '').replace(',52585', '')

				// Click compare processors
				await this.driver.get(selected)
				await this.driver.wait(until.elementLocated(By.css('div.product.item.element.ui-sortable-handle')), 5000).catch(async () => {
					const curUrl = await this.driver.getCurrentUrl()
					await this.driver.get(curUrl+',')
				})

				const cpus = await Promise.all((await this.driver.findElements(By.css('div.product.item.element.ui-sortable-handle'))).map(async el => {
					const name = await (await el.findElement(By.css('#arkproductlink-1 > a'))).getText()
					const id = await el.getAttribute('data-product-id')
					return {name, id}
				}))


		
				const processorsAttributes = (await this.driver.findElements(By.css('div.col-xs-12.table-responsive.hidden-lg.hidden-bg tbody tr td.row-title.sticky-column div.row-text')))
				.map(el => this._extractText(el))
				
				for (let cpu of cpus) {
					const processor = {"Model": cpu['name']}
					processor['indexModel'] = cpu['name'].replace(/[^a-zA-Z0-9]/g, '')
														 .replace('Intel', '')
														 .replace('Processor', '')
														 .toUpperCase()
					const id = cpu['id']
					const values = await this.driver.findElements(By.css(`table.table tbody tr td span[data-product-id='${id}']`))

					for await (const [i, key] of processorsAttributes.entries()) {
						const value = await this._extractText(values[i])

						if (value != '' && value != ' ') {
							processor[await key] = value

							if (await key === 'Processor Number') {
								processor['indexNumber'] = value
														   .replace(/[^a-zA-Z0-9]/g, '')
														   .toUpperCase()
							}


							
						}

					}
					this.transformStream.write(processor)
					

				
				}


			}
			await this.driver.close()
			this.transformStream.end()
			const file = fs.readFileSync(this.link)
			const js = JSON.parse(file)

			await IntelProcessor.insertMany(js,{ ordered: false })
	
	
		} catch(error) {
			console.log(error)
		}
	}
}

Scrapper.scrappyAll()



