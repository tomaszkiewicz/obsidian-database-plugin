import { Plugin, PluginSettingTab, Setting, App } from 'obsidian';
import { parseYaml } from 'obsidian';
import { MarkdownRenderChild } from "obsidian";
import VueApp from "./App.vue";
import Vue from 'vue';
import vuetify from './vuetify'
import 'vuetify/dist/vuetify.min.css'

interface DatabasePluginSettings {
	globalIgnoreFilters: string[]
}

const DEFAULT_SETTINGS: DatabasePluginSettings = {
	globalIgnoreFilters: []
}

export default class DatabasePlugin extends Plugin {
	settings: DatabasePluginSettings;
	instances: any[]

	async onload() {
		await this.loadSettings();
		this.instances = [];

		this.addSettingTab(new DatabasePluginSettingTab(this.app, this))

		this.registerMarkdownCodeBlockProcessor(
			`databaseTable`,
			async (src, el, context) => {
				let parameters = parseYaml(src)

				const div = document.createElement("div");
				const child = new MarkdownRenderChild(div);

				while (!this.app.workspace.getActiveFile()) {
					await new Promise(resolve => setTimeout(resolve, 50));
				}

				const app = new Vue({
					vuetify,
					render: h => h(VueApp, {
						props: {
							parameters,
							app: this.app,
							settings: this.settings,
							urlBase: (this.app.vault.adapter as any).basePath.replaceAll("\\", "/"),
						}
					}),
				})

				this.instances.push(app)

				context.addChild(child)
				el.append(div)
				app.$mount(div);

				child.onunload = () => {
					// this.instances = this.removeItemOnce(this.instances, app)
					// app.$destroy();
					// console.log("onunload child")
				}
			}
		);
	}

	removeItemOnce(arr: Array<any>, value: any) {
		var index = arr.indexOf(value);
		if (index > -1) {
			arr.splice(index, 1);
		}
		return arr;
	}

	onunload() {
		this.instances.forEach(i => i.$destroy())
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class DatabasePluginSettingTab extends PluginSettingTab {
	constructor(app: App, private plugin: DatabasePlugin) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Database settings' });

		new Setting(containerEl)
			.setName('Global ignore list')
			.setDesc('Put a list of regexes, one per line, to ignore some of the files')
			.addTextArea(ta =>
				ta.setPlaceholder('Put regex to ignore fiels, one per line')
					.setValue(this.plugin.settings.globalIgnoreFilters.join('\n'))
					.onChange(async (value) => {
						this.plugin.settings.globalIgnoreFilters = value.split('\n');
						await this.plugin.saveSettings();
					}));
	}
}
