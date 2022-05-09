import { Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, App } from 'obsidian';
import { parseFrontMatterStringArray } from 'obsidian';
import { parseYaml } from 'obsidian';
import { MarkdownPostProcessor, MarkdownRenderChild } from "obsidian";
import Table from "./components/Table.vue";
import { DirectorySource, mapSources, Row, Source } from './source';
import Vue from 'vue';
import vuetify from './vuetify'
import Vuetify from "vuetify/lib"
import 'vuetify/dist/vuetify.min.css'
import { Field } from './field';

Vue.use(Vuetify)

// for future use
interface DatabasePluginSettings {
	mySetting: string;
}

// for future use
const DEFAULT_SETTINGS: DatabasePluginSettings = {
	mySetting: 'default'
}

export default class DatabasePlugin extends Plugin {
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
				const sources = mapSources(parameters.sources, this.app)
				const rows = (
					await Promise.all(sources.map((x: Source) => x.loadData()))
				).flat();

				for (let f of parameters.fields.filter((f: Field) => f.type == "link" && f.sources != null)) {
					const fieldSources = mapSources(f.sources, this.app)

					let autocomplete = (
						await Promise.all(fieldSources.map((x: Source) => x.loadData()))
					).flat().map((x: Row) => x._file.name.replace(".md", ""));

					f._sourceAutocomplete = autocomplete
				}

				const app = new Vue({
					vuetify,
					render: h => h(Table, {
						props: {
							...parameters,
							rows,
						}
					}),
				})
				this.instances.push(app)

				context.addChild(child)
				el.append(div)
				app.$mount(div);

				child.onunload = () => {
					this.instances = this.removeItemOnce(this.instances, app)
					app.$destroy();
				}
			}
		);
	}

	removeItemOnce(arr : Array<any>, value : any) {
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

// for future use
class DatabasePluginSettingTab extends PluginSettingTab {
	plugin: DatabasePlugin;

	constructor(app: App, plugin: DatabasePlugin) {
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
