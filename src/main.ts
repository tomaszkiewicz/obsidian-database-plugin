import { Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { parseFrontMatterStringArray } from 'obsidian';
import { parseYaml } from 'obsidian';
import { MarkdownPostProcessor, MarkdownRenderChild } from "obsidian";
import Table from "./components/Table.vue";
import { DirectorySource } from './source';
import Vue from 'vue';
import vuetify from './vuetify'
import Vuetify from "vuetify/lib"
import 'vuetify/dist/vuetify.min.css'

Vue.use(Vuetify)

// for future use
interface DatabasePluginSettings {
	mySetting: string;
}

// for future use
const DEFAULT_SETTINGS: DatabasePluginSettings = {
	mySetting: 'default'
}

export default class MyPlugin extends Plugin {
	settings: DatabasePluginSettings;
	instances: any[]

	async onload() {
		await this.loadSettings();
		this.instances = [];

		this.registerMarkdownCodeBlockProcessor(
			`databaseTable`,
			async (src, el, context) => {
				const parameters = parseYaml(src)

				const div = document.createElement("div");
				const child = new MarkdownRenderChild(div);

				const sources = parameters.sources.map((s: any) => {
					if (s.type == "directory") {
						return new DirectorySource(s.path, this.app.vault, this.app.metadataCache)
					}
				})

				const app = new Vue({
					vuetify,
					render: h => h(Table, {
						props: {
							...parameters,
							sources,
						}
					}),
				})
				this.instances.push(app)

				context.addChild(child)
				el.append(div)
				app.$mount(div);

				child.onunload = () => {
					app.$destroy();
				}
			}
		);
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

// for future use
class DatabasePluginSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Settings for my awesome plugin.' });

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					console.log('Secret: ' + value);
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
